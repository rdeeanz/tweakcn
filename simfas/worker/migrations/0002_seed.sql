-- Seed data contoh dari template Lap. Cabang (template-output-rekap.xlsx)
-- Password semua user demo: password123 (PBKDF2 hash akan diganti di runtime seed jika perlu)
-- Hash di bawah = placeholder; worker seed script memakai hash yang sama di dev.

INSERT OR IGNORE INTO regions (id, name, code) VALUES
  ('reg-2', 'Regional 2', 'REG2'),
  ('reg-3', 'Regional 3', 'REG3');

INSERT OR IGNORE INTO branches (id, region_id, name, code) VALUES
  ('br-tpriok', 'reg-2', 'Tanjung Priok', 'TPR'),
  ('br-panjang', 'reg-2', 'Panjang', 'PJG'),
  ('br-banten', 'reg-2', 'Banten', 'BTN'),
  ('br-benoa', 'reg-3', 'Benoa', 'BNO');

-- Password: password123 (SHA-256 base64 of "password123:simfas-salt" for demo simplicity)
-- Di production gunakan PBKDF2/argon2 via auth service.
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, branch_id, region_id) VALUES
  ('usr-super', 'Super Admin IT', 'superadmin@pelindo.co.id', 'demo:password123', 'superadmin', NULL, NULL),
  ('usr-mgmt', 'Manajemen Pusat', 'manajemen@pelindo.co.id', 'demo:password123', 'management', NULL, NULL),
  ('usr-reg2', 'Admin Regional 2', 'admin.reg2@pelindo.co.id', 'demo:password123', 'admin_region', NULL, 'reg-2'),
  ('usr-admin-tpr', 'Admin Cabang Tanjung Priok', 'admin.tpriok@pelindo.co.id', 'demo:password123', 'admin_branch', 'br-tpriok', 'reg-2'),
  ('usr-insp-tpr', 'Inspektor Tanjung Priok', 'inspektor.tpriok@pelindo.co.id', 'demo:password123', 'inspector', 'br-tpriok', 'reg-2');

-- Kategori fasilitas Cabang Tanjung Priok
INSERT OR IGNORE INTO facility_categories (id, branch_id, name, sort_order) VALUES
  ('cat-tpr-dermaga', 'br-tpriok', 'DERMAGA', 1),
  ('cat-tpr-lapangan', 'br-tpriok', 'LAPANGAN PENUMPUKAN', 2),
  ('cat-tpr-gudang', 'br-tpriok', 'GUDANG', 3),
  ('cat-tpr-terminal', 'br-tpriok', 'TERMINAL PENUMPANG', 4);

-- Fasilitas contoh dari Lap. Cabang
INSERT OR IGNORE INTO facilities (id, category_id, name, operator, construction_type) VALUES
  ('fac-dermaga-a', 'cat-tpr-dermaga', 'Dermaga A', 'SPTP', 'Tiang Pancang'),
  ('fac-jetty-b', 'cat-tpr-dermaga', 'Jetty B', 'SPMT', 'Tiang Pancang'),
  ('fac-lap-a', 'cat-tpr-lapangan', 'Lapangan Penumpukan A', 'SPTP', 'Paving Blok'),
  ('fac-lap-b', 'cat-tpr-lapangan', 'Lapangan Penumpukan B', 'SPMT', 'Beton'),
  ('fac-gudang-a', 'cat-tpr-gudang', 'Gudang A', 'SPSL', 'Beton'),
  ('fac-term-a', 'cat-tpr-terminal', 'Terminal Penumpang A', 'SPTP', 'Beton');

-- Objek fasilitas Dermaga A
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-da-pelat', 'fac-dermaga-a', 'Pelat Lantai'),
  ('obj-da-fender', 'fac-dermaga-a', 'Fender'),
  ('obj-da-bolder', 'fac-dermaga-a', 'Bolder'),
  ('obj-da-kanstin', 'fac-dermaga-a', 'Kanstin'),
  ('obj-da-rel', 'fac-dermaga-a', 'Rel Crane');

-- Objek Jetty B
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-jb-pelat', 'fac-jetty-b', 'Pelat Lantai'),
  ('obj-jb-fender', 'fac-jetty-b', 'Fender'),
  ('obj-jb-bolder', 'fac-jetty-b', 'Bolder'),
  ('obj-jb-kanstin', 'fac-jetty-b', 'Kanstin'),
  ('obj-jb-breast', 'fac-jetty-b', 'Breasting Dolphin'),
  ('obj-jb-moor', 'fac-jetty-b', 'Mooring Dolphin');

-- Objek Lapangan A
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-la-lap', 'fac-lap-a', 'Lapangan'),
  ('obj-la-sit', 'fac-lap-a', 'Sitting Pad'),
  ('obj-la-rtg', 'fac-lap-a', 'RTG Pad'),
  ('obj-la-turn', 'fac-lap-a', 'Turning Plate');

-- Objek Lapangan B
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-lb-lap', 'fac-lap-b', 'Lapangan');

-- Objek Gudang A
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-ga-lantai', 'fac-gudang-a', 'Lantai Gudang'),
  ('obj-ga-atap', 'fac-gudang-a', 'Atap'),
  ('obj-ga-dinding', 'fac-gudang-a', 'Dinding Gudang'),
  ('obj-ga-pintu', 'fac-gudang-a', 'Pintu Gudang');

-- Objek Terminal A
INSERT OR IGNORE INTO facility_objects (id, facility_id, name) VALUES
  ('obj-ta-lantai', 'fac-term-a', 'Lantai'),
  ('obj-ta-atap', 'fac-term-a', 'Atap'),
  ('obj-ta-dinding', 'fac-term-a', 'Dinding'),
  ('obj-ta-util', 'fac-term-a', 'Utilitas');

-- Data periodik Mei 2026 (sesuai contoh Lap. Cabang template)
-- object_records: ready/available dari template → availability dihitung on-read

INSERT OR IGNORE INTO object_records (id, object_id, year, month, length, width, area, quantity, available_qty, minor_damage, moderate_damage, severe_damage, ready_qty, operator) VALUES
  -- Dermaga A (avail objek: 100, 98, 90, 97, 100 → facility avg 97)
  ('rec-da-pelat-2026-5', 'obj-da-pelat', 2026, 5, 250, 15, 3750, NULL, 3750, 0, 0, 0, 3750, 'SPTP'),
  ('rec-da-fender-2026-5', 'obj-da-fender', 2026, 5, NULL, NULL, NULL, 25, 25, 1, 0, 0, 24.5, 'SPTP'),
  ('rec-da-bolder-2026-5', 'obj-da-bolder', 2026, 5, NULL, NULL, NULL, 10, 10, 0, 0, 1, 9, 'SPTP'),
  ('rec-da-kanstin-2026-5', 'obj-da-kanstin', 2026, 5, 250, NULL, NULL, NULL, 250, 0, 10, 0, 242.5, 'SPTP'),
  ('rec-da-rel-2026-5', 'obj-da-rel', 2026, 5, 450, NULL, NULL, NULL, 450, 0, 0, 0, 450, 'SPTP'),
  -- Jetty B (100, 90, 90, 100, 100, 100 → avg 96.666...)
  ('rec-jb-pelat-2026-5', 'obj-jb-pelat', 2026, 5, 100, 10, 1000, NULL, 1000, 0, 0, 0, 1000, 'SPMT'),
  ('rec-jb-fender-2026-5', 'obj-jb-fender', 2026, 5, NULL, NULL, NULL, 10, 10, 0, 0, 1, 9, 'SPMT'),
  ('rec-jb-bolder-2026-5', 'obj-jb-bolder', 2026, 5, NULL, NULL, NULL, 5, 5, 1, 0, 0, 4.5, 'SPMT'),
  ('rec-jb-kanstin-2026-5', 'obj-jb-kanstin', 2026, 5, 100, NULL, NULL, NULL, 100, 0, 0, 0, 100, 'SPMT'),
  ('rec-jb-breast-2026-5', 'obj-jb-breast', 2026, 5, NULL, NULL, NULL, 2, 2, 0, 0, 0, 2, 'SPMT'),
  ('rec-jb-moor-2026-5', 'obj-jb-moor', 2026, 5, NULL, NULL, NULL, 2, 2, 0, 0, 0, 2, 'SPMT'),
  -- Lapangan A (99.5, 100, 91.666..., 100 → avg 97.7916...)
  ('rec-la-lap-2026-5', 'obj-la-lap', 2026, 5, 200, 100, 20000, NULL, 20000, 0, 0, 100, 19900, 'SPTP'),
  ('rec-la-sit-2026-5', 'obj-la-sit', 2026, 5, NULL, NULL, NULL, 175, 175, 0, 0, 0, 175, 'SPTP'),
  ('rec-la-rtg-2026-5', 'obj-la-rtg', 2026, 5, 600, NULL, NULL, NULL, 600, 0, 0, 50, 550, 'SPTP'),
  ('rec-la-turn-2026-5', 'obj-la-turn', 2026, 5, NULL, NULL, NULL, 24, 24, 0, 0, 0, 24, 'SPTP'),
  -- Lapangan B (100)
  ('rec-lb-lap-2026-5', 'obj-lb-lap', 2026, 5, 200, 200, 40000, NULL, 40000, 0, 0, 0, 40000, 'SPMT'),
  -- Gudang A (100, 100, 100, 91.25 → avg 97.8125)
  ('rec-ga-lantai-2026-5', 'obj-ga-lantai', 2026, 5, 200, 20, 4000, NULL, 4000, 0, 0, 0, 4000, 'SPSL'),
  ('rec-ga-atap-2026-5', 'obj-ga-atap', 2026, 5, 200, 20, 4000, NULL, 4000, 0, 0, 0, 4000, 'SPSL'),
  ('rec-ga-dinding-2026-5', 'obj-ga-dinding', 2026, 5, 440, 4, 1760, NULL, 1760, 0, 0, 0, 1760, 'SPSL'),
  ('rec-ga-pintu-2026-5', 'obj-ga-pintu', 2026, 5, NULL, NULL, NULL, 4, 4, 0, 0.5, 0, 3.65, 'SPSL'),
  -- Terminal A (semua 100)
  ('rec-ta-lantai-2026-5', 'obj-ta-lantai', 2026, 5, 50, 20, 1000, NULL, 1000, 0, 0, 0, 1000, 'SPTP'),
  ('rec-ta-atap-2026-5', 'obj-ta-atap', 2026, 5, 50, 20, 1000, NULL, 1000, 0, 0, 0, 1000, 'SPTP'),
  ('rec-ta-dinding-2026-5', 'obj-ta-dinding', 2026, 5, 140, 4, 560, NULL, 560, 0, 0, 0, 560, 'SPTP'),
  ('rec-ta-util-2026-5', 'obj-ta-util', 2026, 5, NULL, NULL, NULL, 10, 10, 0, 0, 0, 10, 'SPTP');

-- Tren historis beberapa bulan (untuk grafik dashboard) — ringkas
INSERT OR IGNORE INTO object_records (id, object_id, year, month, length, width, area, quantity, available_qty, minor_damage, moderate_damage, severe_damage, ready_qty, operator) VALUES
  ('rec-da-pelat-2026-4', 'obj-da-pelat', 2026, 4, 250, 15, 3750, NULL, 3750, 0, 0, 0, 3700, 'SPTP'),
  ('rec-da-fender-2026-4', 'obj-da-fender', 2026, 4, NULL, NULL, NULL, 25, 25, 2, 0, 0, 24, 'SPTP'),
  ('rec-da-bolder-2026-4', 'obj-da-bolder', 2026, 4, NULL, NULL, NULL, 10, 10, 0, 0, 1, 9, 'SPTP'),
  ('rec-da-kanstin-2026-4', 'obj-da-kanstin', 2026, 4, 250, NULL, NULL, NULL, 250, 0, 15, 0, 238.75, 'SPTP'),
  ('rec-da-rel-2026-4', 'obj-da-rel', 2026, 4, 450, NULL, NULL, NULL, 450, 0, 0, 0, 450, 'SPTP');

-- Contoh inspeksi
INSERT OR IGNORE INTO inspections (id, branch_id, facility_id, location, inspection_date, previous_inspection_date, status, created_by, notes) VALUES
  ('insp-001', 'br-tpriok', 'fac-dermaga-a', 'Area Nusantara I', '2026-05-10', '2026-04-12', 'submitted', 'usr-insp-tpr', 'Inspeksi rutin bulanan');

INSERT OR IGNORE INTO inspection_items (id, inspection_id, item_name, condition_code, notes) VALUES
  ('insp-item-1', 'insp-001', 'Pelat Lantai', 1, 'Kondisi baik'),
  ('insp-item-2', 'insp-001', 'Fender', 3, '1 unit fender retak'),
  ('insp-item-3', 'insp-001', 'Bolder', 2, NULL),
  ('insp-item-4', 'insp-001', 'Kanstin', 3, 'Kerusakan sedang 10m'),
  ('insp-item-5', 'insp-001', 'Rel Crane', 1, NULL);
