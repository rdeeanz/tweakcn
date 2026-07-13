/**
 * Modul form inspeksi digital (PRD §7.1).
 * Approval dua pihak: Cabang & Anak Usaha/Mitra.
 */

import { Hono } from "hono";
import type { Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth, requirePermission } from "../middleware";
import { newId } from "../../infrastructure/auth";
import { writeAudit } from "../../infrastructure/audit";
import { exportInspectionPdf } from "../../infrastructure/pdf-export";
import type { InspectionConditionCode } from "@simfas/shared";

const inspections = new Hono<{ Bindings: Env; Variables: AppVariables }>();

inspections.use("*", requireAuth);

/** GET /api/inspections?branchId=&status= */
inspections.get("/", async (c) => {
  const branchId = c.req.query("branchId");
  const status = c.req.query("status");
  let sql = `
    SELECT i.id, i.branch_id as branchId, i.facility_id as facilityId,
           i.location, i.inspection_date as inspectionDate,
           i.previous_inspection_date as previousInspectionDate,
           i.status, i.notes, i.created_by as createdBy,
           i.created_at as createdAt,
           b.name as branchName, f.name as facilityName,
           u.name as creatorName
    FROM inspections i
    JOIN branches b ON b.id = i.branch_id
    LEFT JOIN facilities f ON f.id = i.facility_id
    JOIN users u ON u.id = i.created_by
    WHERE 1=1`;
  const binds: string[] = [];
  if (branchId) {
    sql += ` AND i.branch_id = ?`;
    binds.push(branchId);
  }
  if (status) {
    sql += ` AND i.status = ?`;
    binds.push(status);
  }
  sql += ` ORDER BY i.inspection_date DESC LIMIT 100`;

  const stmt = c.env.DB.prepare(sql);
  const { results } = binds.length
    ? await stmt.bind(...binds).all()
    : await stmt.all();
  return c.json({ success: true, data: results });
});

/** GET /api/inspections/:id */
inspections.get("/:id", async (c) => {
  const id = c.req.param("id");
  const insp = await c.env.DB.prepare(
    `SELECT i.*, b.name as branchName, f.name as facilityName
     FROM inspections i
     JOIN branches b ON b.id = i.branch_id
     LEFT JOIN facilities f ON f.id = i.facility_id
     WHERE i.id = ?`
  )
    .bind(id)
    .first();
  if (!insp) return c.json({ success: false, error: "Not found" }, 404);

  const { results: items } = await c.env.DB.prepare(
    `SELECT id, inspection_id as inspectionId, item_name as itemName,
            condition_code as conditionCode, notes, photo_key as photoKey
     FROM inspection_items WHERE inspection_id = ?`
  )
    .bind(id)
    .all();

  return c.json({ success: true, data: { ...insp, items } });
});

/** POST /api/inspections — buat draft */
inspections.post("/", requirePermission("inspection:create"), async (c) => {
  const body = await c.req.json<{
    branchId: string;
    facilityId?: string | null;
    location?: string;
    inspectionDate: string;
    notes?: string;
    items: Array<{
      itemName: string;
      conditionCode: InspectionConditionCode;
      notes?: string;
    }>;
  }>();

  if (!body.branchId || !body.inspectionDate || !body.items?.length) {
    return c.json(
      { success: false, error: "branchId, inspectionDate, items wajib" },
      400
    );
  }

  // Auto-isi tanggal inspeksi sebelumnya dari riwayat fasilitas
  let previousDate: string | null = null;
  if (body.facilityId) {
    const prev = await c.env.DB.prepare(
      `SELECT inspection_date FROM inspections
       WHERE facility_id = ? AND status IN ('approved_partner','approved_branch','submitted')
       ORDER BY inspection_date DESC LIMIT 1`
    )
      .bind(body.facilityId)
      .first<{ inspection_date: string }>();
    previousDate = prev?.inspection_date ?? null;
  }

  const id = newId();
  const user = c.get("user");

  await c.env.DB.prepare(
    `INSERT INTO inspections (
       id, branch_id, facility_id, location, inspection_date,
       previous_inspection_date, status, created_by, notes
     ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  )
    .bind(
      id,
      body.branchId,
      body.facilityId ?? null,
      body.location ?? null,
      body.inspectionDate,
      previousDate,
      user.id,
      body.notes ?? null
    )
    .run();

  for (const item of body.items) {
    await c.env.DB.prepare(
      `INSERT INTO inspection_items (id, inspection_id, item_name, condition_code, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        newId(),
        id,
        item.itemName,
        item.conditionCode,
        item.notes ?? null
      )
      .run();
  }

  await writeAudit(c.env, {
    userId: user.id,
    entity: "inspections",
    entityId: id,
    action: "create",
    newValue: body,
  });

  return c.json({ success: true, data: { id, previousInspectionDate: previousDate } }, 201);
});

/** PATCH /api/inspections/:id — update draft / submit */
inspections.patch(
  "/:id",
  requirePermission("inspection:edit"),
  async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{
      location?: string;
      inspectionDate?: string;
      notes?: string;
      status?: "draft" | "submitted";
      items?: Array<{
        itemName: string;
        conditionCode: InspectionConditionCode;
        notes?: string;
        photoKey?: string | null;
      }>;
    }>();

    const existing = await c.env.DB.prepare(
      `SELECT * FROM inspections WHERE id = ?`
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ success: false, error: "Not found" }, 404);
    if (
      existing.status !== "draft" &&
      existing.status !== "submitted" &&
      existing.status !== "rejected"
    ) {
      return c.json(
        { success: false, error: "Inspeksi sudah disetujui, tidak bisa diedit" },
        400
      );
    }

    await c.env.DB.prepare(
      `UPDATE inspections SET
         location = COALESCE(?, location),
         inspection_date = COALESCE(?, inspection_date),
         notes = COALESCE(?, notes),
         status = COALESCE(?, status),
         updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(
        body.location ?? null,
        body.inspectionDate ?? null,
        body.notes ?? null,
        body.status ?? null,
        id
      )
      .run();

    if (body.items) {
      await c.env.DB.prepare(
        `DELETE FROM inspection_items WHERE inspection_id = ?`
      )
        .bind(id)
        .run();
      for (const item of body.items) {
        await c.env.DB.prepare(
          `INSERT INTO inspection_items (id, inspection_id, item_name, condition_code, notes, photo_key)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            newId(),
            id,
            item.itemName,
            item.conditionCode,
            item.notes ?? null,
            item.photoKey ?? null
          )
          .run();
      }
    }

    await writeAudit(c.env, {
      userId: c.get("user").id,
      entity: "inspections",
      entityId: id,
      action: body.status === "submitted" ? "submit" : "update",
      oldValue: existing,
      newValue: body,
    });

    return c.json({ success: true });
  }
);

/** POST /api/inspections/:id/approve — dual approval */
inspections.post("/:id/approve", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ party: "branch" | "partner" }>();
  const user = c.get("user");

  const existing = await c.env.DB.prepare(
    `SELECT * FROM inspections WHERE id = ?`
  )
    .bind(id)
    .first<{
      status: string;
      branch_approver_id: string | null;
      partner_approver_id: string | null;
    }>();
  if (!existing) return c.json({ success: false, error: "Not found" }, 404);

  if (body.party === "branch") {
    // Butuh permission approve_branch
    const { hasPermission } = await import("@simfas/shared");
    if (!hasPermission(user.role, "inspection:approve_branch")) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const newStatus =
      existing.partner_approver_id || existing.status === "approved_partner"
        ? "approved_partner"
        : "approved_branch";
    await c.env.DB.prepare(
      `UPDATE inspections SET
         branch_approver_id = ?, branch_approved_at = datetime('now'),
         status = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(user.id, newStatus === "approved_partner" ? "approved_partner" : "approved_branch", id)
      .run();
  } else {
    const { hasPermission } = await import("@simfas/shared");
    if (!hasPermission(user.role, "inspection:approve_partner")) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const fullyApproved = !!existing.branch_approver_id || existing.status === "approved_branch";
    await c.env.DB.prepare(
      `UPDATE inspections SET
         partner_approver_id = ?, partner_approved_at = datetime('now'),
         status = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(user.id, fullyApproved ? "approved_partner" : "approved_partner", id)
      .run();
  }

  await writeAudit(c.env, {
    userId: user.id,
    entity: "inspections",
    entityId: id,
    action: `approve_${body.party}`,
  });

  return c.json({ success: true });
});

/** POST /api/inspections/:id/photo — upload foto ke R2 (kompres di client) */
inspections.post(
  "/:id/photo",
  requirePermission("inspection:edit"),
  async (c) => {
    const id = c.req.param("id");
    const form = await c.req.formData();
    const file = form.get("file");
    const itemId = form.get("itemId") as string | null;

    if (!(file instanceof File)) {
      return c.json({ success: false, error: "file wajib" }, 400);
    }
    // Batas 2MB setelah kompres client
    if (file.size > 2 * 1024 * 1024) {
      return c.json(
        { success: false, error: "Ukuran foto max 2MB (kompres dulu di client)" },
        400
      );
    }

    const key = `inspections/${id}/${crypto.randomUUID()}-${file.name}`;
    await c.env.PHOTOS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });

    if (itemId) {
      await c.env.DB.prepare(
        `UPDATE inspection_items SET photo_key = ? WHERE id = ? AND inspection_id = ?`
      )
        .bind(key, itemId, id)
        .run();
    }

    return c.json({ success: true, data: { photoKey: key } });
  }
);

/** GET /api/inspections/:id/export.pdf */
inspections.get("/:id/export.pdf", async (c) => {
  const id = c.req.param("id");
  const insp = await c.env.DB.prepare(
    `SELECT i.*, b.name as branchName, f.name as facilityName,
            ub.name as branchApproverName, up.name as partnerApproverName
     FROM inspections i
     JOIN branches b ON b.id = i.branch_id
     LEFT JOIN facilities f ON f.id = i.facility_id
     LEFT JOIN users ub ON ub.id = i.branch_approver_id
     LEFT JOIN users up ON up.id = i.partner_approver_id
     WHERE i.id = ?`
  )
    .bind(id)
    .first<Record<string, unknown>>();

  if (!insp) return c.json({ success: false, error: "Not found" }, 404);

  const { results: items } = await c.env.DB.prepare(
    `SELECT item_name, condition_code, notes FROM inspection_items WHERE inspection_id = ?`
  )
    .bind(id)
    .all<{ item_name: string; condition_code: number; notes: string | null }>();

  const pdf = await exportInspectionPdf({
    branchName: String(insp.branchName),
    facilityName: String(insp.facilityName ?? "—"),
    location: (insp.location as string) ?? null,
    inspectionDate: String(insp.inspection_date),
    previousInspectionDate: (insp.previous_inspection_date as string) ?? null,
    items: (items ?? []).map((it) => ({
      itemName: it.item_name,
      conditionCode: it.condition_code as InspectionConditionCode,
      notes: it.notes,
    })),
    branchApproverName: (insp.branchApproverName as string) ?? null,
    partnerApproverName: (insp.partnerApproverName as string) ?? null,
  });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspeksi-${id}.pdf"`,
      "Access-Control-Allow-Origin": c.env.CORS_ORIGIN || "*",
    },
  });
});

export default inspections;
