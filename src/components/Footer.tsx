import Link from "next/link";
import { ALL_PAGES, NAV_GROUPS } from "@/constants/pages";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#080C0B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/p_monogram_icon.png" alt="PNTHR DGTL" className="size-10 rounded-xl bg-black border border-white/10 object-contain" />
              <span className="text-[18px] font-black tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                PNTHR<span className="text-[#00FF88]">DGTL</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              Panther Digital — crypto discovery radar. Real prices, real volume, real signal. No mock data.
            </p>
            <div className="mt-5 flex gap-2">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-mono text-white/40">RADAR LIVE</span>
              <span className="rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 px-3 py-1 text-[11px] font-mono text-[#00FF88]">● PNTHR DGTL</span>
            </div>
          </div>

          {/* Page groups */}
          {NAV_GROUPS.map((g) => {
            const pages = ALL_PAGES.filter((p) => p.group === g);
            if (pages.length === 0) return null;
            return (
              <div key={g} className="md:col-span-2">
                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-white/30">{g}</h2>
                <ul className="mt-3 space-y-2">
                  {pages.map((p) => (
                    <li key={p.href}>
                      <Link href={p.href} className="text-sm text-white/60 hover:text-[#00FF88] transition-colors">
                        {p.label}
                      </Link>
                      <span className="block text-[11px] text-white/25 leading-tight">{p.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Panther Digital · Not financial advice. DYOR.
          </p>
          <div className="flex gap-2">
            <Link href="/about" className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/60 hover:bg-white hover:text-black transition-colors">About</Link>
            <Link href="/product" className="rounded-full bg-[#00FF88] px-4 py-1.5 text-xs font-black text-black hover:bg-[#B6FFBB] transition-colors">Product →</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
