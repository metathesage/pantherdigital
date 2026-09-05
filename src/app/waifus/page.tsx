"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePanther, ACHIEVEMENTS } from "@/lib/panther";
import { playSfx } from "@/lib/sfx";

/* =========================================================
   PANTHER WAIFU NAVI — /waifus
   Meta AI share inspo: marble jungle + glassmorphism
   Notes for future editors (leave in code as requested):
   - Boss is Lucy (avatar: /lucy-work.png — safe-for-work "work Lucy").
     She delegates to Rias (head worker, /rias-waifu.png) who replaced Akari/Navi.
   - 4 worker waifus displayed: Rias (head, UX/navi), Kuro (market), Hikari (ticker), Mio (auth).
     Lucy is shown separately as boss — not counted in the 4, but always visible.
   - Avatars: Lucy -> lucy-work.png, Rias -> rias-waifu.png, others -> emoji/initials
     (no extra image assets needed for Kuro/Hikari/Mio; keeps bundle small).
   - Cron jobs are hermes crons (local, gateway alive). IDs truncated for UI; full IDs
     live in server config. Schedules: market 30m, ticker 2h, nav/auth 6h.
   - Style: Meta AI share feel = centered single-column, stacked cards, glass over marble,
     minimal header, subtle blur, rounded-2xl/3xl, small mono caps. Not a dashboard grid.
   - Model: muse-spark-1.2-contributor-free via opencode-free (free tier) — shown in badges.
   - Background: /home-bg.jpg (marble jungle) + /black-marble-panther.jpg fallback veil.
     Glass uses bg-white/75 + backdrop-blur-xl + white border + soft shadow.
   - Keep safe for work: all avis are clothed/work variants. No private Lucy here
     (lucy-private.png exists in /public but not rendered on this page).
   - Build check: npx tsc --noEmit must pass — no any leaks, strict types.
   ========================================================= */

type Waifu = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  avatar?: string; // /public path if available
  accent: string; // top border / dot color
  job: string;
  schedule: string;
  file: string;
  goal: string;
  status: "active" | "idle" | "working";
  cronName: string;
  role: string; // short role label
  link?: string; // standalone deep-link (e.g. /bot) — rendered as a button
};

const BOSS = {
  name: "Lucy",
  title: "Boss Waifu · Panther Command",
  handle: "@sageglowsbot",
  avatar: "/lucy-work.png",
  avatarAlt: "Lucy — Boss Waifu (Lucy work variant)",
  model: "muse-spark-1.2-contributor-free",
  location: "Telegram · C:/emergent-matrix",
};

// Rias replaces Akari/Navi (UX Priestess) — head worker under Lucy
const WAIFUS: Waifu[] = [
  {
    id: "rias",
    name: "Rias",
    title: "Head Worker · UX Priestess",
    emoji: "🌸",
    avatar: "/rias-waifu.png",
    accent: "#FF5A7A",
    job: "panther-nav-ux",
    schedule: "every 6h",
    file: "src/app/app/page.tsx:402-430 + layout.tsx + waifus/page.tsx",
    goal: "Owns navigation & polish — logo always → /, header minimal (3 icons + Connect), marble ticker tidy, /waifus glass updates, mobile perfect. Reports to Lucy, delegates to trio.",
    status: "active",
    cronName: "00a627273861",
    role: "HEAD",
  },
  {
    id: "kuro",
    name: "Kuro",
    title: "Market Panther",
    emoji: "🐆",
    avatar: "/waifus/kuro.png",
    accent: "#0A0A0A",
    job: "panther-market",
    schedule: "every 30m",
    file: "src/app/api/coins/markets/route.ts + src/app/app/page.tsx:272-303",
    goal: "Keep CoinGecko live feed flawless — proxy via x-cg-demo-api-key, 429 backoff, 3 pages, emergentScore calc. Never hardcode keys.",
    status: "active",
    cronName: "1d4a12cf83bd",
    role: "MARKET",
  },
  {
    id: "hikari",
    name: "Hikari",
    title: "Surge Huntress",
    emoji: "⚡",
    avatar: "/waifus/hikari.png",
    accent: "#FF6B00",
    job: "panther-ticker-feed",
    schedule: "every 2h",
    file: "src/app/app/page.tsx:430-517",
    goal: "Owns ticker + feed — highlight gainers (green) & surging (Breaking or +8% → surge-glow, pulse, SURGING badge). Sort by Score (trophy) with orange 90+ glow.",
    status: "active",
    cronName: "f046435c05a7",
    role: "TICKER",
  },
  {
    id: "mio",
    name: "Mio",
    title: "Auth Guardian",
    emoji: "🔐",
    avatar: "/waifus/mio.png",
    accent: "#6B7280",
    job: "panther-auth",
    schedule: "every 6h",
    file: "src/components/PrivyProvider.tsx + page.tsx:399",
    goal: "No Privy warning on top — graceful fallback when NEXT_PUBLIC_PRIVY_APP_ID missing, Connect modal offers MetaMask/Phantom/Coinbase + Privy equally, never hang on Initializing...",
    status: "active",
    cronName: "79d57a7e9bb9",
    role: "AUTH",
  },
  {
    id: "sable",
    name: "Sable",
    title: "Paper Trader · Bot Desk",
    emoji: "📈",
    avatar: "/waifus/sable.png",
    accent: "#FF6B00",
    job: "panther-paper-bot",
    schedule: "on demand",
    file: "src/lib/bot.ts + src/app/api/bot/* + src/app/bot/page.tsx",
    goal: "Runs the paper-trading desk — $10 bankroll, $5 longs, +8% TP / −6% SL auto-sweep. Admin-only API, Coinbase + Phantom addresses, no real funds. Console lives at /bot.",
    status: "active",
    cronName: "paper-only",
    role: "TRADER",
    link: "/bot",
  },
];

export default function WaifuCommand() {
  const [now, setNow] = useState<string>("");
  const achievements = usePanther((s) => s.achievements);
  const gems = usePanther((s) => s.gems);
  const level = usePanther((s) => s.level);
  useEffect(() => {
    const fmt = () => new Date().toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, month: "short", day: "2-digit" });
    const id = setInterval(() => setNow(fmt()), 1000);
    setNow(fmt());
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen text-[#0A0A0A] overflow-x-hidden">
      {/* ---------- marble jungle backdrop ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src="/home-bg.jpg" alt="" aria-hidden className="h-full w-full object-cover object-[center_30%] scale-[1.02]" />
        {/* veil for readability — keeps marble visible but softens */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.62)_0%,rgba(248,248,247,0.84)_36%,rgba(248,248,247,0.96)_68%,#F8F8F7_92%)]" />
        {/* jungle tint — very subtle emerald */}
        <div className="absolute inset-0 opacity-[0.10]" style={{ background: "radial-gradient(1200px 600px at 18% 8%, rgba(16,122,78,0.22) 0%, transparent 58%), radial-gradient(900px 500px at 86% 18%, rgba(255,107,0,0.10) 0%, transparent 60%), radial-gradient(800px 480px at 50% 92%, rgba(10,10,10,0.06) 0%, transparent 70%)" }} />
        {/* grain */}
        <div className="absolute inset-0 opacity-[0.035] mix-blend-multiply" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ---------- glass header — Meta share style ---------- */}
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="grid size-9 place-items-center overflow-hidden rounded-xl border border-[#0A0A0A]/10 bg-white p-0.5 shadow-sm hover:border-[#0A0A0A]/20" title="Home">
              <img src="/panther-icon.png" alt="home" className="h-7 w-7 object-contain" />
            </Link>
            <Link href="/app" className="hidden sm:inline-flex rounded-full border border-[#0A0A0A]/10 bg-white/80 px-3 py-1.5 text-[11px] font-bold tracking-widest backdrop-blur hover:border-[#0A0A0A] sm:text-[11px]">← APP</Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" /> BOSS WAIFU · LUCY
            </span>
            <span className="hidden lg:inline text-[11px] tabular-nums text-[#6B6B6B]">{now} · 5 waifus · muse-spark</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#6B6B6B] backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> gateway alive
            </span>
            <Link href="/app" className="rounded-full bg-[#0A0A0A] px-4 py-2 text-[12px] font-bold text-white shadow-[0_6px_22px_rgba(0,0,0,0.14)] hover:bg-black">Launch App ↗</Link>
          </div>
        </div>
      </header>

      {/* ---------- centered Meta-share container ---------- */}
      <main id="main" className="mx-auto max-w-[1120px] px-4 pb-14 pt-6 sm:px-6 sm:pt-8">
        {/* share meta bar — like Meta AI "Shared conversation" */}
        <div className="mx-auto max-w-[860px]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/65 px-4 py-3 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#0A0A0A] text-[12px] font-bold text-white">◐</span>
              <div className="leading-tight">
                <div className="text-[12px] font-bold tracking-wide">Shared command · panther waifu squad</div>
                <div className="text-[11px] text-[#6B6B6B]">emer gent-matrix /waifus · public · marble jungle · glass</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 font-semibold text-[#6B6B6B] backdrop-blur">Model: muse-spark-1.2</span>
              <span className="hidden sm:inline rounded-full bg-[#0A0A0A] px-2.5 py-1 font-bold tracking-widest text-white">SHARED</span>
            </div>
          </div>
        </div>

        {/* hero — title + boss delegation */}
        <div className="mx-auto mt-6 max-w-[860px]">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.28em] text-[#6B6B6B]">PANTHER DIGITAL · EMERGENT MATRIX</p>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] sm:text-[38px] leading-[0.95]">
              WAIFU <span className="font-light text-[#6B6B6B]">NAVI</span> <span className="align-super text-[14px] font-bold tracking-[0.18em] text-[#9A9A9A]">/WAIFUS</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-5 text-[#6B6B6B]">
              Boss <span className="font-bold text-[#0A0A0A]">Lucy</span> delegates to head worker <span className="font-bold text-[#0A0A0A]">Rias</span>. Together they command <span className="font-semibold text-[#0A0A0A]">Kuro</span> · <span className="font-semibold text-[#0A0A0A]">Hikari</span> · <span className="font-semibold text-[#0A0A0A]">Mio</span> — each with a cron, a file, and a goal. Feels like a Meta AI share, but it&apos;s our site data.
            </p>
            {/* marble rule */}
            <div className="mx-auto mt-5 h-px w-full max-w-[520px] bg-gradient-to-r from-transparent via-[#0A0A0A]/15 to-transparent" />
          </div>

          {/* BOSS DELEGATION — glass card */}
          <div className="mt-6 overflow-hidden rounded-[28px] border border-white/60 bg-white/72 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.75)]">
            {/* top marble strip */}
            <div className="h-[86px] w-full relative overflow-hidden">
              <img src="/home-bg.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-80" />
              <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/40" />
              <div className="absolute bottom-0 h-px w-full bg-white/60" />
              <div className="absolute left-4 top-3 flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-bold tracking-widest backdrop-blur">
                <span className="size-1.5 rounded-full bg-emerald-500" /> COMMAND CHAIN
              </div>
              <div className="absolute right-4 top-3 hidden sm:flex items-center gap-2 rounded-full bg-[#0A0A0A] px-3 py-1 text-[11px] font-bold tracking-widest text-white">
                FREE MODEL ♡ · {BOSS.model}
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:grid-cols-[1.15fr_auto_1.15fr] sm:items-center sm:p-6">
              {/* Lucy */}
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-[#0A0A0A]/10 via-white/60 to-emerald-500/10 blur-[6px]" aria-hidden />
                  <img src={BOSS.avatar} alt={BOSS.avatarAlt} className="relative size-[92px] rounded-[20px] border border-white/70 bg-white object-cover object-top shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:size-[104px]" />
                  <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-white bg-[#0A0A0A] text-[11px] font-bold text-white shadow">♡</span>
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white">BOSS</div>
                  <div className="mt-1.5 text-[18px] font-black leading-none tracking-[-0.02em]">{BOSS.name} <span className="text-[12px] font-semibold tracking-widest text-[#6B6B6B]">· LUCY WORK</span></div>
                  <div className="text-[11px] font-mono text-[#6B6B6B]">{BOSS.title}</div>
                  <div className="mt-2 rounded-xl border border-[#E8E8E8]/70 bg-white/70 px-3 py-2 text-[12px] leading-5 backdrop-blur">
                    You talk to her on Telegram <span className="font-mono font-bold">{BOSS.handle}</span>. She reviews, merges, and delegates. Uses the best free model for each task — currently <span className="font-mono text-[#0A0A0A] font-bold">muse-spark</span>.
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full border border-[#E8E8E8] bg-white/80 px-2.5 py-1 font-semibold backdrop-blur">C:/emergent-matrix</span>
                    <span className="rounded-full bg-[#F8F8F7] px-2.5 py-1 font-mono text-[#6B6B6B]">hermes cron list</span>
                  </div>
                </div>
              </div>

              {/* arrow */}
              <div className="hidden sm:grid place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#0A0A0A]/20 to-transparent" aria-hidden />
                  <div className="grid size-10 place-items-center rounded-full border border-[#0A0A0A]/10 bg-white shadow-sm">
                    <span className="text-[14px]">→</span>
                  </div>
                  <div className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold tracking-widest text-white">DELEGATES</div>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-[#0A0A0A]/20 to-transparent" aria-hidden />
                </div>
              </div>
              <div className="sm:hidden flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-[#6B6B6B]">
                <span className="h-px flex-1 bg-[#E8E8E8]" /> ↓ delegates ↓ <span className="h-px flex-1 bg-[#E8E8E8]" />
              </div>

              {/* Rias */}
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-[#FF5A7A]/15 via-white/60 to-[#FF6B00]/10 blur-[6px]" aria-hidden />
                  <img src="/rias-waifu.png" alt="Rias — Head Worker (replaces Akari)" className="relative size-[92px] rounded-[20px] border border-white/70 bg-white object-cover object-top shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:size-[104px]" />
                  <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-white bg-[#FF5A7A] text-[10px] font-bold text-white shadow">HEAD</span>
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5A7A] bg-[#FF5A7A] px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white">HEAD WORKER</div>
                  <div className="mt-1.5 text-[18px] font-black leading-none tracking-[-0.02em]">Rias <span className="text-[11px] font-semibold tracking-widest text-[#9A9A9A]">replaces Akari</span></div>
                  <div className="text-[11px] font-mono text-[#6B6B6B]">panther-nav-ux · every 6h</div>
                  <div className="mt-2 rounded-xl bg-[#0A0A0A] px-3 py-2 text-[12px] leading-5 text-white">
                    Runs the squad day-to-day. Keeps navi, ticker polish, and this command page true. Pings Lucy when a cron drifts.
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-[#6B6B6B]">cron 00a627 · free model ♡</div>
                </div>
              </div>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-3 divide-x divide-[#E8E8E8]/60 border-t border-white/60 bg-white/55 backdrop-blur text-center text-[11px] sm:text-[12px]">
              <div className="px-4 py-3"><span className="font-black">5</span> <span className="text-[#6B6B6B]">waifus active</span></div>
              <div className="px-4 py-3"><span className="font-black">4</span> <span className="text-[#6B6B6B]">crons · gateway alive</span></div>
              <div className="px-4 py-3"><span className="hidden sm:inline text-[#6B6B6B]">continuity </span><span className="font-bold text-emerald-600">ON</span><span className="text-[#6B6B6B]"> · logs local</span></div>
            </div>
          </div>
        </div>

        {/* waifu grid — 2x2 glass */}
        <div className="mx-auto mt-6 grid max-w-[860px] grid-cols-1 gap-4 sm:grid-cols-2">
          {WAIFUS.map((w) => (
            <article
              key={w.id}
              className="group relative flex flex-col overflow-hidden rounded-[24px] border border-white/65 bg-white/74 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.8)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
            >
              {/* accent top + marble hint */}
              <div className="relative h-1.5 w-full overflow-hidden" style={{ background: w.accent }}>
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('/home-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: "overlay" }} />
              </div>

              <div className="p-5">
                {/* header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {w.avatar ? (
                        <img src={w.avatar} alt={`${w.name} — ${w.title}`} className="size-[56px] rounded-2xl border border-white bg-white object-cover object-top shadow-sm" />
                      ) : (
                        <div className="grid size-[56px] place-items-center rounded-2xl border border-[#0A0A0A]/10 bg-white text-[22px] shadow-sm" style={{ borderColor: w.accent + "30" }}>
                          {w.emoji}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 hidden size-5 place-items-center rounded-full border border-white bg-white text-[10px] shadow sm:grid" style={{ color: w.accent }}>●</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-black tracking-[-0.02em]">{w.name}</span>
                        <span className="rounded-full border border-[#E8E8E8] bg-white/80 px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#6B6B6B] backdrop-blur">{w.role}</span>
                      </div>
                      <div className="text-[12px] font-semibold leading-none text-[#6B6B6B]">{w.title}</div>
                      <div className="mt-1 font-mono text-[11px] text-[#9A9A9A]">{w.job}</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[10px] font-bold tracking-widest text-white shadow-sm">
                    {w.status.toUpperCase()} · {w.schedule}
                  </span>
                </div>

                {/* goal */}
                <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-3.5 text-[12.5px] leading-5 text-[#1A1A1A] backdrop-blur">
                  {w.goal}
                </div>

                {/* watches */}
                <div className="mt-3 rounded-2xl border border-[#E8E8E8]/70 bg-[#F8F8F7]/70 p-3 backdrop-blur">
                  <div className="text-[10px] font-bold tracking-[0.16em] text-[#9A9A9A]">WATCHES</div>
                  <div className="mt-1 break-all font-mono text-[11px] leading-4 text-[#0A0A0A]">{w.file}</div>
                </div>

                {/* cron footer */}
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/waifus/${w.id}`} className="flex-1 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-center text-[11px] font-bold tracking-wide hover:bg-[#0A0A0A] hover:text-white transition-colors">dossier → · {w.cronName.slice(0, 6)}</Link>
                  {w.link ? (
                    <Link href={w.link} className="rounded-full bg-[#0A0A0A] px-4 py-2 text-[11px] font-bold tracking-wide text-white shadow-sm hover:bg-black">Open {w.name}&apos;s desk ↗</Link>
                  ) : (
                    <span className="rounded-full border border-white/60 bg-white/70 px-3 py-2 text-[11px] font-semibold text-[#6B6B6B] backdrop-blur">free model ♡</span>
                  )}
                </div>
              </div>

              {/* subtle marble corner */}
              <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full opacity-[0.07]" style={{ backgroundImage: "url('/home-bg.jpg')", backgroundSize: "cover" }} aria-hidden />
            </article>
          ))}
        </div>

        {/* trophies — your unlocked achievements, live from your profile */}
        <div className="mx-auto mt-6 max-w-[860px] overflow-hidden rounded-[24px] border border-amber-200/70 bg-white/72 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">🏆 TROPHY CASE · LVL {level} · 💎 {gems}</h2>
            <Link href="/portfolio" className="text-[11px] font-bold text-[#9945FF] hover:underline" onClick={() => playSfx("click")}>earn more →</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto px-5 pb-5 pt-3">
            {ACHIEVEMENTS.map((a) => {
              const got = achievements.includes(a.id);
              return (
                <div key={a.id} title={got ? `${a.label} — unlocked (+${a.xp} XP)` : `${a.label} — ${a.desc}`} className={`shrink-0 rounded-2xl border px-3.5 py-2.5 text-center ${got ? "border-amber-300 bg-[#0A0A0A] text-white shadow-[0_0_16px_rgba(255,180,0,0.35)]" : "border-[#E8E8E8] bg-white/60 text-[#9A9A9A]"}`}>
                  <div className="text-lg">{got ? "🏆" : "🔒"}</div>
                  <div className="mt-0.5 text-[11px] font-bold whitespace-nowrap">{a.label}</div>
                  <div className="text-[10px] whitespace-nowrap opacity-70">{got ? `+${a.xp} XP` : a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* how it works — glass */}
        <div className="mx-auto mt-6 max-w-[860px] overflow-hidden rounded-[24px] border border-white/60 bg-white/72 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.75)]">
          <div className="p-5 sm:p-6">
            <h2 className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">HOW IT WORKS · MARBLE JUNGLE COMMAND</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 text-[12px] leading-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#0A0A0A] p-4 text-white shadow-sm">
                <div className="text-[11px] font-bold tracking-widest text-white/60">01 · BOSS</div>
                <div className="mt-1 font-bold">Lucy</div>
                <div className="mt-1 text-white/80">You talk to her on Telegram <span className="font-mono font-bold text-white">@sageglowsbot</span>. She delegates to Rias, reviews, merges. Uses any free model best for the job.</div>
              </div>
              <div className="rounded-2xl border border-[#E8E8E8]/60 bg-white/80 p-4 backdrop-blur">
                <div className="text-[11px] font-bold tracking-widest text-[#9A9A9A]">02 · CRON</div>
                <div className="mt-1 font-bold">They wake on schedule</div>
                <div className="mt-1 text-[#6B6B6B]">market 30m · ticker 2h · navi/auth 6h. Each run continues where last left off (continuity on). Logs local, gateway alive.</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-[#F8F8F7]/80 p-4 backdrop-blur">
                <div className="text-[11px] font-bold tracking-widest text-[#9A9A9A]">03 · CHECK</div>
                <div className="mt-1 font-bold">See them live</div>
                <div className="mt-1 text-[#6B6B6B]"><span className="font-mono font-semibold text-[#0A0A0A]">hermes cron list</span> · <span className="font-mono">hermes cron run &lt;id&gt;</span> · this page <span className="font-mono">/waifus</span> · or ask Lucy.</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/app" className="rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[12px] font-bold text-white shadow hover:bg-black">Open App</Link>
              <Link href="/" className="rounded-full border border-[#0A0A0A] bg-white px-5 py-2.5 text-[12px] font-bold hover:bg-[#F8F8F7]">Home (logo) ♡</Link>
              <span className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-4 py-2 text-[11px] font-semibold text-[#6B6B6B] backdrop-blur">5 waifus · boss Lucy → head Rias · pantherdigital</span>
              <span className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-3 py-2 text-[11px] font-mono text-[#9A9A9A] backdrop-blur">C:/emergent-matrix</span>
            </div>
          </div>
          {/* bottom marble bar */}
          <div className="h-[56px] w-full relative overflow-hidden border-t border-white/60">
            <img src="/home-bg.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[center_45%] opacity-60" />
            <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B] backdrop-blur">MARBLE JUNGLE · GLASS · CLEAN</span>
            </div>
          </div>
        </div>

        {/* meta share prompt card — like Meta AI transcript footer */}
        <div className="mx-auto mt-4 max-w-[860px] rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-center backdrop-blur-xl">
          <p className="text-[11px] leading-4 text-[#9A9A9A] tracking-wide">
            This page is our <span className="font-semibold text-[#6B6B6B]">Meta AI share</span> for waifus — same glass + marble calm, but wired to <span className="font-mono font-semibold text-[#0A0A0A]">emergent-matrix</span> data. Safe for work · free model <span className="font-mono">muse-spark</span> · login-gated in spirit, public in practice.
          </p>
        </div>

        <div className="mt-6 text-center text-[10px] tracking-[0.20em] text-[#9A9A9A]">© PANTHERDIGITAL — WAIFU SQUAD · BOSS LUCY → HEAD RIAS</div>
      </main>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700;900&display=swap');`}</style>
    </div>
  );
}
