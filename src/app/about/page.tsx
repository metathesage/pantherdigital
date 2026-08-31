import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wiki — CoinPanther",
  description:
    "The CoinPanther wiki: why we dominate the crypto discovery space, our design system, data sources, security model, and roadmap.",
};

const PALETTE = [
  { name: "Ink", hex: "#0A0A0A", use: "Primary text, buttons, borders" },
  { name: "Paper", hex: "#FFFFFF", use: "Primary background (start menu)" },
  { name: "Ash", hex: "#6B6B6B", use: "Secondary text / labels" },
  { name: "Mist", hex: "#E8E8E8", use: "Borders, dividers, muted fills" },
  { name: "Fog", hex: "#F8F8F7", use: "App canvas background" },
];

const SOURCES = [
  ["CoinGecko", "Live prices, images, market cap, volume, sparklines, tickers, official links — no API key required."],
  ["Dexscreener", "Trading pairs, liquidity, and contract-level price discovery (incl. Robinhood pair pages)."],
  ["Solana Mainnet RPC", "Keyless public RPC — balances, SPL token accounts, and full transaction history."],
  ["Etherscan V2", "Optional API key enriches ETH wallets with ERC-20 holdings + complete tx history."],
  ["CoinMarketCap", "Cross-reference links and market context."],
  ["RugCheck / GoPlus", "Honeypot + contract safety screening before any asset is listed."],
];

const ROADMAP = [
  ["Live", "Discovery radar", "300+ real coins, emergent scoring, honeypot screening, live terminal."],
  ["Live", "Wallet reader", "Read any ETH / SOL wallet — balances, holdings, on-chain activity. No mock data."],
  ["Live", "Start menu", "Futuristic launch experience with panther theming + official logo."],
  ["Live", "Ticker intelligence", "Gainers glow, surging coins flagged 🔥, real 24h movers surfaced."],
  ["Live", "Sort & filter", "Sort by emergent score, 24h/1h, volume, market cap, price, trend — plus category buckets."],
  ["Live", "Hunt & gems", "Gamified discovery streaks, gem drops, panther-themed profile + avatars."],
  ["Live", "Top 10 PnL", "Real 24h leaderboard linking out to gmgn.ai / fomo.app / phantom."],
  ["Next", "Watchlists & alerts", "Cross-device saved lists with price / trend alerts."],
  ["Next", "Multi-chain depth", "Sui, Base, and Robinhood surfaces with native pair data."],
  ["Next", "AI insights", "Per-coin narrative + risk summaries generated from live signals."],
  ["Planned", "Public API & embed", "CoinPanther data API + radar widget for builders."],
  ["Planned", "Mobile app", "Native iOS / Android companion to the radar."],
];

export default function WikiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/"><img src="/panther-icon.png" alt="CoinPanther" className="h-9 w-9 rounded object-contain" /></Link>
        <span className="text-[12px] font-semibold tracking-[0.3em] text-[#6B6B6B]">COINPANTHER · WIKI</span>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Why we dominate</h1>
      <p className="mt-4 leading-relaxed text-[#4A4A4A]">
        CoinPanther is a minimal, luxury discovery engine built on one principle: <strong>real data, no theater.</strong>{" "}
        Every price, image, wallet balance, and transaction is pulled live from primary sources. We never invent
        numbers to look impressive — if we can&apos;t verify it on-chain or from a market API, it doesn&apos;t appear.
        That discipline is what separates a discovery tool from a hype feed.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Design system</h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">A strict black &amp; white palette — high contrast, zero distraction.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PALETTE.map((p) => (
            <div key={p.name} className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
              <div className="h-16 w-full border-b border-[#E8E8E8]" style={{ background: p.hex }} />
              <div className="p-3">
                <div className="text-[14px] font-bold">{p.name}</div>
                <div className="font-mono text-[11px] text-[#9A9A9A]">{p.hex}</div>
                <div className="mt-1 text-[11px] text-[#6B6B6B]">{p.use}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#9A9A9A]">
          The homepage launches as a dark futuristic start menu (ink on paper, drifting grid, scanlines). The app
          canvas flips to Fog (#F8F8F7) for readability at scale. Accent color is intentionally absent — the panther
          is the only brand mark.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Data sources</h2>
        <dl className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/10 bg-white">
          {SOURCES.map(([name, detail]) => (
            <div key={name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
              <dt className="w-44 shrink-0 font-semibold text-[#0A0A0A]">{name}</dt>
              <dd className="text-sm leading-relaxed text-[#555]">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Security model</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#4A4A4A]">
          Every contract is screened for honeypots before listing — Solana via RugCheck, EVM via GoPlus. Native assets
          (BTC / ETH / SOL) are marked safe by default. Wallet connection is keyless through injected providers
          (MetaMask, Phantom, Coinbase Wallet) or optional Privy — we never custody funds and never see your keys.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Roadmap</h2>
        <ul className="mt-4 space-y-2.5">
          {ROADMAP.map(([status, item, detail]) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  status === "Live" ? "bg-[#0A0A0A] text-white" : status === "Next" ? "border border-[#0A0A0A] text-[#0A0A0A]" : "bg-[#F2F2F2] text-[#6B6B6B]"
                }`}
              >
                {status}
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-semibold">{item}</span>
                <span className="block text-[12px] text-[#6B6B6B]">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/app" className="rounded-xl bg-[#0A0A0A] px-6 py-3 text-sm font-bold text-white hover:bg-black">
          Enter the radar →
        </Link>
        <Link href="/portfolio" className="rounded-xl border border-[#0A0A0A] px-6 py-3 text-sm font-semibold hover:bg-[#F8F8F7]">
          Open wallet reader
        </Link>
      </div>

      <p className="mt-10 rounded-2xl bg-[#F8F8F7] p-5 text-xs leading-relaxed text-[#9A9A9A] ring-1 ring-black/5">
        CoinPanther is an informational tool. Nothing here is financial advice. Market data is provided by third
        parties and may be delayed or incomplete.
      </p>
    </div>
  );
}
