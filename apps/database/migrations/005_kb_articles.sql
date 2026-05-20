-- Migration 005: Knowledge Base Articles & Categories

CREATE TABLE IF NOT EXISTS kb_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  parent_id   UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kb_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) UNIQUE NOT NULL,
  content      TEXT NOT NULL,
  excerpt      TEXT,
  category_id  UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  author_id    VARCHAR(255) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  views        INTEGER NOT NULL DEFAULT 0,
  helpful_yes  INTEGER NOT NULL DEFAULT 0,
  helpful_no   INTEGER NOT NULL DEFAULT 0,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kb_article_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL DEFAULT 1,
  content     TEXT NOT NULL,
  changed_by  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_articles_category  ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status    ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug      ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_versions_article   ON kb_article_versions(article_id);
