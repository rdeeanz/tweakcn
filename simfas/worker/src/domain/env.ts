/**
 * Binding Cloudflare Workers untuk SIMFAS.
 * DB = D1, PHOTOS = R2, CACHE = KV.
 */

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  CORS_ORIGIN: string;
}

/** Payload JWT yang disimpan di token. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "inspector" | "admin_branch" | "admin_region" | "management" | "superadmin";
  branchId: string | null;
  regionId: string | null;
}
