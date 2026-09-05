import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || "";
const BASE = "https://api.coingecko.com/api/v3";

// PNTHR DGTL — server-side market-chart proxy. Keeps the key private, avoids client CORS/429.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const days = searchParams.get("days") || "30";
  const interval = searchParams.get("interval") || "";
  const vs = searchParams.get("vs_currency") || "usd";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const url = `${BASE}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${vs}&days=${days}${interval ? `&interval=${interval}` : ""}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: t.slice(0, 400) }, { status: r.status });
    }
    const j = await r.json();
    return NextResponse.json(j, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
