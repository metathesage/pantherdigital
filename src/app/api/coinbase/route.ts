import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Coinbase Advanced Trade — public market data (keyless) + private endpoints (need API key + secret).
// The UUID key (COINBASE_API_KEY) authenticates PRIVATE endpoints only when paired with the API SECRET.
// Public market-data endpoints work without any auth, so this proxy serves both.
const CB_BASE = "https://api.coinbase.com";
const CB_KEY = process.env.COINBASE_API_KEY || "";
const TTL_MS = 15_000;
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
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function normProduct(p: any) {
  const [base, quote] = String(p?.product_id || "").split("-");
  return {
    product_id: String(p?.product_id || ""),
    base_currency: base || "",
    quote_currency: quote || "",
    price: num(p?.price),
    change24h: num(p?.price_percentage_change_24h),
    volume24: num(p?.volume_24h),
    market_cap: null,
    fdv: null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "products";
  const product = searchParams.get("product") || "";
  const limit = searchParams.get("limit") || "100";
  const product_type = searchParams.get("product_type") || "SPOT";
  const granularity = searchParams.get("granularity") || "3600";
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";

  let url = "";
  if (action === "products") url = `${CB_BASE}/api/v3/brokerage/market/products?limit=${limit}&product_type=${product_type}`;
  else if (action === "ticker" && product) url = `${CB_BASE}/api/v3/brokerage/market/products/${product}/ticker`;
  else if (action === "candles" && product) {
    const q = new URLSearchParams({ granularity });
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    url = `${CB_BASE}/api/v3/brokerage/market/products/${product}/candles?${q}`;
  } else if (action === "book" && product) url = `${CB_BASE}/api/v3/brokerage/market/product_book?product_id=${product}`;
  else return NextResponse.json({ error: "missing action/product params" }, { status: 400 });

  const cacheKey = `${action}:${url}`;
  const hit = cacheGet(cacheKey);
  if (hit) {
    return NextResponse.json(hit, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30", "X-CP-Source": "coinbase" },
    });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "CoinPanther/1.0" };
    // Private endpoints get the UUID key attached (still need COINBASE_API_SECRET for signing to work)
    if (CB_KEY) headers["CB-ACCESS-KEY"] = CB_KEY;
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `Coinbase ${r.status}`, detail: t.slice(0, 400) }, { status: r.status });
    }
    const j = await r.json();
    let body: unknown = j;
    if (action === "products") {
      const rows = Array.isArray(j?.products) ? j.products : [];
      body = { products: rows.map(normProduct) };
    }
    cacheSet(cacheKey, body);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30", "X-CP-Source": "coinbase" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "coinbase failed" }, { status: 502 });
  }
}