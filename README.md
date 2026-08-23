# 🔍 UniFound — Lost & Found Matcher

A modern full-stack web application designed for university campuses to report, match, and recover lost items using an intelligent multi-signal matching engine and built-in chat.

---

## 🛠️ Tech Stack & Languages

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6 *(JavaScript, HTML, CSS)*
- **Backend**: Node.js, Express.js *(JavaScript ES Modules)*
- **Database**: PostgreSQL with connection pooling & raw SQL queries *(SQL)*
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Storage**: Cloudinary & Multer for item photo uploads
- **Deployment**: Vercel (Frontend), Render (Backend), Neon (Serverless PostgreSQL)

---

## 💡 The Approach Taken

1. **Deterministic Multi-Signal Engine**: Rather than relying on unreliable black-box AI or expensive APIs, the core engine scores matches deterministically across 5 independent signals with human-readable match reasons.
2. **User-Centric Matching Feed**: Users submit lost or found reports and immediately get a consolidated "My Matches" feed with real-time match scores and signal breakdowns.
3. **Frictionless Communication**: Matched parties can directly message in-app or reach out via email to verify item details and arrange returns.

---

## 📌 Important Assumptions

- **Campus Context**: Landmark and building names (e.g., *"Main Library"*, *"Student Union"*) provide sufficient location signal without requiring heavy GPS geocoordinates.
- **Fuzzy Timelines**: Self-reported dates are approximate (a student might report an item lost days after the fact); time scoring applies an exponential decay rather than strict cutoffs.
- **Human Verification**: While the engine scores matches, final ownership verification is best handled through direct chat and communication between the owner and finder.

---

## ⚙️ How the Matching System Works

Each lost-and-found item pair is scored on a **0% to 100% scale**. Matches below **50%** are filtered out as noise.

### 5 Scored Signals

| Signal | Weight | Method |
|---|:---:|---|
| **Text Similarity** | **35%** | TF-IDF cosine similarity over `category + description` with tokenization, stopword removal, singularization, and synonym normalization. |
| **Category Match** | **25%** | Exact match + token-set Jaccard overlap & bigram Dice coefficient. |
| **Location Overlap** | **15%** | Jaccard overlap of distinctive landmark keywords. |
| **Time Plausibility** | **15%** | Exponential decay curve based on days elapsed between lost and found dates. |
| **Color Match** | **10%** | Direct comparison of selected item colors. |

### Match Tiers
- **Strong Match**: Score ≥ 65%
- **Possible Match**: Score 50% – 64%
- *(Scores < 50% are excluded)*

---

## 🏗️ Major Technical Decisions

1. **Rule-Based Engine Over LLM/Vector APIs**: Fast (sub-millisecond), zero operational cost, 100% deterministic, explainable, and fully unit-testable offline.
2. **Raw SQL with `pg` Pool**: Kept the backend lightweight and transparent without heavy ORM layers.
3. **Live In-App Chat**: Real-time conversation thread scoped to the matched pair (`lost_report_id` + `found_report_id`) with authenticated participant access control.
4. **Cloudinary for Image Uploads**: Cloud-hosted image storage with automatic optimization and CDN delivery.

---

## 🚫 Intentionally Chosen Not to Build

- **Complex Map Geofencing**: Campus location keywords provide sufficient precision without maps overhead.
- **Strict Automated Claim Gating**: Avoided rigid algorithmic verification that could lock out legitimate owners due to phrasing mismatches.
- **Heavy Full-Text Search Engines**: Local in-memory tokenization and scoring keeps deployment simple and dependency-free.

---

## 🚀 What to Improve for a Production Product

1. **Vision Models / Perceptual Hashing**: Use visual embeddings (e.g., CLIP or perceptual image hashes) to match uploaded item photos automatically.
2. **Instant Notifications**: Automated email/push/SMS alerts when a new report scores above 70% against an existing item.
3. **University SSO Integration**: Single Sign-On (SAML / OAuth / Google Workspace) to authenticate university students and staff automatically.
4. **Machine-Learned Weights**: Optimize signal weights using feedback data (confirmed returns vs. dismissed matches).

---

## 💻 Local Setup

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN, CLOUDINARY credentials
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
