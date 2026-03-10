-- AssetLens — Init DB
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  role       VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(200) NOT NULL,
  path         VARCHAR(500) UNIQUE NOT NULL,
  asset_type   VARCHAR(100),
  thumbnail_url VARCHAR(500),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(200) NOT NULL,
  path           VARCHAR(500) UNIQUE NOT NULL,
  screenshot_url VARCHAR(500),
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- Scene actors
CREATE TABLE IF NOT EXISTS scene_actors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id    UUID REFERENCES scenes(id) ON DELETE CASCADE,
  name        VARCHAR(200),
  actor_type  VARCHAR(100),
  light_type  VARCHAR(100),
  intensity   FLOAT,
  color       VARCHAR(20),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Docs
CREATE TABLE IF NOT EXISTS docs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(200),
  content       TEXT,
  template_type VARCHAR(100),
  entity_type   VARCHAR(100),
  entity_id     UUID,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS asset_tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id            UUID REFERENCES assets(id) ON DELETE SET NULL,
  task_name           VARCHAR(200),
  task_category       VARCHAR(100),
  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  status              VARCHAR(50) DEFAULT 'todo',
  priority            VARCHAR(50) DEFAULT 'normal',
  deadline            TIMESTAMP,
  brief               TEXT,
  target_polycount    INTEGER,
  target_texture_size VARCHAR(50),
  destination_path    VARCHAR(500),
  material_path       VARCHAR(500),
  import_config       JSONB,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Task references
CREATE TABLE IF NOT EXISTS task_references (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID REFERENCES asset_tasks(id) ON DELETE CASCADE,
  url        VARCHAR(500),
  image_url  VARCHAR(500),
  note       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID REFERENCES asset_tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  content    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50),
  title       VARCHAR(200),
  message     TEXT,
  entity_type VARCHAR(50),
  entity_id   UUID,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Project docs (bibliothèque)
CREATE TABLE IF NOT EXISTS project_docs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(200) NOT NULL,
  content       TEXT,
  category      VARCHAR(100),
  tags          TEXT[] DEFAULT '{}',
  file_url      VARCHAR(500),
  file_type     VARCHAR(50),
  cover_url     VARCHAR(500),
  author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(title, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(category, ''))
  ) STORED,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_docs_search_idx ON project_docs USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS project_docs_tags_idx   ON project_docs USING GIN(tags);