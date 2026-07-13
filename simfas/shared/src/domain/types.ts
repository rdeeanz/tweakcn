/**
 * Domain types — entitas inti SIMFAS.
 * Hierarki: Regional → Cabang → Kategori → Fasilitas → Objek Fasilitas → Data Periodik.
 * Sumber: PRD.md §5 & struktur kolom Excel Lap. Cabang / Rekap Regional.
 */

/** Peran pengguna sesuai PRD §3 (RBAC). */
export type UserRole =
  | "inspector" // Inspektor Cabang/Mitra
  | "admin_branch" // Admin Cabang (PIC Pelabuhan)
  | "admin_region" // Admin Regional
  | "management" // Manajemen Pusat / Viewer (read-only)
  | "superadmin"; // Superadmin IT

/** Kode kondisi form inspeksi (template-output-inspeksi.pdf). */
export type InspectionConditionCode = 1 | 2 | 3 | 4;

/** Status workflow inspeksi digital. */
export type InspectionStatus =
  | "draft"
  | "submitted"
  | "approved_branch"
  | "approved_partner"
  | "rejected";

/** Status warna availability di dashboard (PRD §7.3). */
export type AvailabilityStatus = "baik" | "perhatian" | "kritis";

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Branch {
  id: string;
  regionId: string;
  name: string;
  code: string;
}

export interface FacilityCategory {
  id: string;
  branchId: string;
  name: string; // Dermaga, Lapangan Penumpukan, Gudang, Terminal Penumpang
  sortOrder: number;
}

export interface Facility {
  id: string;
  categoryId: string;
  name: string;
  operator: string | null;
  constructionType: string | null;
}

export interface FacilityObject {
  id: string;
  facilityId: string;
  name: string; // Pelat Lantai, Fender, Bolder, Kanstin, dll.
  constructionType: string | null;
}

/**
 * Data periodik bulanan per Objek Fasilitas.
 * Kolom 5–18 Excel: dimensi, jumlah, kerusakan, siap pakai, operator, keterangan.
 * Availability dihitung, tidak disimpan (hindari write D1 berlebih — PRD §9.2).
 */
export interface ObjectRecord {
  id: string;
  objectId: string;
  year: number;
  month: number; // 1–12
  length: number | null;
  width: number | null;
  area: number | null;
  quantity: number | null;
  constructionType: string | null;
  availableQty: number; // Fasilitas Tersedia
  minorDamage: number; // Rusak Ringan
  moderateDamage: number; // Rusak Sedang
  severeDamage: number; // Rusak Berat
  readyQty: number; // Fasilitas Siap Pakai (input, bukan kalkulasi — PRD §5)
  operator: string | null;
  notes: string | null;
}

export interface Inspection {
  id: string;
  branchId: string;
  facilityId: string | null;
  location: string | null;
  inspectionDate: string; // ISO date
  previousInspectionDate: string | null;
  status: InspectionStatus;
  branchApproverId: string | null;
  partnerApproverId: string | null;
  branchApprovedAt: string | null;
  partnerApprovedAt: string | null;
  createdBy: string;
  notes: string | null;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  itemName: string;
  conditionCode: InspectionConditionCode;
  notes: string | null;
  photoKey: string | null; // R2 object key
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  regionId: string | null;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

/** Baris laporan Lap. Cabang (kolom 1–18). */
export interface ReportRow {
  no: string | number | null;
  facilityCategory: string | null; // kolom 2 Fasilitas
  facilityName: string | null; // kolom 3
  facilityObject: string | null; // kolom 4
  length: number | null;
  width: number | null;
  area: number | null;
  quantity: number | null;
  construction: string | null;
  availableQty: number | null;
  minorDamage: number | null;
  moderateDamage: number | null;
  severeDamage: number | null;
  readyQty: number | null;
  objectAvailabilityPct: number | null; // kolom 15
  facilityAvailabilityPct: number | null; // kolom 16
  operator: string | null; // kolom 17
  notes: string | null; // kolom 18
  rowType: "header" | "facility" | "object" | "subtotal" | "total";
}

/** Baris rekap regional (No, Fasilitas, Lokasi, Availability %). */
export interface RegionalRecapRow {
  no: string | number | null;
  facilityName: string | null;
  location: string | null;
  availabilityPct: number | null;
  rowType: "category" | "item" | "subtotal" | "total";
}
