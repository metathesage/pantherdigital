import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 86400;

const CG_KEY = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";

// GET /api/coins/platforms — CoinGecko coins/list with per-coin asset platforms.
// One call (~18k coins), cached 24h server-side. Lets the client verify each coin's
// REAL native chain + contract addresses instead of guessing from symbols.
export async function GET() {
  const url = "https://api.coingecko.com/api/v3/coins/list?include_platform=true";
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: t.slice(0, 500) }, { status: r.status });
    }
    const data = await r.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "proxy failed" }, { status: 500 });
  }
}
