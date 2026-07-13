-- SIMFAS schema (PRD §10)
-- Hierarki: regions → branches → facility_categories → facilities → facility_objects → object_records
-- Inspeksi, users, audit_logs terpisah.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(region_id, code)
);

CREATE TABLE IF NOT EXISTS facility_categories (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES facility_categories(id),
  name TEXT NOT NULL,
  operator TEXT,
  construction_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facility_objects (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id),
  name TEXT NOT NULL,
  construction_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Data periodik bulanan. Availability TIDAK disimpan (hitung on-read — PRD §9.2).
CREATE TABLE IF NOT EXISTS object_records (
  id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL REFERENCES facility_objects(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  length REAL,
  width REAL,
  area REAL,
  quantity REAL,
  construction_type TEXT,
  available_qty REAL NOT NULL DEFAULT 0,
  minor_damage REAL NOT NULL DEFAULT 0,
  moderate_damage REAL NOT NULL DEFAULT 0,
  severe_damage REAL NOT NULL DEFAULT 0,
  ready_qty REAL NOT NULL DEFAULT 0,
  operator TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  UNIQUE(object_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_object_records_period ON object_records(year, month);
CREATE INDEX IF NOT EXISTS idx_object_records_object ON object_records(object_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('inspector','admin_branch','admin_region','management','superadmin')),
  branch_id TEXT REFERENCES branches(id),
  region_id TEXT REFERENCES regions(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  theme_preset TEXT DEFAULT 'pelindo',
  theme_mode TEXT DEFAULT 'light',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  facility_id TEXT REFERENCES facilities(id),
  location TEXT,
  inspection_date TEXT NOT NULL,
  previous_inspection_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved_branch','approved_partner','rejected')),
  branch_approver_id TEXT REFERENCES users(id),
  partner_approver_id TEXT REFERENCES users(id),
  branch_approved_at TEXT,
  partner_approved_at TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  condition_code INTEGER NOT NULL CHECK (condition_code BETWEEN 1 AND 4),
  notes TEXT,
  photo_key TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
