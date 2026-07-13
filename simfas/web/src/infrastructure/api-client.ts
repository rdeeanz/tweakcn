/**
 * HTTP client ke SIMFAS API.
 * Token JWT disimpan di localStorage; header Authorization otomatis.
 */

const TOKEN_KEY = "simfas-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Fetch JSON ke /api/*
 * @param path - path relatif, mis. /api/auth/login
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });

  // Binary export (xlsx/pdf)
  const ct = res.headers.get("Content-Type") ?? "";
  if (
    ct.includes("spreadsheet") ||
    ct.includes("pdf") ||
    ct.includes("octet-stream")
  ) {
    if (!res.ok) throw new ApiError("Gagal mengunduh file", res.status);
    return (await res.blob()) as T;
  }

  const json = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: T;
  };

  if (!res.ok || json.success === false) {
    if (res.status === 401) {
      setToken(null);
    }
    throw new ApiError(json.error ?? "Request gagal", res.status);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

/** Unduh blob sebagai file browser. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
