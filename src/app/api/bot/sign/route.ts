import { NextResponse } from "next/server";
import { authFromRequest } from "@/lib/admin";
import { openPaper, closePaper } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/bot/sign — admin-gated paper trade executor (NO real funds move).
// Body: { action: "open", coinId, symbol, wallet, sizeUsd?, price? }
//       { action: "close", id, price? }
export async function POST(request: Request) {
  const auth = authFromRequest(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "open") {
      if (!body.coinId || !body.symbol || !body.wallet)
        return NextResponse.json({ error: "coinId, symbol, wallet required" }, { status: 400 });
      const pos = await openPaper({
        coinId: String(body.coinId),
        symbol: String(body.symbol),
        wallet: String(body.wallet), // e.g. "coinbase:0x…" or "phantom:…"
        sizeUsd: body.sizeUsd != null ? Number(body.sizeUsd) : undefined,
        price: body.price != null ? Number(body.price) : undefined,
      });
      return NextResponse.json({ ok: true, paper: true, position: pos });
    }
    if (body.action === "close") {
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const pos = await closePaper(String(body.id), body.price != null ? Number(body.price) : undefined);
      return NextResponse.json({ ok: true, paper: true, position: pos });
    }
    return NextResponse.json({ error: 'action must be "open" or "close"' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "paper trade failed" }, { status: e.status || 500 });
  }
}
