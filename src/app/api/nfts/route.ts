import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || "";
const BASE = "https://api.coingecko.com/api/v3";

// PNTHR DGTL — server-side NFT proxy. Keeps the key private, avoids client CORS/429.
// Usage:
//   /api/nfts?action=list&per_page=40
//   /api/nfts?action=markets&per_page=40
//   /api/nfts?action=detail&id=bored-ape-yacht-club
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";
  const per_page = searchParams.get("per_page") || "40";
  const id = searchParams.get("id") || "";
  let url = "";
  if (action === "detail") {
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    url = `${BASE}/nfts/${encodeURIComponent(id)}?localization=false`;
  } else if (action === "markets") {
    url = `${BASE}/nfts/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=1&sparkline=false`;
  } else {
    url = `${BASE}/nfts/list?per_page=${per_page}`;
  }
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
