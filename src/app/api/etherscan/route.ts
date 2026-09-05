import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Secure proxy for Etherscan V2 — keeps the key server-side (set ETHERSCAN_API_KEY in .env.local / Netlify env).
// Usage: /api/etherscan?action=ping | /api/etherscan?action=txlist|tokenlist&address=0x...
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASE = "https://api.etherscan.io/v2/api";

function allowlistedAction(action: string | null): action is "txlist" | "tokenlist" {
  return action === "txlist" || action === "tokenlist";
}

function isAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Key-presence probe for the client (leaks nothing but a boolean)
  if (action === "ping") {
    return NextResponse.json({ ok: !!ETHERSCAN_KEY }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!ETHERSCAN_KEY) {
    return NextResponse.json({ error: "ETHERSCAN_API_KEY not set on server" }, { status: 503 });
  }
  if (!allowlistedAction(action)) {
    return NextResponse.json({ error: "unsupported action" }, { status: 400 });
  }
  const address = searchParams.get("address") || "";
  if (!isAddress(address)) {
    return NextResponse.json({ error: "valid 0x address required" }, { status: 400 });
  }

  const extra =
    action === "txlist"
      ? "&startblock=0&endblock=99999999&sort=asc"
      : "";
  const url = `${BASE}?chainid=1&module=account&action=${action}&address=${address}${extra}&apikey=${ETHERSCAN_KEY}`;

  try {
    const r = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `Etherscan ${r.status}`, detail: t.slice(0, 400) }, { status: r.status });
    }
    const j = await r.json();
    return NextResponse.json(j, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "proxy failed" }, { status: 500 });
  }
}
