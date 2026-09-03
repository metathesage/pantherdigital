import { NextResponse } from "next/server";
import { authFromRequest } from "@/lib/admin";
import { getState, sweepExits } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/bot/health — admin-gated bot status (+ auto-sweeps TP/SL exits)
export async function GET(request: Request) {
  const auth = authFromRequest(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  let swept: unknown[] = [];
  try {
    swept = await sweepExits();
  } catch {
    /* prices may fail; still report state */
  }
  return NextResponse.json({ ok: true, ...getState(), swept, ts: new Date().toISOString() });
}
