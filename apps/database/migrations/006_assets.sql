-- Migration 006: Asset Management Tables

CREATE TABLE IF NOT EXISTS asset_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  tag           VARCHAR(100) UNIQUE NOT NULL,
  category_id   UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
  status        VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE','IN_USE','MAINTENANCE','RETIRED','DISPOSED')),
  serial_number VARCHAR(200),
  purchase_date DATE,
  purchase_cost NUMERIC(12,2),
  location      VARCHAR(255),
  notes         TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id    UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to VARCHAR(255) NOT NULL,
  assigned_by VARCHAR(255) NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS asset_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action     VARCHAR(60) NOT NULL,
  actor_id   VARCHAR(255) NOT NULL,
  old_value  JSONB,
  new_value  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_status        ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category      ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assignments_asset    ON asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user     ON asset_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_asset_audit_asset    ON asset_audit_logs(asset_id);
