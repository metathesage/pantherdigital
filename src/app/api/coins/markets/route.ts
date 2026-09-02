import { NextResponse } from "next/server";

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

    // 429-aware fetch with exponential backoff (max 3 retries)
    let lastRes: Response | null = null;
    let lastText = "";
    for (let attempt = 0; attempt <= 3; attempt++) {
      const r = await fetch(url, { cache: "no-store", headers });
      if (r.ok) {
        const data = await r.json();
        return NextResponse.json(data, {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      lastRes = r;
      lastText = await r.text().catch(() => "");
      // only retry on 429 (rate limit); break immediately on other errors
      if (r.status !== 429 || attempt === 3) break;
      // respect Retry-After if CoinGecko sends it, else exponential backoff 900ms * 2^attempt
      const retryAfter = r.headers.get("retry-after");
      let delayMs = 900 * Math.pow(2, attempt);
      if (retryAfter) {
        const secs = Number(retryAfter);
        if (!Number.isNaN(secs) && secs > 0) delayMs = Math.min(secs * 1000, 10000);
        else {
          const dateMs = Date.parse(retryAfter);
          if (!Number.isNaN(dateMs)) delayMs = Math.max(0, dateMs - Date.now());
        }
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }

    const status = lastRes?.status ?? 500;
    return NextResponse.json(
      { error: `CoinGecko ${status}`, detail: lastText.slice(0, 800) },
      { status }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "proxy failed" }, { status: 500 });
  }
}
