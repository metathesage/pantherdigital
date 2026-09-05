import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wiki — Emergent Matrix",
  description: "Emergent Matrix Wiki: command guide, matrix principles, Alina protocols, and the waifu command aesthetic.",
};

export default function WikiPage() {
  return (
    <div className="relative min-h-screen bg-[#F8F8F7] text-[#0A0A0A]">
      <div className="mx-auto max-w-[960px] px-6 py-20 sm:py-28">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-[#6B6B6B]">EMERGENT MATRIX · WIKI</p>
        <h1 className="mt-4 text-[42px] font-extrabold leading-[0.95] tracking-tight sm:text-[64px]">
          Command
          <br />Manual
        </h1>
        <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-[#4A4A4A]">
          The definitive guide to Emergent Matrix. Principles, protocols, and the aesthetic that keeps the command center clean, private, and lethal.
        </p>

        <section className="mt-20 space-y-12">
          {[
            {title:"01 · The Matrix", body:"A living grid. Drifting scanlines, marble vignette, and jungle accent #00C78A. No clutter. Every signal earns its place."},
            {title:"02 · Alina Protocol", body:"Alina is the operator. Naming is locked: Alina, never Alita. She curates surges, flags breaking trends, and keeps the radar silent until it matters."},
            {title:"03 · Radar Logic", body:"Emergent scoring blends change, volume, and risk. Honeypot screening runs before listing. Real CoinGecko + DexScreener data only."},
            {title:"04 · Design Doctrine", body:"Black & white luxury. Glass nav with focus-visible rings. Prefers-reduced-motion respected. Skip links and semantic landmarks for accessibility."},
            {title:"05 · Security Model", body:"No custody. Wallet reads via injected providers or optional Privy. Contracts screened via RugCheck / GoPlus. Privy ID guarded with graceful fallback."},
            {title:"06 · Command Flow", body:"Start Menu → Radar → Matrix → Vault. Each route is split for initial JS. SFX centralized via src/lib/sfx.ts. Nav deduplicated to SiteNav."},
          ].map(item=>(
            <article key={item.title} className="rounded-[24px] border border-[#E8E8E8] bg-white p-7 sm:p-9">
              <h2 className="text-[22px] font-extrabold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4A4A4A]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-24">
          <div className="rounded-[24px] border border-[#E8E8E8] bg-[#0A0A0A] p-8 text-white">
            <h3 className="text-[20px] font-bold">Ready to command?</h3>
            <p className="mt-2 text-[14px] text-white/70">Enter the radar, open the matrix, or return to the start menu.</p>
            <div className="mt-5 flex gap-3">
              <Link href="/app" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black">Radar</Link>
              <Link href="/matrix" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold">Matrix</Link>
              <Link href="/" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold">Start</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
