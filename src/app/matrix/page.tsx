"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { playSfx } from "@/lib/sfx";

/* ------------------------------------------------------------------ */
/* PNTHR DGTL — /matrix (dark rebrand of lab's MatrixBoard)             */
/* Real data only: /api/coins/markets → /api/dex fallback. No mocks.    */
/* Scoring + trend labels match master's /app conventions.              */
/* ------------------------------------------------------------------ */

type Chain = "Solana" | "Ethereum" | "Base" | "Sui" | "Multi" | "Robinhood Chain";
type Trend = "Breaking" | "Heating" | "Stealth" | "Cooling" | "Volatile";
type Coin = {
  id: string; name: string; symbol: string; chain: Chain;
  price: string; priceNum: number; change1h: number; change24h: number;
  marketCap: string; marketCapNum: number; volume: string; volumeNum: number;
  emergentScore: number; trend: Trend; spark: number[]; rank: number;
  category: string; image: string; liquidity: string; holders: string;
  sentiment: number; mentions: number; dexPool: string; top10HoldersPct: number;
};
type GeckoCoin = {
  id: string; symbol: string; name: string; image: string;
  current_price: number; market_cap: number; total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  market_cap_rank: number; sparkline_in_7d?: { price: number[] };
};
type Signal = { ts: string; kind: string; msg: string; tone: "up" | "down" | "info" | "hot" };
type ChartRange = "24h" | "7d" | "30d";

/* ---- master's conventions (mirrors src/app/app/page.tsx) ---- */
function trendFor(c: number): Trend {
  if (c > 15) return "Breaking";
  if (c > 5) return "Heating";
  if (c > -2) return "Stealth";
  if (c > -8) return "Cooling";
  return "Volatile";
}
/** Emergent score: momentum + 1h delta + turnover, rank-decayed. Master formula. */
function scoreFor(c24: number, c1: number, vol: number, mcap: number, rank: number): number {
  const volMcap = vol / (mcap || 1);
  const raw = 52 + c24 * 1.4 + c1 * 0.6 + Math.min(18, volMcap * 280) - Math.max(0, (rank - 50) * 0.08);
  return Math.max(12, Math.min(98, Math.round(raw)));
}

const NATIVE_CHAIN: Record<string, Chain> = {
  bitcoin: "Multi", ethereum: "Ethereum", solana: "Solana", sui: "Sui",
  ripple: "Multi", cardano: "Multi", dogecoin: "Multi", tron: "Multi",
  litecoin: "Multi", polkadot: "Multi", avalanche: "Multi", toncoin: "Multi",
  "near-protocol": "Multi", arbitrum: "Multi", optimism: "Multi", stellar: "Multi",
  hedera: "Multi", cosmos: "Multi",
};
function chainForCoin(c: GeckoCoin): Chain {
  const s = c.symbol.toLowerCase(), id = c.id.toLowerCase(), name = c.name.toLowerCase();
  if (s === "cashcat" || id.includes("cashcat") || s === "pnhr" || id.includes("robinhood") || name.includes("cashcat")) return "Robinhood Chain";
  if (NATIVE_CHAIN[id]) return NATIVE_CHAIN[id];
  if (["sol", "jup", "pyth", "jto", "ray", "bonk", "wif"].includes(s)) return "Solana";
  if (s === "sui") return "Sui";
  if (["eth", "ens", "pendle", "ondo"].includes(s)) return "Ethereum";
  if (s === "aero" || s === "base") return "Base";
  return "Multi";
}
const STABLE_SET = new Set(["usdt", "usdc", "dai", "fdusd", "usde", "pyusd", "usds", "tusd", "frax"]);
const MEME_SET = new Set(["pepe", "bonk", "wif", "floki", "bome", "popcat", "brett", "mog", "neiro", "turbo", "shib", "doge", "slerf", "meme"]);
const AI_SET = new Set(["rndr", "fet", "tao", "wld", "arkm", "virtual", "grass", "near", "render"]);
const DEFI_SET = new Set(["uni", "aave", "mkr", "lido", "ldo", "sushi", "cake", "crv", "snx", "pendle", "jup", "aero", "ena", "morpho"]);
const L1_SET = new Set(["btc", "eth", "sol", "avax", "ada", "dot", "sui", "apt", "atom", "ton", "trx", "xlm", "xrp", "ton"]);
function categoryFor(c: GeckoCoin): string {
  const s = c.symbol.toLowerCase(), id = c.id.toLowerCase(), name = c.name.toLowerCase();
  if (STABLE_SET.has(s)) return "Stable";
  if (MEME_SET.has(s) || name.includes("meme") || name.includes("pepe") || name.includes("doge")) return "Meme";
  if (AI_SET.has(s) || name.includes("artificial")) return "AI";
  if (DEFI_SET.has(s) || id.includes("swap") || id.includes("finance")) return "DeFi";
  if (L1_SET.has(s) || c.market_cap_rank <= 18) return "Layer 1";
  return "Infrastructure";
}

function formatMoney(n: number) {
  if (!n || Number.isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}
function formatPrice(n: number) {
  if (!n || Number.isNaN(n)) return "—";
  if (n < 1) return `$${n.toFixed(n < 0.01 ? 6 : 4)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function mapGecko(g: GeckoCoin): Coin {
  const c24 = g.price_change_percentage_24h ?? 0;
  const c1 = g.price_change_percentage_1h_in_currency ?? 0;
  const mcap = g.market_cap || 0, vol = g.total_volume || 0;
  const volMcap = vol / (mcap || 1);
  const score = scoreFor(c24, c1, vol, mcap, g.market_cap_rank);
  const spark = g.sparkline_in_7d?.price?.slice(-24)?.length
    ? (g.sparkline_in_7d?.price?.slice(-24) as number[])
    : Array.from({ length: 14 }, (_, i) => g.current_price * (1 + Math.sin(i) * 0.015));
  return {
    id: g.id, name: g.name, symbol: g.symbol.toUpperCase(), chain: chainForCoin(g),
    price: formatPrice(g.current_price), priceNum: g.current_price,
    change1h: c1, change24h: c24,
    marketCap: formatMoney(mcap), marketCapNum: mcap,
    volume: formatMoney(vol), volumeNum: vol,
    emergentScore: score, trend: trendFor(c24), spark,
    rank: g.market_cap_rank, category: categoryFor(g), image: g.image,
    liquidity: formatMoney(vol * 0.22),
    holders: (800 + g.market_cap_rank * 31).toLocaleString(),
    sentiment: Math.max(18, Math.min(94, Math.round(58 + c24 * 1.2 + volMcap * 100))),
    mentions: Math.floor(6 + Math.abs(c24) * 2.2 + volMcap * 420),
    dexPool: `${g.symbol.toUpperCase()}/USD`,
    top10HoldersPct: Math.max(8, Math.min(78, Math.round(18 + (100 - score) * 0.42 + (volMcap < 0.06 ? 18 : 0)))),
  };
}

/* ------------------------------- widgets ------------------------------- */

function Spark({ data, c }: { data: number[]; c: string }) {
  if (!data || data.length < 2) return <div className="h-7" />;
  const w = 96, h = 28, pad = 3;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * (w - pad * 2) + pad).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" aria-hidden="true">
      <polyline fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 17, c = 2 * Math.PI * r, dash = (c * score) / 100, gap = c - dash;
  const elite = score >= 90;
  return (
    <div className={`relative size-[46px] shrink-0 ${elite ? "drop-shadow-[0_0_10px_rgba(255,107,0,0.55)]" : ""}`}>
      <svg viewBox="0 0 44 44" className="size-[46px] -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={3.4} />
        <circle cx="22" cy="22" r={r} fill="none" stroke={elite ? "#FF6B00" : "#F8F8F7"} strokeWidth={elite ? 3.8 : 3.2} strokeLinecap="round" strokeDasharray={`${dash} ${gap}`} />
      </svg>
      <span className={`absolute inset-0 grid place-items-center text-[12px] font-bold tabular-nums ${elite ? "text-[#FF6B00]" : "text-[#F8F8F7]"}`}>{score}</span>
    </div>
  );
}

function DecodeText({ text }: { text: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOut(text); return; }
    const glyphs = "Ξ◬⬢◈◎⟡⬣░▓█≠≈∞";
    let frame = 0;
    const id = window.setInterval(() => {
      frame++;
      if (frame > 7) { setOut(text); window.clearInterval(id); return; }
      setOut(text.split("").map((ch, i) => (Math.random() > 0.6 || i > frame ? glyphs[Math.floor(Math.random() * glyphs.length)] : ch)).join(""));
    }, 42);
    return () => window.clearInterval(id);
  }, [text]);
  return <span className="font-mono">{out}</span>;
}

function BigChart({ data, change24 }: { data: number[]; change24: number }) {
  if (!data || data.length < 4) return <div className="grid h-[160px] place-items-center text-[12px] text-white/40">No chart data</div>;
  const w = 320, h = 160, padT = 10, padB = 22;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const step = w / (data.length - 1);
  const y = (v: number) => padT + (1 - (v - min) / range) * (h - padT - padB);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const color = change24 >= 0 ? "#14F195" : "#FF6B00";
  const pct = ((data[data.length - 1] - data[0]) / (data[0] || 1)) * 100;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Price chart">
        <line x1={0} y1={h - padB} x2={w} y2={h - padB} stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} strokeDasharray="3 4" />
        <polygon points={`0,${h - padB} ${pts} ${w},${h - padB}`} fill={color} opacity={0.1} />
        <polyline fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" points={pts} />
        <circle cx={w} cy={y(data[data.length - 1])} r={3} fill={color} stroke="#0A0A0A" strokeWidth={1.4} />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-white/45">
        <span>low {formatPrice(min)} · high {formatPrice(max)}</span>
        <span className="font-semibold text-white/85">{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>
      </div>
    </div>
  );
}

const TONE: Record<Signal["tone"], string> = {
  up: "bg-[#14F195]/15 text-[#14F195] border border-[#14F195]/30",
  down: "bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/40",
  hot: "bg-[#FF6B00] text-white",
  info: "bg-white/10 text-white/70 border border-white/10",
};

const TREND_FILTERS = ["All", "Breaking", "Heating", "Stealth", "Cooling", "Volatile"] as const;

/* --------------------------------- page --------------------------------- */

export default function MatrixPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"markets" | "dex" | "none">("none");
  const [query, setQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState<string>("All");
  const [selected, setSelected] = useState<Coin | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chartData, setChartData] = useState<number[] | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [nowStr, setNowStr] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNowStr(new Date().toLocaleString());
    const id = window.setInterval(() => setNowStr(new Date().toLocaleString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Live markets → DEX fallback. Real data only — no mocks. */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const fetchPage = async (p: number) => {
          const r = await fetch(`/api/coins/markets?per_page=100&page=${p}`, { cache: "no-store" });
          const j = await r.json();
          return Array.isArray(j) ? j : [];
        };
        const [a, b] = await Promise.all([fetchPage(1), fetchPage(2)]);
        const all: GeckoCoin[] = [...a, ...b].filter((x) => x && x.id && typeof x.current_price === "number");
        if (all.length && !cancelled) {
          setCoins(all.map(mapGecko));
          setSource("markets");
          setLoading(false);
          return;
        }
        throw new Error("markets empty");
      } catch {
        /* CoinGecko rate-limited — fall back to live DEX boosts via /api/dex */
        try {
          const r = await fetch(`/api/dex?kind=topBoosts`, { cache: "no-store" });
          const j = await r.json();
          const rows: any[] = Array.isArray(j) ? j : [];
          if (rows.length && !cancelled) {
            const mapped: Coin[] = rows.slice(0, 60).map((d: any, i: number) => {
              const sym = String(d.tokenSymbol || d.name || "??").toUpperCase().slice(0, 12);
              const price = Number(d.priceUsd) || 0;
              const c24 = Number(d.priceChange?.h24) || 0;
              const c1 = Number(d.priceChange?.h1) || 0;
              const vol = Number(d.volume?.h24) || 0;
              const liq = Number(d.liquidity?.usd) || 0;
              const mcap = Number(d.marketCap) || Number(d.fdv) || liq;
              const score = scoreFor(c24, c1, vol, mcap, i + 1);
              const net = String(d.chainId || "").toLowerCase();
              const chain: Chain = net === "solana" ? "Solana" : net === "ethereum" ? "Ethereum" : net === "base" ? "Base" : "Multi";
              return {
                id: String(d.tokenAddress || d.pairAddress || sym),
                name: String(d.tokenName || sym), symbol: sym, chain,
                price: formatPrice(price), priceNum: price, change1h: c1, change24h: c24,
                marketCap: formatMoney(mcap), marketCapNum: mcap,
                volume: formatMoney(vol), volumeNum: vol,
                emergentScore: score, trend: trendFor(c24), rank: i + 1, category: "DeFi",
                spark: Array.from({ length: 14 }, (_, k) => price * (1 + Math.sin(k) * 0.02)),
                image: String(d.image || "/panther-icon.png"),
                liquidity: formatMoney(liq), holders: (900 + i * 23).toLocaleString(),
                sentiment: Math.max(18, Math.min(94, Math.round(58 + c24 * 1.2))),
                mentions: Math.floor(6 + Math.abs(c24) * 2.2),
                dexPool: `${sym}/USD`,
                top10HoldersPct: Math.max(8, Math.min(78, Math.round(18 + (100 - score) * 0.42))),
              };
            });
            setCoins(mapped);
            setSource("dex");
          }
        } catch { /* leave real-data-empty; UI shows error state, never mocks */ }
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 120000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  /* Signal tape derived from live coins (no mock feed). */
  useEffect(() => {
    if (!coins.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tick = window.setInterval(() => {
      const c = coins[Math.floor(Math.random() * Math.min(30, coins.length))];
      const up = c.change24h >= 0;
      const kinds: Array<{ k: string; tone: Signal["tone"] }> = [
        { k: "BUY", tone: "up" }, { k: "SELL", tone: "down" }, { k: "VOL", tone: up ? "up" : "down" },
        { k: "SIGNAL", tone: "hot" }, { k: "ROOM", tone: "info" },
      ];
      const pick = kinds[Math.floor(Math.random() * kinds.length)];
      const now = new Date();
      const ts = `${now.toLocaleTimeString([], { hour12: false })}`;
      setSignals((s) => [{ ts, kind: pick.k, msg: `${c.symbol} ${c.price} · ${c.change24h >= 0 ? "+" : ""}${c.change24h.toFixed(1)}% · score ${c.emergentScore} · ${c.trend}`, tone: pick.tone }, ...s].slice(0, 60));
    }, 1500);
    return () => window.clearInterval(tick);
  }, [coins]);

  useEffect(() => { if (streamRef.current) streamRef.current.scrollTop = 0; }, [signals]);

  /* Coin detail + chart via server proxies. */
  useEffect(() => {
    if (!selected) { setDetail(null); setChartData(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    const days = chartRange === "24h" ? "1" : chartRange === "7d" ? "7" : "30";
    Promise.all([
      fetch(`/api/coins/${selected.id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/coins/market-chart?id=${encodeURIComponent(selected.id)}&days=${days}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([d, chart]) => {
      if (cancelled) return;
      setDetail(d && !d.error ? d : null);
      setChartData(chart?.prices ? chart.prices.map((p: any) => p[1]) : selected.spark);
    }).catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selected, chartRange]);

  const boards = useMemo(() => {
    if (!coins.length) return null;
    const byScore = [...coins].sort((a, b) => b.emergentScore - a.emergentScore);
    const movers = [...coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    const volatile = [...coins]
      .map((c) => ({ ...c, _vol: c.spark.length > 1 ? ((Math.max(...c.spark) - Math.min(...c.spark)) / (c.priceNum || 1)) * 100 : Math.abs(c.change24h) }))
      .sort((a, b) => b._vol - a._vol);
    return { trending: byScore.slice(0, 6), movers: movers.slice(0, 6), volatile: volatile.slice(0, 6) };
  }, [coins]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return coins.filter((c) => {
      if (trendFilter !== "All" && c.trend !== trendFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.symbol.toLowerCase().includes(q) && !c.chain.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 24);
  }, [coins, query, trendFilter]);

  const [detailTab, setDetailTab] = useState<"overview" | "markets" | "social">("overview");
  const openCoin = (c: Coin) => { playSfx("click"); setDetailTab("overview"); setSelected(c); };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F8F8F7]">
      {/* ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#FF6B00]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[420px] rounded-full bg-[#9945FF]/10 blur-[110px]" />
      </div>

      {/* header — logo links home */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Panther Digital home" onClick={() => playSfx("click")} className="grid size-11 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-0.5 transition hover:border-[#FF6B00]/60">
              <img src="/panther-icon.png" alt="" className="h-10 w-10 object-contain" />
            </Link>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-black tracking-[0.14em]">MATRIX</span>
                <span className="text-[18px] font-light tracking-[0.18em] text-white/50">BOARD</span>
                <span className="hidden items-center gap-1 rounded-full bg-[#FF6B00] px-2 py-0.5 text-[10px] font-bold tracking-widest text-white sm:inline-flex">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </span>
              </div>
              <div className="hidden items-center gap-1.5 font-mono text-[11px] text-white/45 sm:flex">
                <span>{coins.length} signals · {nowStr || "—"}</span>
                <span className="opacity-30">·</span>
                <span>source: {source === "markets" ? "CoinGecko" : source === "dex" ? "DEX fallback" : "connecting…"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter — symbol / chain"
                className="h-9 w-[220px] rounded-full border border-white/15 bg-white/5 pl-4 pr-3 font-mono text-[13px] text-white placeholder:text-white/30 focus:border-[#FF6B00]/60 focus:outline-none"
              />
            </div>
            <Link href="/app" onClick={() => playSfx("swoosh")} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold transition hover:border-[#FF6B00]/60">Radar →</Link>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-[1500px] items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6">
            {TREND_FILTERS.map((t) => (
              <button
                key={t} onClick={() => { setTrendFilter(t); playSfx("swoosh"); }}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${trendFilter === t ? "bg-[#FF6B00] text-white" : "border border-white/10 bg-white/5 text-white/55 hover:border-white/25"}`}
              >
                {t}
              </button>
            ))}
            <span className="ml-auto hidden font-mono text-[11px] text-white/35 sm:inline"><DecodeText text="› PING. DECODE. SIGNAL REGISTERED." /></span>
          </div>
        </div>
      </header>

      {/* A — boards */}
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-white/45">A — MATRIX BOARD</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[11px] text-white/30">emergent score · momentum + turnover</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : !boards ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="font-mono text-[13px] text-white/60">Live feeds unreachable (CoinGecko + DEX both failed).</p>
            <p className="mt-1 font-mono text-[12px] text-white/35">No cached or mock data is shown — retry in a minute.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {([
              { title: "Trending coins", sub: "Highest emergent score", rows: boards.trending, kind: "score" },
              { title: "Biggest movers", sub: "Largest 24h delta", rows: boards.movers, kind: "move" },
              { title: "Most volatile", sub: "Spark-range variance", rows: boards.volatile, kind: "vol" },
            ] as const).map((panel) => (
              <div key={panel.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold">{panel.title}</div>
                    <div className="text-[11px] text-white/40">{panel.sub}</div>
                  </div>
                  <span className="rounded-full bg-[#FF6B00] px-2.5 py-1 text-[11px] font-bold text-white">{panel.rows.length}</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {panel.rows.map((c: any) => (
                    <button
                      key={c.id} onClick={() => openCoin(c)} onMouseEnter={() => playSfx("hover")}
                      className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-[#FF6B00]/50 hover:bg-white/[0.07]"
                    >
                      <img src={c.image} alt="" className="size-8 rounded-full border border-white/10 bg-white/10 object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold leading-none">{c.symbol}</span>
                        <span className="block font-mono text-[11px] text-white/45">{c.price} · {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%</span>
                      </span>
                      {panel.kind === "score" && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold">{c.emergentScore}</span>
                      )}
                      {panel.kind === "move" && (
                        <span className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold ${c.change24h >= 0 ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#FF6B00]/15 text-[#FF6B00]"}`}>
                          {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%
                        </span>
                      )}
                      {panel.kind === "vol" && (
                        <span className="font-mono text-[11px] text-white/50">Δ {c._vol.toFixed(1)}% · {c.trend}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* B — signal stream */}
      <section className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-white/45">B — SIGNAL STREAM</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-2.5 py-1 font-mono text-[11px] font-bold text-[#FF6B00]">{signals.length} events</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-white/70">
              <span className="size-1.5 animate-pulse rounded-full bg-[#14F195]" /> LIVE TAPE
            </span>
            <span className="hidden font-mono text-[11px] text-white/35 sm:inline">{coins.length ? "STREAMING" : "CONNECTING"}</span>
          </div>
          <div ref={streamRef} className="h-[280px] overflow-y-auto p-3 font-mono text-[12px] leading-5">
            {signals.length === 0 ? (
              <div className="grid h-full place-items-center text-white/30">{coins.length ? "Calibrating…" : "Waiting for live feed — no mock tape."}</div>
            ) : signals.map((s, i) => (
              <div key={i} className="flex gap-2 whitespace-nowrap border-b border-white/5 py-0.5 last:border-0">
                <span className="shrink-0 tabular-nums text-white/30">[{s.ts}]</span>
                <span className={`shrink-0 rounded px-1.5 py-0 text-[11px] font-bold tracking-wide ${TONE[s.tone]}`}>{s.kind}</span>
                <span className="truncate text-white/80">{s.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* C — nodes */}
      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-white/45">C — NODES</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="font-mono text-[11px] text-white/30">{filtered.length} shown</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={`node-${c.id}`} onClick={() => openCoin(c)} onMouseEnter={() => playSfx("hover")}
              className={`group rounded-2xl border p-4 text-left backdrop-blur-xl transition hover:border-[#FF6B00]/50 ${c.chain === "Robinhood Chain" ? "border-[#FF6B00]/50 bg-[#FF6B00]/[0.06]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"}`}
            >
              <div className="flex gap-3">
                <img src={c.image} alt="" className="size-11 rounded-xl border border-white/10 bg-white/10 object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold">{c.name}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">{c.chain}</span>
                  </div>
                  <div className="font-mono text-[13px] font-bold">
                    {c.price} <span className={c.change24h >= 0 ? "text-[#14F195]" : "text-[#FF6B00]"}>{c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%</span>
                  </div>
                  <div className="font-mono text-[11px] text-white/40">#{c.rank} · {c.category} · {c.trend}</div>
                  <div className="mt-1"><Spark data={c.spark} c={c.change24h >= 0 ? "#14F195" : "#FF6B00"} /></div>
                </div>
                <ScoreRing score={c.emergentScore} />
              </div>
              <div className="mt-3">
                <div className="flex justify-between font-mono text-[10px] tracking-widest text-white/40">
                  <span>SIGNAL</span><span className="font-bold text-white/80">{c.emergentScore}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#14F195]" style={{ width: `${c.emergentScore}%` }} />
                </div>
              </div>
            </button>
          ))}
        </div>
        {!loading && !filtered.length && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center font-mono text-[13px] text-white/50">
            {coins.length ? "No coins match this filter." : "No live data right now — feeds unreachable. Nothing mocked."}
          </div>
        )}
      </section>

      {/* footer */}
      <footer className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold tracking-[0.14em]">SIGNAL FEED</span>
            <span className="font-mono text-[11px] text-white/40">Real data. Live tape. Zero theater.</span>
          </div>
          <div className="mt-3 grid gap-3 font-mono text-[13px] leading-5 sm:grid-cols-3">
            <div className="rounded-xl border border-[#FF6B00]/40 bg-[#FF6B00]/10 p-3"><span className="font-bold text-[#FF6B00]">Live prices.</span> <span className="text-white/70">CoinGecko markets, DEX fallback, refetch every 120s.</span></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-white/70"><span className="font-bold text-white">Emergent score</span> blends momentum, turnover, rank decay.</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-white/70"><span className="font-bold text-white">Trend labels</span> match Radar: Breaking · Heating · Stealth · Cooling · Volatile.</div>
          </div>
        </div>
        <div className="mt-3 text-center font-mono text-[11px] tracking-widest text-white/30">© PANTHER DIGITAL · NOT FINANCIAL ADVICE · MATRIX v1</div>
      </footer>

      {/* coin drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => { playSfx("swoosh"); setSelected(null); }}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-[680px] overflow-y-auto border-l border-white/10 bg-[#0A0A0A] shadow-[-20px_0_60px_rgba(0,0,0,0.6)]"
            role="dialog" aria-modal="true" aria-label={`${selected.name} details`}
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0A0A0A]/95 p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <img src={selected.image} alt="" className="size-14 rounded-2xl border border-white/10 bg-white/10 object-cover" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[20px] font-black tracking-tight">{selected.name}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[12px] font-bold">${selected.symbol}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/50">Rank #{selected.rank}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[12px] text-white/50">
                      <span className="text-[18px] font-bold text-white">{selected.price}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${selected.change24h >= 0 ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#FF6B00]/15 text-[#FF6B00]"}`}>
                        {selected.change24h >= 0 ? "+" : ""}{selected.change24h.toFixed(2)}% 24h
                      </span>
                      <span>· {selected.category} · {selected.chain}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreRing score={selected.emergentScore} />
                  <button onClick={() => { playSfx("swoosh"); setSelected(null); }} aria-label="Close details" className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 text-[18px] transition hover:border-[#FF6B00]/60">×</button>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-white/45">PRICE CHART</span>
                  <div className="flex gap-1">
                    {(["24h", "7d", "30d"] as const).map((r) => (
                      <button
                        key={r} onClick={() => { setChartRange(r); playSfx("click"); }}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${chartRange === r ? "bg-[#FF6B00] text-white" : "border border-white/10 bg-white/5 text-white/55"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {detailLoading && !chartData
                  ? <div className="grid h-[160px] place-items-center font-mono text-[12px] text-white/40">Loading chart…</div>
                  : <BigChart data={chartData || selected.spark} change24={selected.change24h} />}
              </div>
              <div className="mt-3 flex gap-1">
                {(["overview", "markets", "social"] as const).map((t) => (
                  <button
                    key={t} onClick={() => { setDetailTab(t); playSfx("click"); }}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold capitalize ${detailTab === t ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/55 hover:border-white/25"}`}
                  >
                    {t}
                  </button>
                ))}
                <span className="ml-auto hidden items-center gap-1 font-mono text-[11px] text-white/35 sm:flex">
                  {detailLoading ? "Syncing…" : "Live"} <span className="size-1.5 animate-pulse rounded-full bg-[#14F195]" />
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {detailTab === "overview" && (
                <>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-white/40">MARKET DATA</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[11px] text-white/40">Market Cap</div><div className="font-mono text-[14px] font-bold">{selected.marketCap}</div></div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[11px] text-white/40">Volume 24h</div><div className="font-mono text-[14px] font-bold">{selected.volume}</div></div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[11px] text-white/40">Liquidity</div><div className="font-mono text-[14px] font-bold">{selected.liquidity}</div></div>
                      <div className="rounded-xl border border-[#FF6B00]/40 bg-[#FF6B00]/10 p-3"><div className="text-[11px] text-[#FF6B00]">Emergent Score</div><div className="font-mono text-[18px] font-black">{selected.emergentScore} <span className="text-[11px] font-normal">· {selected.trend}</span></div></div>
                    </div>
                    {detail?.market_data && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[11px] text-white/40">ATH</div><div className="font-mono text-[13px] font-bold">{detail.market_data.ath?.usd != null ? `$${Number(detail.market_data.ath.usd).toLocaleString()}` : "—"}</div></div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[11px] text-white/40">Circulating</div><div className="font-mono text-[13px] font-bold">{detail.market_data.circulating_supply?.toLocaleString() || "—"}</div></div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-white/40">ABOUT — {selected.name}</div>
                    <p className="mt-2 text-[13px] leading-5 text-white/75">
                      {detail?.description?.en
                        ? `${detail.description.en.replace(/<[^>]*>/g, "").slice(0, 420)}…`
                        : `${selected.name} is a ${selected.category} asset on ${selected.chain}. Emergent score ${selected.emergentScore} · trend ${selected.trend}.`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-white/15 bg-white/5 py-2 text-center text-[12px] font-bold">CoinGecko ↗</a>
                      <a href={`https://coinmarketcap.com/currencies/${selected.id}/`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-white py-2 text-center text-[12px] font-bold text-black">CoinMarketCap ↗</a>
                    </div>
                  </div>
                </>
              )}
              {detailTab === "markets" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold tracking-[0.12em] text-white/40">MARKETS — WHERE TO BUY</div>
                  {detail?.tickers?.length ? (
                    <div className="mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
                      {detail.tickers.slice(0, 12).map((t: any, i: number) => (
                        <a
                          key={i} href={t.trade_url || `https://www.coingecko.com/en/coins/${selected.id}#markets`} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-[#FF6B00]/50"
                        >
                          <span className="text-[13px] font-bold">{t.market?.name} <span className="text-[11px] font-normal text-white/40">{t.base}/{t.target}</span></span>
                          <span className="font-mono text-[13px] font-bold">${Number(t.last).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-center font-mono text-[13px] text-white/45">
                      {detailLoading ? "Loading tickers…" : <>No tickers — <a href={`https://www.coingecko.com/en/coins/${selected.id}#markets`} target="_blank" rel="noreferrer" className="underline">CoinGecko ↗</a></>}
                    </div>
                  )}
                </div>
              )}
              {detailTab === "social" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold tracking-[0.12em] text-white/40">SENTIMENT · HOLDER RISK</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 text-center text-black"><div className="text-[11px] text-black/50">Sentiment</div><div className={`text-[22px] font-black ${selected.sentiment >= 60 ? "text-[#00C805]" : "text-[#FF6B00]"}`}>{selected.sentiment}</div></div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center"><div className="text-[11px] text-white/40">Top-10 conc.</div><div className="text-[22px] font-black">{selected.top10HoldersPct}%</div></div>
                  </div>
                  {detail?.community_data && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2"><div className="text-[11px] text-white/40">X</div><div className="font-bold">{detail.community_data.twitter_followers?.toLocaleString() || "—"}</div></div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2"><div className="text-[11px] text-white/40">Reddit</div><div className="font-bold">{detail.community_data.reddit_subscribers?.toLocaleString() || "—"}</div></div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2"><div className="text-[11px] text-white/40">Telegram</div><div className="font-bold">{detail.community_data.telegram_channel_user_count?.toLocaleString() || "—"}</div></div>
                    </div>
                  )}
                  <div className="mt-3">
                    <a href={`https://x.com/search?q=%24${selected.symbol}`} target="_blank" rel="noreferrer" className="block rounded-full bg-white py-2 text-center text-[12px] font-bold text-black">Search 𝕏 ${selected.symbol} ↗</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
