import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=7&format=json", { cache: "no-store" });
    if (!r.ok) throw new Error(`fng ${r.status}`);
    const j = await r.json();
    const latest = j.data?.[0];
    const history = (j.data || []).map((d:any)=>({ value: Number(d.value), label: d.value_classification, ts: Number(d.timestamp)*1000 }));
    return NextResponse.json({ value: latest ? Number(latest.value) : 50, label: latest?.value_classification || "Neutral", history, updatedAt: new Date().toISOString() }, { headers:{ "Cache-Control":"s-maxage=120, stale-while-revalidate=300"} });
  } catch (e:any) {
    // fallback neutral if blocked
    return NextResponse.json({ value: 52, label: "Neutral", history: [], error: e.message, updatedAt: new Date().toISOString() }, { status: 200 });
  }
}
