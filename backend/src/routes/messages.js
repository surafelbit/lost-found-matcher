import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

async function verifyAccess(req, res, lostId, foundId) {
  const userId = req.user.userId;
  
  const result = await pool.query(
    `SELECT * FROM reports WHERE id IN ($1, $2) AND user_id = $3`,
    [lostId, foundId, userId]
  );
  
  if (result.rows.length === 0) {
    res.status(403).json({ errors: ['You are not a participant in this match.'] });
    return false;
  }
  return true;
}

// ─── GET /api/messages/unread-count ──────────────────────────────────────────
router.get('/unread-count', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as unread
       FROM messages m
       JOIN reports lost ON m.lost_report_id = lost.id
       JOIN reports found ON m.found_report_id = found.id
       WHERE (lost.user_id = $1 OR found.user_id = $1)
         AND m.sender_id != $1
         AND m.read_at IS NULL`,
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].unread, 10) });
  } catch (err) {
    console.error('GET /api/messages/unread-count error:', err.message);
    res.status(500).json({ errors: ['Failed to fetch unread count'] });
  }
});

// ─── GET /api/messages/:lostId/:foundId ──────────────────────────────────────
router.get('/:lostId/:foundId', requireAuth, async (req, res) => {
  const { lostId, foundId } = req.params;
  const userId = req.user.userId;
  
  try {
    const hasAccess = await verifyAccess(req, res, lostId, foundId);
    if (!hasAccess) return;

    // Mark as read
    await pool.query(
      `UPDATE messages SET read_at = CURRENT_TIMESTAMP
       WHERE lost_report_id = $1 AND found_report_id = $2
         AND sender_id != $3 AND read_at IS NULL`,
      [lostId, foundId, userId]
    );

    const messagesResult = await pool.query(
      `SELECT m.*, u.email as sender_email
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.lost_report_id = $1 AND m.found_report_id = $2
       ORDER BY m.created_at ASC`,
      [lostId, foundId]
    );

    res.json({ messages: messagesResult.rows });
  } catch (err) {
    console.error('GET /api/messages error:', err.message);
    res.status(500).json({ errors: ['Failed to fetch messages'] });
  }
});

// ─── POST /api/messages/:lostId/:foundId ─────────────────────────────────────
router.post('/:lostId/:foundId', requireAuth, async (req, res) => {
  const { lostId, foundId } = req.params;
  const { message } = req.body;
  const userId = req.user.userId;

  if (!message || message.trim() === '') {
    return res.status(400).json({ errors: ['Message cannot be empty'] });
  }

  try {
    const hasAccess = await verifyAccess(req, res, lostId, foundId);
    if (!hasAccess) return;

    const insertResult = await pool.query(
      `INSERT INTO messages (lost_report_id, found_report_id, sender_id, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lostId, foundId, userId, message.trim()]
    );

    res.status(201).json({ message: insertResult.rows[0] });
  } catch (err) {
    console.error('POST /api/messages error:', err.message);
    res.status(500).json({ errors: ['Failed to send message'] });
  }
});

export default router;
