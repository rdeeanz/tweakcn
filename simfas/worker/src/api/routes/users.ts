/**
 * Manajemen pengguna & audit log (Superadmin / Admin Regional).
 */

import { Hono } from "hono";
import type { Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth, requirePermission } from "../middleware";
import { hashPassword, newId } from "../../infrastructure/auth";
import { writeAudit } from "../../infrastructure/audit";

const users = new Hono<{ Bindings: Env; Variables: AppVariables }>();

users.use("*", requireAuth);

/** GET /api/users */
users.get("/", requirePermission("user:manage"), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, email, role, branch_id as branchId, region_id as regionId,
            is_active as isActive, created_at as createdAt
     FROM users ORDER BY name`
  ).all();
  return c.json({ success: true, data: results });
});

/** POST /api/users */
users.post("/", requirePermission("user:manage"), async (c) => {
  const body = await c.req.json<{
    name: string;
    email: string;
    password: string;
    role: string;
    branchId?: string | null;
    regionId?: string | null;
  }>();

  const id = newId();
  const passwordHash = await hashPassword(body.password);

  try {
    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, branch_id, region_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name,
        body.email.toLowerCase().trim(),
        passwordHash,
        body.role,
        body.branchId ?? null,
        body.regionId ?? null
      )
      .run();
  } catch {
    return c.json({ success: false, error: "Email sudah terdaftar" }, 409);
  }

  await writeAudit(c.env, {
    userId: c.get("user").id,
    entity: "users",
    entityId: id,
    action: "create",
    newValue: { ...body, password: "[redacted]" },
  });

  return c.json({ success: true, data: { id } }, 201);
});

/** GET /api/users/audit-logs */
users.get("/audit-logs", requirePermission("audit:view"), async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.user_id as userId, u.name as userName, a.entity,
            a.entity_id as entityId, a.action, a.old_value as oldValue,
            a.new_value as newValue, a.created_at as createdAt
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();
  return c.json({ success: true, data: results });
});

export default users;
