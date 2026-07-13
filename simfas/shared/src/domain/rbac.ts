/**
 * Aturan RBAC (PRD §3).
 * Dipakai di API middleware dan UI (sembunyikan aksi yang tidak diizinkan).
 */

import type { UserRole } from "./types";

export type Permission =
  | "inspection:create"
  | "inspection:edit"
  | "inspection:submit"
  | "inspection:approve_branch"
  | "inspection:approve_partner"
  | "record:edit"
  | "master:edit_branch"
  | "master:edit_region"
  | "master:edit_all"
  | "user:manage"
  | "report:view_branch"
  | "report:view_region"
  | "report:view_all"
  | "report:export"
  | "audit:view"
  | "theme:manage";

/** Matriks permission per role. */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  inspector: [
    "inspection:create",
    "inspection:edit",
    "inspection:submit",
    "report:view_branch",
  ],
  admin_branch: [
    "inspection:create",
    "inspection:edit",
    "inspection:submit",
    "inspection:approve_branch",
    "inspection:approve_partner",
    "record:edit",
    "master:edit_branch",
    "report:view_branch",
    "report:export",
  ],
  admin_region: [
    "inspection:create",
    "record:edit",
    "master:edit_region",
    "report:view_region",
    "report:export",
    "audit:view",
  ],
  management: ["report:view_all", "report:export"],
  superadmin: [
    "inspection:create",
    "inspection:edit",
    "inspection:submit",
    "inspection:approve_branch",
    "inspection:approve_partner",
    "record:edit",
    "master:edit_branch",
    "master:edit_region",
    "master:edit_all",
    "user:manage",
    "report:view_branch",
    "report:view_region",
    "report:view_all",
    "report:export",
    "audit:view",
    "theme:manage",
  ],
};

/** Cek apakah role memiliki permission tertentu. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Cek scope data: user hanya boleh akses cabang/regional miliknya.
 * Superadmin & management pusat boleh semua.
 */
export function canAccessBranch(
  role: UserRole,
  userBranchId: string | null,
  userRegionId: string | null,
  targetBranchId: string,
  targetRegionId: string
): boolean {
  if (role === "superadmin" || role === "management") return true;
  if (role === "admin_region") {
    return userRegionId != null && userRegionId === targetRegionId;
  }
  // inspector & admin_branch: hanya cabang sendiri
  return userBranchId != null && userBranchId === targetBranchId;
}

/** Label role untuk UI. */
export function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    inspector: "Inspektor Cabang",
    admin_branch: "Admin Cabang",
    admin_region: "Admin Regional",
    management: "Manajemen Pusat",
    superadmin: "Superadmin",
  };
  return map[role];
}

/** Label kondisi inspeksi 1–4 (form kertas). */
export function inspectionConditionLabel(code: 1 | 2 | 3 | 4): string {
  const map = {
    1: "Fasilitas dalam kondisi baik",
    2: "Tidak ada perubahan dari inspeksi sebelumnya",
    3: "Ditemukan kerusakan tambahan dari inspeksi sebelumnya",
    4: "Terdapat kerusakan yang sudah diperbaiki",
  } as const;
  return map[code];
}
