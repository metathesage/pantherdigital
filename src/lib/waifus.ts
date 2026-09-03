/**
 * PNHR DGTL — waifu squad source of truth.
 * Shared by /waifus (cards), /waifus/[id] (full pages) and /wiki/waifus.
 * Images: /public/waifus/* (ported from emergent-matrix-lab marble set).
 * Alina → /lucy-work.png · Rias → /rias-waifu.png (existing assets kept).
 */

export type SquadWaifu = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  avatar: string;
  accent: string;
  job: string;
  schedule: string;
  files: string;
  goal: string;
  status: "active" | "idle" | "working";
  cron: string;
  role: string;
  link?: string;
  powers: string[];
  bio: string;
};

export const BOSS = {
  id: "alina",
  name: "Alina",
  title: "Boss Waifu · Panther Command",
  handle: "@sageglowsbot",
  avatar: "/lucy-work.png",
  model: "muse-spark-1.2-contributor-free",
  bio: "You talk to her on Telegram @sageglowsbot. She reviews, merges, and delegates to head worker Rias. Uses the best free model for each task.",
  powers: ["Command & review", "Delegation", "Free-model routing"],
};

export const SQUAD: SquadWaifu[] = [
  {
    id: "rias",
    name: "Rias",
    title: "Head Worker · UX Priestess",
    emoji: "🌸",
    avatar: "/rias-waifu.png",
    accent: "#FF5A7A",
    job: "panther-nav-ux",
    schedule: "every 6h",
    files: "src/app/app/page.tsx + layout.tsx + waifus/page.tsx",
    goal: "Owns navigation & polish — logo always → /, header minimal, marble ticker tidy, mobile perfect. Reports to Alina, delegates to trio.",
    status: "active",
    cron: "00a627273861",
    role: "HEAD",
    powers: ["Navigation & UX", "Squad tasking", "Polish passes"],
    bio: "Head worker under Alina. Runs the squad day-to-day — keeps navi, ticker polish, and the command page true. Pings Alina when a cron drifts. Replaces Akari/Navi.",
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
    files: "src/app/api/coins/markets/route.ts + app/page.tsx feed",
    goal: "Keep the CoinGecko live feed flawless — server proxy, 429 backoff, emergentScore calc. Never hardcode keys.",
    status: "active",
    cron: "1d4a12cf83bd",
    role: "MARKET",
    powers: ["Live price feed", "429 backoff", "Emergent scores"],
    bio: "Market panther carved in marble candlesticks. Watches every tick across 300+ coins and keeps the radar feed alive through rate limits and outages.",
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
    files: "src/app/app/page.tsx ticker + /api/pairs",
    goal: "Owns ticker + feed — highlight gainers and surging (Breaking or +8%). Sort by Score with orange 90+ glow.",
    status: "active",
    cron: "f046435c05a7",
    role: "TICKER",
    powers: ["Surge detection", "Gainer highlights", "90+ glow"],
    bio: "Surge huntress on a flaming arrow. Lives for breakouts — first to flag a runner, first to light the ticker on fire.",
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
    files: "src/components/PrivyProvider.tsx + admin bearer auth",
    goal: "No auth walls on top — graceful wallet fallback (MetaMask/Phantom/Coinbase), admin token gate for the bot desk.",
    status: "active",
    cron: "79d57a7e9bb9",
    role: "AUTH",
    powers: ["Wallet login", "Admin gate", "Session guard"],
    bio: "Auth guardian behind a marble shield. Holds the gates — wallets in, strangers out, admin token checked at the bot desk door.",
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
    files: "src/lib/bot.ts + src/app/api/bot/* + src/app/bot/page.tsx",
    goal: "Runs the paper-trading desk — $10 bankroll, $5 longs, +8% TP / −6% SL auto-sweep. Admin-only, Coinbase + Phantom, no real funds.",
    status: "active",
    cron: "paper-only",
    role: "TRADER",
    link: "/bot",
    powers: ["Paper longs", "TP/SL sweep", "$5–10 bankroll"],
    bio: "Paper trader stacked on a marble bitcoin. Runs the desk with ice-cold discipline — small bankroll, short entries, auto-exits. Her console lives at /bot.",
  },
];

export function getWaifu(id: string): SquadWaifu | undefined {
  return SQUAD.find((w) => w.id === id);
}
