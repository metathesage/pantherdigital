import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PNTHR DGTL — CoinLore proxy. Completely free, no API key, no strict rate
// limit (~1 req/s recommended). Supplement/fallback for CoinGecko
// (Demo = 30 calls/min -> 429 under load).
const CL_BASE = "https://api.coinlore.net/api";
const TTL_MS = 60_000;
const cache = new Map<string, { ts: number; body: unknown }>();

function cacheGet(key: string): unknown | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) { cache.delete(key); return null; }
  return e.body;
}
function cacheSet(key: string, body: unknown) {
  cache.set(key, { ts: Date.now(), body });
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function normTicker(c: any) {
  return {
    id: String(c?.id ?? ""),
    symbol: String(c?.symbol ?? ""),
    name: String(c?.name ?? ""),
    nameid: String(c?.nameid ?? ""),
    rank: num(c?.rank),
    priceUsd: num(c?.price_usd),
    change1h: num(c?.percent_change_1h),
    change24h: num(c?.percent_change_24h),
    change7d: num(c?.percent_change_7d),
    marketCapUsd: num(c?.market_cap_usd),
    volume24: num(c?.volume24),
    csupply: c?.csupply == null ? null : String(c.csupply),
    tsupply: c?.tsupply == null ? null : String(c.tsupply),
    msupply: c?.msupply == null || c.msupply === "" ? null : String(c.msupply),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "tickers";
  const start = searchParams.get("start") || "0";
  const limit = searchParams.get("limit") || "100";
  const ids = searchParams.get("ids") || "";
  const id = searchParams.get("id") || "";
  const coin = searchParams.get("coin") || "";
  const sort = searchParams.get("sort") || "24h";

  const buildUrl = (): string => {
    switch (action) {
      case "tickers": return `${CL_BASE}/tickers/?start=${start}&limit=${limit}`;
      case "ticker": return `${CL_BASE}/ticker/?id=${encodeURIComponent(ids)}`;
      case "assets": return `${CL_BASE}/assets/`;
      case "info": return `${CL_BASE}/coin/info/?id=${encodeURIComponent(id)}`;
      case "social": return `${CL_BASE}/coin/social_stats/?id=${encodeURIComponent(id)}`;
      case "markets": return `${CL_BASE}/coin/markets/?id=${encodeURIComponent(id)}`;
      case "movers": return `${CL_BASE}/movers/?sort=${sort}`;
      case "ohlcv": return `${CL_BASE}/coin/ohlcv/?coin=${encodeURIComponent(coin)}`;
      case "global": return `${CL_BASE}/global/`;
      default: return "";
    }
  };
  const url = buildUrl();
  if (!url) return NextResponse.json({ error: "unsupported action" }, { status: 400 });
  const cacheKey = `${action}:${url}`;
  const hit = cacheGet(cacheKey);
  if (hit) {
    return NextResponse.json(hit, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120", "X-CP-Source": "coinlore" },
    });
  }

  try {
    const r = await fetch(url, { cache: "no-store", headers: { Accept: "application/json", "User-Agent": "PNHRDGTL/1.0" } });
    if (!r.ok) return NextResponse.json({ error: `CoinLore ${r.status}` }, { status: r.status });
    const j = await r.json();
    let body: unknown = j;
    if (action === "tickers") body = { data: (j?.data ?? []).map(normTicker), info: j?.info ?? null };
    else if (action === "ticker") body = (Array.isArray(j) ? j : []).map(normTicker);
    else if (action === "assets") body = j?.data ?? [];
    else if (action === "info") body = Array.isArray(j) && j.length ? j[0] : null;
    else if (action === "social") body = j ?? null;
    else if (action === "markets") body = Array.isArray(j) ? j : [];
    else if (action === "movers") body = j?.data ?? { winners: [], losers: [] };
    else if (action === "global") body = Array.isArray(j) && j.length ? j[0] : null;
    else if (action === "ohlcv") body = j ?? {};
    cacheSet(cacheKey, body);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120", "X-CP-Source": "coinlore" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "coinlore failed" }, { status: 502 });
  }
}
