# Lost & Found Matcher

A small full-stack web application for a university lost-and-found system. Students submit lost and found item reports; the app surfaces ranked potential matches with score explanations.

---

## Approach

The app is a Node/Express backend paired with a React/Vite frontend. The core of the assessment is a **rule-based, deterministic matching engine** (`matching.js`) that scores every lost/found pair across four independent signals and returns both a weighted score and human-readable reasons for each match.

The data model is intentionally simple: a single `reports` table, a type flag (`lost`/`found`), and a `private_detail` column used only server-side for the claim flow.

---

## Assumptions

| Area | Decision |
|---|---|
| **Data model** | One `reports` table for both types, distinguished by `type`. Avoids join complexity for matching queries. |
| **Location** | Free-text field only, no geocoding. The matcher compares location keywords (Jaccard similarity). This is intentional — geocoding introduces infrastructure complexity not proportionate to a university campus context. |
| **Dates** | Self-reported and trusted at face value. A found date before the lost date is penalized but not hard-zeroed, because people often misremember exact dates. |
| **Contact** | Optional free-text (email or phone). No verification, no auth layer. Contact is only revealed to the claimant via the claim endpoint. |
| **Auth/login** | Not implemented. The app is anonymous by design for this scope. |

---

## How Matching Works

The matching engine is in `backend/src/matching.js`. It is a collection of **pure functions** with no database or framework dependency, making it fully unit-testable in isolation.

### The Four Signals

| Signal | Weight | Method |
|---|---|---|
| **Text similarity** | 0.35 | TF-IDF cosine similarity over `category + description`, after tokenizing (lowercase, strip punctuation, remove stopwords, naive singularize trailing "s", apply synonym map) |
| **Category match** | 0.30 | Exact match → 1.0; otherwise max of token-set Jaccard and bigram Dice coefficient |
| **Location overlap** | 0.20 | Jaccard similarity of tokenized location keywords |
| **Time plausibility** | 0.15 | Exponential decay from found date ≥ lost date (full credit ≤1 day, half at ~14 days, near-zero beyond ~30 days). Found before lost is penalized at max 0.2, decaying quickly. |

### Combining Scores

```
score = text×0.35 + category×0.30 + location×0.20 + time×0.15
```

**Tiers:**
- `strong` — score ≥ 0.65
- `possible` — score ≥ 0.40
- `weak` — score ≥ 0.15 (below 0.15 is excluded entirely as noise)

### Synonym Map

The tokenizer applies a hand-picked synonym map before comparison:
```
backpack ↔ bag, rucksack, knapsack
airpods  ↔ earbud, earphone, headphone
case     ↔ pouch, holder, cover, sleeve
phone    ↔ cellphone, mobile, smartphone, iphone
wallet   ↔ purse
laptop   ↔ notebook, macbook
...
```
This handles the common "same item, different word" case without needing semantic embeddings.

### Why Rule-Based Instead of LLM/Embeddings

- **Deterministic**: the same pair always produces the same score, which matters for trust
- **Explainable**: every score traces to a specific signal — the `reasons` array surfaces exactly why something matched
- **Free and offline**: no API keys, no latency, no cost per query
- **Tuneable**: changing a weight or adding a synonym is a one-line edit

A production system would replace the synonym map and TF-IDF text signal with **semantic embeddings** (e.g. `text-embedding-3-small` or a local sentence-transformer). The four-signal weighted structure and the `reasons` transparency layer would remain the same — only the quality of the text and category signals would improve.

---

## Major Technical Decisions

| Decision | Rationale |
|---|---|
| **Node + Express** | Minimal, readable, matches the raw-SQL constraint well |
| **No ORM** | SQL is visible in `routes/reports.js`. Queries are simple enough that an ORM would add abstraction without benefit |
| **Single `reports` table** | Avoids a `JOIN` in the matching query; the `type` column is the only structural difference between lost and found |
| **Synonym map** | Lightweight, auditable substitute for semantic similarity. A production system would use embeddings |
| **`private_detail` never in responses** | The column is selected separately only in the claim endpoint handler, never via the `SAFE_COLUMNS` constant used everywhere else |

---

## What Was Intentionally Not Built

- **Photo upload / image matching** — Would be the highest-signal feature in production (perceptual hashing), but out of scope for this assessment
- **Real identity verification** — The `private_detail` claim gate is a **fraud-reduction nudge**, not verification. It makes opportunistic false claims significantly harder (you must know a non-public detail), but a determined bad actor who observed the item could still succeed. A production system would require university SSO login, photo evidence, and likely a staff review step. This limitation is documented explicitly here and in the claim endpoint code comment.
- **Geocoded / structured locations** — Free text is intentional; structured location pickers are infrastructure work not proportionate to the assessment scope
- **Proactive notifications** — No email/push when a new report matches an existing one
- **Auth / login** — Anonymous submission; no session management
- **Persisted dismissals** — "Not a match" is client-side only (dismissed set in React state, not persisted to DB). Kept simple deliberately.

---

## What I'd Improve for a Real Product

1. **Photo hashing as a 5th signal** — Perceptual hashing (e.g. `sharp` + `blockhash`) would be the most reliable signal; a matching bag photo is near-conclusive
2. **Semantic embeddings replacing the synonym map** — Replace TF-IDF + synonym normalization with `text-embedding-3-small` or a local `all-MiniLM-L6` model; handles vocabulary variation automatically
3. **Proactive matching on ingestion** — When a new report is submitted, run matching immediately against all open opposite-type reports and notify high-scoring counterparties
4. **Structured location picker** — Building + room selector, or campus map click, would make location matching far more reliable than free text
5. **Weight tuning from real data** — Replace hand-picked weights (0.35, 0.30, 0.20, 0.15) with weights learned from confirmed/dismissed feedback using logistic regression or a simple Bayesian model
6. **University SSO** — Authentication via the university identity provider, so contact info is already known and verified

---

## Run Instructions

### Prerequisites

- Node.js ≥ 18
- PostgreSQL (local instance or any Postgres-compatible host)

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE lostfound;"
```

### 2. Install dependencies

```bash
# Backend
cd lost-found-matcher/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment (optional)

Create `backend/.env` if your Postgres settings differ from the defaults:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=lostfound
PGUSER=postgres
PGPASSWORD=yourpassword
PORT=3001
```

If you have a `DATABASE_URL` (e.g. from Railway/Heroku), set that instead.

### 4. Apply schema and seed data

```bash
cd lost-found-matcher/backend
node src/seed.js
```

This applies the schema and inserts 10 demonstration reports across 5 matched pairs.

### 5. Run tests

```bash
cd lost-found-matcher/backend
npm test
```

All 5 unit tests should pass.

### 6. Start the backend

```bash
cd lost-found-matcher/backend
npm run dev     # or: npm start
# API running at http://localhost:3001
```

### 7. Start the frontend

```bash
cd lost-found-matcher/frontend
npm run dev
# UI at http://localhost:5173
```

### 8. Verify end-to-end

1. Open `http://localhost:5173/reports` — you should see 10 seeded reports
2. Go to **Matches**, pick "Lost backpack (library)" (report #1) — should show a **strong** match (the library found backpack) and a **possible** match (the football-field backpack)
3. Go to **Matches**, pick "Lost AirPods case" (report #4) — should show a **strong** match with the earbud case via synonym normalization
4. On a match card, click **"This is a match"** — for the phone pair (report #9 lost, #10 found), you will be prompted for the private detail answer: `cracked back glass`
5. Submit the form to create a new report, then check Matches for it

---

## AI Usage

This application was built by an AI coding agent (**Antigravity**, powered by Google Gemini) from a detailed specification. The specification itself — including the stack choice, data model, matching algorithm design and signal weights, API shape, and fraud-mitigation approach — was worked out in conversation with Claude beforehand. The AI agent wrote all code (backend, frontend, tests, seed data, and this README) in a single autonomous execution pass.
