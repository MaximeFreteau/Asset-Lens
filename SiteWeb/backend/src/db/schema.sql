-- schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL UNIQUE,   -- chemin UE ex: /Game/Meshes/SM_Rock
  asset_type VARCHAR(100),             -- StaticMesh, Texture2D, Blueprint...
  thumbnail_url VARCHAR(500),
  metadata JSONB,                      -- données brutes UE (polys, taille...)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL UNIQUE,   -- chemin UE ex: /Game/Maps/L_Cave
  screenshot_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  actor_type VARCHAR(100),             -- StaticMeshActor, PointLight, Blueprint...
  transform JSONB,                     -- position, rotation, scale
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  light_type VARCHAR(100),             -- Point, Spot, Directional, Rect
  intensity FLOAT,
  color VARCHAR(20),                   -- hex
  temperature FLOAT,
  radius FLOAT,
  metadata JSONB,                      -- tous les autres paramètres UE
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(20),
  category VARCHAR(100)                -- 'ambiance', 'type', 'status'...
);

CREATE TABLE docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT,                        -- Markdown
  template_type VARCHAR(100),          -- asset, scene, light, metrics, ld, pipeline
  entity_type VARCHAR(100),            -- 'asset', 'scene', 'actor', 'light'
  entity_id UUID,                      -- id de l'entité liée
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE doc_tags (
  doc_id UUID REFERENCES docs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (doc_id, tag_id)
);

CREATE TABLE doc_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES docs(id) ON DELETE CASCADE,
  content TEXT,
  author_id UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Index utiles
CREATE INDEX idx_assets_path ON assets(path);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_actors_scene ON actors(scene_id);
CREATE INDEX idx_docs_entity ON docs(entity_type, entity_id);