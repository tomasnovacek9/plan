CREATE TABLE IF NOT EXISTS shared_plan_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT,
  write_id TEXT
);
INSERT OR IGNORE INTO shared_plan_state (id) VALUES (1);
CREATE TABLE IF NOT EXISTS shared_plan_history (
  revision INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  write_id TEXT NOT NULL
);
