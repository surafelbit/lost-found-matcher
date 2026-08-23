/**
 * matching.test.js — Unit tests for the matching engine
 *
 * Uses Node's built-in node:test runner. No external test framework needed.
 * Run: node --test src/tests/matching.test.js
 *
 * Tests cover:
 *  1. Strong match — library backpack pair
 *  2. Possible/ambiguous match — football-field backpack
 *  3. Synonym normalization — AirPods vs earbud case
 *  4. Implausible time order — found before lost
 *  5. Unrelated items — umbrella vs laptop
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch, computeMatches, MIN_SCORE_THRESHOLD } from '../matching.js';

// ─── Test fixtures ─────────────────────────────────────────────────────────

const libraryLost = {
  id: 1,
  type: 'lost',
  category: 'backpack',
  description: 'Dark blue Northface backpack with a broken zipper on the front pocket. Has a red keychain attached.',
  location: 'Main Library, 3rd floor study area',
  event_date: '2024-10-14',
};

const libraryFound = {
  id: 2,
  type: 'found',
  category: 'backpack',
  description: 'Found a dark navy bag near the study tables. Northface brand. Has a broken zipper and a small red keyring.',
  location: 'University Library, near the stairwell on level 3',
  event_date: '2024-10-14',
};

const footballFound = {
  id: 3,
  type: 'found',
  category: 'backpack',
  description: 'Black backpack left on the bleachers. No identifying marks visible.',
  location: 'Football field, south bleachers',
  event_date: '2024-10-15',
};

const airpodsLost = {
  id: 4,
  type: 'lost',
  category: 'airpods case',
  description: 'Lost my white AirPods case, third generation. Has a small crack on the lid.',
  location: 'Student cafeteria, near the vending machines',
  event_date: '2024-10-20',
};

const earbudsFound = {
  id: 5,
  type: 'found',
  category: 'earbud case',
  description: 'Found a white earphone holder/case on a table. Looks like an Apple product. Small crack on the cover.',
  location: 'Campus coffee shop',
  event_date: '2024-10-20',
};

const umbrellaLost = {
  id: 6,
  type: 'lost',
  category: 'umbrella',
  description: 'Green folding umbrella, wooden handle.',
  location: 'Engineering building',
  event_date: '2024-10-18',
};

const laptopFound = {
  id: 7,
  type: 'found',
  category: 'laptop',
  description: 'Found a silver MacBook on a desk. Has university sticker on the lid.',
  location: 'Business school, room 204',
  event_date: '2024-10-19',
};

// An implausible time-order pair: found 10 days BEFORE the item was reported lost.
// Uses a similar but not identical description to isolate the time penalty effect.
const foundBeforeLost = {
  id: 8,
  type: 'found',
  category: 'backpack',
  description: 'Found a blue backpack with broken front zipper near the library entrance.',
  location: 'Main Library',
  event_date: '2024-10-04', // 10 days before libraryLost's event_date
};

// ─── Tests ─────────────────────────────────────────────────────────────────

test('1. Strong match — library backpack pair', () => {
  const result = scoreMatch(libraryLost, libraryFound);

  assert.ok(
    result.score >= 0.65,
    `Expected score >= 0.65 (strong), got ${result.score.toFixed(3)}`
  );
  assert.equal(result.tier, 'strong', `Expected tier "strong", got "${result.tier}"`);
  assert.ok(result.reasons.length > 0, 'Expected at least one reason');
  assert.ok(
    result.breakdown.category >= 0.9,
    `Expected high category score, got ${result.breakdown.category.toFixed(3)}`
  );
  assert.ok(
    result.breakdown.location >= 0.1,
    `Expected some location overlap, got ${result.breakdown.location.toFixed(3)}`
  );
});

test('2. Possible/ambiguous match — football-field backpack', () => {
  const result = scoreMatch(libraryLost, footballFound);

  assert.ok(
    result.score >= 0.4 && result.score < 0.65,
    `Expected score in [0.4, 0.65) (possible), got ${result.score.toFixed(3)}`
  );
  assert.equal(result.tier, 'possible', `Expected tier "possible", got "${result.tier}"`);
  // Location should be poor — library vs football field
  assert.ok(
    result.breakdown.location < 0.3,
    `Expected low location overlap, got ${result.breakdown.location.toFixed(3)}`
  );
  // Category should still match well
  assert.ok(
    result.breakdown.category >= 0.8,
    `Expected high category score, got ${result.breakdown.category.toFixed(3)}`
  );
});

test('3. Synonym normalization — AirPods vs earbud case', () => {
  const result = scoreMatch(airpodsLost, earbudsFound);

  // Synonym normalization should bring "airpods" and "earbud" to the same token,
  // and "case" / "holder" / "cover" likewise. This should produce a meaningful score.
  assert.ok(
    result.score >= 0.4,
    `Expected score >= 0.4 after synonym normalization, got ${result.score.toFixed(3)}`
  );
  assert.ok(
    result.breakdown.category >= 0.5,
    `Expected significant category match via synonyms, got ${result.breakdown.category.toFixed(3)}`
  );
  assert.ok(
    result.breakdown.text >= 0.1,
    `Expected some text overlap via synonyms, got ${result.breakdown.text.toFixed(3)}`
  );
});

test('4. Implausible time order — found 10 days before lost', () => {
  const result = scoreMatch(libraryLost, foundBeforeLost);

  // Time signal should be heavily penalized (found before lost)
  assert.ok(
    result.breakdown.time < 0.15,
    `Expected low time score for implausible order, got ${result.breakdown.time.toFixed(3)}`
  );
  // But the overall score can still be non-zero (category/description are good)
  // and the overall score should be lower than the clean library match
  const cleanResult = scoreMatch(libraryLost, libraryFound);
  assert.ok(
    result.score < cleanResult.score,
    `Implausible time order should score lower than plausible match`
  );
});

test('5. Unrelated items — umbrella vs laptop (below threshold)', () => {
  const result = scoreMatch(umbrellaLost, laptopFound);

  // Should score below MIN_SCORE_THRESHOLD and be treated as noise
  assert.ok(
    result.score < MIN_SCORE_THRESHOLD,
    `Expected score < ${MIN_SCORE_THRESHOLD} (noise), got ${result.score.toFixed(3)}`
  );

  // Verify computeMatches also filters it out
  const matches = computeMatches(umbrellaLost, [laptopFound]);
  assert.equal(
    matches.length,
    0,
    `Expected no matches after threshold filter, got ${matches.length}`
  );
});
