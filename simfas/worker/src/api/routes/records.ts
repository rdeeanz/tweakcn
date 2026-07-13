/**
 * Input/edit data periodik bulanan object_records.
 * Availability tidak disimpan — dihitung di endpoint reports.
 */

import { Hono } from "hono";
import type { Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth, requirePermission } from "../middleware";
import { newId } from "../../infrastructure/auth";
import { writeAudit } from "../../infrastructure/audit";
import { calcObjectAvailability } from "@simfas/shared";

const records = new Hono<{ Bindings: Env; Variables: AppVariables }>();

records.use("*", requireAuth);

/** GET /api/records?branchId=&year=&month= */
records.get("/", async (c) => {
  const branchId = c.req.query("branchId");
  const year = Number(c.req.query("year"));
  const month = Number(c.req.query("month"));
  if (!branchId || !year || !month) {
    return c.json(
      { success: false, error: "branchId, year, month wajib" },
      400
    );
  }

  const { results } = await c.env.DB.prepare(
    `SELECT
       r.id, r.object_id as objectId, r.year, r.month,
       r.length, r.width, r.area, r.quantity,
       r.construction_type as constructionType,
       r.available_qty as availableQty,
       r.minor_damage as minorDamage,
       r.moderate_damage as moderateDamage,
       r.severe_damage as severeDamage,
       r.ready_qty as readyQty,
       r.operator, r.notes,
       o.name as objectName,
       f.id as facilityId, f.name as facilityName, f.operator as facilityOperator,
       c.id as categoryId, c.name as categoryName, c.sort_order as categorySort
     FROM object_records r
     JOIN facility_objects o ON o.id = r.object_id
     JOIN facilities f ON f.id = o.facility_id
     JOIN facility_categories c ON c.id = f.category_id
     WHERE c.branch_id = ? AND r.year = ? AND r.month = ?
     ORDER BY c.sort_order, f.name, o.name`
  )
    .bind(branchId, year, month)
    .all();

  // Hitung availability objek on-read (PRD §6 + §9.2)
  const data = (results as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    objectAvailabilityPct: calcObjectAvailability(
      Number(row.readyQty),
      Number(row.availableQty)
    ),
  }));

  return c.json({ success: true, data });
});

/** PUT /api/records — upsert data bulanan 1 objek */
records.put("/", requirePermission("record:edit"), async (c) => {
  const body = await c.req.json<{
    objectId: string;
    year: number;
    month: number;
    length?: number | null;
    width?: number | null;
    area?: number | null;
    quantity?: number | null;
    constructionType?: string | null;
    availableQty: number;
    minorDamage?: number;
    moderateDamage?: number;
    severeDamage?: number;
    readyQty: number;
    operator?: string | null;
    notes?: string | null;
  }>();

  if (!body.objectId || !body.year || !body.month) {
    return c.json({ success: false, error: "objectId, year, month wajib" }, 400);
  }

  // Ambil nilai lama untuk audit
  const existing = await c.env.DB.prepare(
    `SELECT * FROM object_records WHERE object_id = ? AND year = ? AND month = ?`
  )
    .bind(body.objectId, body.year, body.month)
    .first();

  const id = (existing?.id as string) ?? newId();
  const user = c.get("user");

  await c.env.DB.prepare(
    `INSERT INTO object_records (
       id, object_id, year, month, length, width, area, quantity,
       construction_type, available_qty, minor_damage, moderate_damage,
       severe_damage, ready_qty, operator, notes, updated_at, updated_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(object_id, year, month) DO UPDATE SET
       length = excluded.length,
       width = excluded.width,
       area = excluded.area,
       quantity = excluded.quantity,
       construction_type = excluded.construction_type,
       available_qty = excluded.available_qty,
       minor_damage = excluded.minor_damage,
       moderate_damage = excluded.moderate_damage,
       severe_damage = excluded.severe_damage,
       ready_qty = excluded.ready_qty,
       operator = excluded.operator,
       notes = excluded.notes,
       updated_at = datetime('now'),
       updated_by = excluded.updated_by`
  )
    .bind(
      id,
      body.objectId,
      body.year,
      body.month,
      body.length ?? null,
      body.width ?? null,
      body.area ?? null,
      body.quantity ?? null,
      body.constructionType ?? null,
      body.availableQty ?? 0,
      body.minorDamage ?? 0,
      body.moderateDamage ?? 0,
      body.severeDamage ?? 0,
      body.readyQty ?? 0,
      body.operator ?? null,
      body.notes ?? null,
      user.id
    )
    .run();

  await writeAudit(c.env, {
    userId: user.id,
    entity: "object_records",
    entityId: id,
    action: existing ? "update" : "create",
    oldValue: existing,
    newValue: body,
  });

  // Hapus cache dashboard terkait periode
  const cacheKey = `report:branch:${body.year}:${body.month}`;
  // KV delete by prefix tidak didukung; hapus key generik yang diketahui
  await c.env.CACHE.delete(cacheKey);

  const objectAvailabilityPct = calcObjectAvailability(
    body.readyQty,
    body.availableQty
  );

  return c.json({
    success: true,
    data: { id, objectAvailabilityPct },
  });
});

/** POST /api/records/copy-previous — duplikasi data bulan sebelumnya sebagai starting point */
records.post(
  "/copy-previous",
  requirePermission("record:edit"),
  async (c) => {
    const body = await c.req.json<{
      branchId: string;
      year: number;
      month: number;
    }>();
    // Hitung periode sebelumnya
    let py = body.year;
    let pm = body.month - 1;
    if (pm < 1) {
      pm = 12;
      py -= 1;
    }

    const { results: prev } = await c.env.DB.prepare(
      `SELECT r.* FROM object_records r
       JOIN facility_objects o ON o.id = r.object_id
       JOIN facilities f ON f.id = o.facility_id
       JOIN facility_categories c ON c.id = f.category_id
       WHERE c.branch_id = ? AND r.year = ? AND r.month = ?`
    )
      .bind(body.branchId, py, pm)
      .all();

    let copied = 0;
    for (const row of prev as Array<Record<string, unknown>>) {
      const id = newId();
      try {
        await c.env.DB.prepare(
          `INSERT OR IGNORE INTO object_records (
             id, object_id, year, month, length, width, area, quantity,
             construction_type, available_qty, minor_damage, moderate_damage,
             severe_damage, ready_qty, operator, notes, updated_by
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            row.object_id,
            body.year,
            body.month,
            row.length,
            row.width,
            row.area,
            row.quantity,
            row.construction_type,
            row.available_qty,
            row.minor_damage,
            row.moderate_damage,
            row.severe_damage,
            row.ready_qty,
            row.operator,
            row.notes,
            c.get("user").id
          )
          .run();
        copied += 1;
      } catch {
        // skip conflict
      }
    }

    await writeAudit(c.env, {
      userId: c.get("user").id,
      entity: "object_records",
      entityId: body.branchId,
      action: "copy_previous",
      newValue: { from: `${py}-${pm}`, to: `${body.year}-${body.month}`, copied },
    });

    return c.json({ success: true, data: { copied } });
  }
);

export default records;
