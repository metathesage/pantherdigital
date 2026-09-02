import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GT_BASE = "https://api.geckoterminal.com/api/v2";
const DS_BASE = "https://api.dexscreener.com";
const UA = { "User-Agent": "CoinPanther/1.0", Accept: "application/json" } as const;
const TTL_MS = 60_000;
const PER_NETWORK = 30;
const BOOST_HYDRATE = 24;

type GtNet = "solana" | "eth" | "base";
type Feed = "trending" | "new" | "boosts";
type ChainQ = "all" | GtNet;

type Socials = { twitter?: string; telegram?: string; website?: string };

export type UnifiedPair = {
  id: string;
  source: "geckoterminal" | "dexscreener";
  feed: Feed;
  network: GtNet;
  chainId: "solana" | "ethereum" | "base";
  pairAddress: string;
  tokenAddress: string;
  name: string;
  tokenName: string;
  tokenSymbol: string;
  quoteSymbol: string;
  dexName: string;
  image: string;
  priceUsd: number;
  change1h: number;
  change24h: number;
  volume24h: number;
  liquidityUsd: number;
  fdvUsd: number;
  marketCapUsd: number;
  txns24h: number;
  poolCreatedAt: string | null;
  pairUrl: string;
  geckoTerminalUrl: string;
  socials: Socials;
  description: string;
};

type CacheEntry = { expires: number; payload: unknown };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string, allowStale = false): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires > Date.now() || allowStale) return hit.payload;
  return null;
}
function cacheSet(key: string, payload: unknown) {
  cache.set(key, { expires: Date.now() + TTL_MS, payload });
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function dsChain(net: GtNet): "solana" | "ethereum" | "base" {
  return net === "eth" ? "ethereum" : net;
}
function gtNetFromDs(chainId: string): GtNet | null {
  const c = chainId.toLowerCase();
  if (c === "solana") return "solana";
  if (c === "ethereum" || c === "eth") return "eth";
  if (c === "base") return "base";
  return null;
}
function networkFromPoolId(id: string, fallback: GtNet): GtNet {
  if (id.startsWith("solana_")) return "solana";
  if (id.startsWith("eth_")) return "eth";
  if (id.startsWith("base_")) return "base";
  return fallback;
}

function parseChain(raw: string | null): ChainQ {
  const v = (raw || "all").toLowerCase();
  if (v === "solana" || v === "eth" || v === "base") return v;
  if (v === "ethereum") return "eth";
  return "all";
}
function parseFeed(raw: string | null): Feed {
  const v = (raw || "trending").toLowerCase();
  if (v === "new" || v === "boosts" || v === "trending") return v;
  return "trending";
}

function jsonHeaders() {
  return { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: UA, cache: "no-store", signal: ctrl.signal });
    if (!r.ok) {
      const err: any = new Error(`HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function includedIndex(included: any[]): Map<string, any> {
  const m = new Map<string, any>();
  for (const row of included || []) {
    if (row?.id) m.set(row.id, row);
  }
  return m;
}

function relId(row: any, key: string): string {
  return row?.relationships?.[key]?.data?.id || "";
}

function normalizeGtPool(row: any, inc: Map<string, any>, fallbackNet: GtNet, feed: Feed): UnifiedPair | null {
  const attr = row?.attributes || {};
  const pairAddress = str(attr.address);
  if (!pairAddress) return null;
  const network = networkFromPoolId(str(row?.id), fallbackNet);
  const chainId = dsChain(network);
  const base = inc.get(relId(row, "base_token"));
  const quote = inc.get(relId(row, "quote_token"));
  const dex = inc.get(relId(row, "dex"));
  const ba = base?.attributes || {};
  const qa = quote?.attributes || {};
  const tokenSymbol = str(ba.symbol) || str(attr.name).split("/")[0].trim() || "???";
  const quoteSymbol = str(qa.symbol) || str(attr.name).split("/")[1]?.trim() || "";
  const tokenName = str(ba.name) || tokenSymbol;
  const tokenAddress = str(ba.address);
  const pc = attr.price_change_percentage || {};
  const vol = attr.volume_usd || {};
  const tx = attr.transactions || {};
  const txh = tx.h24 || {};
  const txns24h = num(txh.buys) + num(txh.sells);
  const priceUsd = num(attr.base_token_price_usd);
  const liquidityUsd = num(attr.reserve_in_usd);
  const fdvUsd = num(attr.fdv_usd);
  const marketCapUsd = num(attr.market_cap_usd) || fdvUsd || liquidityUsd;
  const name = str(attr.name) || `${tokenSymbol}/${quoteSymbol || "USD"}`;
  const dexName = str(dex?.attributes?.name) || "DEX";
  const created = attr.pool_created_at ? str(attr.pool_created_at) : null;
  return {
    id: `${network}:${pairAddress}`,
    source: "geckoterminal",
    feed,
    network,
    chainId,
    pairAddress,
    tokenAddress,
    name,
    tokenName,
    tokenSymbol,
    quoteSymbol,
    dexName,
    image: str(ba.image_url),
    priceUsd,
    change1h: num(pc.h1),
    change24h: num(pc.h24),
    volume24h: num(vol.h24),
    liquidityUsd,
    fdvUsd,
    marketCapUsd,
    txns24h,
    poolCreatedAt: created,
    pairUrl: `https://dexscreener.com/${chainId}/${pairAddress}`,
    geckoTerminalUrl: `https://www.geckoterminal.com/${network}/pools/${pairAddress}`,
    socials: {},
    description: `${tokenName} · ${dexName} · ${name}`,
  };
}

function normalizeGtPayload(json: any, fallbackNet: GtNet, feed: Feed): UnifiedPair[] {
  const inc = includedIndex(json?.included || []);
  const out: UnifiedPair[] = [];
  for (const row of json?.data || []) {
    const p = normalizeGtPool(row, inc, fallbackNet, feed);
    if (p) out.push(p);
    if (out.length >= PER_NETWORK) break;
  }
  return out;
}

async function fetchGtNetwork(feed: "trending" | "new", net: GtNet): Promise<UnifiedPair[]> {
  const path = feed === "trending" ? "trending_pools" : "new_pools";
  const url = `${GT_BASE}/networks/${net}/${path}?include=base_token,quote_token,dex`;
  const json = await fetchJson(url);
  return normalizeGtPayload(json, net, feed);
}

async function fetchGtFeed(feed: "trending" | "new", chain: ChainQ): Promise<{ pairs: UnifiedPair[]; degraded: boolean }> {
  const nets: GtNet[] = chain === "all" ? ["solana", "eth", "base"] : [chain];
  const settled = await Promise.allSettled(nets.map((n) => fetchGtNetwork(feed, n)));
  const pairs: UnifiedPair[] = [];
  let ok = 0;
  settled.forEach((res) => {
    if (res.status === "fulfilled") {
      ok += 1;
      pairs.push(...res.value);
    }
  });
  const seen = new Set<string>();
  const deduped = pairs.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  if (feed === "new") {
    deduped.sort((a, b) => str(b.poolCreatedAt).localeCompare(str(a.poolCreatedAt)));
  } else {
    deduped.sort((a, b) => b.volume24h - a.volume24h);
  }
  return { pairs: deduped, degraded: ok < nets.length };
}

function unwrapPairs(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.pairs)) return json.pairs;
  if (json && typeof json === "object" && json.pairAddress) return [json];
  return [];
}

function pickBestPair(pairs: any[], chainId?: string): any | null {
  const filtered = chainId
    ? pairs.filter((p) => String(p?.chainId || "").toLowerCase() === chainId.toLowerCase())
    : pairs;
  const pool = (filtered.length ? filtered : pairs).slice().sort((a, b) => num(b?.liquidity?.usd) - num(a?.liquidity?.usd));
  return pool[0] || null;
}

function socialsFromBoostAndPair(boost: any, pair: any, profile: any): Socials {
  const s: Socials = {};
  const consider = (url?: string, type?: string, label?: string) => {
    const u = str(url);
    if (!u) return;
    const t = `${type || ""} ${label || ""} ${u}`.toLowerCase();
    if (!s.twitter && (t.includes("twitter") || t.includes("x.com") || t.includes("/x.com"))) s.twitter = u;
    else if (!s.telegram && (t.includes("telegram") || t.includes("t.me"))) s.telegram = u;
    else if (!s.website && /^https?:\/\//i.test(u) && !t.includes("twitter") && !t.includes("t.me") && !t.includes("dexscreener")) {
      if (!s.website) s.website = u;
    }
  };
  for (const l of boost?.links || []) consider(l.url, l.type, l.label);
  for (const l of profile?.links || []) consider(l.url, l.type, l.label);
  for (const l of pair?.info?.socials || []) consider(l.url, l.type, l.label);
  for (const l of pair?.info?.websites || []) consider(l.url, "website", l.label);
  return s;
}

function imageFrom(boost: any, pair: any, profile: any): string {
  const candidates = [
    pair?.info?.imageUrl,
    profile?.icon,
    boost?.icon,
  ];
  for (const c of candidates) {
    const v = str(c);
    if (/^https?:\/\//i.test(v)) return v;
    if (v && !v.includes("/")) return `https://cdn.dexscreener.com/cms/images/${v}?width=64&height=64&fit=crop&quality=95&format=auto`;
  }
  return "";
}

function createdIso(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = str(v);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeDsPair(pair: any, boost: any, profile: any, feed: Feed): UnifiedPair | null {
  const pairAddress = str(pair?.pairAddress);
  const chainIdRaw = str(pair?.chainId || boost?.chainId).toLowerCase();
  const network = gtNetFromDs(chainIdRaw);
  if (!pairAddress || !network) return null;
  const chainId = dsChain(network);
  const base = pair?.baseToken || {};
  const quote = pair?.quoteToken || {};
  const tokenSymbol = str(base.symbol) || "???";
  const quoteSymbol = str(quote.symbol) || "";
  const tokenName = str(base.name) || tokenSymbol;
  const tokenAddress = str(base.address || boost?.tokenAddress);
  const txh = pair?.txns?.h24 || {};
  const liq = num(pair?.liquidity?.usd);
  const fdvUsd = num(pair?.fdv);
  const marketCapUsd = num(pair?.marketCap) || fdvUsd || liq;
  const dexName = str(pair?.dexId) || "DEX";
  const name = `${tokenSymbol}${quoteSymbol ? ` / ${quoteSymbol}` : ""}`;
  const desc = str(boost?.description || profile?.description || `${tokenName} · ${dexName}`);
  return {
    id: `${network}:${pairAddress}`,
    source: "dexscreener",
    feed,
    network,
    chainId,
    pairAddress,
    tokenAddress,
    name,
    tokenName,
    tokenSymbol,
    quoteSymbol,
    dexName,
    image: imageFrom(boost, pair, profile),
    priceUsd: num(pair?.priceUsd),
    change1h: num(pair?.priceChange?.h1),
    change24h: num(pair?.priceChange?.h24),
    volume24h: num(pair?.volume?.h24),
    liquidityUsd: liq,
    fdvUsd,
    marketCapUsd,
    txns24h: num(txh.buys) + num(txh.sells),
    poolCreatedAt: createdIso(pair?.pairCreatedAt),
    pairUrl: str(pair?.url) || `https://dexscreener.com/${chainId}/${pairAddress}`,
    geckoTerminalUrl: `https://www.geckoterminal.com/${network}/pools/${pairAddress}`,
    socials: socialsFromBoostAndPair(boost, pair, profile),
    description: desc,
  };
}

async function hydrateToken(chainId: string, address: string): Promise<any[]> {
  try {
    const a = await fetchJson(`${DS_BASE}/tokens/v1/${chainId}/${address}`);
    const pairs = unwrapPairs(a);
    if (pairs.length) return pairs;
  } catch {
    /* fall through */
  }
  try {
    const b = await fetchJson(`${DS_BASE}/latest/dex/tokens/${address}`);
    return unwrapPairs(b);
  } catch {
    return [];
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    const part = await Promise.all(chunk.map(fn));
    out.push(...part);
  }
  return out;
}

async function fetchBoostsFeed(chain: ChainQ): Promise<{ pairs: UnifiedPair[]; degraded: boolean }> {
  const [boostsJson, profilesJson] = await Promise.all([
    fetchJson(`${DS_BASE}/token-boosts/latest/v1`),
    fetchJson(`${DS_BASE}/token-profiles/latest/v1`).catch(() => []),
  ]);
  const boosts: any[] = Array.isArray(boostsJson) ? boostsJson : [];
  const profiles: any[] = Array.isArray(profilesJson) ? profilesJson : [];
  const profIdx = new Map<string, any>();
  for (const p of profiles) {
    const key = `${str(p.chainId).toLowerCase()}:${str(p.tokenAddress).toLowerCase()}`;
    if (key !== ":") profIdx.set(key, p);
  }
  const want = chain === "all" ? null : dsChain(chain);
  const filtered = boosts.filter((b) => {
    const net = gtNetFromDs(str(b.chainId));
    if (!net) return false;
    if (want && dsChain(net) !== want) return false;
    return true;
  });
  const uniq: any[] = [];
  const seen = new Set<string>();
  for (const b of filtered) {
    const key = `${str(b.chainId).toLowerCase()}:${str(b.tokenAddress).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(b);
    if (uniq.length >= BOOST_HYDRATE) break;
  }
  let failed = 0;
  const hydrated = await mapPool(uniq, 6, async (b) => {
    const chainId = str(b.chainId).toLowerCase();
    const address = str(b.tokenAddress);
    const pairs = await hydrateToken(chainId, address);
    const best = pickBestPair(pairs, chainId);
    if (!best) {
      failed += 1;
      return null;
    }
    const profile = profIdx.get(`${chainId}:${address.toLowerCase()}`);
    return normalizeDsPair(best, b, profile, "boosts");
  });
  const pairs = hydrated.filter((p): p is UnifiedPair => !!p);
  pairs.sort((a, b) => b.volume24h - a.volume24h);
  return { pairs, degraded: failed > 0 };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const feed = parseFeed(searchParams.get("feed"));
  const chain = parseChain(searchParams.get("chain"));
  const key = `${feed}:${chain}`;
  const hit = cacheGet(key);
  if (hit) return NextResponse.json(hit, { headers: jsonHeaders() });

  try {
    const result =
      feed === "boosts" ? await fetchBoostsFeed(chain) : await fetchGtFeed(feed, chain);
    const payload = {
      feed,
      chain,
      updatedAt: new Date().toISOString(),
      degraded: result.degraded,
      pairs: result.pairs,
    };
    cacheSet(key, payload);
    return NextResponse.json(payload, { headers: jsonHeaders() });
  } catch (e: any) {
    const stale = cacheGet(key, true);
    if (stale) {
      return NextResponse.json(
        { ...(stale as object), degraded: true, stale: true },
        { headers: jsonHeaders() }
      );
    }
    const status = e?.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: e?.message || "pairs upstream failed", feed, chain, pairs: [] },
      { status, headers: jsonHeaders() }
    );
  }
}
