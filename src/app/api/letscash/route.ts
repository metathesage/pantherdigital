import { NextResponse } from "next/server";
import {
  fetchLive,
  MIN_LIVE_TOKENS,
  snapshotData,
  emergentScore,
  tokenUrl,
  sortTokens,
  parseSort,
  type LetscashToken,
} from "@/lib/letscash";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * letscash.fun proxy — the memecoin launchpad on Robinhood Chain.
 *
 *   GET /api/letscash                       → board (trending), chain stats, tokenomics, ranks
 *   GET /api/letscash?sort=newest|mcap|burned|oldest|trending
 *   GET /api/letscash?kind=tape             → live trade tape
 *   GET /api/letscash?address=0x…           → single token detail
 *
 * Live scrape first, bundled snapshot on any failure. `live:false` in the
 * payload tells the client which one it got so the UI can say so honestly.
 */

const TTL_MS = 60_000;
type CacheEntry = { expires: number; payload: unknown };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string, allowStale = false): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  return hit.expires > Date.now() || allowStale ? hit.payload : null;
}
function cacheSet(key: string, payload: unknown) {
  cache.set(key, { expires: Date.now() + TTL_MS, payload });
}

/** Shape consumed by the radar feed — mirrors the pair engine's UnifiedPair. */
function toPairRow(t: LetscashToken, rank: number) {
  const score = emergentScore(t);
  return {
    id: `robinhood:${t.address}`,
    source: "letscash",
    feed: "robinhood",
    network: "robinhood",
    chainId: "robinhood",
    pairAddress: t.address,
    tokenAddress: t.address,
    name: t.name,
    tokenName: t.name,
    tokenSymbol: t.symbol,
    quoteSymbol: "ETH",
    dexName: "letscash.fun",
    image: t.image,
    priceUsd: 0,
    change1h: 0,
    change24h: t.change24h,
    volume24h: t.volume24hUsd ?? Math.max(0, t.marketCapUsd * 0.06),
    liquidityUsd: Math.max(0, t.marketCapUsd * 0.12),
    fdvUsd: t.marketCapUsd,
    marketCapUsd: t.marketCapUsd,
    txns24h: 0,
    poolCreatedAt: null,
    pairUrl: tokenUrl(t.address),
    geckoTerminalUrl: tokenUrl(t.address),
    socials: t.socials,
    description:
      t.description ||
      `${t.name} (${t.symbol}) — launched on letscash.fun${
        t.taxPct ? ` · ${t.taxPct}% tax` : t.burnedPct ? " · self-burn" : ""
      }${t.burnedPct ? ` · ${t.burnedPct}% burned` : ""}`,
    // extra fields the radar uses for Robinhood-specific chrome
    emergentScore: score,
    rank,
    taxPct: t.taxPct,
    burnedPct: t.burnedPct,
    holders: t.holders,
    ageSeconds: t.ageSeconds,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "board";
  const sort = parseSort(searchParams.get("sort"));
  const address = (searchParams.get("address") || "").trim();
  const key = `${kind}:${sort}:${address.toLowerCase()}`;

  const hit = cacheGet(key);
  if (hit) return NextResponse.json(hit, { headers: jsonHeaders() });

  // Resolve upstream (live, else snapshot) once per request.
  let live = false;
  let tokens = snapshotData.tokens;
  let chain = snapshotData.chain;

  if (kind !== "offline") {
    try {
      const up = await fetchLive();
      if (up.tokens.length >= MIN_LIVE_TOKENS) {
        tokens = up.tokens;
        chain = up.chain ?? snapshotData.chain;
        live = true;
      }
    } catch {
      /* fall through to snapshot */
    }
  }

  const base = {
    source: "letscash.fun",
    sourceUrl: "https://www.letscash.fun/",
    network: "Robinhood Chain",
    live,
    capturedAt: live ? new Date().toISOString() : snapshotData.capturedAt,
    tokenomics: snapshotData.tokenomics,
    ranks: snapshotData.ranks,
    chain,
  };

  let payload: unknown;

  if (kind === "tape") {
    payload = { ...base, kind, tape: snapshotData.tape };
  } else if (kind === "ranks") {
    payload = { ...base, kind, ranks: snapshotData.ranks };
  } else if (address) {
    const found =
      tokens.find((t) => t.address.toLowerCase() === address.toLowerCase()) ??
      snapshotData.tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
    payload = found
      ? { ...base, kind: "token", token: { ...found, emergentScore: emergentScore(found), url: tokenUrl(found.address) } }
      : { ...base, kind: "token", token: null, error: "token not found" };
  } else {
    const sorted = sortTokens(tokens, sort);
    payload = {
      ...base,
      kind: "board",
      sort,
      count: sorted.length,
      // tape rides along with the board so the radar needs a single round trip
      tape: snapshotData.tape,
      pairs: sorted.map(toPairRow),
      tokens: sorted.map((t) => ({
        ...t,
        emergentScore: emergentScore(t),
        url: tokenUrl(t.address),
      })),
    };
  }

  cacheSet(key, payload);
  return NextResponse.json(payload, { headers: jsonHeaders() });
}

function jsonHeaders() {
  return { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" };
}
