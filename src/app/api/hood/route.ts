import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 86400;

// GET /api/hood — verify which coins REALLY have contracts on Robinhood chain.
// Queries DexScreener search per candidate and keeps only pairs with chainId === "robinhood"
// (Uniswap / swaphood / flapsh on Robinhood Chain). Cached 24h server-side.
// Example: ARB has pairs only on arbitrum/solana/ethereum → excluded. HOOD → verified.
const CANDIDATES: { id: string; symbol: string }[] = [
  { id: "bitcoin", symbol: "BTC" }, { id: "ethereum", symbol: "ETH" }, { id: "solana", symbol: "SOL" },
  { id: "dogecoin", symbol: "DOGE" }, { id: "shiba-inu", symbol: "SHIB" }, { id: "pepe", symbol: "PEPE" },
  { id: "bonk", symbol: "BONK" }, { id: "dogwifcoin", symbol: "WIF" }, { id: "floki", symbol: "FLOKI" },
  { id: "brett", symbol: "BRETT" }, { id: "popcat", symbol: "POPCAT" }, { id: "cat-in-a-dogs-world", symbol: "MEW" },
  { id: "book-of-meme", symbol: "BOME" }, { id: "turbo", symbol: "TURBO" }, { id: "mog-coin", symbol: "MOG" },
  { id: "official-trump", symbol: "TRUMP" }, { id: "neiro", symbol: "NEIRO" }, { id: "baby-doge-coin", symbol: "BABYDOGE" },
  { id: "kishu-inu", symbol: "KISHU" }, { id: "wojak", symbol: "WOJAK" }, { id: "slerf", symbol: "SLERF" },
  { id: "avalanche", symbol: "AVAX" }, { id: "cardano", symbol: "ADA" }, { id: "chainlink", symbol: "LINK" },
  { id: "uniswap", symbol: "UNI" }, { id: "aave", symbol: "AAVE" }, { id: "arbitrum", symbol: "ARB" },
  { id: "optimism", symbol: "OP" }, { id: "matic-network", symbol: "MATIC" }, { id: "near", symbol: "NEAR" },
  { id: "aptos", symbol: "APT" }, { id: "cosmos", symbol: "ATOM" }, { id: "algorand", symbol: "ALGO" },
  { id: "stellar", symbol: "XLM" }, { id: "litecoin", symbol: "LTC" }, { id: "bitcoin-cash", symbol: "BCH" },
  { id: "compound", symbol: "COMP" }, { id: "the-graph", symbol: "GRT" }, { id: "lido-dao", symbol: "LDO" },
  { id: "curve-dao-token", symbol: "CRV" }, { id: "synthetix", symbol: "SNX" }, { id: "sushi", symbol: "SUSHI" },
  { id: "pudgy-penguins", symbol: "PENGU" }, { id: "cashcat", symbol: "CASHCAT" }, { id: "hood", symbol: "HOOD" },
  { id: "virtual-protocol", symbol: "VIRTUAL" },
];

type HoodEntry = { id: string; symbol: string; contract: string; dex: string; pairUrl: string; liquidityUsd: number };

export async function GET() {
  const verified: HoodEntry[] = [];
  const unverified: string[] = [];
  for (const c of CANDIDATES) {
    // fictional Panther tickers pass through (native to the Hood desk)
    if (c.id === "cashcat" || c.id === "hood") {
      verified.push({ id: c.id, symbol: c.symbol, contract: "native", dex: "hood-desk", pairUrl: "https://dexscreener.com/robinhood", liquidityUsd: 0 });
      continue;
    }
    try {
      const r = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(c.symbol)}`, {
        headers: { Accept: "application/json" },
      });
      if (!r.ok) { unverified.push(c.id); continue; }
      const j = await r.json();
      const pairs: any[] = (j.pairs || []).filter((p: any) => p.chainId === "robinhood");
      if (!pairs.length) { unverified.push(c.id); continue; }
      // best pair by liquidity; prefer exact symbol match on base token
      const exact = pairs.filter((p) => String(p.baseToken?.symbol || "").toUpperCase() === c.symbol.toUpperCase());
      const pool = exact.length ? exact : pairs;
      pool.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const best = pool[0];
      verified.push({
        id: c.id,
        symbol: c.symbol,
        contract: String(best.baseToken?.address || ""),
        dex: String(best.dexId || "uniswap"),
        pairUrl: String(best.url || "https://dexscreener.com/robinhood"),
        liquidityUsd: Number(best.liquidity?.usd || 0),
      });
    } catch {
      unverified.push(c.id);
    }
    await new Promise((res) => setTimeout(res, 200)); // stay under DexScreener rate limit
  }
  return NextResponse.json(
    { verified, unverified, count: verified.length, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } }
  );
}
