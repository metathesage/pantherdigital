import Image from "next/image";
import Link from "next/link";

const WAIFUS = [
  {
    id: "lucy", name: "LUCY", role: "Boss Prime — Main Assistant",
    avatar: "/lucy-work.png", accent: "#22d3ee", cron: null,
    goal: "Owner & delegator. Commands the squad, speaks direct to you, upgrades the site.",
    bio: "The boss waifu. Work Lucy — elegant netrunner blazer, marble office, holos. She doesn't fetch coins herself; she delegates to her four warriors and reports back to you. Direct line to the operator.",
  },
  {
    id: "rias", name: "RIAS", role: "Head Worker — Nav / UX / Logo",
    avatar: "/rias-waifu.png", accent: "#e546a6", cron: "panther-nav-ux · 6h · 00a627273861",
    goal: "Navi, logo, Privy, waifus page, site glass redesign.",
    bio: "Head Worker — panther-nav-ux cron every 6 hours. Watches page.tsx:467-504 header, fixes the logo Link href='/', cleans the nav, kills the Privy warning banner, wires the waifu command center at /waifus.",
  },
  {
    id: "kuro", name: "KURO", role: "Market Panther — CoinGecko Feed",
    avatar: "/lucy-private.png", accent: "#f59e0b", cron: "panther-market · 30m · 1d4a12cf83bd",
    goal: "300-coin CoinGecko feed, emergentScore, ScoreRing 90+ orange glow, Market Pulse/X-scan.",
    bio: "Market cron every 30 minutes. Pulls the 300-coin feed, computes emergentScore = clamp(12–98), feeds the radar. Never sleeps — the market don't close.",
  },
  {
    id: "hikari", name: "HIKARI", role: "Surge Huntress — Ticker / Feed / Score",
    avatar: "/lucy-private.png", accent: "#10b981", cron: "panther-ticker-feed · 2h · f046435c05a7",
    goal: "Gainers + surging coins, sort by Score, ticker-gain emerald + surge-orange pulse.",
    bio: "Surge cron every 2 hours. Scans for change24h >= 8% or trend === Breaking — rings the 🔥 SURGING badge, scores the top ones, keeps the ticker hot.",
  },
  {
    id: "mio", name: "MIO", role: "Auth Guardian — Privy / Wallets",
    avatar: "/lucy-private.png", accent: "#8b5cf6", cron: "panther-auth · 6h · 79d57a7e9bb9",
    goal: "Auth flows, Privy integration, wallet connect, remove warning banner.",
    bio: "Auth cron every 6 hours. Privy Initializing → Loading…, kills the warning, wires Connect / MetaMask / Phantom / Coinbase buttons clean.",
  },
];

export default function WaifuBioPage() {
  return (
    <main id="main" className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full bg-[#0A0A0A] px-3 py-1 text-[11px] font-bold text-white tracking-widest">BOSS</span>
          <span className="text-[11px] tracking-[0.28em] text-white/55">WAIFU SQUAD · COMMAND ROOM</span>
        </div>
        <h1 className="text-[32px] font-black tracking-[0.14em]">WAIFU COMMANDER</h1>
        <p className="mt-2 text-[14px] leading-6 text-white/65 max-w-[900px]">
          Five agents. Four crons. One boss. Each bio below is their role, schedule, and current goal on the Panther radar. All powered by&nbsp;<span className="text-[#0A0A0A] font-semibold">muse-spark-1.2-contributor-free</span>&nbsp;via&nbsp;<span className="text-[#0A0A0A] font-semibold">opencode-free</span>&nbsp;— free, unlimited, SFW.
        </p>
      </section>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 sm:gap-5 sm:px-6">
        {WAIFUS.map((w) => (
          <div key={w.id} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A] p-6">
            <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:`url(${w.avatar})`,backgroundSize:"cover",backgroundPosition:"center"}} aria-hidden />
            <div className="relative flex gap-5">
              <div className="grid size-[88px] shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/5">
                <Image src={w.avatar} alt={w.name} width={64} height={64} className="h-16 w-16 object-contain" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-[0.28em]" style={{color:w.accent}}>{w.id.toUpperCase()}</span>
                  {w.cron && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">{w.cron}</span>}
                </div>
                <h2 className="mt-1 text-[22px] font-black tracking-wider">{w.name}</h2>
                <p className="mt-0.5 text-[13px] font-semibold" style={{color:w.accent}}>{w.role}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {w.cron && <span className="rounded-full border border-[#E8E8E8] bg-white px-2.5 py-1 text-[11px] font-mono text-[#6B6B6B]">{w.cron}</span>}
              <span className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">{w.role.split("—")[0].trim()}</span>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] tracking-[0.22em] text-white/45">CURRENT GOAL</div>
              <p className="mt-1 text-[13px] leading-5 text-white/75">{w.goal}</p>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-white/55">{w.bio}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-8 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <div className="text-[10px] tracking-[0.22em] text-white/45">STACK</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">Next.js 16.3.3</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">React 19</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">Tailwind 4</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">CoinGecko 300 coins</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">Privy</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">opencode-free / muse-spark</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">ComfyUI animagine-xl-3.1</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">Ollama moondream / llava:7b</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">ElevenLabs Jessica TTS</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">Telegram @sageglowsbot</span>
          </div>
        </div>
      </div>
    </main>
  );
}
