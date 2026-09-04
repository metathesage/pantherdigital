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
            Holo<span className="text-gradient">Hub</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
            A fast, fan-made database and visual index for the hololive
            OFFICIAL CARD GAME.
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
              <strong>Home</strong> — landing, latest releases & highlights
            </li>
            <li>
              <strong>Sets</strong> — card game expansions & packs
            </li>
            <li>
              <strong>Card Browser</strong> — search & browse every card
            </li>
            <li>
              <strong>Waifus</strong> — character gallery & stats
            </li>
            <li>
              <strong>Wiki</strong> — rules, talents, collecting guide
            </li>
            <li>
              <strong>Decks / Packs / Collection</strong> — play & track
            </li>
            <li>
              <strong>App</strong> — main dashboard entry point
            </li>
            <li>
              <strong>Bot Desk</strong> — bot utilities & tools
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Disclaimer
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Fan-made project for demonstration purposes. Not affiliated with
            or endorsed by Cover Corp or hololive production. Card data is
            placeholder sample content.
          </p>
          <p className="mt-4 text-[11px] text-zinc-400">
            PNHR DGTL — Panther Digital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
