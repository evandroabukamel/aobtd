-- Monitored sources. scan_slot sets the daily window (0=00h, 1=06h, 2=12h, 3=18h UTC).
CREATE TABLE sources (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('government', 'database', 'agency')),
  country       TEXT,
  homepage      TEXT NOT NULL,
  feed_url      TEXT NOT NULL,
  parser        TEXT NOT NULL CHECK (parser IN ('rss', 'asn_html')),
  scan_slot     SMALLINT NOT NULL CHECK (scan_slot BETWEEN 0 AND 3),
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  etag          TEXT,
  last_modified TEXT,
  last_scan_at  TIMESTAMPTZ,
  last_status   TEXT,
  last_error    TEXT
);

-- One accident can be cited by many articles (grouped by date and proximity).
CREATE TABLE accidents (
  id            BIGSERIAL PRIMARY KEY,
  occurred_at   TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  country       TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  aircraft      TEXT,
  fatalities    INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((lat IS NULL) = (lng IS NULL))
);
-- Covering index: the markers query reads only the index.
CREATE INDEX accidents_occurred_at_idx ON accidents (occurred_at) INCLUDE (lat, lng, fatalities);

CREATE TABLE articles (
  id           BIGSERIAL PRIMARY KEY,
  accident_id  BIGINT NOT NULL REFERENCES accidents (id) ON DELETE CASCADE,
  source_id    INTEGER NOT NULL REFERENCES sources (id),
  url          TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX articles_accident_idx ON articles (accident_id);

CREATE TABLE scan_runs (
  id          BIGSERIAL PRIMARY KEY,
  source_id   INTEGER NOT NULL REFERENCES sources (id),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL,
  items_seen  INTEGER NOT NULL DEFAULT 0,
  items_new   INTEGER NOT NULL DEFAULT 0,
  error       TEXT
);
CREATE INDEX scan_runs_source_idx ON scan_runs (source_id, started_at DESC);

-- Geocoding cache: avoids repeating Nominatim queries.
CREATE TABLE geocode_cache (
  query      TEXT PRIMARY KEY,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  country    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
