"use client";
import Link from "next/link";

const MENU = [
  { label: "Launch App", href: "/app", primary: true, sub: "Enter the radar" },
  { label: "Portfolio", href: "/portfolio", sub: "Read any ETH / SOL wallet" },
  { label: "Wiki / About", href: "/about", sub: "Why we dominate" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-white text-[#0A0A0A]">
      {/* Marble panther background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url(/home-bg.jpg)" }}
      />
      {/* Light scrim for contrast on the bright marble */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/55" />
      {/* Drifting grid (light) */}
      <div aria-hidden className="menu-grid pointer-events-none absolute inset-0 opacity-70" />
      {/* Scanlines (light) */}
      <div aria-hidden className="menu-scanlines pointer-events-none absolute inset-0 opacity-60" />

      {/* Marble sculptures as faint decorative accents */}
      <img aria-hidden src="/assets/marble-bitcoin.png" alt="" className="pointer-events-none absolute -left-10 bottom-10 w-44 opacity-20 sm:w-56" />
      <img aria-hidden src="/assets/marble-solana.png" alt="" className="pointer-events-none absolute -right-10 top-16 w-40 opacity-20 sm:w-52" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-[#0A0A0A] bg-white/70">
              <img src="/panther-icon.png" alt="CoinPanther" className="h-7 w-7 rounded object-contain" />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.32em] text-[#0A0A0A]/70">COINPANTHER</span>
          </Link>
          <span className="menu-pulse flex items-center gap-2 text-[11px] font-semibold tracking-widest text-[#0A0A0A]/60">
            <span className="size-1.5 rounded-full bg-[#0A0A0A]" /> EMERGENT MATRIX · ONLINE
          </span>
        </header>

        {/* Center menu */}
        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="mb-6">
            <img src="/assets/logo-panther.png" alt="CoinPanther" className="h-24 w-auto object-contain drop-shadow-sm sm:h-28" />
          </div>

          <p className="mt-2 max-w-[460px] text-[13px] leading-6 tracking-wide text-[#2A2A2A]">
            The crypto discovery radar. Real prices, real wallets, real signals — no noise.
          </p>

          <nav className="mt-12 flex w-full max-w-[420px] flex-col gap-3">
            {MENU.map((m) =>
              m.primary ? (
                <Link
                  key={m.label}
                  href={m.href}
                  className="home-launch group relative flex items-center justify-center gap-3 rounded-xl px-8 py-5 text-[16px] font-bold uppercase tracking-[0.18em]"
                >
                  <img src="/assets/marble-arrow-flames.png" alt="" className="h-6 w-6 object-contain opacity-90" />
                  {m.label}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">▶</span>
                </Link>
              ) : (
                <Link
                  key={m.label}
                  href={m.href}
                  className="menu-link group flex items-center justify-between rounded-xl border border-[#0A0A0A] bg-white/70 px-6 py-4 text-left backdrop-blur-sm hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="menu-caret text-[#0A0A0A]/50">▸</span>
                    <span className="text-[15px] font-semibold tracking-[0.14em] uppercase text-[#0A0A0A]">{m.label}</span>
                  </span>
                  <span className="text-[11px] tracking-wide text-[#0A0A0A]/40">{m.sub}</span>
                </Link>
              )
            )}
          </nav>
        </section>

        {/* Feature strip */}
        <section className="mt-10 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "/assets/icon-analytics.png", t: "Live analytics", d: "300+ coins" },
            { icon: "/assets/icon-tracking-eye.png", t: "X-ray radar", d: "real signals" },
            { icon: "/assets/icon-wallet.png", t: "Wallet scan", d: "ETH / SOL" },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-[#0A0A0A] bg-white/70 px-3 py-4 backdrop-blur-sm">
              <img src={f.icon} alt="" className="mx-auto h-9 w-9 object-contain" />
              <div className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-[#0A0A0A]">{f.t}</div>
              <div className="text-[11px] tracking-wide text-[#0A0A0A]/45">{f.d}</div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between text-[10px] tracking-[0.2em] text-[#0A0A0A]/45">
          <span>v1.0 · MAINNET</span>
          <span>© COINPANTHER — NOT FINANCIAL ADVICE</span>
        </footer>
      </div>
    </main>
  );
}
