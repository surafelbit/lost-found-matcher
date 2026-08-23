/**
 * matching.js — Rule-based deterministic matching engine
 *
 * Pure functions only. No database or framework dependencies.
 * This makes the engine fully unit-testable in isolation (see tests/matching.test.js).
 *
 * DESIGN DECISION: This is intentionally rule-based rather than LLM/embedding-based.
 * Rationale:
 *   - Deterministic and explainable: every score can be traced to a specific signal
 *   - No API costs, no latency, no external dependency
 *   - Runs fully offline
 *   - Easier to tune: changing a weight or rule is a one-line edit
 *
 * FUTURE IMPROVEMENT: Replace the synonym map and TF-IDF text signal with
 * semantic embeddings (e.g. OpenAI text-embedding-3-small or a local sentence-
 * transformer model). The synonym map below handles only known cases; embeddings
 * would capture "grey" vs "gray", "specs" vs "glasses", etc. automatically.
 * The four-signal weighted structure would remain the same; only the text and
 * category signals would improve in quality.
 */

// ─── Weights ────────────────────────────────────────────────────────────────
const WEIGHTS = {
  text: 0.35,
  category: 0.25,
  location: 0.15,
  time: 0.15,
  color: 0.10,
};

// Items scoring below this threshold are excluded entirely (treated as noise).
export const MIN_SCORE_THRESHOLD = 0.50;

// ─── Synonym Map ─────────────────────────────────────────────────────────────
// Hand-picked, explicit synonyms for common lost-and-found items.
// A production system would replace this with real semantic embeddings.
// Each array is a synonym group: all tokens in the group are normalised to the
// first element (the canonical form) before any comparison.
const SYNONYM_GROUPS = [
  ['backpack', 'bag', 'rucksack', 'knapsack', 'pack', 'satchel'],
  ['airpod', 'airpods', 'earbud', 'earbuds', 'earphone', 'earphones', 'headphone', 'headphones'],
  ['case', 'pouch', 'holder', 'cover', 'sleeve'],
  ['phone', 'cellphone', 'mobile', 'smartphone', 'iphone'],
  ['wallet', 'purse'],
  ['laptop', 'notebook', 'macbook', 'computer'],
  ['charger', 'cable', 'cord', 'adapter'],
  ['key', 'keys', 'keychain', 'keyring'],
  ['glasses', 'spectacles', 'specs', 'sunglasses', 'shades'],
  ['umbrella', 'brolly'],
  ['black', 'dark'],
  ['scarlet', 'red', 'crimson'],
];

// Build a flat lookup map: synonym → canonical form (first element of group)
const SYNONYM_MAP = new Map();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const word of group) {
    SYNONYM_MAP.set(word, canonical);
  }
}

// ─── Stopwords ────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'it', 'its', 'is', 'was', 'are', 'were',
  'i', 'my', 'me', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them',
  'this', 'that', 'these', 'those', 'have', 'has', 'had', 'be', 'been',
  'will', 'would', 'can', 'could', 'not', 'no', 'so', 'if', 'as', 'very',
  'lost', 'found', 'item', 'report',
  // Generic location words — strip these so distinctive landmark names dominate
  // the location Jaccard signal. E.g. "Main Library, 3rd floor" → ["main", "library"]
  'floor', 'level', 'room', 'area', 'building', 'near', 'block',
  'side', 'section', 'wing', 'hall', 'ground',
]);

// ─── Tokenizer ────────────────────────────────────────────────────────────────
/**
 * Tokenize a text string into normalized, de-duplicated tokens.
 * Steps: lowercase → strip punctuation → split → remove stopwords →
 *        naive singularize → apply synonym map.
 *
 * Returns an array (not a set) to preserve frequency information for TF-IDF.
 */
export function tokenize(text) {
  if (!text) return [];

  return text
    .toLowerCase()
    // Strip punctuation but keep hyphens between words and apostrophes (for possessives)
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      // Strip ordinal suffixes: "3rd" → "3", "1st" → "1", "2nd" → "2", "4th" → "4"
      // Helps location matching: "3rd floor" vs "level 3" both tokenize to "3"
      token = token.replace(/^(\d+)(?:st|nd|rd|th)$/, '$1');

      // Naive singularization: strip trailing 's' for tokens > 3 chars
      // (handles "airpods" → "airpod", "bags" → "bag", etc.)
      // Deliberately naive: a production system would use a proper stemmer.
      if (token.length > 3 && token.endsWith('s') && !/\d$/.test(token)) {
        token = token.slice(0, -1);
      }
      // Apply synonym normalization
      return SYNONYM_MAP.get(token) ?? token;
    })
    .filter((token) => !STOPWORDS.has(token) && token.length > 1);
}

// ─── Signal 1: Text Similarity (TF-IDF cosine) ───────────────────────────────
/**
 * TF-IDF-style cosine similarity over category + description.
 * Weight: 0.35
 *
 * Uses raw term frequency (TF) weighted by inverse document frequency (IDF)
 * derived from the two documents being compared. This is a simplified "local
 * IDF" — sufficient for two-document comparison without a corpus.
 */
function computeTfIdfCosine(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;

  const tf = (tokens) => {
    const freq = new Map();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    const max = Math.max(...freq.values());
    const normalized = new Map();
    for (const [term, count] of freq) normalized.set(term, count / max);
    return normalized;
  };

  const tfA = tf(tokensA);
  const tfB = tf(tokensB);

  // Vocabulary: union of both token sets
  const vocab = new Set([...tfA.keys(), ...tfB.keys()]);

  // IDF with add-1 smoothing: log(1 + N/df) where N=2 (two-document corpus).
  // This ensures terms shared by both docs (df=2) still get a positive weight:
  //   log(1 + 2/2) = log(2) ≈ 0.693
  // While unique terms (df=1) get a higher weight:
  //   log(1 + 2/1) = log(3) ≈ 1.099
  // The old formula log(N/df) was incorrect — it zeroed all shared terms (log(1)=0),
  // which collapsed cosine similarity to 0 whenever documents shared any content.
  const idf = (term) => {
    const df = (tfA.has(term) ? 1 : 0) + (tfB.has(term) ? 1 : 0);
    return Math.log(1 + 2 / df);
  };

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const term of vocab) {
    const a = (tfA.get(term) ?? 0) * idf(term);
    const b = (tfB.get(term) ?? 0) * idf(term);
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function textSimilarity(reportA, reportB) {
  const tokensA = tokenize(`${reportA.category} ${reportA.description}`);
  const tokensB = tokenize(`${reportB.category} ${reportB.description}`);
  return computeTfIdfCosine(tokensA, tokensB);
}

// ─── Signal 2: Category Match ─────────────────────────────────────────────────
/**
 * Category match score.
 * Weight: 0.30
 *
 * 1. Exact match after normalization → 1.0
 * 2. Token-set overlap (Jaccard) of the tokenized categories
 * 3. Bigram Dice coefficient for fuzzy string matching
 * Returns the maximum of (2) and (3) — they're complementary.
 */
function bigrams(str) {
  const result = [];
  for (let i = 0; i < str.length - 1; i++) {
    result.push(str.slice(i, i + 2));
  }
  return result;
}

function diceCoefficient(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (!bigramsA.length || !bigramsB.length) return 0;

  const setB = new Map();
  for (const bg of bigramsB) setB.set(bg, (setB.get(bg) ?? 0) + 1);

  let matches = 0;
  for (const bg of bigramsA) {
    const count = setB.get(bg) ?? 0;
    if (count > 0) {
      matches++;
      setB.set(bg, count - 1);
    }
  }

  // Require at least 2 matching bigrams to avoid noise from single-bigram
  // coincidences (e.g. "umbrella" and "laptop" share the bigram "la" →
  // matches=1 → Dice=0.083 which is spurious overlap, not real similarity).
  if (matches < 2) return 0;

  return (2 * matches) / (bigramsA.length + bigramsB.length);
}

export function categoryMatch(reportA, reportB) {
  const normalize = (s) => (s ?? '').toLowerCase().trim();
  const catA = normalize(reportA.category);
  const catB = normalize(reportB.category);

  // Exact match after normalization
  if (catA === catB) return 1.0;

  // Token-set Jaccard
  const tokA = new Set(tokenize(catA));
  const tokB = new Set(tokenize(catB));
  const intersection = new Set([...tokA].filter((t) => tokB.has(t)));
  const union = new Set([...tokA, ...tokB]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;

  // Bigram Dice on raw (normalized) strings
  const dice = diceCoefficient(catA, catB);

  return Math.max(jaccard, dice);
}

// ─── Signal 3: Location Overlap (Jaccard) ─────────────────────────────────────
/**
 * Jaccard similarity of tokenized location keywords.
 * Weight: 0.20
 *
 * No geocoding. This app compares words, not coordinates.
 * "Main Library, 3rd floor" vs "library building" → shared tokens: ["library"]
 */
export function locationOverlap(reportA, reportB) {
  const tokA = new Set(tokenize(reportA.location ?? ''));
  const tokB = new Set(tokenize(reportB.location ?? ''));

  if (!tokA.size || !tokB.size) return 0;

  const intersection = new Set([...tokA].filter((t) => tokB.has(t)));
  const union = new Set([...tokA, ...tokB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ─── Signal 4: Color Match ───────────────────────────────────────────────────
export function colorMatch(reportA, reportB) {
  if (!reportA.color || !reportB.color) return 0.5; // Neutral if missing
  return (reportA.color.toLowerCase() === reportB.color.toLowerCase()) ? 1.0 : 0.0;
}

// ─── Signal 5: Time Plausibility ──────────────────────────────────────────────
/**
 * Time plausibility score.
 * Weight: 0.15
 *
 * Scoring rationale:
 *   - found_date >= lost_date: physically plausible. Full score if ≤1 day apart,
 *     decaying toward 0 as the gap grows, near-zero beyond ~30 days.
 *   - found_date < lost_date: physically implausible (item found before it was
 *     reported lost). Heavily penalized, but not hard-zeroed: self-reported dates
 *     are often approximate ("I think I lost it yesterday").
 */
export function timePlausibility(lostReport, foundReport) {
  const lostDate = new Date(lostReport.event_date);
  const foundDate = new Date(foundReport.event_date);

  if (isNaN(lostDate.getTime()) || isNaN(foundDate.getTime())) return 0.5; // Unknown → neutral

  const diffDays = (foundDate - lostDate) / (1000 * 60 * 60 * 24);

  if (diffDays >= 0) {
    // Found on or after lost date — plausible
    // Full credit (1.0) if ≤ 1 day, tapering by ~2 weeks, near zero beyond ~30 days
    // Uses an exponential decay: score = e^(-k * diffDays)
    // k = ln(2) / 14 ≈ 0.0495 gives half-score at 14 days, ~10% at 47 days
    const k = Math.LN2 / 14;
    return Math.exp(-k * diffDays);
  } else {
    // Found BEFORE lost date — implausible
    // Apply a heavy penalty: max 0.2, decaying quickly
    const absDiff = Math.abs(diffDays);
    const k = Math.LN2 / 3; // Halves every 3 days
    return 0.2 * Math.exp(-k * absDiff);
  }
}

// ─── Reasons Builder ─────────────────────────────────────────────────────────
/**
 * Produces human-readable reason strings for signals that meaningfully contributed.
 * Only signals above a contribution threshold are included.
 * This transparency is the core UX value of the matching engine.
 */
function buildReasons(lostReport, foundReport, breakdown) {
  const reasons = [];

  // Text similarity
  if (breakdown.text >= 0.3) {
    reasons.push('Strong description overlap');
  } else if (breakdown.text >= 0.15) {
    reasons.push('Partial description match');
  }

  // Category
  if (breakdown.category >= 0.9) {
    const cat = (lostReport.category ?? '').toLowerCase();
    reasons.push(`Same category ("${cat}")`);
  } else if (breakdown.category >= 0.5) {
    reasons.push('Similar category');
  } else if (breakdown.category >= 0.25) {
    reasons.push('Related category');
  }

  // Location — find shared keywords
  if (breakdown.location >= 0.15) {
    const tokLost = new Set(tokenize(lostReport.location ?? ''));
    const tokFound = new Set(tokenize(foundReport.location ?? ''));
    const shared = [...tokLost].filter((t) => tokFound.has(t));
    if (shared.length > 0) {
      const keyword = shared[0];
      reasons.push(`Shared location keyword: "${keyword}"`);
    }
  }

  // Color
  if (breakdown.color === 1.0) {
    reasons.push(`Exact color match (${lostReport.color})`);
  } else if (breakdown.color === 0.0) {
    reasons.push(`Color mismatch (${lostReport.color} vs ${foundReport.color})`);
  }

  // Time
  const lostDate = new Date(lostReport.event_date);
  const foundDate = new Date(foundReport.event_date);
  if (!isNaN(lostDate.getTime()) && !isNaN(foundDate.getTime())) {
    const diffDays = Math.round((foundDate - lostDate) / (1000 * 60 * 60 * 24));
    if (breakdown.time >= 0.7) {
      if (diffDays === 0) reasons.push('Same day');
      else if (Math.abs(diffDays) <= 1) reasons.push('1 day apart');
      else reasons.push(`${Math.abs(diffDays)} days apart`);
    } else if (breakdown.time >= 0.3) {
      reasons.push(`${Math.abs(diffDays)} days apart`);
    } else if (diffDays < 0) {
      reasons.push('Found date is before lost date (dates may be approximate)');
    }
  }

  return reasons;
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────
/**
 * Score a lost/found pair.
 * @param {object} lostReport  — report with type='lost'
 * @param {object} foundReport — report with type='found'
 * @returns {{ score: number, tier: string, reasons: string[], breakdown: object }}
 */
export function scoreMatch(lostReport, foundReport) {
  const text = textSimilarity(lostReport, foundReport);
  const category = categoryMatch(lostReport, foundReport);
  const location = locationOverlap(lostReport, foundReport);
  const time = timePlausibility(lostReport, foundReport);
  const color = colorMatch(lostReport, foundReport);

  const score =
    text * WEIGHTS.text +
    category * WEIGHTS.category +
    location * WEIGHTS.location +
    time * WEIGHTS.time +
    color * WEIGHTS.color;

  const tier = score >= 0.65 ? 'strong' : score >= 0.4 ? 'possible' : 'weak';

  const breakdown = { text, category, location, time, color };
  const reasons = buildReasons(lostReport, foundReport, breakdown);

  return { score, tier, reasons, breakdown };
}

/**
 * Compute matches for a single report against a list of candidates (opposite type).
 * Filters by MIN_SCORE_THRESHOLD, sorts descending by score.
 *
 * @param {object}   report     — the report to find matches for
 * @param {object[]} candidates — open reports of the opposite type
 * @returns {Array<{ report: object, score, tier, reasons, breakdown }>}
 */
export function computeMatches(report, candidates) {
  const isLost = report.type === 'lost';

  return candidates
    .map((candidate) => {
      const lostReport = isLost ? report : candidate;
      const foundReport = isLost ? candidate : report;
      const result = scoreMatch(lostReport, foundReport);
      return { report: candidate, ...result };
    })
    .filter((m) => m.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}
