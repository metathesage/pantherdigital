import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CG_KEY = process.env.COINGECKO_API_KEY || "";
const BASE = "https://api.coingecko.com/api/v3";

// Server-side contract lookup — prices ERC-20 holdings by token contract.
// Usage: /api/coins/contract?chain=ethereum&address=0x...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain") || "ethereum";
  const address = searchParams.get("address") || "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "valid 0x address required" }, { status: 400 });
  }
  const url = `${BASE}/coins/${encodeURIComponent(chain)}/contract/${address}`;
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
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}