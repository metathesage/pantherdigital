/**
 * PNHR DGTL paper-trading engine (admin-only).
 * Serverless-safe: state lives in-memory per instance. Good for $5–10 paper bankroll testing.
 * Prices: CoinGecko simple/price (server-side, uses COINGECKO_API_KEY if set).
 * Wallets: Coinbase + Phantom connect already exists client-side (app page) — bot records
 * the wallet address on each paper trade; no private keys ever touch the server.
 */

export type StrategyParams = {
  maxPositions: number;
  positionUsd: number; // paper size per trade, default 5
  takeProfitPct: number; // default 8
  stopLossPct: number; // default -6
  minScore: number; // emergentScore gate, default 70
};

export type PaperPosition = {
  id: string;
  coinId: string;
  symbol: string;
  side: "LONG";
  entry: number;
  sizeUsd: number;
  wallet: string; // coinbase | phantom | manual + address
  openedAt: string;
  status: "OPEN" | "CLOSED";
  exit?: number;
  pnlPct?: number;
  pnlUsd?: number;
  closedAt?: string;
  note?: string;
};

const DEFAULTS: StrategyParams = {
  maxPositions: 3,
  positionUsd: 5,
  takeProfitPct: 8,
  stopLossPct: -6,
  minScore: 70,
};

// module-scope = per-instance memory (documented limitation)
const store = {
  balance: 10, // paper bankroll $
  strategy: { ...DEFAULTS },
  positions: [] as PaperPosition[],
  history: [] as PaperPosition[],
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getState() {
  const open = store.positions.filter((p) => p.status === "OPEN");
  const realized = store.history.reduce((a, p) => a + (p.pnlUsd ?? 0), 0);
  return {
    balance: store.balance,
    strategy: store.strategy,
    open,
    openCount: open.length,
    realizedPnlUsd: Math.round(realized * 100) / 100,
    history: store.history.slice(-50).reverse(),
  };
}

export function setStrategy(patch: Partial<StrategyParams>): StrategyParams {
  store.strategy = { ...store.strategy, ...patch };
  return store.strategy;
}

export async function getPriceUsd(coinId: string): Promise<number> {
  const key = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers["x-cg-demo-api-key"] = key;
  const r = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`,
    { cache: "no-store", headers }
  );
  if (!r.ok) throw new Error(`price fetch ${r.status}`);
  const j = await r.json();
  const px = j?.[coinId]?.usd;
  if (typeof px !== "number") throw new Error("no price for " + coinId);
  return px;
}

export async function openPaper(params: {
  coinId: string;
  symbol: string;
  wallet: string;
  sizeUsd?: number;
  price?: number; // allow client-quoted price; else fetch server-side
}): Promise<PaperPosition> {
  const open = store.positions.filter((p) => p.status === "OPEN");
  if (open.length >= store.strategy.maxPositions)
    throw Object.assign(new Error("max positions reached"), { status: 409 });
  const size = params.sizeUsd ?? store.strategy.positionUsd;
  if (size > store.balance) throw Object.assign(new Error("insufficient paper balance"), { status: 400 });
  const entry = params.price ?? (await getPriceUsd(params.coinId));
  store.balance = Math.round((store.balance - size) * 100) / 100;
  const pos: PaperPosition = {
    id: uid(),
    coinId: params.coinId,
    symbol: params.symbol.toUpperCase(),
    side: "LONG",
    entry,
    sizeUsd: size,
    wallet: params.wallet,
    openedAt: new Date().toISOString(),
    status: "OPEN",
  };
  store.positions.push(pos);
  return pos;
}

export async function closePaper(id: string, price?: number): Promise<PaperPosition> {
  const pos = store.positions.find((p) => p.id === id && p.status === "OPEN");
  if (!pos) throw Object.assign(new Error("position not found"), { status: 404 });
  const exit = price ?? (await getPriceUsd(pos.coinId));
  const pnlPct = ((exit - pos.entry) / pos.entry) * 100;
  const pnlUsd = Math.round(((pos.sizeUsd * pnlPct) / 100) * 100) / 100;
  pos.status = "CLOSED";
  pos.exit = exit;
  pos.pnlPct = Math.round(pnlPct * 100) / 100;
  pos.pnlUsd = pnlUsd;
  pos.closedAt = new Date().toISOString();
  store.balance = Math.round((store.balance + pos.sizeUsd + pnlUsd) * 100) / 100;
  store.history.push(pos);
  return pos;
}

/** Auto-exit check: closes anything past TP/SL at current prices. Returns closed list. */
export async function sweepExits(): Promise<PaperPosition[]> {
  const closed: PaperPosition[] = [];
  for (const p of store.positions.filter((x) => x.status === "OPEN")) {
    try {
      const px = await getPriceUsd(p.coinId);
      const pct = ((px - p.entry) / p.entry) * 100;
      if (pct >= store.strategy.takeProfitPct || pct <= store.strategy.stopLossPct) {
        closed.push(await closePaper(p.id, px));
      }
    } catch {
      /* skip on price failure */
    }
  }
  return closed;
}
