/**
 * PNTHR DGTL — admin auth.
 * Two credentials, either unlocks the paper desk:
 *  1. Bearer token (ADMIN_BEARER_TOKEN env or build-time hash) — header `Authorization: Bearer …`
 *  2. Admin wallet — header `x-wallet: <address>` matching ADMIN_WALLETS below.
 * Note: the wallet header is an address claim (paper-desk convenience, local trust),
 * not a cryptographic signature proof. No real funds move through these routes.
 */

import { createHash } from "node:crypto";

const ALGO = "SHA-256";

/** Boss wallets — full admin. EVM compared case-insensitively, Solana exact. */
export const ADMIN_WALLETS = [
  "0xF15eea68C6aC1D830Bc39Ef80830d0ACaF50c6fE",
  "BTJHkMGSPgmYck32aG7ed9cZ9LESYKWT1Q4xakmuz7yz",
];

export function isAdminWallet(addr: string | null | undefined): boolean {
  if (!addr) return false;
  const a = addr.trim();
  return ADMIN_WALLETS.some((w) =>
    w.startsWith("0x") ? w.toLowerCase() === a.toLowerCase() : w === a
  );
}

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
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer" && verifyAdminToken(parts[1])) {
    return { ok: true, user: "admin" };
  }
  // Wallet credential: x-wallet header matching the boss allowlist
  const wallet = request.headers.get("x-wallet") ?? "";
  if (wallet && isAdminWallet(wallet)) {
    return { ok: true, user: "admin" };
  }
  if (!auth && !wallet) {
    return { ok: false, status: 401, body: { error: "missing Authorization: Bearer <token> or x-wallet: <admin address>" } };
  }
  return { ok: false, status: 403, body: { error: "invalid admin credential" } };
}
