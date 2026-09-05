import Link from "next/link";
import { BOSS, SQUAD } from "@/lib/waifus";

/* Mini-wiki: the waifu squad — who runs what. Links to full pages at /waifus/[id]. */

export default function WaifuWiki() {
  return (
    <div className="relative min-h-screen text-[#0A0A0A] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src="/home-bg.jpg" alt="" aria-hidden className="h-full w-full object-cover object-[center_30%] scale-[1.02]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.62)_0%,rgba(248,248,247,0.84)_36%,rgba(248,248,247,0.96)_68%,#F8F8F7_92%)]" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2.5 px-4 py-3 sm:px-6">
          <Link href="/" className="grid size-9 place-items-center overflow-hidden rounded-xl border border-[#0A0A0A]/10 bg-white p-0.5" title="Home">
            <img src="/panther-icon.png" alt="home" className="h-7 w-7 object-contain" />
          </Link>
          <Link href="/wiki" className="rounded-full border border-[#0A0A0A]/10 bg-white/80 px-3 py-1.5 text-[11px] font-bold tracking-widest hover:border-[#0A0A0A]">← WIKI</Link>
          <span className="rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white">WIKI · WAIFU SQUAD</span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[860px] px-4 pb-14 pt-8 sm:px-6">
        <p className="text-[11px] font-bold tracking-[0.28em] text-[#6B6B6B]">PANTHER DIGITAL · WIKI</p>
        <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] sm:text-[38px]">Waifu Squad</h1>
        <p className="mt-3 max-w-[620px] text-[13px] leading-6 text-[#4A4A4A]">
          Boss <Link href="/waifus/lucy" className="font-bold text-[#0A0A0A] underline">Lucy</Link> commands from Telegram;
          head worker <Link href="/waifus/rias" className="font-bold text-[#0A0A0A] underline">Rias</Link> runs day-to-day.
          Each waifu below owns one subsystem — tap through for the full dossier.
        </p>
        <div className="mt-6 space-y-3">
          {[{ id: BOSS.id, name: BOSS.name, title: BOSS.title, avatar: BOSS.avatar, accent: "#0A0A0A", role: "BOSS" }, ...SQUAD].map((w) => (
            <Link
              key={w.id}
              href={`/waifus/${w.id}`}
              className="flex items-center gap-4 rounded-[20px] border border-white/65 bg-white/75 p-4 backdrop-blur-2xl shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] transition-transform"
            >
              <img src={w.avatar} alt={w.name} className="size-14 shrink-0 rounded-2xl border border-white bg-white object-cover object-top" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-black">{w.name}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest text-white" style={{ background: w.accent }}>{w.role}</span>
                </div>
                <div className="truncate text-[12px] text-[#6B6B6B]">{w.title}</div>
              </div>
              <span className="text-[13px] font-bold text-[#9A9A9A]">→</span>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center text-[10px] tracking-[0.20em] text-[#9A9A9A]">© PANTHERDIGITAL — WIKI · WAIFU SQUAD</div>
      </main>
    </div>
  );
}
