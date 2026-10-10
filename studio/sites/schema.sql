CREATE TABLE fd_workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  actor TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  summary TEXT NOT NULL,
  document TEXT NOT NULL
);

CREATE INDEX fd_workspaces_actor ON fd_workspaces(actor);

CREATE TABLE fd_write_receipts (
  actor TEXT NOT NULL,
  scope TEXT NOT NULL,
  request_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  response TEXT NOT NULL,
  write_token TEXT NOT NULL,
  PRIMARY KEY (actor, scope, request_id)
);

CREATE TABLE fd_telemetry_daily (
  day TEXT NOT NULL,
  tool TEXT NOT NULL,
  storage TEXT NOT NULL,
  result TEXT NOT NULL,
  count INTEGER NOT NULL,
  latency_ms_total INTEGER NOT NULL,
  PRIMARY KEY (day, tool, storage, result)
);

CREATE TABLE fd_oauth_kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER
);

CREATE INDEX fd_oauth_kv_expiry ON fd_oauth_kv(expires_at);
