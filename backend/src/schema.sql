-- Lost & Found Matcher — Database Schema
-- Single table for both lost and found reports, distinguished by the `type` column.
-- This avoids joins for the matching query and keeps the data model simple.

CREATE TABLE IF NOT EXISTS reports (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(5)   NOT NULL CHECK (type IN ('lost', 'found')),
  category     TEXT         NOT NULL,
  description  TEXT         NOT NULL,
  location     TEXT         NOT NULL,
  event_date   DATE         NOT NULL,
  contact      TEXT,
  status       VARCHAR(8)   NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  -- private_detail is optional, only meaningful on found reports.
  -- It is a detail the finder knows but did NOT include in the public description
  -- (e.g. "coffee stain on inside pocket"). It is NEVER returned in any API response
  -- body — it is only used server-side to gate a claim attempt.
  private_detail TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for the most common query: listing by type and status
CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports (type, status);

-- Index for newest-first ordering
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
