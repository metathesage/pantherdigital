import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Proxy CoinGecko markets server-side to avoid client CORS/429 + Vercel protection issues
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const per_page = searchParams.get("per_page") || "100";
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`;
  try {
    const r = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: text.slice(0, 800) }, { status: r.status });
    }
    const data = await r.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "proxy failed" }, { status: 500 });
  }
}
