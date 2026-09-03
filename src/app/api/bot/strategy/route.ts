import { NextResponse } from "next/server";
import { authFromRequest } from "@/lib/admin";
import { getState, setStrategy } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET returns strategy · POST patches it (admin-gated).
// Patch keys: maxPositions, positionUsd, takeProfitPct, stopLossPct, minScore
export async function GET(request: Request) {
  const auth = authFromRequest(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  return NextResponse.json({ ok: true, strategy: getState().strategy });
}

export async function POST(request: Request) {
  const auth = authFromRequest(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const body = await request.json().catch(() => ({}));
  const allowed = ["maxPositions", "positionUsd", "takeProfitPct", "stopLossPct", "minScore"];
  const patch: Record<string, number> = {};
  for (const k of allowed) if (body[k] != null && Number.isFinite(Number(body[k]))) patch[k] = Number(body[k]);
  return NextResponse.json({ ok: true, strategy: setStrategy(patch) });
}
