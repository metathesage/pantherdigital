import Image from "next/image";
import Link from "next/link";
import GlowStars from "@/components/GlowStars";
import LiquidOrb from "@/components/LiquidOrb";

const FEATURES = [
  { tag: "01", title: "Live Markets", body: "Real CoinGecko prices, sparklines, and momentum for 300+ coins." },
  { tag: "02", title: "Radar Signals", body: "Emergent scoring, whale flow, and mindshare — beyond raw market cap." },
  { tag: "03", title: "Honeypot Screened", body: "Every contract checked via RugCheck + GoPlus before it lists." },
  { tag: "04", title: "Wallet X-Ray", body: "Deep ETH + SOL portfolio analysis: swaps, streaks, meme exposure." },
] as const;

export default function HomePage() {
  return (
    <main className="launch-root relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <h1 className="sr-only">CoinPanther — Panther Digital crypto discovery radar</h1>

      <LiquidOrb />
      <div aria-hidden="true" className="launch-veil pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="launch-vignette pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="launch-grid pointer-events-none fixed inset-0" />
      <GlowStars />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 anim-fade-in">
        <Link href="/" className="flex items-center gap-2.5" aria-label="CoinPanther home">
          <Image src="/panther-icon.png" alt="" width={30} height={30} className="object-contain" />
          <span className="text-[12px] font-bold tracking-[0.28em]">COINPANTHER</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 text-[11px] font-semibold tracking-[0.2em] text-white/55 sm:flex">
          <Link href="/app" className="transition hover:text-white">RADAR</Link>
          <Link href="/matrix" className="transition hover:text-white">MATRIX</Link>
          <Link href="/portfolio" className="transition hover:text-white">X-RAY</Link>
          <Link href="/about" className="transition hover:text-white">ABOUT</Link>
        </nav>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <p className="launch-eyebrow anim-fade-up">PANTHER DIGITAL</p>
        <p className="launch-kicker anim-fade-up anim-delay-1">EMERGENT MATRIX</p>

        <Link href="/app" className="launch-cta group anim-scale-in anim-delay-2">
          <span className="launch-cta-label">LAUNCH APP</span>
          <span className="launch-cta-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-[18px] sm:size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        <p className="launch-sub anim-fade-up anim-delay-3">
          300+ COINS<span className="launch-dot" aria-hidden="true">·</span>REAL ON-CHAIN<span className="launch-dot" aria-hidden="true">·</span>NO NOISE
        </p>
      </div>

      {/* Feature rail */}
      <section aria-label="What CoinPanther does" className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 anim-fade-up anim-delay-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.tag} className="launch-card group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/35">{f.tag}</span>
                <span className="h-1 w-1 rounded-full bg-white/30 transition group-hover:bg-white/80" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-[13px] font-bold tracking-wide text-white">{f.title}</h2>
              <p className="mt-1.5 text-[11.5px] leading-4.5 text-white/50">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="launch-footer relative z-10 flex flex-col items-center justify-center gap-1.5 pb-7">
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-white/40">
          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h7l9 9-5 5-9-9V5z"/><circle cx="8" cy="8" r="0.5" fill="currentColor"/></svg>
          POWERED BY THREE.JS · WEBGL
        </span>
        <span>© PANTHER DIGITAL <span className="launch-dot" aria-hidden="true">·</span> NOT FINANCIAL ADVICE</span>
      </footer>
    </main>
  );
}
