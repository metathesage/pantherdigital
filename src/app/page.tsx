"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      {/* Black marble panther — your image */}
      <img
        src="/black-marble-panther.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-[0.92]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/80"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 42%, transparent 28%, rgba(0,0,0,0.58) 78%)",
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl animate-pulse" />
              <div className="relative grid size-20 place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur">
                <img src="/panther-icon.png" alt="" className="h-10 w-10 object-contain animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border border-white/20 animate-[spin_1.2s_linear_infinite]" style={{ borderTopColor: "transparent", borderRightColor: "transparent" }} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] tracking-[0.4em] text-white/60">PANTHER DIGITAL</span>
              <div className="h-px w-24 overflow-hidden rounded bg-white/10">
                <div className="h-full w-1/2 bg-white animate-[shimmer_0.9s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single huge CTA — nothing else */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] font-semibold tracking-[0.4em] text-white/55">PANTHER DIGITAL · EMERGENT MATRIX</p>
        <Link
          href="/app"
          className="group mt-6 inline-flex items-center justify-center rounded-[20px] bg-white px-10 py-7 text-[42px] font-black leading-none tracking-[-0.04em] text-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition hover:bg-zinc-100 hover:shadow-[0_24px_70px_rgba(0,0,0,0.6)] sm:px-14 sm:py-8 sm:text-[64px] md:text-[84px]"
          style={{ letterSpacing: "-0.05em" }}
        >
          <span className="relative">
            LAUNCH APP
            <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition group-hover:opacity-100" />
          </span>
          <span className="ml-4 inline-flex size-10 items-center justify-center rounded-full bg-black text-[18px] text-white transition group-hover:translate-x-1 sm:size-12 sm:text-[20px]">↗</span>
        </Link>
        <p className="mt-5 max-w-[520px] text-[12px] tracking-[0.18em] text-white/45">300+ COINS · REAL ON-CHAIN · NO NOISE</p>
      </div>

      <footer className="relative z-10 flex items-center justify-center pb-6 text-[10px] tracking-[0.2em] text-white/30">
        © PANTHERDIGITAL — NOT FINANCIAL ADVICE
      </footer>

      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(220%)}}`}</style>
    </main>
  );
}
