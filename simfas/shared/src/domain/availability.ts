/**
 * Formula availability berjenjang (PRD §6).
 * Tervalidasi dari template-output-rekap.xlsx — tanpa hardcode angka rekap.
 *
 * 1. Objek = siap pakai ÷ tersedia × 100
 * 2. Fasilitas = rata-rata objek di dalamnya
 * 3. Kategori = rata-rata fasilitas
 * 4. Cabang/Regional = rata-rata kategori
 */

import type { AvailabilityStatus } from "./types";

/**
 * Availability Objek Fasilitas (%).
 * @param readyQty - Fasilitas Siap Pakai
 * @param availableQty - Fasilitas Tersedia
 * @returns persentase 0–100, atau null jika tidak dapat dihitung (tersedia = 0)
 */
export function calcObjectAvailability(
  readyQty: number,
  availableQty: number
): number | null {
  // Guard: pembagi nol → null (setara #DIV/0! di Excel, tidak dihitung di rata-rata)
  if (availableQty === 0 || availableQty == null || Number.isNaN(availableQty)) {
    return null;
  }
  if (readyQty == null || Number.isNaN(readyQty)) {
    return null;
  }
  return (readyQty / availableQty) * 100;
}

/**
 * Rata-rata aritmetika dari nilai non-null.
 * Dipakai untuk roll-up Fasilitas / Kategori / Cabang / Regional.
 * @param values - daftar persentase (null diabaikan)
 */
export function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter(
    (v): v is number => v != null && !Number.isNaN(v) && Number.isFinite(v)
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return sum / valid.length;
}

/**
 * Availability Fasilitas = rata-rata Availability Objek di dalamnya.
 */
export function calcFacilityAvailability(
  objectAvailabilities: Array<number | null | undefined>
): number | null {
  return average(objectAvailabilities);
}

/**
 * Availability Kategori = rata-rata Availability Fasilitas dalam kategori.
 */
export function calcCategoryAvailability(
  facilityAvailabilities: Array<number | null | undefined>
): number | null {
  return average(facilityAvailabilities);
}

/**
 * Availability Cabang atau Regional = rata-rata Availability Kategori.
 */
export function calcBranchOrRegionAvailability(
  categoryAvailabilities: Array<number | null | undefined>
): number | null {
  return average(categoryAvailabilities);
}

/**
 * Ambang status warna dashboard (PRD §7.3):
 * - Baik ≥ 95%
 * - Perhatian 80–95%
 * - Kritis < 80%
 */
export function getAvailabilityStatus(
  pct: number | null | undefined
): AvailabilityStatus | null {
  if (pct == null || Number.isNaN(pct)) return null;
  if (pct >= 95) return "baik";
  if (pct >= 80) return "perhatian";
  return "kritis";
}

/** Label bahasa Indonesia untuk status. */
export function availabilityStatusLabel(status: AvailabilityStatus): string {
  const map: Record<AvailabilityStatus, string> = {
    baik: "Baik",
    perhatian: "Perhatian",
    kritis: "Kritis",
  };
  return map[status];
}

/**
 * Format persentase untuk tampilan/laporan (2 desimal default).
 * Excel sering menampilkan banyak desimal; UI cukup 2.
 */
export function formatAvailabilityPct(
  pct: number | null | undefined,
  digits = 2
): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  return `${pct.toFixed(digits)}%`;
}

/**
 * Hitung roll-up penuh dari daftar objek → fasilitas → kategori → cabang.
 * Pure function: tidak menyentuh I/O (mudah diuji unit).
 */
export interface ObjectAvailInput {
  objectId: string;
  facilityId: string;
  categoryId: string;
  readyQty: number;
  availableQty: number;
}

export interface HierarchyAvailabilityResult {
  byObject: Record<string, number | null>;
  byFacility: Record<string, number | null>;
  byCategory: Record<string, number | null>;
  overall: number | null;
}

export function calcHierarchyAvailability(
  items: ObjectAvailInput[]
): HierarchyAvailabilityResult {
  // Level 1: objek
  const byObject: Record<string, number | null> = {};
  for (const item of items) {
    byObject[item.objectId] = calcObjectAvailability(
      item.readyQty,
      item.availableQty
    );
  }

  // Group objek per fasilitas
  const facilityGroups = new Map<string, Array<number | null>>();
  for (const item of items) {
    const list = facilityGroups.get(item.facilityId) ?? [];
    list.push(byObject[item.objectId]);
    facilityGroups.set(item.facilityId, list);
  }

  // Level 2: fasilitas
  const byFacility: Record<string, number | null> = {};
  for (const [facilityId, avails] of facilityGroups) {
    byFacility[facilityId] = calcFacilityAvailability(avails);
  }

  // Map facility → category (ambil dari item pertama)
  const facilityToCategory = new Map<string, string>();
  for (const item of items) {
    facilityToCategory.set(item.facilityId, item.categoryId);
  }

  // Group fasilitas per kategori
  const categoryGroups = new Map<string, Array<number | null>>();
  for (const [facilityId, pct] of Object.entries(byFacility)) {
    const catId = facilityToCategory.get(facilityId);
    if (!catId) continue;
    const list = categoryGroups.get(catId) ?? [];
    list.push(pct);
    categoryGroups.set(catId, list);
  }

  // Level 3: kategori
  const byCategory: Record<string, number | null> = {};
  for (const [catId, avails] of categoryGroups) {
    byCategory[catId] = calcCategoryAvailability(avails);
  }

  // Level 4: cabang/regional
  const overall = calcBranchOrRegionAvailability(Object.values(byCategory));

  return { byObject, byFacility, byCategory, overall };
}
