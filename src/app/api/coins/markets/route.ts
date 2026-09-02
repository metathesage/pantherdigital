import { NextResponse } from "next/server";
import { fetchJson, UpstreamError, UPSTREAM_TIMEOUT_MS } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";

// Proxy CoinGecko markets server-side to avoid client CORS/429 + Vercel protection issues
// Uses Demo API key header when COINGECKO_API_KEY is set (30-50 req/min vs 10 w/o key) — never hardcode, set via .env.local / Vercel env
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "100";
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
    const data = await fetchJson(url, { cache: "no-store", headers });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    // Always answer — a hung request here leaves the whole feed spinner running.
    const status = e instanceof UpstreamError ? e.proxyStatus : 502;
    const message = e instanceof Error ? e.message : "proxy failed";
    return NextResponse.json(
      { error: `CoinGecko ${message}`, detail: `proxy gave up after ${UPSTREAM_TIMEOUT_MS / 1000}s` },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          ...(status === 429 ? { "Retry-After": "30" } : {}),
        },
      }
    );
  }
}
