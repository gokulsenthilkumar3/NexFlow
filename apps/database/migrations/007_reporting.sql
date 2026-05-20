-- Migration 007: Reporting & Analytics Tables

CREATE TABLE IF NOT EXISTS report_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  query_type  VARCHAR(50) NOT NULL CHECK (query_type IN ('WORK_ITEMS','TICKETS','SLA','ASSETS','CUSTOM')),
  config      JSONB NOT NULL DEFAULT '{}',
  created_by  VARCHAR(255) NOT NULL,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
  triggered_by  VARCHAR(255) NOT NULL,
  result_url    TEXT,
  error_message TEXT,
  row_count     INTEGER,
  duration_ms   INTEGER,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  cron_expr     VARCHAR(100) NOT NULL,
  recipients    TEXT[] NOT NULL DEFAULT '{}',
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_runs_definition ON report_runs(definition_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_status     ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_schedules_def   ON report_schedules(definition_id);
