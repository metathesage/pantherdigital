import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Emergent Matrix",
  description: "About Emergent Matrix: waifu command center with Alina. Design, data, security, and roadmap for the emergent intelligence matrix.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#F8F8F7] text-[#0A0A0A]">
      <div className="mx-auto max-w-[960px] px-6 py-20 sm:py-28">
        {/* Hero */}
        <section className="scroll-mt-24">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-[#6B6B6B]">EMERGENT MATRIX · COMMAND</p>
          <h1 className="mt-4 text-[42px] font-extrabold leading-[0.95] tracking-tight sm:text-[64px]">
            Waifu Command.
            <br />Emergent Intelligence.
          </h1>
          <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-[#4A4A4A]">
            Emergent Matrix is a private, luxury command center. Alina orchestrates the radar, the matrix board, and the vault.
            Real signals only. No theater. No noise.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/app" className="rounded-xl bg-[#0A0A0A] px-6 py-3 text-sm font-bold text-white hover:bg-black">Enter Radar</Link>
            <Link href="/matrix" className="rounded-xl border border-[#0A0A0A] px-6 py-3 text-sm font-semibold hover:bg-white">Open Matrix</Link>
          </div>
        </section>

        {/* Story */}
        <section className="mt-28 grid gap-8 sm:grid-cols-2">
          <div className="rounded-[24px] border border-[#E8E8E8] bg-white p-6">
            <h2 className="text-[20px] font-bold">The Principle</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#4A4A4A]">Real data, no invention. Every price, wallet balance, and transaction is pulled live from primary sources. If we can’t verify it on-chain or from a market API, it doesn’t appear.</p>
          </div>
          <div className="rounded-[24px] border border-[#E8E8E8] bg-white p-6">
            <h2 className="text-[20px] font-bold">Alina</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#4A4A4A]">Your waifu operator. Alina curates signals, flags surges, and keeps the matrix calm. Named Alina — never Alita — and always in command.</p>
          </div>
        </section>

        {/* Scroll breakdown */}
        <section className="mt-28">
          <h2 className="text-[28px] font-extrabold tracking-tight">Full Breakdown</h2>
          <div className="mt-8 space-y-4">
            {[
              {t:"Design System", d:"Black & white luxury. Ink #0A0A0A, Paper #FFFFFF, Ash #6B6B6B, Mist #E8E8E8, Fog #F8F8F7. Glass nav, focus-visible rings, reduced-motion safe."},
              {t:"SFX Centralized", d:"src/lib/sfx.ts → playSfx('click'|'pop'|'unlock'). Replaces inline WebAudio."},
              {t:"Nav Dedupe", d:"SiteNav is primary glass nav. NavBar removed. No duplicate renders."},
              {t:"Image Perf", d:"Next/Image with loading=lazy, decoding=async for verified waifu avatars."},
              {t:"Route Split", d:"/app page split to _components/ ScoreRing, Sparkline, MatrixField for smaller JS."},
              {t:"Accessibility", d:"Skip to content, focus-visible rings, prefers-reduced-motion guards for Three.js."},
              {t:"Brand Consistency", d:"Metadata → Emergent Matrix / waifu command. Alina naming enforced."},
              {t:"Reliability", d:"NEXT_PUBLIC_PRIVY_APP_ID guarded with graceful no-Privy UI."},
            ].map(item=>(
              <div key={item.t} className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
                <p className="font-bold">{item.t}</p>
                <p className="mt-1 text-[14px] text-[#4A4A4A]">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="mt-28">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-[#6B6B6B]">Emergent Matrix is an informational tool. Not financial advice. Data is provided by third parties and may be delayed.</p>
        </section>
      </div>
    </div>
  );
}
