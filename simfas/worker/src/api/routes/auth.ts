/**
 * Route autentikasi: login, me, ganti preferensi tema user.
 */

import { Hono } from "hono";
import type { AuthUser, Env } from "../../domain/env";
import type { AppVariables } from "../middleware";
import { requireAuth } from "../middleware";
import { signJwt, verifyPassword } from "../../infrastructure/auth";
import { writeAudit } from "../../infrastructure/audit";

const auth = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/** POST /api/auth/login */
auth.post("/login", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  if (!body.email || !body.password) {
    return c.json({ success: false, error: "Email dan password wajib" }, 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT id, name, email, password_hash, role, branch_id, region_id, is_active
     FROM users WHERE email = ?`
  )
    .bind(body.email.toLowerCase().trim())
    .first<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: AuthUser["role"];
      branch_id: string | null;
      region_id: string | null;
      is_active: number;
    }>();

  if (!row || !row.is_active) {
    return c.json({ success: false, error: "Kredensial tidak valid" }, 401);
  }

  const ok = await verifyPassword(body.password, row.password_hash);
  if (!ok) {
    return c.json({ success: false, error: "Kredensial tidak valid" }, 401);
  }

  const user: AuthUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    branchId: row.branch_id,
    regionId: row.region_id,
  };

  const token = await signJwt(user, c.env.JWT_SECRET);

  await writeAudit(c.env, {
    userId: user.id,
    entity: "auth",
    entityId: user.id,
    action: "login",
  });

  return c.json({ success: true, data: { token, user } });
});

/** GET /api/auth/me */
auth.get("/me", requireAuth, async (c) => {
  const u = c.get("user");
  const row = await c.env.DB.prepare(
    `SELECT id, name, email, role, branch_id as branchId, region_id as regionId,
            theme_preset as theme_preset, theme_mode as theme_mode
     FROM users WHERE id = ?`
  )
    .bind(u.id)
    .first();
  if (!row) return c.json({ success: false, error: "User not found" }, 404);
  return c.json({ success: true, data: row });
});

/** PATCH /api/auth/theme — simpan preferensi tema per user */
auth.patch("/theme", requireAuth, async (c) => {
  const u = c.get("user");
  const body = await c.req.json<{ themePreset?: string; themeMode?: string }>();
  await c.env.DB.prepare(
    `UPDATE users SET theme_preset = COALESCE(?, theme_preset),
      theme_mode = COALESCE(?, theme_mode) WHERE id = ?`
  )
    .bind(body.themePreset ?? null, body.themeMode ?? null, u.id)
    .run();
  return c.json({ success: true });
});

export default auth;
