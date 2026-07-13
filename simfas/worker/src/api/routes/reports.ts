/**
 * Dashboard, tabel laporan, rekap regional, ekspor xlsx/pdf.
 * Agregat dihitung on-read + cache KV singkat (PRD §9.2).
 */

import { Hono } from "hono";
import type { Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth, requirePermission } from "../middleware";
import {
  buildBranchReportRows,
  buildRegionalRecapRows,
  type RawRecordRow,
} from "../../application/report-builder";
import {
  exportBranchReportXlsx,
  exportRegionalRecapXlsx,
} from "../../infrastructure/excel-export";
import { exportReportPdf } from "../../infrastructure/pdf-export";
import {
  calcFacilityAvailability,
  calcObjectAvailability,
  getAvailabilityStatus,
} from "@simfas/shared";

const reports = new Hono<{ Bindings: Env; Variables: AppVariables }>();

reports.use("*", requireAuth);

/** Query raw records untuk 1 cabang + periode. */
async function fetchBranchRaw(
  db: D1Database,
  branchId: string,
  year: number,
  month: number
): Promise<RawRecordRow[]> {
  const { results } = await db
    .prepare(
      `SELECT
         c.id as categoryId, c.name as categoryName, c.sort_order as categorySort,
         f.id as facilityId, f.name as facilityName,
         f.operator as facilityOperator, f.construction_type as facilityConstruction,
         o.id as objectId, o.name as objectName,
         r.length, r.width, r.area, r.quantity,
         COALESCE(r.construction_type, o.construction_type) as constructionType,
         COALESCE(r.available_qty, 0) as availableQty,
         COALESCE(r.minor_damage, 0) as minorDamage,
         COALESCE(r.moderate_damage, 0) as moderateDamage,
         COALESCE(r.severe_damage, 0) as severeDamage,
         COALESCE(r.ready_qty, 0) as readyQty,
         r.operator, r.notes
       FROM facility_categories c
       JOIN facilities f ON f.category_id = c.id
       JOIN facility_objects o ON o.facility_id = f.id
       LEFT JOIN object_records r
         ON r.object_id = o.id AND r.year = ? AND r.month = ?
       WHERE c.branch_id = ?
       ORDER BY c.sort_order, f.name, o.name`
    )
    .bind(year, month, branchId)
    .all();

  return (results as Array<Record<string, unknown>>).map((r) => ({
    categoryId: String(r.categoryId),
    categoryName: String(r.categoryName),
    categorySort: Number(r.categorySort),
    facilityId: String(r.facilityId),
    facilityName: String(r.facilityName),
    facilityOperator: (r.facilityOperator as string) ?? null,
    facilityConstruction: (r.facilityConstruction as string) ?? null,
    objectId: String(r.objectId),
    objectName: String(r.objectName),
    length: r.length != null ? Number(r.length) : null,
    width: r.width != null ? Number(r.width) : null,
    area: r.area != null ? Number(r.area) : null,
    quantity: r.quantity != null ? Number(r.quantity) : null,
    constructionType: (r.constructionType as string) ?? null,
    availableQty: Number(r.availableQty ?? 0),
    minorDamage: Number(r.minorDamage ?? 0),
    moderateDamage: Number(r.moderateDamage ?? 0),
    severeDamage: Number(r.severeDamage ?? 0),
    readyQty: Number(r.readyQty ?? 0),
    operator: (r.operator as string) ?? null,
    notes: (r.notes as string) ?? null,
  }));
}

/** GET /api/reports/branch?branchId=&year=&month= */
reports.get("/branch", async (c) => {
  const branchId = c.req.query("branchId");
  const year = Number(c.req.query("year"));
  const month = Number(c.req.query("month"));
  if (!branchId || !year || !month) {
    return c.json(
      { success: false, error: "branchId, year, month wajib" },
      400
    );
  }

  const cacheKey = `report:branch:${branchId}:${year}:${month}`;
  const cached = await c.env.CACHE.get(cacheKey, "json");
  if (cached) {
    return c.json({ success: true, data: cached, meta: { cached: true } });
  }

  const branch = await c.env.DB.prepare(
    `SELECT b.name, b.id, r.name as regionName, r.id as regionId
     FROM branches b JOIN regions r ON r.id = b.region_id WHERE b.id = ?`
  )
    .bind(branchId)
    .first<{ name: string; regionName: string; regionId: string }>();

  if (!branch) {
    return c.json({ success: false, error: "Cabang tidak ditemukan" }, 404);
  }

  const raw = await fetchBranchRaw(c.env.DB, branchId, year, month);
  const built = buildBranchReportRows(raw);

  const data = {
    branchId,
    branchName: branch.name,
    regionName: branch.regionName,
    year,
    month,
    rows: built.rows,
    categoryAvails: built.categoryAvails.map((x) => ({
      ...x,
      status: getAvailabilityStatus(x.pct),
    })),
    overall: built.overall,
    overallStatus: getAvailabilityStatus(built.overall),
  };

  // Cache 5 menit di KV (kurangi load D1)
  await c.env.CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 300,
  });

  return c.json({ success: true, data, meta: { cached: false } });
});

/** GET /api/reports/regional?regionId=&year=&month= */
reports.get("/regional", async (c) => {
  const regionId = c.req.query("regionId");
  const year = Number(c.req.query("year"));
  const month = Number(c.req.query("month"));
  if (!regionId || !year || !month) {
    return c.json(
      { success: false, error: "regionId, year, month wajib" },
      400
    );
  }

  const region = await c.env.DB.prepare(
    `SELECT id, name FROM regions WHERE id = ?`
  )
    .bind(regionId)
    .first<{ id: string; name: string }>();
  if (!region) {
    return c.json({ success: false, error: "Regional tidak ditemukan" }, 404);
  }

  const { results: branches } = await c.env.DB.prepare(
    `SELECT id, name FROM branches WHERE region_id = ?`
  )
    .bind(regionId)
    .all<{ id: string; name: string }>();

  // Kumpulkan availability per fasilitas di semua cabang
  const facilityItems: Array<{
    categoryName: string;
    categorySort: number;
    facilityName: string;
    branchName: string;
    facilityAvailabilityPct: number | null;
  }> = [];

  const branchSummaries: Array<{
    branchId: string;
    branchName: string;
    overall: number | null;
    status: ReturnType<typeof getAvailabilityStatus>;
  }> = [];

  for (const br of branches ?? []) {
    const raw = await fetchBranchRaw(c.env.DB, br.id, year, month);
    const built = buildBranchReportRows(raw);
    branchSummaries.push({
      branchId: br.id,
      branchName: br.name,
      overall: built.overall,
      status: getAvailabilityStatus(built.overall),
    });

    // Extract facility-level rows for regional recap
    // Group objects by facility from raw
    const byFac = new Map<
      string,
      {
        categoryName: string;
        categorySort: number;
        facilityName: string;
        objectPcts: Array<number | null>;
      }
    >();
    for (const r of raw) {
      let g = byFac.get(r.facilityId);
      if (!g) {
        g = {
          categoryName: r.categoryName,
          categorySort: r.categorySort,
          facilityName: r.facilityName,
          objectPcts: [],
        };
        byFac.set(r.facilityId, g);
      }
      g.objectPcts.push(
        calcObjectAvailability(r.readyQty, r.availableQty)
      );
    }
    for (const g of byFac.values()) {
      facilityItems.push({
        categoryName: g.categoryName,
        categorySort: g.categorySort,
        facilityName: g.facilityName,
        branchName: br.name,
        facilityAvailabilityPct: calcFacilityAvailability(g.objectPcts),
      });
    }
  }

  const recap = buildRegionalRecapRows(facilityItems);

  return c.json({
    success: true,
    data: {
      regionId,
      regionName: region.name,
      year,
      month,
      rows: recap.rows,
      overall: recap.overall,
      overallStatus: getAvailabilityStatus(recap.overall),
      branches: branchSummaries,
    },
  });
});

/** GET /api/reports/dashboard?year=&month= — ringkasan multi-regional + tren */
reports.get("/dashboard", async (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const month = Number(c.req.query("month") ?? new Date().getMonth() + 1);

  const { results: regions } = await c.env.DB.prepare(
    `SELECT id, name, code FROM regions ORDER BY name`
  ).all<{ id: string; name: string; code: string }>();

  const regionCards = [];
  const alerts: Array<{
    scope: string;
    name: string;
    availability: number;
    status: string;
  }> = [];

  for (const reg of regions ?? []) {
    const { results: branches } = await c.env.DB.prepare(
      `SELECT id, name FROM branches WHERE region_id = ?`
    )
      .bind(reg.id)
      .all<{ id: string; name: string }>();

    const branchPcts: Array<number | null> = [];
    for (const br of branches ?? []) {
      const raw = await fetchBranchRaw(c.env.DB, br.id, year, month);
      const built = buildBranchReportRows(raw);
      branchPcts.push(built.overall);
      if (built.overall != null && built.overall < 95) {
        alerts.push({
          scope: "cabang",
          name: br.name,
          availability: built.overall,
          status: getAvailabilityStatus(built.overall) ?? "kritis",
        });
      }
    }
    const { average } = await import("@simfas/shared");
    const overall = average(branchPcts);
    regionCards.push({
      regionId: reg.id,
      regionName: reg.name,
      code: reg.code,
      branchCount: branches?.length ?? 0,
      overall,
      status: getAvailabilityStatus(overall),
    });
  }

  // Tren 6 bulan terakhir untuk cabang pertama (atau filter branchId)
  const branchId = c.req.query("branchId") ?? "br-tpriok";
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    const raw = await fetchBranchRaw(c.env.DB, branchId, y, m);
    const built = buildBranchReportRows(raw);
    trend.push({
      year: y,
      month: m,
      label: `${m}/${y}`,
      overall: built.overall,
      categories: built.categoryAvails,
    });
  }

  return c.json({
    success: true,
    data: {
      year,
      month,
      regions: regionCards,
      alerts: alerts.sort((a, b) => a.availability - b.availability).slice(0, 10),
      trend,
    },
  });
});

/** GET /api/reports/export/branch.xlsx */
reports.get(
  "/export/branch.xlsx",
  requirePermission("report:export"),
  async (c) => {
    const branchId = c.req.query("branchId");
    const year = Number(c.req.query("year"));
    const month = Number(c.req.query("month"));
    if (!branchId || !year || !month) {
      return c.json({ success: false, error: "parameter wajib" }, 400);
    }

    const branch = await c.env.DB.prepare(
      `SELECT b.name, r.name as regionName FROM branches b
       JOIN regions r ON r.id = b.region_id WHERE b.id = ?`
    )
      .bind(branchId)
      .first<{ name: string; regionName: string }>();

    const raw = await fetchBranchRaw(c.env.DB, branchId, year, month);
    const built = buildBranchReportRows(raw);
    const buf = await exportBranchReportXlsx({
      regionName: branch?.regionName ?? "",
      branchName: branch?.name ?? "",
      year,
      month,
      rows: built.rows,
    });

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-cabang-${branchId}-${year}-${month}.xlsx"`,
        "Access-Control-Allow-Origin": c.env.CORS_ORIGIN || "*",
      },
    });
  }
);

/** GET /api/reports/export/regional.xlsx */
reports.get(
  "/export/regional.xlsx",
  requirePermission("report:export"),
  async (c) => {
    const regionId = c.req.query("regionId");
    const year = Number(c.req.query("year"));
    const month = Number(c.req.query("month"));
    if (!regionId || !year || !month) {
      return c.json({ success: false, error: "parameter wajib" }, 400);
    }

    // Reuse regional logic via internal fetch would be circular; duplicate slim path
    const region = await c.env.DB.prepare(
      `SELECT name FROM regions WHERE id = ?`
    )
      .bind(regionId)
      .first<{ name: string }>();

    const { results: branches } = await c.env.DB.prepare(
      `SELECT id, name FROM branches WHERE region_id = ?`
    )
      .bind(regionId)
      .all<{ id: string; name: string }>();

    const facilityItems: Array<{
      categoryName: string;
      categorySort: number;
      facilityName: string;
      branchName: string;
      facilityAvailabilityPct: number | null;
    }> = [];

    for (const br of branches ?? []) {
      const raw = await fetchBranchRaw(c.env.DB, br.id, year, month);
      const byFac = new Map<
        string,
        {
          categoryName: string;
          categorySort: number;
          facilityName: string;
          objectPcts: Array<number | null>;
        }
      >();
      for (const r of raw) {
        let g = byFac.get(r.facilityId);
        if (!g) {
          g = {
            categoryName: r.categoryName,
            categorySort: r.categorySort,
            facilityName: r.facilityName,
            objectPcts: [],
          };
          byFac.set(r.facilityId, g);
        }
        g.objectPcts.push(calcObjectAvailability(r.readyQty, r.availableQty));
      }
      for (const g of byFac.values()) {
        facilityItems.push({
          categoryName: g.categoryName,
          categorySort: g.categorySort,
          facilityName: g.facilityName,
          branchName: br.name,
          facilityAvailabilityPct: calcFacilityAvailability(g.objectPcts),
        });
      }
    }

    const recap = buildRegionalRecapRows(facilityItems);
    const buf = await exportRegionalRecapXlsx({
      regionName: region?.name ?? "",
      year,
      month,
      rows: recap.rows,
    });

    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap-regional-${regionId}-${year}-${month}.xlsx"`,
        "Access-Control-Allow-Origin": c.env.CORS_ORIGIN || "*",
      },
    });
  }
);

/** GET /api/reports/export/branch.pdf */
reports.get(
  "/export/branch.pdf",
  requirePermission("report:export"),
  async (c) => {
    const branchId = c.req.query("branchId");
    const year = Number(c.req.query("year"));
    const month = Number(c.req.query("month"));
    if (!branchId || !year || !month) {
      return c.json({ success: false, error: "parameter wajib" }, 400);
    }
    const branch = await c.env.DB.prepare(
      `SELECT b.name, r.name as regionName FROM branches b
       JOIN regions r ON r.id = b.region_id WHERE b.id = ?`
    )
      .bind(branchId)
      .first<{ name: string; regionName: string }>();

    const raw = await fetchBranchRaw(c.env.DB, branchId, year, month);
    const built = buildBranchReportRows(raw);
    const pdf = await exportReportPdf({
      title: "LAPORAN AVAILABILITY FASILITAS PELABUHAN",
      subtitle: `${branch?.regionName ?? ""} — ${branch?.name ?? ""} — ${month}/${year}`,
      rows: built.rows.map((r) => ({
        no: r.no,
        col2: r.facilityCategory,
        col3: r.facilityName,
        col4: r.facilityObject,
        availability: r.facilityAvailabilityPct ?? r.objectAvailabilityPct,
      })),
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-cabang-${year}-${month}.pdf"`,
        "Access-Control-Allow-Origin": c.env.CORS_ORIGIN || "*",
      },
    });
  }
);

export default reports;
