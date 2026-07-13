/**
 * Auth helpers — password demo + JWT HS256 (Web Crypto, edge-compatible).
 * Production: ganti demo hash dengan PBKDF2/argon2; JWT_SECRET via wrangler secret.
 */

import type { AuthUser } from "../domain/env";

/** Verifikasi password demo (format "demo:plain") atau hash sederhana. */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  // Mode demo seed: "demo:password123"
  if (stored.startsWith("demo:")) {
    return stored.slice(5) === password;
  }
  // Fallback: bandingkan SHA-256 hex
  const hash = await sha256Hex(password);
  return hash === stored;
}

export async function hashPassword(password: string): Promise<string> {
  // Dev-friendly; production sebaiknya PBKDF2 dengan salt per-user
  return `demo:${password}`;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Encode base64url (tanpa padding). */
function b64url(data: ArrayBuffer | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

/**
 * Buat JWT HS256.
 * @param user - klaim user
 * @param secret - JWT_SECRET
 * @param expiresInSec - default 8 jam
 */
export async function signJwt(
  user: AuthUser,
  secret: string,
  expiresInSec = 8 * 3600
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...user,
    iat: now,
    exp: now + expiresInSec,
  };
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const data = `${h}.${p}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

/** Verifikasi JWT dan kembalikan AuthUser, atau null jika invalid/expired. */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<AuthUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    // Decode signature
    const sigStr = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = sigStr.length % 4 === 0 ? "" : "=".repeat(4 - (sigStr.length % 4));
    const sigBytes = Uint8Array.from(atob(sigStr + pad), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );
    if (!ok) return null;

    const payloadStr = p.replace(/-/g, "+").replace(/_/g, "/");
    const payloadPad =
      payloadStr.length % 4 === 0 ? "" : "=".repeat(4 - (payloadStr.length % 4));
    const payload = JSON.parse(atob(payloadStr + payloadPad)) as AuthUser & {
      exp?: number;
    };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      branchId: payload.branchId ?? null,
      regionId: payload.regionId ?? null,
    };
  } catch {
    return null;
  }
}

/** Generate UUID v4. */
export function newId(): string {
  return crypto.randomUUID();
}
