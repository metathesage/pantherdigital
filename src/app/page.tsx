"use client";
import Link from "next/link";
import PantherBackground from "@/components/PantherBackground";

const MENU = [
  { label: "Launch App", href: "/app", primary: true, sub: "Enter the radar" },
  { label: "Portfolio", href: "/portfolio", sub: "Read any ETH / SOL wallet" },
  { label: "Wiki / About", href: "/about", sub: "Why we dominate" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#050208] text-white">
      {/* PANTHER DIGITAL — meshy 8192 + 3D GLB background */}
      <PantherBackground />

      {/* subtle scanlines over panther */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]" style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 7px)" }} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-6 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-black/40 backdrop-blur">
              <img src="/panther-icon.png" alt="PantherDigital" className="h-7 w-7 rounded object-contain" />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.32em] text-white/80">PANTHERDIGITAL</span>
          </Link>
          <span className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-white/55">
            <img src="/assets/halloween/cryptohallow_sol_ghost_1024.png" alt="" className="size-5 rounded-full bg-white/10 object-cover animate-[pulse_2s_ease-in-out_infinite]"/> <span className="hidden sm:inline text-[#FF9A3D]">🦇 SPOOKY SEASON — HAUNTED MARKETS</span><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> PANTHER DIGITAL · ONLINE
          </span>
        </header>

        {/* Center menu */}
        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="mb-6 relative">
            <img src="/assets/logo-panther.png" alt="PantherDigital" className="h-24 w-auto object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.6)] sm:h-28" />
            <img src="/assets/halloween/cryptohallow_btc_pumpkin_1024.png" alt="" className="absolute -right-6 -top-2 size-10 rounded-full border-2 border-[#FF6B00] bg-white object-cover shadow-lg hidden sm:block"/>
          </div>

          <p className="mt-2 max-w-[480px] text-[13px] leading-6 tracking-wide text-white/70">
            The digital panther. Sculpted mesh, real-time 3D, on-chain signals — haunted edition. 🎃👻
          </p>

          <nav className="mt-12 flex w-full max-w-[420px] flex-col gap-3">
            {MENU.map((m) =>
              m.primary ? (
                <Link
                  key={m.label}
                  href={m.href}
                  className="group relative flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-5 text-[16px] font-bold uppercase tracking-[0.18em] text-black hover:bg-zinc-100"
                >
                  <img src="/assets/marble-arrow-flames.png" alt="" className="h-6 w-6 object-contain opacity-90" />
                  {m.label}
                  <span className="transition-transform duration-200 group-hover:translate-x-1">▶</span>
                </Link>
              ) : (
                <Link
                  key={m.label}
                  href={m.href}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-black/35 px-6 py-4 text-left backdrop-blur-md hover:bg-black/50 hover:border-white/15"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-white/40 opacity-0 transition group-hover:opacity-100">▸</span>
                    <span className="text-[15px] font-semibold tracking-[0.14em] uppercase text-white">{m.label}</span>
                  </span>
                  <span className="text-[11px] tracking-wide text-white/45">{m.sub}</span>
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
            <div key={f.t} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-4 backdrop-blur-md">
              <img src={f.icon} alt="" className="mx-auto h-9 w-9 object-contain opacity-90" />
              <div className="mt-2 text-[13px] font-semibold tracking-[0.06em] text-white">{f.t}</div>
              <div className="text-[11px] tracking-wide text-white/45">{f.d}</div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between text-[10px] tracking-[0.2em] text-white/35">
          <span>v1.0 · MAINNET</span>
          <span>© PANTHERDIGITAL — NOT FINANCIAL ADVICE</span>
        </footer>
      </div>
    </main>
  );
}
