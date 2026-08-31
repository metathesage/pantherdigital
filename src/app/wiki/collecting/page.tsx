import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getDistinctRarities } from "@/lib/data";
import { rarityOrder } from "@/lib/meta";

export const metadata: Metadata = {
  title: "Collecting Guide",
  description:
    "How to collect the hololive OFFICIAL CARD GAME: rarities, product lines, market tools, grading, and card protection.",
};

const RARITY_NOTES: Record<string, string> = {
  C: "Common — the backbone of every deck.",
  U: "Uncommon — slightly stronger effects or better statlines.",
  R: "Rare — deck-defining pieces with unique abilities.",
  RR: "Double Rare — premium text boxes and strong holomem.",
  SR: "Super Rare — foil treatment, meta staples.",
  S: "Special — promotional-tier inserts in some products.",
  P: "Promo — distributed at events or with merchandise.",
  SY: "Signature-style special printing.",
  HR: "Holo Rare — full-art foils.",
  UR: "Ultra Rare — full-art with premium finishing.",
  SEC: "Secret Rare — very low pull rate, high collector demand.",
  OC: "Oshi Collector — premium Oshi-card parallel.",
  OSR: "Oshi Super Rare — the flagship Oshi cards collectors chase first.",
  OUR: "Oshi Ultra Rare — top of the Oshi hierarchy.",
};

export default function CollectingPage() {
  const rarities = [...getDistinctRarities()].sort(
    (a, b) => rarityOrder(a) - rarityOrder(b)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Collecting Guide
        </h1>
        <p className="mt-2 max-w-xl text-zinc-500">
          Everything you need to collect the hololive OFFICIAL CARD GAME
          smartly — from your first Start Deck to graded grails.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <section className="mt-10" aria-labelledby="products-heading">
          <h2 id="products-heading" className="text-xl font-bold tracking-tight">Product Lines</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">
            <li><strong className="text-zinc-800">Start Decks (hSD…)</strong> — ready-to-play 50-card decks built around one Oshi. The cheapest way to learn a color.</li>
            <li><strong className="text-zinc-800">Booster Packs (hBP…)</strong> — quarterly main sets (~250 cards each incl. parallels) where all high rarities live.</li>
            <li><strong className="text-zinc-800">Cheer Set (hYS01)</strong> — accessory bundle with support cards and supplies for live play.</li>
            <li><strong className="text-zinc-800">Entry Cups (ent…)</strong> — tournament kits that double as beginner products.</li>
            <li><strong className="text-zinc-800">Promos (hPR)</strong> — event/shop-distributed cards; often the hardest to track down later.</li>
          </ul>
          <p className="mt-3">
            <Link href="/releases" className="text-sm font-semibold text-holo-blue hover:underline">
              See every product with release dates →
            </Link>
          </p>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="mt-12" aria-labelledby="rarity-heading">
          <h2 id="rarity-heading" className="text-xl font-bold tracking-tight">Reading Rarity Symbols</h2>
          <dl className="mt-4 divide-y divide-sky-950/5 rounded-2xl border border-sky-950/10 bg-white/80 backdrop-blur">
            {rarities.map((rarity) => (
              <div key={rarity} className="flex gap-4 px-5 py-3">
                <dt className="w-14 shrink-0">
                  <span className="holo-chip inline-flex h-6 min-w-8 items-center justify-center rounded-md bg-gradient-to-r from-holo-purple/15 to-holo-pink/15 px-1.5 font-mono text-[11px] font-bold text-holo-purple ring-1 ring-holo-purple/25">
                    {rarity}
                  </span>
                </dt>
                <dd className="text-sm text-zinc-500">{RARITY_NOTES[rarity] ?? "Collector-oriented special printing."}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="mt-12" aria-labelledby="value-heading">
          <h2 id="value-heading" className="text-xl font-bold tracking-tight">Checking Market Value</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">
            <li><strong className="text-zinc-800">TCGPlayer</strong> — aggregated market prices per card and condition. Every card page here links straight to a pre-filled search.</li>
            <li><strong className="text-zinc-800">eBay Sold Listings</strong> — filter to “Sold items” for real transaction data instead of asking prices. This is what pros quote.</li>
            <li><strong className="text-zinc-800">PSA Pop Report</strong> — before buying graded, check how many copies exist at each grade; low pop + high demand = premium.</li>
            <li><strong className="text-zinc-800">Set codes matter</strong> — the same talent can appear in many sets; always match the full card number (e.g. hBP01-002 vs hBP06-011).</li>
          </ul>
        </section>
      </Reveal>

      <Reveal delay={120}>
        <section className="mt-12" aria-labelledby="protect-heading">
          <h2 id="protect-heading" className="text-xl font-bold tracking-tight">Protecting Your Cards</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">
            <li>Penny sleeve → toploader for anything you pull above Common.</li>
            <li>Foil cards curl with humidity — store flat, away from sunlight.</li>
            <li>Binders with side-loading pockets avoid ring-pressure creases.</li>
            <li>Never grade a card you haven’t checked under bright light for print lines or whitening on edges/corners.</li>
          </ul>
        </section>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-12" aria-labelledby="jp-en-heading">
          <h2 id="jp-en-heading" className="text-xl font-bold tracking-tight">JP vs EN Editions</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            The Japanese game launched in March 2025, roughly four months ahead
            of the English edition. JP cards hold nostalgic value and arrive
            earlier; EN cards are tournament-legal in western events. Card
            numbers mirror each other (JP hBP01-002 ≈ EN hBP01-002), so this
            database’s EN listings map cleanly when you browse Japanese
            product photos.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
