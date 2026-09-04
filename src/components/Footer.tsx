import Link from "next/link";
import { ALL_PAGES, NAV_GROUPS } from "@/constants/pages";

const GROUPS = NAV_GROUPS;

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-1">
          <p className="text-lg font-bold tracking-tight">
            PNTHR<span className="text-gradient">DGTL</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
            Crypto discovery radar powered by AI and on-chain data
          </p>
          <p className="mt-4 text-[11px] text-zinc-400 leading-relaxed">
            Curious where to start? Hover any nav link for a quick description,
            or scroll the full page list below.
          </p>
        </div>

        {/* All pages by group */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            All Pages
          </h2>
          {GROUPS.map((g: typeof NAV_GROUPS[number]) => {
            if (ALL_PAGES.filter((l) => l.group === g).length === 0) return null;
            return (
              <div key={g} className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {g}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {ALL_PAGES
                    .filter((l) => l.group === g)
                    .map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-zinc-600 hover:text-holo-blue">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Small nav hints */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Quick Guide
          </h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-500">
            <li>
              <strong>Home</strong> — AI-powered crypto radar with real-time data
            </li>
            <li>
              <strong>Sets</strong> — Token categories and classification
            </li>
            <li>
              <strong>Card Browser</strong> — Search and filter all cryptocurrencies
            </li>
            <li>
              <strong>Waifus</strong> — Panther Digital AI agent squad
            </li>
            <li>
              <strong>Wiki</strong> — Trading guides, DeFi explained, alpha strategies
            </li>
            <li>
              <strong>Decks / Packs / Collection</strong> — Portfolio tracking and analytics
            </li>
            <li>
              <strong>App</strong> — Main dashboard with AI analysis and alerts
            </li>
            <li>
              <strong>Bot Desk</strong> — Paper trading console and strategy tester
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Disclaimer
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Experimental project for educational purposes. Not financial advice.
            Crypto involves risk — DYOR and never invest more than you can afford to lose.
          </p>
          <p className="mt-4 text-[11px] text-zinc-400">
            PNTHR DGTL — Panther Digital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
