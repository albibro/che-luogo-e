PRAGMA foreign_keys = ON;
CREATE TABLE municipalities (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 province TEXT NOT NULL, region TEXT NOT NULL, istat_code TEXT UNIQUE,
 centroid_json TEXT CHECK(centroid_json IS NULL OR json_valid(centroid_json))
);
CREATE TABLE sources (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, publisher TEXT NOT NULL, url TEXT,
 review_status TEXT NOT NULL CHECK(review_status IN ('pending','approved','rejected')),
 license_json TEXT NOT NULL CHECK(json_valid(license_json)), reviewed_at TEXT,
 coverage TEXT NOT NULL, granularity TEXT NOT NULL,
 limitations_json TEXT NOT NULL CHECK(json_valid(limitations_json))
);
CREATE TABLE indicator_definitions (
 id TEXT PRIMARY KEY, category TEXT NOT NULL CHECK(category IN ('clima','rischi','aria','servizi','natura')),
 name TEXT NOT NULL, unit TEXT NOT NULL, description TEXT NOT NULL,
 planned_method TEXT NOT NULL, comparability TEXT NOT NULL
);
CREATE TABLE observations (
 id TEXT PRIMARY KEY, municipality_id TEXT NOT NULL REFERENCES municipalities(id),
 indicator_id TEXT NOT NULL REFERENCES indicator_definitions(id), source_id TEXT NOT NULL REFERENCES sources(id),
 kind TEXT NOT NULL CHECK(kind IN ('observed','derived','forecast')),
 value REAL, unit TEXT NOT NULL, missing_reason TEXT,
 period_from TEXT, period_to TEXT, retrieved_at TEXT NOT NULL, source_updated_at TEXT,
 spatial_level TEXT NOT NULL CHECK(spatial_level IN ('municipality','point','grid','province')),
 spatial_resolution TEXT NOT NULL, coverage_percent REAL CHECK(coverage_percent BETWEEN 0 AND 100),
 reliability_level TEXT NOT NULL CHECK(reliability_level IN ('high','medium','low','not-assessed')),
 reliability_reason TEXT NOT NULL, method_version TEXT,
 lineage_json TEXT NOT NULL CHECK(json_valid(lineage_json)),
 raw_payload_json TEXT NOT NULL CHECK(json_valid(raw_payload_json)), raw_url TEXT, checksum TEXT,
 CHECK((value IS NULL AND missing_reason IS NOT NULL) OR (value IS NOT NULL AND missing_reason IS NULL)),
 CHECK(kind NOT IN ('derived','forecast') OR method_version IS NOT NULL),
 CHECK((period_from IS NULL AND period_to IS NULL) OR (period_from IS NOT NULL AND period_to IS NOT NULL AND period_from <= period_to))
);
CREATE INDEX idx_observations_municipality_indicator_period ON observations(municipality_id,indicator_id,period_to);
CREATE TABLE assessments (
 id TEXT PRIMARY KEY, municipality_id TEXT NOT NULL REFERENCES municipalities(id),
 indicator_id TEXT NOT NULL REFERENCES indicator_definitions(id),
 score REAL CHECK(score BETWEEN 0 AND 100), label TEXT NOT NULL,
 method_version TEXT, explanation TEXT NOT NULL, calculated_at TEXT NOT NULL,
 CHECK(score IS NULL OR method_version IS NOT NULL)
);
CREATE TABLE assessment_inputs (
 assessment_id TEXT NOT NULL REFERENCES assessments(id),
 observation_id TEXT NOT NULL REFERENCES observations(id),
 PRIMARY KEY(assessment_id, observation_id)
);
-- No municipality-level overall score. Raw observations are append-only by application convention.
