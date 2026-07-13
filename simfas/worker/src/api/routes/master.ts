/**
 * Master data: regions, branches, categories, facilities, objects.
 */

import { Hono } from "hono";
import type { Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth, requirePermission } from "../middleware";
import { newId } from "../../infrastructure/auth";
import { writeAudit } from "../../infrastructure/audit";

const master = new Hono<{ Bindings: Env; Variables: AppVariables }>();

master.use("*", requireAuth);

/** GET /api/master/regions */
master.get("/regions", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, code FROM regions ORDER BY name`
  ).all();
  return c.json({ success: true, data: results });
});

/** GET /api/master/branches?regionId= */
master.get("/branches", async (c) => {
  const regionId = c.req.query("regionId");
  let sql = `SELECT b.id, b.region_id as regionId, b.name, b.code, r.name as regionName
             FROM branches b JOIN regions r ON r.id = b.region_id`;
  const binds: string[] = [];
  if (regionId) {
    sql += ` WHERE b.region_id = ?`;
    binds.push(regionId);
  }
  sql += ` ORDER BY b.name`;
  const stmt = c.env.DB.prepare(sql);
  const { results } = binds.length
    ? await stmt.bind(...binds).all()
    : await stmt.all();
  return c.json({ success: true, data: results });
});

/** GET /api/master/categories?branchId= */
master.get("/categories", async (c) => {
  const branchId = c.req.query("branchId");
  if (!branchId) {
    return c.json({ success: false, error: "branchId wajib" }, 400);
  }
  const { results } = await c.env.DB.prepare(
    `SELECT id, branch_id as branchId, name, sort_order as sortOrder
     FROM facility_categories WHERE branch_id = ? ORDER BY sort_order`
  )
    .bind(branchId)
    .all();
  return c.json({ success: true, data: results });
});

/** GET /api/master/facilities?categoryId= | branchId= */
master.get("/facilities", async (c) => {
  const categoryId = c.req.query("categoryId");
  const branchId = c.req.query("branchId");
  if (categoryId) {
    const { results } = await c.env.DB.prepare(
      `SELECT id, category_id as categoryId, name, operator, construction_type as constructionType
       FROM facilities WHERE category_id = ? ORDER BY name`
    )
      .bind(categoryId)
      .all();
    return c.json({ success: true, data: results });
  }
  if (branchId) {
    const { results } = await c.env.DB.prepare(
      `SELECT f.id, f.category_id as categoryId, f.name, f.operator,
              f.construction_type as constructionType, c.name as categoryName
       FROM facilities f
       JOIN facility_categories c ON c.id = f.category_id
       WHERE c.branch_id = ?
       ORDER BY c.sort_order, f.name`
    )
      .bind(branchId)
      .all();
    return c.json({ success: true, data: results });
  }
  return c.json({ success: false, error: "categoryId atau branchId wajib" }, 400);
});

/** GET /api/master/objects?facilityId= */
master.get("/objects", async (c) => {
  const facilityId = c.req.query("facilityId");
  if (!facilityId) {
    return c.json({ success: false, error: "facilityId wajib" }, 400);
  }
  const { results } = await c.env.DB.prepare(
    `SELECT id, facility_id as facilityId, name, construction_type as constructionType
     FROM facility_objects WHERE facility_id = ? ORDER BY name`
  )
    .bind(facilityId)
    .all();
  return c.json({ success: true, data: results });
});

/** POST /api/master/facilities — Admin Cabang+ */
master.post(
  "/facilities",
  requirePermission("master:edit_branch"),
  async (c) => {
    const body = await c.req.json<{
      categoryId: string;
      name: string;
      operator?: string;
      constructionType?: string;
    }>();
    const id = newId();
    await c.env.DB.prepare(
      `INSERT INTO facilities (id, category_id, name, operator, construction_type)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.categoryId,
        body.name,
        body.operator ?? null,
        body.constructionType ?? null
      )
      .run();
    await writeAudit(c.env, {
      userId: c.get("user").id,
      entity: "facilities",
      entityId: id,
      action: "create",
      newValue: body,
    });
    // Invalidate cache rekap
    await c.env.CACHE.delete(`dashboard:${body.categoryId}`);
    return c.json({ success: true, data: { id } }, 201);
  }
);

/** POST /api/master/objects */
master.post(
  "/objects",
  requirePermission("master:edit_branch"),
  async (c) => {
    const body = await c.req.json<{
      facilityId: string;
      name: string;
      constructionType?: string;
    }>();
    const id = newId();
    await c.env.DB.prepare(
      `INSERT INTO facility_objects (id, facility_id, name, construction_type)
       VALUES (?, ?, ?, ?)`
    )
      .bind(id, body.facilityId, body.name, body.constructionType ?? null)
      .run();
    await writeAudit(c.env, {
      userId: c.get("user").id,
      entity: "facility_objects",
      entityId: id,
      action: "create",
      newValue: body,
    });
    return c.json({ success: true, data: { id } }, 201);
  }
);

export default master;
