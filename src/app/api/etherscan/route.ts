import { NextResponse } from "next/server";
import { fetchJson, UpstreamError, UPSTREAM_TIMEOUT_MS } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Etherscan V2 proxy — keeps the API key on the server.
 *
 * This existed inline in `src/app/portfolio/page.tsx`, a `"use client"` component.
 * Anything read as `process.env.NEXT_PUBLIC_*` is statically inlined into the shipped
 * JS bundle, so the key was downloadable by any visitor (and stays in git/CDN caches
 * forever). The portfolio page now calls this route instead and never sees a key.
 *
 * The NEXT_PUBLIC_ name is still accepted here — it is read server-side only, so
 * existing deployments keep working with no env changes and no leak. Prefer setting
 * plain `ETHERSCAN_API_KEY`.
 */
const ETHERSCAN_KEY =
  process.env.ETHERSCAN_API_KEY || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";

const ETHERSCAN_BASE = "https://api.etherscan.io/v2/api";
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Strict allowlist of upstream requests. This is deliberately NOT a generic proxy: a
 * passthrough on a keyed third-party API would let anyone on the internet relay
 * arbitrary requests (SSRF pivot) or drain the account's quota through us.
 * Only the two read-only calls the portfolio actually makes are reachable, and the
 * query string is built from a fixed template plus a validated address.
 */
const QUERIES = {
  // Params intentionally identical to the previous inline calls (asc, no paging),
  // so the route is a pure transport change with no behaviour drift.
  txlist: (address: string) =>
    `${ETHERSCAN_BASE}?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`,
  tokenlist: (address: string) =>
    `${ETHERSCAN_BASE}?chainid=1&module=account&action=tokenlist&address=${address}`,
} as const;

type Kind = keyof typeof QUERIES;

/* --------------------- quota guards: cache + per-IP throttle -------------------- */
/* A public deployment gets scraped; without these, one crawler could spend the whole
   free-tier budget (5 req/s) on our key. */

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expires: number; payload: unknown }>();

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40; // requests per IP per minute
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Bound the map so a botnet sweeping unique IPs can't grow it without limit.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function errorResponse(message: string, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message, result: null, status: "0" }, { status, headers });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") as Kind | null;
  const address = (searchParams.get("address") || "").trim();

  if (!kind || !(kind in QUERIES)) {
    return errorResponse(`kind must be one of: ${Object.keys(QUERIES).join(", ")}`, 400);
  }
  if (!ADDRESS_RE.test(address)) {
    return errorResponse("address must be a 0x-prefixed 40-char hex EVM address", 400);
  }
  if (!ETHERSCAN_KEY) {
    return errorResponse(
      "ETHERSCAN_API_KEY not set — add it to .env.local and the host's env (optional; native ETH balance works without it)",
      503
    );
  }

  const ip = clientIp(req);
  if (throttled(ip)) {
    return errorResponse("too many requests", 429, { "Retry-After": "60" });
  }

  const cacheKey = `${kind}:${address.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json(hit.payload, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  }

  try {
    const json = await fetchJson(
      `${QUERIES[kind](address)}&apikey=${encodeURIComponent(ETHERSCAN_KEY)}`,
      { cache: "no-store", headers: { Accept: "application/json" } },
      UPSTREAM_TIMEOUT_MS
    );

    // Etherscan signals rate limiting with HTTP 200 + a "Max rate limit reached" body.
    if (typeof json?.result === "string" && /rate limit/i.test(json.result)) {
      if (hit) return NextResponse.json(hit.payload, { headers: { "Cache-Control": "no-store" } });
      return errorResponse("Etherscan rate limited", 429, { "Retry-After": "15" });
    }

    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, payload: json });
    return NextResponse.json(json, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (e) {
    // Serve the last good payload rather than failing the portfolio panel.
    if (hit) {
      return NextResponse.json(hit.payload, {
        headers: { "Cache-Control": "no-store", "X-Cache": "stale" },
      });
    }
    const status = e instanceof UpstreamError ? e.proxyStatus : 502;
    return errorResponse(
      e instanceof Error ? `Etherscan ${e.message}` : "Etherscan proxy failed",
      status
    );
  }
}
