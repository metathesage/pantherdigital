/**
 * PNHR DGTL — admin-bearer auth.
 * Plain server-only helpers (imported by /api/bot/* routes). NOT server actions,
 * so no "use server" directive — that breaks route-handler imports.
 * Admin is whoever holds the current ADMIN_BEARER_TOKEN.
 * Priority: build-time hardcoded token > ADMIN_BEARER_TOKEN env var.
 * Tokens are stored as a SHA-256 hash so the raw value is never kept in memory.
 *
 * Build: vercel --prod --yes  (token baked into the server bundle at build)
 * Runtime override: set ADMIN_BEARER_TOKEN in Vercel env (System variable) to bypass.
 */

import { createHash } from "node:crypto";

const ALGO = "SHA-256";

/** SHA-256 hash of the build-time token — baked into the server bundle at build time. */
const BUILD_TOKEN_HASH =
  "4436abe0e5c18e6c99165e3b994ba4bebdd279463caa5f6c82996a2a2866c093";

function hashToken(token: string): string {
  return createHash(ALGO).update(token).digest("hex");
}

// In-memory store of hashed valid tokens (survives cold-start of the warm instance)
const validTokens = new Set<string>();

export function addAdminToken(rawToken: string): void {
  validTokens.add(hashToken(rawToken));
}

export function removeAdminToken(rawToken: string): void {
  validTokens.delete(hashToken(rawToken));
}

export function verifyAdminToken(rawToken: string): boolean {
  return validTokens.has(hashToken(rawToken));
}

/** Bootstrap at module import: add build-time hash, then env override if present. */
export function bootstrapAdmin(): void {
  validTokens.add(BUILD_TOKEN_HASH);
  const envToken = process.env.ADMIN_BEARER_TOKEN;
  if (envToken && envToken !== "") {
    validTokens.add(hashToken(envToken));
  }
}

bootstrapAdmin();

export type AdminAuthResult =
  | { ok: true; user: "admin" }
  | { ok: false; status: 401 | 403; body: Record<string, string> };

export function authFromRequest(request: Request): AdminAuthResult {
  const auth = request.headers.get("authorization") ?? "";
  const parts = auth.split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { ok: false, status: 401, body: { error: "missing Authorization: Bearer <token>" } };
  }
  if (!verifyAdminToken(parts[1])) {
    return { ok: false, status: 403, body: { error: "invalid admin token" } };
  }
  return { ok: true, user: "admin" };
}
