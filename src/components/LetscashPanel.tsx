"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Robinhood Chain panel — data + design lifted from letscash.fun.
 *
 * Three things that site gets right and this borrows:
 *   1. Chain-wide receipts up front (coins issued / volume / traders) — proof of life.
 *   2. "Where the fees went" — every fee tier followed to the end, nothing self-reported.
 *   3. A live trade tape, so the page is never a still image.
 */

export type LetscashRank = {
  key: string;
  label: string;
  thresholdEth: number;
  thresholdLabel: string;
  traders: number;
  sharePct: number;
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

export type LetscashChainStats = {
  coinsIssued: number;
  volumeUsd: number;
  volumeEth: number;
  cashcatBought: number;
  traders: number;
  boardPages: number;
};

export type LetscashTokenomics = {
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

export type LetscashPanelData = {
  live: boolean;
  capturedAt: string;
  sourceUrl: string;
  chain: LetscashChainStats;
  tokenomics: LetscashTokenomics;
  ranks: LetscashRank[];
  tape: LetscashTapeItem[];
};

export const LETSCASH_SORTS = [
  { key: "trending", label: "Trending" },
  { key: "newest", label: "Newest" },
  { key: "mcap", label: "Market cap" },
  { key: "burned", label: "Most burned" },
  { key: "oldest", label: "Oldest" },
] as const;
export type LetscashSort = (typeof LETSCASH_SORTS)[number]["key"];

function usd(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function int(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString();
}
function ago(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const RANK_ART: Record<string, { fg: string; ring: string }> = {
  copper: { fg: "#B87333", ring: "rgba(184,115,51,0.30)" },
  silver: { fg: "#9AA0A6", ring: "rgba(154,160,166,0.32)" },
  gold: { fg: "#C8A227", ring: "rgba(200,162,39,0.34)" },
  platinum: { fg: "#7FA8C9", ring: "rgba(127,168,201,0.34)" },
  diamond: { fg: "#5FD0D8", ring: "rgba(95,208,216,0.36)" },
  master: { fg: "#FF6B00", ring: "rgba(255,107,0,0.36)" },
  cashking: { fg: "#0A0A0A", ring: "rgba(10,10,10,0.30)" },
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 border-l border-[#E8E8E8] px-3 py-1 first:border-l-0 sm:px-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A]">{label}</div>
      <div className="mt-0.5 text-[17px] font-bold tabular-nums tracking-tight text-[#0A0A0A] sm:text-[19px]">{value}</div>
      {sub && <div className="text-[10px] leading-4 text-[#6B6B6B]">{sub}</div>}
    </div>
  );
}

export default function LetscashPanel({
  data,
  sort,
  onSort,
}: {
  data: LetscashPanelData;
  sort: LetscashSort;
  onSort: (s: LetscashSort) => void;
}) {
  // The tape should age in place so a snapshot doesn't look frozen.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const tape = useMemo(() => {
    return [...data.tape]
      .map((t) => ({ ...t, secondsAgo: t.secondsAgo + tick }))
      .sort((a, b) => a.secondsAgo - b.secondsAgo);
  }, [data.tape, tick]);

  const { tokenomics: tk } = data;
  const feeRows = [
    { label: "To creators", detail: `${tk.creatorSharePct}% of every trade, claimable by the fee-stream holder`, eth: tk.toCreatorsEth, usd: tk.toCreatorsUsd },
    { label: "Back into the coin", detail: "same share on self-burn launches — buys the coin and destroys it", eth: tk.selfBurnEth, usd: tk.selfBurnUsd },
    { label: "To the platform", detail: `${tk.platformSharePct}% of every trade`, eth: tk.platformEth, usd: tk.platformUsd },
  ];
  const maxFee = Math.max(...feeRows.map((r) => r.usd), 1);

  return (
    <section aria-label="Robinhood Chain" className="space-y-4">
      {/* header + receipts */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#E8E8E8] px-4 py-3">
          <img src="/assets/mapped/robinhood.png" alt="" className="size-6 rounded-full border border-[#E8E8E8] bg-white object-contain" />
          <h2 className="text-[15px] font-bold tracking-tight text-[#0A0A0A]">Robinhood Chain</h2>
          <span className="rounded-full bg-[#FF6B00]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">
            launchpad
          </span>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-full border border-[#E8E8E8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0A0A0A] transition hover:border-[#0A0A0A]"
          >
            letscash.fun ↗
          </a>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
            title={data.live ? "Scraped live from letscash.fun" : `Upstream unreachable — showing snapshot captured ${new Date(data.capturedAt).toUTCString()}`}
          >
            <span className={`size-1.5 rounded-full ${data.live ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className={data.live ? "text-emerald-600" : "text-amber-600"}>
              {data.live ? "live" : `snapshot ${new Date(data.capturedAt).toLocaleDateString()}`}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap py-2">
          <Stat label="coins issued" value={int(data.chain.coinsIssued)} sub={`${int(data.chain.boardPages)} board pages`} />
          <Stat label="volume" value={usd(data.chain.volumeUsd)} sub={data.chain.volumeEth ? `Ξ${data.chain.volumeEth.toLocaleString()}` : "all time"} />
          <Stat label="traders" value={int(data.chain.traders)} sub="distinct wallets" />
          <Stat label="CASHCAT bought" value={usd(data.chain.cashcatBought, 1)} sub="from platform fees" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* sort control */}
        <div className="card p-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-semibold uppercase tracking-widest text-[#6B6B6B]">Board sort</span>
            {LETSCASH_SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSort(s.key)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all ${
                    active
                      ? "bg-[#FF6B00] text-white shadow-[0_0_12px_rgba(255,107,0,0.4)]"
                      : "border border-[#E8E8E8] bg-white text-[#0A0A0A] hover:border-[#FF6B00] hover:bg-orange-50"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#6B6B6B]">
            Trending is our own emergent score — momentum, real cap, verified supply burn and survivorship.
            Every coin on Robinhood Chain is a fresh launch:{" "}
            <span className="font-semibold text-[#0A0A0A]">treat the whole feed as critical risk until you have read the contract.</span>
          </p>
        </div>

        {/* live tape */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E8E8E8] px-3 py-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FF6B00] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#FF6B00]" />
            </span>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#0A0A0A]">Trading now</h3>
            <span className="ml-auto text-[10px] text-[#9A9A9A]">every trade, as it lands</span>
          </div>
          <ul className="max-h-[248px] divide-y divide-[#F2F2F2] overflow-y-auto">
            {tape.slice(0, 14).map((t, i) => (
              <li key={`${t.symbol}-${t.address}-${i}`}>
                <a
                  href={`https://www.letscash.fun/token/${t.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-3 py-1.5 transition-colors hover:bg-[#F8F8F7]"
                >
                  <img src={t.image} alt="" className="size-6 shrink-0 rounded-full border border-[#E8E8E8] bg-white object-cover" />
                  <span className="w-[74px] shrink-0 truncate text-[12px] font-bold text-[#0A0A0A]">{t.symbol}</span>
                  <span
                    className={`w-[34px] shrink-0 rounded px-1 py-0.5 text-center text-[10px] font-bold ${
                      t.side === "buy" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {t.side}
                  </span>
                  <span className="flex-1 text-right text-[11px] tabular-nums text-[#6B6B6B]">{usd(t.marketCapUsd, 1)} cap</span>
                  <span className="w-[46px] shrink-0 text-right text-[11px] font-semibold tabular-nums text-[#0A0A0A]">{usd(t.sizeUsd, 0)}</span>
                  <span className="w-[30px] shrink-0 text-right text-[10px] tabular-nums text-[#9A9A9A]">{ago(t.secondsAgo)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* where the fees went */}
        <div className="card p-4">
          <h3 className="text-[13px] font-bold tracking-tight text-[#0A0A0A]">Where the fees went</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#6B6B6B]">
            Each coin picks {tk.feeTiers.join("%, ")}% at launch. Of every trade the platform keeps{" "}
            {tk.platformSharePct}%; the rest is followed to the end.
          </p>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">Total fees collected</span>
              <span className="text-[15px] font-bold tabular-nums text-[#0A0A0A]">
                {usd(tk.totalFeesUsd)} <span className="text-[11px] font-medium text-[#6B6B6B]">Ξ{tk.totalFeesEth.toLocaleString()}</span>
              </span>
            </div>
            {feeRows.map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12px] font-semibold text-[#0A0A0A]">{r.label}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#6B6B6B]">
                    {usd(r.usd)} · Ξ{r.eth.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F2F2F2]">
                  <div
                    className="h-1.5 rounded-full bg-[#0A0A0A] transition-all duration-500"
                    style={{ width: `${Math.max(2, (r.usd / maxFee) * 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-[#9A9A9A]">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* rank tiers */}
        <div className="card p-4">
          <h3 className="text-[13px] font-bold tracking-tight text-[#0A0A0A]">Trader ranks</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#6B6B6B]">
            Earned by lifetime traded volume, both sides, never reset — converted to ether so{" "}
            {tk.quoteAssets.join("/")} pools score the same.
          </p>
          <ul className="mt-3 space-y-1.5">
            {data.ranks.map((r) => {
              const art = RANK_ART[r.key] || { fg: "#0A0A0A", ring: "rgba(10,10,10,0.3)" };
              return (
                <li key={r.key} className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: art.fg, boxShadow: `0 0 0 3px ${art.ring}` }}
                  >
                    {r.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-bold capitalize leading-none text-[#0A0A0A]">{r.label}</span>
                    <span className="mt-0.5 block text-[11px] text-[#9A9A9A]">{r.thresholdLabel}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[13px] font-bold tabular-nums text-[#0A0A0A]">{int(r.traders)}</span>
                    <span className="block text-[10px] tabular-nums text-[#9A9A9A]">
                      {r.sharePct >= 0.1 ? `${r.sharePct}%` : "<0.1%"} of traders
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
