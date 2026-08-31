-- Leaderboard storage for Sushi48.
--
-- `scores.score` is always a value this Worker derived by replaying a move
-- log. Nothing a client claims about its score is ever written here.

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    provider      TEXT NOT NULL,
    provider_id   TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    UNIQUE (provider, provider_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    seed            INTEGER NOT NULL,
    ruleset_version INTEGER NOT NULL,
    created_at      INTEGER NOT NULL,
    submitted_at    INTEGER,
    ip_hash         TEXT NOT NULL
);

-- Supports the per-IP mint rate limit and the expiry sweep.
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON sessions (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions (created_at);

CREATE TABLE IF NOT EXISTS scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL UNIQUE REFERENCES sessions (id),
    user_id         TEXT NOT NULL REFERENCES users (id),
    score           INTEGER NOT NULL,
    max_tile        INTEGER NOT NULL,
    move_count      INTEGER NOT NULL,
    duration_ms     INTEGER NOT NULL,
    ruleset_version INTEGER NOT NULL,
    created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores (ruleset_version, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores (user_id, score DESC);
