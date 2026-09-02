import { NextResponse } from "next/server";
import { fetchJson, timedFetch, UpstreamError, UPSTREAM_TIMEOUT_MS } from "@/lib/http";
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Secure proxy for Helius — keeps key off client (set HELIUS_API_KEY in .env.local / Vercel env)
// Usage: /api/helius?method=getAssets&address=xxx  or POST body forwarded

const HELIUS_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";
const HELIUS_BASE = HELIUS_KEY ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}` : "";

function failure(e: unknown) {
  const status = e instanceof UpstreamError ? e.proxyStatus : 502;
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "helius proxy failed" },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  if (!HELIUS_BASE) return NextResponse.json({ error: "HELIUS_API_KEY not set — add to .env.local and Vercel env" }, { status: 503 });
  try {
    const body = await req.text();
    const r = await timedFetch(HELIUS_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
    const j = await r.text();
    return new NextResponse(j, { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(req: Request) {
  if (!HELIUS_BASE) return NextResponse.json({ error: "HELIUS_API_KEY not set" }, { status: 503 });
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  // DAS getAssetsByOwner
  const body = JSON.stringify({ jsonrpc: "2.0", id: "1", method: "getAssetsByOwner", params: { ownerAddress: address, page: 1, limit: 20, displayOptions: { showFungible: true } } });
  try {
    const j = await fetchJson(HELIUS_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" }, UPSTREAM_TIMEOUT_MS);
    return NextResponse.json(j, { headers: { "Cache-Control": "s-maxage=30" } });
  } catch (e) {
    // Previously this threw out of the handler and rendered an unhandled-exception page.
    return failure(e);
  }
}
