import type { TcgCard, TcgSet } from "@/types";

/**
 * Market & grading integrations.
 *
 * Deep links (searches pre-filled with the card's number/name) always work
 * without credentials. Live pricing requires API keys via env vars:
 *
 *   TCGPLAYER_PUBLIC_KEY / TCGPLAYER_PRIVATE_KEY  → TCGPlayer API (OAuth2)
 *   EBAY_CLIENT_ID / EBAY_CLIENT_SECRET           → eBay Browse API (OAuth2)
 *   PSA has no public API — pop reports are linked directly.
 */

export interface MarketLink {
  label: string;
  href: string;
  description: string;
}

function encodeURIComponentSafe(value: string): string {
  return encodeURIComponent(value);
}

export function tcgplayerSearchUrl(card: TcgCard): string {
  const query = `${card.cardNumber} ${card.name ?? ""}`.trim();
  return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponentSafe(
    query
  )}&productLineName=hololive-official-card-game`;
}

export function ebaySoldUrl(card: TcgCard): string {
  const query = card.cardNumber;
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponentSafe(
    query
  )}&LH_Sold=1&LH_Complete=1&_sacat=183454`;
}

export function ebayLiveUrl(card: TcgCard): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponentSafe(
    card.cardNumber
  )}&_sacat=183454&rt=nc`;
}

export function psaPopUrl(): string {
  return "https://www.psacard.com/pop";
}

export function psaCertUrl(): string {
  return "https://www.psacard.com/cert";
}

export function getMarketLinks(card: TcgCard): MarketLink[] {
  return [
    {
      label: "TCGPlayer",
      href: tcgplayerSearchUrl(card),
      description: "Market prices & listings",
    },
    {
      label: "eBay Sold",
      href: ebaySoldUrl(card),
      description: "Completed sales",
    },
    {
      label: "eBay Live",
      href: ebayLiveUrl(card),
      description: "Active listings",
    },
    {
      label: "PSA Pop",
      href: psaPopUrl(),
      description: "Population report",
    },
  ];
}

/** Set-level marketplace search. */
export function setEbayUrl(set: TcgSet): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponentSafe(
    `hololive ocg ${set.code}`
  )}`;
}

export function setTcgplayerUrl(set: TcgSet): string {
  return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponentSafe(
    `hololive ${set.code}`
  )}`;
}

/* --------------------------- Live market data ----------------------------- */

export interface MarketComp {
  source: "eBay" | "TCGPlayer";
  title: string;
  price: number;
  currency: string;
  url: string;
}

export interface MarketSnapshot {
  live: boolean;
  comps: MarketComp[];
  /** Median price across comps, when enough exist. */
  estimate?: number;
  currency?: string;
  note?: string;
}

interface CacheEntry {
  at: number;
  snapshot: MarketSnapshot;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** OAuth2 client-credentials token for eBay Browse API. */
async function ebayToken(): Promise<string> {
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  const res = await timedFetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:
      "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!res.ok) throw new Error(`eBay auth failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function fetchEbayComps(card: TcgCard): Promise<MarketComp[]> {
  const token = await ebayToken();
  const query = `"${card.cardNumber}"`;
  const url =
    `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponentSafe(query)}` +
    `&category_ids=183454&limit=8`;
  const res = await timedFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });
  if (!res.ok) throw new Error(`eBay search failed (${res.status})`);
  const body = (await res.json()) as {
    itemSummaries?: Array<{
      title?: string;
      itemWebUrl?: string;
      price?: { value?: string; currency?: string };
    }>;
  };
  return (body.itemSummaries ?? [])
    .map((item) => ({
      source: "eBay" as const,
      title: item.title ?? card.name ?? card.cardNumber,
      price: Number.parseFloat(item.price?.value ?? "0"),
      currency: item.price?.currency ?? "USD",
      url: item.itemWebUrl ?? ebayLiveUrl(card),
    }))
    .filter((comp) => Number.isFinite(comp.price) && comp.price > 0);
}

/** OAuth2 client-credentials token for TCGPlayer API. */
async function tcgplayerToken(): Promise<string> {
  const res = await timedFetch("https://api.tcgplayer.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.TCGPLAYER_PUBLIC_KEY ?? "",
      client_secret: process.env.TCGPLAYER_PRIVATE_KEY ?? "",
    }),
  });
  if (!res.ok) throw new Error(`TCGPlayer auth failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function fetchTcgplayerComps(card: TcgCard): Promise<MarketComp[]> {
  const token = await tcgplayerToken();
  const auth = { Authorization: `Bearer ${token}` };

  const searchRes = await timedFetch(
    `https://api.tcgplayer.com/catalog/products?productName=${encodeURIComponentSafe(
      `${card.cardNumber}`
    )}&limit=5`,
    { headers: auth }
  );
  if (!searchRes.ok) throw new Error(`TCGPlayer search failed (${searchRes.status})`);
  const products = ((await searchRes.json()) as { data?: Array<{ productId: number; name: string }> })
    .data ?? [];
  if (products.length === 0) return [];

  const ids = products.map((p) => p.productId).join(",");
  const pricingRes = await timedFetch(
    `https://api.tcgplayer.com/pricing/product/${ids}`,
    { headers: auth }
  );
  if (!pricingRes.ok) throw new Error(`TCGPlayer pricing failed (${pricingRes.status})`);
  const pricing = ((await pricingRes.json()) as {
    data?: Array<{
      productId: number;
      marketPrice?: number;
      productTypeName?: string;
    }>;
  }).data ?? [];

  return pricing
    .filter((p) => typeof p.marketPrice === "number" && p.marketPrice > 0)
    .map((p) => ({
      source: "TCGPlayer" as const,
      title:
        products.find((prod) => prod.productId === p.productId)?.name ??
        `${card.name ?? card.cardNumber}${p.productTypeName ? ` (${p.productTypeName})` : ""}`,
      price: p.marketPrice as number,
      currency: "USD",
      url: tcgplayerSearchUrl(card),
    }));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Aggregates live market comparables. Uses official APIs when credentials
 * are configured; otherwise returns the keyless deep-link mode so the UI can
 * point users straight to live searches. Never fabricates prices.
 */
export async function getMarketSnapshot(card: TcgCard): Promise<MarketSnapshot> {
  const cached = cache.get(card.id);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  const comps: MarketComp[] = [];
  const notes: string[] = [];

  if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
    try {
      comps.push(...(await fetchEbayComps(card)));
    } catch (error) {
      notes.push(`eBay unavailable (${(error as Error).message})`);
    }
  }

  if (
    process.env.TCGPLAYER_PUBLIC_KEY &&
    process.env.TCGPLAYER_PRIVATE_KEY &&
    comps.length < 3
  ) {
    try {
      comps.push(...(await fetchTcgplayerComps(card)));
    } catch (error) {
      notes.push(`TCGPlayer unavailable (${(error as Error).message})`);
    }
  }

  let snapshot: MarketSnapshot;
  if (comps.length > 0) {
    snapshot = {
      live: true,
      comps,
      estimate: comps.length >= 2 ? Number(median(comps.map((c) => c.price)).toFixed(2)) : undefined,
      currency: comps[0]?.currency ?? "USD",
    };
  } else {
    snapshot = {
      live: false,
      comps: [],
      note:
        notes.length > 0
          ? `Live pricing offline — ${notes.join("; ")}.`
          : "Live pricing is disabled. Add TCGPLAYER_* or EBAY_* API keys to enable embedded market data.",
    };
  }

  cache.set(card.id, { at: Date.now(), snapshot });
  return snapshot;
}
