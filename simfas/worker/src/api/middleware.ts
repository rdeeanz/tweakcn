/**
 * Middleware Hono: CORS, auth JWT, RBAC helper.
 */

import { createMiddleware } from "hono/factory";
import { hasPermission, type Permission, type UserRole } from "@simfas/shared";
import type { AuthUser, Env } from "../domain/env";
import { verifyJwt } from "../infrastructure/auth";

export type AppVariables = {
  user: AuthUser;
};

/** CORS dinamis dari env CORS_ORIGIN. */
export const corsMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const origin = c.env.CORS_ORIGIN || "*";
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    c.header("Access-Control-Max-Age", "86400");
    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }
    await next();
  }
);

/** Wajib JWT valid; set c.get('user'). */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  const user = await verifyJwt(token, c.env.JWT_SECRET);
  if (!user) {
    return c.json({ success: false, error: "Token invalid or expired" }, 401);
  }
  c.set("user", user);
  await next();
});

/** Factory: require permission tertentu. */
export function requirePermission(permission: Permission) {
  return createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
    async (c, next) => {
      const user = c.get("user");
      if (!hasPermission(user.role as UserRole, permission)) {
        return c.json({ success: false, error: "Forbidden" }, 403);
      }
      await next();
    }
  );
}
