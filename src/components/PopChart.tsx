"use client";

import { RARITY_WEIGHTS } from "@/lib/deckRules";

// Reuse weights to estimate pop distribution — real PSA data requires scraping with keys.
// This gives an honest placeholder that looks like PSA's bar chart.

const GRADE_LABELS = ["Gem 10", "Mint 9", "NM 8", "EX 6", "Auth"] as const;

function estimatePop(rarity: string | null): number[] {
  const w = RARITY_WEIGHTS[rarity ?? "C"] ?? 1;
  // Higher rarity = fewer 10s, more variance. Base pop ~ inverse weight.
  const base = Math.max(120, Math.round(800 / (w + 0.5)));
  const g10 = Math.round(base * (rarity === "OSR" || rarity === "SEC" ? 0.18 : rarity === "SR" ? 0.28 : 0.35));
  const g9 = Math.round(base * 0.35);
  const g8 = Math.round(base * 0.2);
  const g6 = Math.round(base * 0.12);
  const auth = Math.round(base * 0.05);
  return [g10, g9, g8, g6, auth];
}

export default function PopChart({ rarity, cardNumber }: { rarity: string | null; cardNumber: string }) {
  const pops = estimatePop(rarity);
  const max = Math.max(...pops);
  const total = pops.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-sky-950/10 bg-white/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">PSA pop estimate</h3>
        <a
          href={`https://www.psacard.com/pop/search?q=${encodeURIComponent(cardNumber)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-holo-blue hover:underline"
        >
          View on PSA ↗
        </a>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Estimated from rarity weights for <span className="font-mono font-bold">{cardNumber}</span> — total ~{total.toLocaleString()} graded. Connect PSA scraping (requires partner key) for live pops.
      </p>
      <div className="mt-3 flex items-end gap-2">
        {pops.map((pop, i) => (
          <div key={GRADE_LABELS[i]} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-bold tabular-nums text-zinc-600">{pop}</span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-holo-blue to-holo-purple transition-all"
              style={{ height: `${(pop / max) * 56 + 8}px` }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">{GRADE_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expose weights for PopChart reuse — keep single source.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keep = RARITY_WEIGHTS;
