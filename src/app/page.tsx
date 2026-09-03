"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLoading(false);
      return;
    }
    const t = window.setTimeout(() => setLoading(false), 1100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="launch-root relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <h1 className="sr-only">PNHR DGTL{"\u2014"}Panther Digital crypto discovery radar</h1>

      <img
        src="/black-marble-panther.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover object-[center_35%] opacity-[0.94]"
      />
      <div aria-hidden="true" className="launch-veil pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="launch-vignette pointer-events-none fixed inset-0" />

      {loading && (
        <div
          className="launch-loader fixed inset-0 z-50 grid place-items-center bg-black"
          role="status"
          aria-live="polite"
          aria-label="Loading Panther Digital"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl" />
              <div className="relative grid size-[4.5rem] place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
                <img src="/panther-icon.png" alt="" className="h-10 w-10 object-contain" />
              </div>
              <div className="launch-loader-ring absolute inset-0 rounded-full border border-white/25" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-medium tracking-[0.42em] text-white/55">PANTHER DIGITAL</span>
              <div className="h-px w-28 overflow-hidden rounded bg-white/10">
                <div className="launch-loader-bar h-full w-1/2 bg-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="launch-eyebrow anim-fade-up">PANTHER DIGITAL</p>
        <p className="launch-kicker anim-fade-up anim-delay-1">EMERGENT MATRIX</p>
        <Link
          href="/app"
          className="launch-cta group anim-scale-in anim-delay-2"
        >
          <span className="launch-cta-label">LAUNCH APP</span>
          <span className="launch-cta-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-[18px] sm:size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
        <p className="launch-sub anim-fade-up anim-delay-3">
          300+ COINS
          <span className="launch-dot" aria-hidden="true">
            {"\u00B7"}
          </span>
          REAL ON-CHAIN
          <span className="launch-dot" aria-hidden="true">
            {"\u00B7"}
          </span>
          NO NOISE
        </p>
      </div>

      <footer className="launch-footer relative z-10 flex items-center justify-center pb-7">
        <span>{"\u00A9"} PANTHER DIGITAL</span>
        <span className="launch-dot" aria-hidden="true">
          {"\u00B7"}
        </span>
        <span>NOT FINANCIAL ADVICE</span>
      </footer>
    </main>
  );
}
