import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || "";

// Tiny in-memory LRU to absorb demo-keyless spikes; ~30s TTL.
// Map preserves insertion order, so we can evict oldest by re-inserting.
type Entry = { ts: number; body: unknown };
const TTL_MS = 30_000;
const MAX_KEYS = 64;
const cache = new Map<string, Entry>();

function get(key: string): unknown | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  // touch: re-insert to mark as fresh
  cache.delete(key);
  cache.set(key, e);
  return e.body;
}
function set(key: string, body: unknown) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, { ts: Date.now(), body });
  while (cache.size > MAX_KEYS) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

// Proxy CoinGecko markets server-side to avoid client CORS/429
// Uses Demo API key header when COINGECKO_API_KEY is set (30-50 req/min vs 10 w/o key) — server-only, set via .env.local / Netlify env
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "100";
  const cacheKey = `p=${page}&n=${per_page}`;

  const hit = get(cacheKey);
  if (hit !== null) {
    return NextResponse.json(hit, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-CP-Cache": "HIT",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) {
      // CoinGecko rate-limited (429) or down — fall back to CoinLore (free, no key).
      // Normalize to CoinGecko's markets shape so app/matrix mapping code works unchanged.
      const start = String((Number(page) - 1) * Number(per_page));
      const cl = await fetch(
        `https://api.coinlore.net/api/tickers/?start=${start}&limit=${per_page}`,
        { cache: "no-store", headers: { Accept: "application/json", "User-Agent": "CoinPanther/1.0" } }
      ).then((x) => x.json()).catch(() => null);
      const rows: any[] = cl?.data ?? [];
      if (rows.length) {
        const fallback = rows.map((c: any) => ({
          id: `cl-${c.nameid || c.symbol.toLowerCase()}`,
          symbol: c.symbol,
          name: c.name,
          image: `https://c2.coinlore.com/img/25x25/${c.nameid || c.symbol.toLowerCase()}.png`,
          current_price: c.priceUsd,
          market_cap: c.marketCapUsd,
          total_volume: c.volume24,
          price_change_percentage_1h_in_currency: c.change1h,
          price_change_percentage_24h: c.change24h,
          price_change_percentage_7d_in_currency: c.change7d,
          market_cap_rank: c.rank,
          circulating_supply: c.csupply ? Number(c.csupply) : null,
          total_supply: c.tsupply ? Number(c.tsupply) : null,
          sparkline_in_7d: null,
        }));
        if (Array.isArray(fallback)) set(cacheKey, fallback);
        return NextResponse.json(fallback, {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            "X-CP-Cache": "MISS",
            "X-CP-Source": "coinlore",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      const text = await r.text();
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: text.slice(0, 800) }, { status: r.status });
    }
    const data = await r.json();
    if (Array.isArray(data)) set(cacheKey, data);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-CP-Cache": "MISS",
        "X-CP-Source": "coingecko",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "proxy failed" }, { status: 500 });
  }
}
