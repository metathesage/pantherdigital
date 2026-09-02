import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const CG_KEY = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
export async function GET() {
  try {
    const headers: Record<string,string> = { Accept: "application/json" };
    if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
    const r = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store", headers });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `CG ${r.status}`, detail: t.slice(0,600) }, { status: r.status });
    }
    const j = await r.json();
    return NextResponse.json(j.data || j, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
