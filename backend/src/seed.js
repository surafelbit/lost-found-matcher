/**
 * seed.js — Seed the database with demonstration data.
 *
 * Pairs are designed directly from the assessment's examples so that
 * matching output can be demonstrated against them:
 *
 *   1. Library backpack pair             → should score STRONG
 *   2. Football-field backpack (found)   → should score POSSIBLE against pair 1's lost report
 *   3. AirPods/earbuds synonym pair      → should score STRONG (via synonym normalization)
 *   4. Unrelated pair                    → should score WEAK (noise-filtered)
 *   5. Private-detail claim demo pair    → demonstrates the claim flow
 *
 * Run: node src/seed.js
 */

import pool from './db.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const client = await pool.connect();
  try {
    // Apply schema
    const schema = await readFile(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    // Clear existing data
    await client.query('DELETE FROM reports');
    await client.query('ALTER SEQUENCE reports_id_seq RESTART WITH 1');

    console.log('🌱 Seeding database...\n');

    // ── Pair 1: Library Backpack (strong match) ──────────────────────────────
    // A lost dark-blue backpack left in the library vs one found in the library.
    // Same category, overlapping description, same location → STRONG.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'lost',
        'backpack',
        'Dark blue Northface backpack with a broken zipper on the front pocket. Has a red keychain attached.',
        'Main Library, 3rd floor study area',
        '2024-10-14',
        'alice@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Lost backpack (library)');

    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'found',
        'backpack',
        'Found a dark navy bag near the study tables. Northface brand. Has a broken zipper and a small red keyring.',
        'University Library, near the stairwell on level 3',
        '2024-10-14',
        'bob@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Found backpack (library)');

    // ── Pair 2: Football-field backpack (possible — ambiguous) ───────────────
    // Same lost backpack (id=1) vs a found backpack at the football field.
    // Category matches, but location is different and no description overlap → POSSIBLE, not STRONG.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'found',
        'backpack',
        'Black backpack left on the bleachers. No identifying marks visible.',
        'Football field, south bleachers',
        '2024-10-15',
        'charlie@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Found backpack (football field) — expect POSSIBLE vs lost backpack');

    // ── Pair 3: AirPods / earbud case (synonym normalization) ────────────────
    // "airpods case" vs "earbud case" — different words, same thing.
    // Tests that the synonym map correctly normalizes both to the same tokens.
    // Cafeteria vs coffee shop — nearby but different words — should still score well on text/category.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'lost',
        'airpods case',
        'Lost my white AirPods case, third generation. Has a small crack on the lid.',
        'Student cafeteria, near the vending machines',
        '2024-10-20',
        'dana@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Lost AirPods case');

    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'found',
        'earbud case',
        'Found a white earphone holder/case on a table. Looks like an Apple product. Small crack on the cover.',
        'Campus coffee shop',
        '2024-10-20',
        'evan@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Found earbud case — expect STRONG via synonym normalization');

    // ── Pair 4: Unrelated items (should be noise-filtered) ───────────────────
    // A lost umbrella vs a found laptop — completely different categories, locations, descriptions.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'lost',
        'umbrella',
        'Green folding umbrella, wooden handle. Lost somewhere on campus.',
        'Engineering building',
        '2024-10-18',
        'frank@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Lost umbrella');

    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'found',
        'laptop',
        'Found a silver MacBook on a desk. Has university sticker on the lid.',
        'Business school, room 204',
        '2024-10-19',
        'grace@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Found laptop — expect WEAK / noise-filtered vs lost umbrella');

    // ── Pair 5: Private detail claim demo ─────────────────────────────────────
    // A lost phone vs a found phone. The finder set a private_detail (not in public description).
    // The claimant must know the private detail to get the finder's contact.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'lost',
        'phone',
        'Lost my iPhone 14 Pro, space grey, with a clear case. Lock screen is a photo of a dog.',
        'Sports centre, changing rooms',
        '2024-10-21',
        'henry@university.edu',
        'open',
      ]
    );
    console.log('✓ Inserted: Lost phone');

    // The private_detail ("cracked back glass") is NOT in the public description.
    // The claimant must know it to unlock the finder's contact.
    await client.query(
      `INSERT INTO reports (type, category, description, location, event_date, contact, private_detail, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'found',
        'phone',
        'Found an iPhone in the gym area. Space grey with a clear case.',
        'Sports centre',
        '2024-10-21',
        'iris@university.edu',
        'cracked back glass',
        'open',
      ]
    );
    console.log('✓ Inserted: Found phone (with private_detail) — claim answer: "cracked back glass"');

    console.log('\n✅ Seed complete. 10 reports inserted across 5 demonstration pairs.\n');
    console.log('Expected match tiers:');
    console.log('  Pair 1 (library backpack):           STRONG');
    console.log('  Pair 2 (football backpack vs lost):  POSSIBLE');
    console.log('  Pair 3 (AirPods/earbud synonyms):   STRONG');
    console.log('  Pair 4 (umbrella vs laptop):         WEAK / filtered');
    console.log('  Pair 5 (phone claim demo):           STRONG');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
