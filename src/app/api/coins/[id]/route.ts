import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const CG_KEY = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";

// GET /api/coins/[id] — full CoinGecko coin detail via server proxy (key stays server-side).
// Ported from emergent-matrix-lab.

function num(v: unknown): number {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function twitterHandle(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.startsWith("@")) return s.slice(1);
  const m = s.match(/x\.com\/([^/?]+)|twitter\.com\/([^/?]+)/i);
  return m ? m[1] || m[2] : null;
}

// Normalize CoinLore info+ticker+social+markets into CoinGecko coin-detail shape.
// Direct lightweight fetch to api.coinlore.net (no self-HTTP in serverless).
let clIdIdx: { ts: number; map: Record<string, string> } | null = null;
async function resolveCoinLoreId(nameid: string): Promise<string> {
  const now = Date.now();
  if (!clIdIdx || now - clIdIdx.ts > 600_000) {
    try {
      const r = await fetch("https://api.coinlore.net/api/assets/", {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "CoinPanther/1.0" },
      });
      const j = await r.json();
      const rows: any[] = Array.isArray(j) ? j : (j?.data ?? []);
      const map: Record<string, string> = {};
      for (const a of rows) if (a?.nameid) map[String(a.nameid).toLowerCase()] = String(a.id);
      clIdIdx = { ts: now, map };
    } catch {
      if (!clIdIdx) return "";
    }
  }
  return clIdIdx?.map[nameid.toLowerCase()] || "";
}

async function coinLoreFallback(id: string): Promise<unknown | null> {
  const nameid = id.startsWith("cl-") ? id.slice(3) : id;
  try {
    const cid = await resolveCoinLoreId(nameid);
    if (!cid) return null;
    const base = "https://api.coinlore.net/api";
    const hdrs = { Accept: "application/json", "User-Agent": "CoinPanther/1.0" };
    const [info, ticker, social, markets] = await Promise.all([
      fetch(`${base}/coin/info/?id=${cid}`, { cache: "no-store", headers: hdrs })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${base}/ticker/?id=${cid}`, { cache: "no-store", headers: hdrs })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${base}/coin/social_stats/?id=${cid}`, { cache: "no-store", headers: hdrs })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${base}/coin/markets/?id=${cid}`, { cache: "no-store", headers: hdrs })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);
    const info0 = Array.isArray(info) && info.length ? info[0] : null;
    const tick = Array.isArray(ticker) && ticker.length ? ticker[0] : null;
    if (!info0 && !tick) return null;
    const symbol = String(tick?.symbol || info0?.symbol || "TOK").toUpperCase();
    const name = String(tick?.name || info0?.name || nameid);
    const price = num(tick?.price_usd ?? info0?.first_price);
    const mcap = num(tick?.market_cap_usd);
    const vol = num(tick?.volume24);
    const ath = num(info0?.ath);
    const csupply =
      tick?.csupply != null ? num(tick.csupply) : info0?.csupply != null ? num(info0.csupply) : null;
    const tsupply =
      tick?.tsupply != null ? num(tick.tsupply) : info0?.tsupply != null ? num(info0.tsupply) : null;
    const msupply = info0?.msupply != null && info0.msupply !== "" ? num(info0.msupply) : null;
    const platform = info0?.platform ? String(info0.platform) : null;
    const website = info0?.website ? String(info0.website) : null;
    const tw = twitterHandle(info0?.twitter);
    const socials = (social ?? {}) as {
      reddit?: { subscribers?: unknown };
      twitter?: { followers_count?: unknown };
    };
    const mkts = Array.isArray(markets) ? markets : [];
    return {
      id: `cl-${nameid}`,
      symbol,
      name,
      market_data: {
        current_price: { usd: price },
        market_cap: { usd: mcap },
        total_volume: { usd: vol },
        ath: { usd: ath || null },
        ath_change_percentage: { usd: null },
        atl: { usd: null },
        circulating_supply: csupply,
        total_supply: tsupply,
        max_supply: msupply,
        fully_diluted_valuation: { usd: null },
        price_change_percentage_24h: num(tick?.percent_change_24h),
        price_change_percentage_1h_in_currency: { usd: num(tick?.percent_change_1h) },
        price_change_percentage_24h_in_currency: { usd: num(tick?.percent_change_24h) },
        price_change_percentage_7d_in_currency: { usd: num(tick?.percent_change_7d) },
      },
      description: {
        en: `${name} (${symbol}) — a digital asset${platform ? ` built on ${platform}` : ""} tracked by CoinLore. Circulating supply ${csupply != null ? csupply.toLocaleString() : "—"}${msupply != null ? `, max supply ${msupply.toLocaleString()}` : ""}.`,
      },
      categories: [platform || "Digital Assets", "Crypto"],
      links: {
        homepage: website ? [website] : [],
        twitter_screen_name: tw,
        telegram_channel_identifier: null,
        subreddit_url: null,
        blockchain_site: info0?.explorer ? [String(info0.explorer)] : [],
      },
      community_data: {
        twitter_followers: socials?.twitter?.followers_count ?? null,
        reddit_subscribers: socials?.reddit?.subscribers ?? null,
        telegram_channel_user_count: null,
      },
      tickers: mkts.slice(0, 12).map((m: any) => ({
        market: { name: String(m?.name || "DEX") },
        base: String(m?.base || symbol),
        target: String(m?.quote || "USD"),
        last: m?.price_usd ?? m?.price ?? 0,
        volume: m?.volume ?? 0,
        trust_score: m?.name ? "green" : null,
        trade_url: null,
      })),
      contract_address: null,
      platforms: platform ? { [platform]: null } : {},
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // CoinLore-sourced coins (id prefix "cl-") never hit CoinGecko
  if (id.startsWith("cl-")) {
    const fb = await coinLoreFallback(id);
    if (fb) {
      return NextResponse.json(fb, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-CP-Source": "coinlore",
        },
      });
    }
    return NextResponse.json({ error: "coinlore detail failed" }, { status: 404 });
  }

  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (CG_KEY) headers["x-cg-demo-api-key"] = CG_KEY;
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) {
      // CoinGecko 404/429 — fall back to normalized CoinLore detail
      if (r.status === 404 || r.status === 429) {
        const fb = await coinLoreFallback(id);
        if (fb) {
          return NextResponse.json(fb, {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
              "X-CP-Source": "coinlore",
            },
          });
        }
      }
      const t = await r.text();
      return NextResponse.json({ error: `CoinGecko ${r.status}`, detail: t.slice(0, 900) }, { status: r.status });
    }
    const j = await r.json();
    return NextResponse.json(j, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch (e: unknown) {
    const fb = await coinLoreFallback(id);
    if (fb) {
      return NextResponse.json(fb, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-CP-Source": "coinlore",
        },
      });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
