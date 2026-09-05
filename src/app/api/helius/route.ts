import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Secure proxy for Helius — keeps key off client (set HELIUS_API_KEY in .env.local / Netlify env)
// Usage: /api/helius?method=getAssets&address=xxx  or POST body forwarded

const HELIUS_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_BASE = HELIUS_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}` : "";

export async function POST(req: Request) {
  if (!HELIUS_BASE) return NextResponse.json({ error: "HELIUS_API_KEY not set — add to .env.local and Vercel env" }, { status: 503 });
  try {
    const body = await req.text();
    const r = await fetch(HELIUS_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
    const j = await r.text();
    return new NextResponse(j, { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "helius proxy failed" }, { status: 500 });
  }
}
export async function GET(req: Request) {
  if (!HELIUS_BASE) return NextResponse.json({ error: "HELIUS_API_KEY not set" }, { status: 503 });
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  // DAS getAssetsByOwner
  const body = JSON.stringify({ jsonrpc: "2.0", id: "1", method: "getAssetsByOwner", params: { ownerAddress: address, page: 1, limit: 20, displayOptions: { showFungible: true } } });
  const r = await fetch(HELIUS_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
  const j = await r.json();
  return NextResponse.json(j, { headers: { "Cache-Control": "s-maxage=30" } });
}
