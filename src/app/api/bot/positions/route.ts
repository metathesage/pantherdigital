import { NextResponse } from "next/server";
import { authFromRequest } from "@/lib/admin";
import { getState } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/bot/positions — admin-gated open paper positions
export async function GET(request: Request) {
  const auth = authFromRequest(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const s = getState();
  return NextResponse.json({ ok: true, balance: s.balance, open: s.open, openCount: s.openCount });
}
