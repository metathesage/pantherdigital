import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// OpenSea aggregator proxy — tries OpenSea with optional OPENSEA_API_KEY, falls back gracefully
// Free tier without key is heavily rate-limited (429), so we cache and fallback to CoinGecko/Dex
const OPENSEA_KEY = process.env.OPENSEA_API_KEY || "";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain") || "ethereum";
  const limit = searchParams.get("limit") || "20";

  // Try OpenSea collections trending
  const headers: Record<string, string> = { Accept: "application/json" };
  if (OPENSEA_KEY) headers["X-API-KEY"] = OPENSEA_KEY;
  if (OPENSEA_KEY) headers["x-api-key"] = OPENSEA_KEY;

  try {
    // Attempt OpenSea v2 collections — needs key, otherwise 401/429
    if (OPENSEA_KEY) {
      const url = `https://api.opensea.io/api/v2/collections?chain=${chain}&limit=${limit}`;
      const r = await fetch(url, { headers, cache: "no-store" });
      if (r.ok) {
        const j = await r.json() as { collections?: unknown };
        const collections: unknown[] = Array.isArray(j.collections) ? j.collections : Array.isArray(j) ? j : [];
        const mapped = collections.slice(0, Number(limit)).map((raw) => {
          const c = (raw ?? {}) as Record<string, unknown>;
          const collection = String(c.collection ?? "");
          return {
            id: c.collection || c.slug || c.name || "",
            name: c.name || c.collection || "",
            symbol: collection.slice(0, 6).toUpperCase(),
            image: String(c.image_url || c.banner_image_url || ""),
            floor: (c.floor_price ?? null) as number | null,
            volume: (c.volume ?? 0) as number,
            opensea: c.opensea_url || `https://opensea.io/collection/${collection}`,
          };
        });
        if (mapped.length) return NextResponse.json({ source: "opensea", collections: mapped }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
      }
    }
    // No key or failed — report that opensea needs key, client will fallback to CoinGecko/Dex
    return NextResponse.json({ source: "fallback", note: OPENSEA_KEY ? "opensea empty" : "OPENSEA_API_KEY not set — using CoinGecko + DexScreener fallback (free, no key)", collections: [] }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  } catch (e: unknown) {
    return NextResponse.json({ source: "error", error: e instanceof Error ? e.message : "opensea failed", collections: [] }, { status: 200 });
  }
}
