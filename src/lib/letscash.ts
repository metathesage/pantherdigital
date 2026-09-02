import snapshot from "@/data/letscash.json";

/**
 * letscash.fun — the memecoin launchpad on Robinhood Chain.
 *
 * There is no published JSON API, so the route scrapes the server-rendered
 * board and falls back to a bundled snapshot (`src/data/letscash.json`) whenever
 * upstream is unreachable or the markup moves. The fallback is deliberate:
 * a blind scrape must never be able to render garbage, so anything that parses
 * to fewer than MIN_LIVE_TOKENS rows is discarded in favour of the snapshot.
 */

export const LETSCASH_ORIGIN = "https://www.letscash.fun";
export const MIN_LIVE_TOKENS = 5;

export type LetscashSocials = { x?: string; tg?: string; web?: string };

export type LetscashToken = {
  name: string;
  symbol: string;
  address: string;
  marketCapUsd: number;
  change24h: number;
  ageSeconds: number;
  taxPct: number | null;
  burnedPct: number | null;
  holders: number | null;
  volume24hUsd: number | null;
  volumeAllTimeUsd: number | null;
  range24hLow: number | null;
  range24hHigh: number | null;
  image: string;
  description: string;
  socials: LetscashSocials;
};

export type LetscashTapeItem = {
  symbol: string;
  side: "buy" | "sell";
  marketCapUsd: number;
  sizeUsd: number;
  secondsAgo: number;
  address: string;
  image: string;
};

export type LetscashRank = {
  key: string;
  label: string;
  thresholdEth: number;
  thresholdLabel: string;
  traders: number;
  sharePct: number;
};

export type LetscashChainStats = {
  coinsIssued: number;
  volumeUsd: number;
  volumeEth: number;
  cashcatBought: number;
  traders: number;
  boardPages: number;
};

export type LetscashTokenomics = {
  totalVolumeUsd: number;
  totalVolumeEth: number;
  totalFeesUsd: number;
  totalFeesEth: number;
  toCreatorsUsd: number;
  toCreatorsEth: number;
  selfBurnUsd: number;
  selfBurnEth: number;
  platformUsd: number;
  platformEth: number;
  feeTiers: number[];
  platformSharePct: number;
  creatorSharePct: number;
  quoteAssets: string[];
};

export type LetscashSnapshot = {
  capturedAt: string;
  source: string;
  sourceUrl: string;
  network: string;
  note: string;
  chain: LetscashChainStats;
  tokenomics: LetscashTokenomics;
  ranks: LetscashRank[];
  tokens: LetscashToken[];
  tape: LetscashTapeItem[];
};

export const snapshotData = snapshot as unknown as LetscashSnapshot;

export function tokenUrl(address: string): string {
  return `${LETSCASH_ORIGIN}/token/${address}`;
}

export function shortAddress(address: string): string {
  if (!address) return "—";
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

/** Human age label, matching the "8d ago" / "7h ago" style used on letscash.fun. */
export function ageLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatCompact(n: number | null | undefined): string {
  return formatUsd(n);
}

/**
 * Emergent score for a letscash coin (0–100).
 *
 * Reward: momentum, real turnover and supply destruction (self-burn).
 * Penalty: brand-new coins (no track record) and dead-fresh caps with no tape.
 * Deterministic per token so ranks don't jitter between refreshes.
 */
export function emergentScore(t: LetscashToken): number {
  const change = Number.isFinite(t.change24h) ? t.change24h : 0;
  const cap = t.marketCapUsd || 0;
  const ageDays = t.ageSeconds / 86400;

  // Momentum, capped so a +678% print can't pin everything to 100.
  const momentum = Math.max(-20, Math.min(26, change * 0.22));
  // A real cap means real liquidity. Log-scaled: $3.3K floor → ~0, $2M+ → ~14.
  const scale = cap > 0 ? Math.max(0, Math.min(14, Math.log10(cap / 1000) * 5)) : 0;
  // Self-burn is a verifiable on-chain commitment.
  const burn = Math.min(12, (t.burnedPct || 0) * 0.6);
  // Survivorship: coins past a week have outlived the rug window.
  const survival = Math.max(0, Math.min(14, ageDays * 0.7));
  // Tax drag — high tax bleeds traders.
  const tax = -Math.min(6, (t.taxPct || 0) * 0.6);

  const raw = 46 + momentum + scale + burn + survival + tax;
  return Math.max(8, Math.min(99, Math.round(raw)));
}

export function riskLabel(score: number, t: LetscashToken): "Low" | "Medium" | "High" | "Critical" {
  const ageDays = t.ageSeconds / 86400;
  if (ageDays < 1 || t.marketCapUsd < 5000) return "Critical";
  if (score < 50) return "High";
  if (score < 70) return "Medium";
  return "Low";
}

// ---------------------------------------------------------------------------
// Board sorts — mirror the sort control on letscash.fun itself.
// ---------------------------------------------------------------------------

export type SortKey = "trending" | "newest" | "mcap" | "burned" | "oldest";

export function sortTokens(tokens: LetscashToken[], sort: SortKey): LetscashToken[] {
  const copy = [...tokens];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => a.ageSeconds - b.ageSeconds);
    case "oldest":
      return copy.sort((a, b) => b.ageSeconds - a.ageSeconds);
    case "mcap":
      return copy.sort((a, b) => b.marketCapUsd - a.marketCapUsd);
    case "burned":
      return copy.sort((a, b) => (b.burnedPct || 0) - (a.burnedPct || 0));
    case "trending":
    default:
      return copy.sort((a, b) => emergentScore(b) - emergentScore(a));
  }
}

export function parseSort(raw: string | null): SortKey {
  const v = (raw || "trending").toLowerCase();
  if (v === "newest" || v === "mcap" || v === "burned" || v === "oldest" || v === "trending") return v;
  return "trending";
}

// ---------------------------------------------------------------------------
// Live scrape. Written defensively: any unexpected markup yields few/no rows,
// and the caller discards that in favour of the snapshot.
// ---------------------------------------------------------------------------

const ADDR_RE = /\/token\/(0x[a-fA-F0-9]{40})/g;

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "$2.17M" / "$26.5K" / "$118,278,311" → number. Returns 0 when unparseable. */
export function parseMoney(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = String(raw).replace(/[$,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)([KMBT])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[(m[2] || "").toLowerCase() as "k"] || 1;
  return n * mult;
}

/** "8d ago" / "7h ago" / "41m" / "3141s" → seconds. */
export function parseAgeSeconds(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = String(raw).trim().toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*([smhd])/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return Math.round(n * mult);
}

/**
 * Split the board into per-token blocks and pull the fields out of each.
 * Exported for tests.
 */
export function parseBoardHtml(html: string): LetscashToken[] {
  if (typeof html !== "string" || !html.length) return [];

  // Anchor on each token link; the block runs until the next token link.
  const anchors: { address: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  ADDR_RE.lastIndex = 0;
  while ((m = ADDR_RE.exec(html))) {
    anchors.push({ address: m[1], index: m.index });
    if (anchors.length > 400) break;
  }

  const out: LetscashToken[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < anchors.length; i += 1) {
    const { address, index } = anchors[i];
    if (seen.has(address.toLowerCase())) continue;
    const end = i + 1 < anchors.length ? anchors[i + 1].index : Math.min(html.length, index + 4000);
    const text = stripTags(html.slice(index, end));

    const name = text.match(/token\/0x[a-fA-F0-9]{40}\)?\s*([^\n]{0,80})/)?.[1]?.trim() || "";
    const mcapMatch = text.match(/\$\s?([\d.,]+\s?[KMBT]?)/i);
    const marketCapUsd = parseMoney(mcapMatch?.[1]);
    if (!marketCapUsd) continue;

    const changeMatch = text.match(/([+\-\u25b2\u25bc])\s?([\d.]+)\s?%/);
    let change24h = 0;
    if (changeMatch) {
      const sign = changeMatch[1] === "+" || changeMatch[1] === "\u25b2" ? 1 : -1;
      change24h = sign * (parseFloat(changeMatch[2]) || 0);
    }

    const ageMatch = text.match(/(\d+(?:\.\d+)?\s?[smhd])\s*ago/i) || text.match(/([\d.]+[smhd])\b/);
    const ageSeconds = parseAgeSeconds(ageMatch?.[1]);

    const taxMatch = text.match(/tax\s?(\d+(?:\.\d+)?)\s?%/i);
    const burnedMatch = text.match(/([\d.]+)\s?%\s*burned/i);

    const image =
      html.slice(index, end).match(/(https:\/\/[^\s"']*(?:ipfs|mypinata|\.png|\.jpg|\.webp)[^\s"']*)/i)?.[1] || "";

    const socials: LetscashSocials = {};
    const chunk = html.slice(index, end);
    const x = chunk.match(/href="(https:\/\/(?:x|twitter)\.com\/[^\s"]+)"/i)?.[1];
    const tg = chunk.match(/href="(https:\/\/t\.me\/[^\s"]+)"/i)?.[1];
    const web = chunk.match(/href="(https:\/\/(?!x\.com|twitter\.com|t\.me|letscash\.fun)[^\s"]+)"/i)?.[1];
    if (x) socials.x = x;
    if (tg) socials.tg = tg;
    if (web) socials.web = web;

    seen.add(address.toLowerCase());
    out.push({
      name: name || address,
      symbol: (text.match(/\b([A-Za-z][A-Za-z0-9]{1,11})\b(?=\s*\$)/)?.[1] || "???").toUpperCase(),
      address,
      marketCapUsd,
      change24h,
      ageSeconds,
      taxPct: taxMatch ? parseFloat(taxMatch[1]) : null,
      burnedPct: burnedMatch ? parseFloat(burnedMatch[1]) : null,
      holders: null,
      volume24hUsd: null,
      volumeAllTimeUsd: null,
      range24hLow: null,
      range24hHigh: null,
      image,
      description: "",
      socials,
    });
  }

  return out;
}

/** Chain-wide counters from the homepage ("9,806 coins issued", "$118.24M volume", …). */
export function parseChainStats(html: string): LetscashChainStats | null {
  if (typeof html !== "string" || !html.length) return null;
  const text = stripTags(html);
  const issued = text.match(/([\d,]+)\s*coins issued/i)?.[1];
  const volume = text.match(/\$([\d.,]+[KMBT]?)\s*volume/i)?.[1];
  const traders = text.match(/([\d,]+)\s*traders/i)?.[1];
  const cashcat = text.match(/([\d.,]+[KMB]?)\s*CASHCAT bought/i)?.[1];
  if (!issued && !volume) return null;
  return {
    coinsIssued: parseMoney(issued),
    volumeUsd: parseMoney(volume),
    volumeEth: 0,
    cashcatBought: parseMoney(cashcat),
    traders: parseMoney(traders),
    boardPages: snapshotData.chain.boardPages,
  };
}

export async function fetchLive(timeoutMs = 9000): Promise<{
  tokens: LetscashToken[];
  chain: LetscashChainStats | null;
}> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(LETSCASH_ORIGIN + "/", {
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "CoinPanther/1.0 (+https://github.com/metathesage/pantherdigital)",
        Accept: "text/html",
      },
    });
    if (!r.ok) throw new Error(`letscash ${r.status}`);
    const html = await r.text();
    return { tokens: parseBoardHtml(html), chain: parseChainStats(html) };
  } finally {
    clearTimeout(t);
  }
}
