import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || "";
const BASE = "https://api.coingecko.com/api/v3";

// Tiny cached CoinLore asset index (nameid -> numeric id) for keyless price fallback
let clIdx: { ts: number; map: Record<string, string> } | null = null;
async function coinLoreIds(nameids: string[]): Promise<string[]> {
  const now = Date.now();
  if (!clIdx || now - clIdx.ts > 600_000) {
    try {
      const r = await fetch("https://api.coinlore.net/api/assets/", { cache: "no-store", headers: { Accept: "application/json" } });
      const j = await r.json();
      const rows: any[] = Array.isArray(j) ? j : (j?.data ?? []);
      const map: Record<string, string> = {};
      for (const a of rows) if (a?.nameid) map[String(a.nameid).toLowerCase()] = String(a.id);
      clIdx = { ts: now, map };
    } catch {
      if (!clIdx) return [];
    }
  }
  return nameids.map((n) => clIdx?.map[n.toLowerCase()] || "").filter(Boolean);
}

async function coinLorePrices(nameids: string[]): Promise<Record<string, { usd: number }>> {
  const ids = await coinLoreIds(nameids);
  if (!ids.length) return {};
  try {
    const r = await fetch(`https://api.coinlore.net/api/ticker/?id=${ids.join(",")}`, { cache: "no-store", headers: { Accept: "application/json" } });
    const j = await r.json();
    const rows: any[] = Array.isArray(j) ? j : [];
    const byNameid = new Map(rows.map((c) => [String(c?.nameid).toLowerCase(), c]));
    const out: Record<string, { usd: number }> = {};
    for (const n of nameids) {
      const c = byNameid.get(n.toLowerCase());
      if (c?.price_usd != null) out[n] = { usd: parseFloat(c.price_usd) };
    }
    return out;
  } catch {
    return {};
  }
}

// Server-side proxy for /simple/price — keeps the key private and avoids client CORS/429.
// Usage: /api/simple-price?ids=bitcoin,ethereum&vs_currencies=usd
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids") || "";
  const vs = searchParams.get("vs_currencies") || "usd";
  if (!ids) return NextResponse.json({ error: "ids required" }, { status: 400 });
  const include_mcap = searchParams.get("include_market_cap") || "false";
  const include_vol = searchParams.get("include_24hr_vol") || "false";
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${vs}&include_market_cap=${include_mcap}&include_24hr_vol=${include_vol}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) {
      // CoinGecko 429 — fall back to CoinLore (free, no key)
      const fb = await coinLorePrices(idList);
      if (Object.keys(fb).length) {
        return NextResponse.json(fb, {
          headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-CP-Source": "coinlore" },
        });
      }
      const t = await r.text();
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: t.slice(0, 400) }, { status: r.status });
    }
    const j = await r.json();
    return NextResponse.json(j, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-CP-Source": "coingecko" },
    });
  } catch (e: unknown) {
    const fb = await coinLorePrices(idList);
    if (Object.keys(fb).length) {
      return NextResponse.json(fb, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60", "X-CP-Source": "coinlore" } });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}