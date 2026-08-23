/**
 * routes/reports.js — All /api/reports endpoints
 *
 * IMPORTANT: private_detail is NEVER included in any response body from this
 * file. It exists only in the DB and is used only in the claim endpoint check.
 */

import { Router } from 'express';
import pool from '../db.js';
import { computeMatches } from '../matching.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Validation helpers ────────────────────────────────────────────────────

/**
 * Validate the body of a POST /api/reports request.
 * Returns an array of error strings; empty array means valid.
 */
function validateReportBody(body) {
  const errors = [];
  const { type, category, description, location, event_date } = body;

  if (!type || !['lost', 'found'].includes(type)) {
    errors.push('type must be "lost" or "found"');
  }
  if (!category || !category.trim()) {
    errors.push('category is required');
  }
  if (!description || !description.trim()) {
    errors.push('description is required');
  }
  if (!location || !location.trim()) {
    errors.push('location is required');
  }
  if (!event_date) {
    errors.push('event_date is required');
  } else {
    const d = new Date(event_date);
    if (isNaN(d.getTime())) {
      errors.push('event_date must be a valid date (YYYY-MM-DD)');
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Allow same-day reports
      if (d > today) {
        errors.push('event_date cannot be in the future');
      }
    }
  }

  return errors;
}

// Columns returned in list/match responses — private_detail intentionally excluded
const SAFE_COLUMNS = `
  id, type, category, description, location, color, image_url,
  event_date, contact, status, user_id, created_at
`;

// ─── POST /api/reports — Create a report ──────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  const errors = validateReportBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const { type, category, description, location, event_date, contact, private_detail, color, image_url } =
    req.body;

  // Attach user_id if the request comes from an authenticated user
  const userId = req.user?.userId ?? null;

  // private_detail is only stored for found reports
  const privateDetailValue =
    type === 'found' && private_detail?.trim() ? private_detail.trim() : null;

  try {
    const result = await pool.query(
      `INSERT INTO reports
         (type, category, description, location, event_date, contact, private_detail, user_id, color, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${SAFE_COLUMNS}`,
      [
        type,
        category.trim(),
        description.trim(),
        location.trim(),
        event_date,
        contact?.trim() || null,
        privateDetailValue,
        userId,
        color?.trim() || null,
        image_url?.trim() || null,
      ]
    );
    res.status(201).json({ report: result.rows[0] });
  } catch (err) {
    console.error('POST /api/reports error:', err.message);
    res.status(500).json({ errors: ['Failed to create report'] });
  }
});

// ─── GET /api/reports/mine — My reports (auth required) ──────────────────────

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('GET /api/reports/mine error:', err.message);
    res.status(500).json({ errors: ['Failed to fetch your reports'] });
  }
});

// ─── GET /api/reports/all-matches — Aggregate matches for the user ────────
router.get('/all-matches', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all user reports
    const myReportsResult = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports WHERE user_id = $1`,
      [userId]
    );
    const myReports = myReportsResult.rows;

    if (myReports.length === 0) {
      return res.json({ matches: [] });
    }

    // Fetch all open reports not belonging to the user
    const candidatesResult = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports WHERE status = 'open' AND (user_id IS NULL OR user_id != $1)`,
      [userId]
    );
    const allCandidates = candidatesResult.rows;

    const allMatches = [];

    for (const myReport of myReports) {
      // Find candidates of opposite type
      const oppositeType = myReport.type === 'lost' ? 'found' : 'lost';
      const validCandidates = allCandidates.filter((c) => c.type === oppositeType);

      const matches = computeMatches(myReport, validCandidates);

      for (const m of matches) {
        allMatches.push({
          myReport: myReport,
          candidate: m.report,
          score: m.score,
          tier: m.tier,
          reasons: m.reasons,
          breakdown: m.breakdown,
        });
      }
    }

    // Sort globally by score descending
    allMatches.sort((a, b) => b.score - a.score);

    res.json({ matches: allMatches });
  } catch (err) {
    console.error('GET /api/reports/all-matches error:', err.message);
    res.status(500).json({ errors: ['Failed to fetch aggregated matches'] });
  }
});

// ─── GET /api/reports — List reports ──────────────────────────────────────

router.get('/', async (req, res) => {
  const { type, status } = req.query;

  const conditions = [];
  const params = [];

  if (type) {
    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ errors: ['type must be "lost" or "found"'] });
    }
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  if (status) {
    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ errors: ['status must be "open" or "resolved"'] });
    }
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('GET /api/reports error:', err.message);
    res.status(500).json({ errors: ['Failed to fetch reports'] });
  }
});

// ─── GET /api/reports/:id/matches — Compute matches for a report ───────────

router.get('/:id/matches', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ errors: ['Invalid report id'] });

  try {
    const reportResult = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports WHERE id = $1`,
      [id]
    );
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ errors: ['Report not found'] });
    }
    const report = reportResult.rows[0];

    // Security Check: Only the creator can view matches for this report
    if (report.user_id !== req.user.userId) {
      return res.status(403).json({ errors: ['You do not have permission to view matches for this report.'] });
    }

    // Fetch all open reports of the opposite type
    const oppositeType = report.type === 'lost' ? 'found' : 'lost';
    const candidatesResult = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM reports WHERE type = $1 AND status = 'open' AND id != $2`,
      [oppositeType, id]
    );

    const matches = computeMatches(report, candidatesResult.rows);

    res.json({ report, matches });
  } catch (err) {
    console.error('GET /api/reports/:id/matches error:', err.message);
    res.status(500).json({ errors: ['Failed to compute matches'] });
  }
});

// ─── PATCH /api/reports/:id — Update status ───────────────────────────────

router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ errors: ['Invalid report id'] });

  const { status } = req.body;
  if (!status || !['open', 'resolved'].includes(status)) {
    return res.status(400).json({ errors: ['status must be "open" or "resolved"'] });
  }

  try {
    const result = await pool.query(
      `UPDATE reports SET status = $1 WHERE id = $2 RETURNING ${SAFE_COLUMNS}`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ errors: ['Report not found'] });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error('PATCH /api/reports/:id error:', err.message);
    res.status(500).json({ errors: ['Failed to update report'] });
  }
});

// ─── POST /api/reports/:id/claim — Claim a found report ──────────────────
//
// SCOPE BOUNDARY (documented explicitly): This is a lightweight fraud-reduction
// nudge, not real identity verification. It proves the claimant knows a non-public
// detail about their item, which significantly reduces opportunistic false claims.
// It does NOT prevent a determined bad actor who observed the item. A production
// system would require university SSO login, photo upload with matching, and
// possibly a staff review step. Those features are outside the scope of this
// take-home assessment.

router.post('/:id/claim', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ errors: ['Invalid report id'] });

  try {
    // Fetch including private_detail — ONLY for the comparison in this handler.
    // private_detail is NOT forwarded in the response.
    const result = await pool.query(
      `SELECT id, type, contact, private_detail, status FROM reports WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ errors: ['Report not found'] });
    }

    const report = result.rows[0];

    if (report.type !== 'found') {
      return res.status(400).json({ errors: ['Claim endpoint is only for found reports'] });
    }

    if (report.status === 'resolved') {
      return res.status(409).json({ errors: ['This report is already resolved'] });
    }

    const { private_detail } = report;

    if (private_detail) {
      const { answer } = req.body;
      if (!answer || !answer.trim()) {
        return res.status(400).json({ errors: ['answer is required for this found report'] });
      }

      const matches =
        answer.trim().toLowerCase() === private_detail.trim().toLowerCase();

      if (!matches) {
        return res
          .status(403)
          .json({ errors: ['Answer does not match. Contact info cannot be released.'] });
      }
    }

    // Answer matched (or no private_detail set) — return contact
    res.json({
      contact: report.contact,
      message: 'Contact information released. Please reach out to arrange the return.',
    });
  } catch (err) {
    console.error('POST /api/reports/:id/claim error:', err.message);
    res.status(500).json({ errors: ['Failed to process claim'] });
  }
});

export default router;
