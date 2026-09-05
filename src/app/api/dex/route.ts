import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// DexScreener is completely free, no key needed. We proxy to avoid CORS and add caching.
// Docs: https://docs.dexscreener.com/api/reference
// Endpoints: /latest/dex/search/?q=, /latest/dex/tokens/{address}, /token-boosts/latest/v1,
// /token-profiles/latest/v1, /tokens/v1/{chainId}/{tokenAddress}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const chain = searchParams.get("chain");
  const address = searchParams.get("address");
  const pair = searchParams.get("pair");
  const kind = searchParams.get("kind") || "search";
  const dsChain = chain === "eth" ? "ethereum" : chain;

  try {
    let url = "";
    if (kind === "boosts") url = "https://api.dexscreener.com/token-boosts/latest/v1";
    else if (kind === "topBoosts") url = "https://api.dexscreener.com/token-boosts/top/v1";
    else if (kind === "profiles") url = "https://api.dexscreener.com/token-profiles/latest/v1";
    else if (kind === "tokenPairs" && address) {
      url = dsChain
        ? `https://api.dexscreener.com/tokens/v1/${dsChain}/${address}`
        : `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    }
    else if (kind === "pairs" && chain && pair) url = `https://api.dexscreener.com/latest/dex/pairs/${dsChain}/${pair}`;
    else if (address) url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    else if (q) url = `https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(q)}`;
    else if (kind === "trending") url = "https://api.dexscreener.com/token-boosts/top/v1";
    else return NextResponse.json({ error: "missing q/address/pair" }, { status: 400 });

    const r = await fetch(url, { cache: "no-store", headers: { Accept: "application/json", "User-Agent": "CoinPanther/1.0" } });
    if (!r.ok) return NextResponse.json({ error: `DexScreener ${r.status}` }, { status: r.status });
    const data = await r.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "dex proxy failed" }, { status: 500 });
  }
}
