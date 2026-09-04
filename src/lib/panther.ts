"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PANTHER_AVATARS = [
  "◐", "◑", "◒", "◓", "◎", "◍", "⬢", "⬣", "✦", "✧", "⟡", "⬔", "🐾", "🦁", "🌸",
];

export const MAX_LEVEL = 100;
export const MAX_XP = (MAX_LEVEL - 1) * 500; // 49500 → level 100 via formula

/** Achievements — unlocked by real actions, persisted with the profile. */
export const ACHIEVEMENTS = [
  { id: "first-scan", label: "First Blood", desc: "Scan your first wallet", xp: 50 },
  { id: "whale-spotter", label: "Whale Spotter", desc: "Scan a $10k+ wallet", xp: 150 },
  { id: "nft-hunter", label: "NFT Hunter", desc: "Reveal an NFT collection", xp: 100 },
  { id: "paper-pilot", label: "Paper Pilot", desc: "Unlock the bot desk", xp: 100 },
  { id: "signed-in", label: "Claimed Identity", desc: "Sign in to PNTHR DGTL", xp: 50 },
  { id: "streak-7", label: "Week Predator", desc: "7-day hunt streak", xp: 300 },
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

/** Boss admin wallets — full admin anywhere ranks/wallets are checked (client mirror). */
export const ADMIN_WALLETS_CLIENT = [
  "0xF15eea68C6aC1D830Bc39Ef80830d0ACaF50c6fE",
  "BTJHkMGSPgmYck32aG7ed9cZ9LESYKWT1Q4xakmuz7yz",
];

export function isAdminWalletClient(addr: string | null | undefined): boolean {
  if (!addr) return false;
  const a = addr.trim();
  return ADMIN_WALLETS_CLIENT.some((w) =>
    w.startsWith("0x") ? w.toLowerCase() === a.toLowerCase() : w === a
  );
}

export interface PantherState {
  handle: string;
  bio: string;
  avatar: string;
  // gamification
  gems: number;
  xp: number;
  level: number;
  streak: number;       // consecutive days a hunt was logged
  lastHunt: string | null; // YYYY-MM-DD
  hunts: number;        // total hunts
  linkedWallets: string[]; // saved wallet addresses
  achievements: AchievementId[]; // unlocked achievement ids
  setHandle: (v: string) => void;
  setBio: (v: string) => void;
  setAvatar: (v: string) => void;
  logHunt: () => void;  // records a discovery; advances streak + grants gems
  addXp: (n: number) => void; // quest/scan rewards (levels up)
  unlock: (id: AchievementId) => boolean; // true if newly unlocked (fires SFX-worthy moment)
  addWallet: (addr: string) => void;
  removeWallet: (addr: string) => void;
  crownAdmin: () => void; // max ranks + link boss wallets (admin wallets only — checked by caller)
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export const usePanther = create<PantherState>()(
  persist(
    (set, get) => ({
      handle: "",
      bio: "Panther on the hunt for early signals.",
      avatar: "🐾",
      gems: 0,
      xp: 0,
      level: 1,
      streak: 0,
      lastHunt: null,
      hunts: 0,
      linkedWallets: [],
      achievements: [],
      setHandle: (v) => set({ handle: v.slice(0, 24) }),
      setBio: (v) => set({ bio: v.slice(0, 140) }),
      setAvatar: (v) => set({ avatar: v }),
      addWallet: (addr) => set((s) => ({ linkedWallets: s.linkedWallets.includes(addr) ? s.linkedWallets : [...s.linkedWallets, addr].slice(-8) })),
      addXp: (n) =>
        set((s) => {
          const xp = Math.min(MAX_XP, s.xp + n);
          return { xp, level: Math.min(MAX_LEVEL, Math.floor(xp / 500) + 1) };
        }),
      unlock: (id) => {
        const s = get();
        if (s.achievements.includes(id)) return false;
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        const xp = Math.min(MAX_XP, s.xp + (def?.xp ?? 25));
        set({
          achievements: [...s.achievements, id],
          xp,
          level: Math.min(MAX_LEVEL, Math.floor(xp / 500) + 1),
          gems: s.gems + 25,
        });
        return true;
      },
      removeWallet: (addr) => set((s) => ({ linkedWallets: s.linkedWallets.filter((a) => a !== addr) })),
      crownAdmin: () =>
        set((s) => ({
          gems: 9999,
          xp: MAX_XP,
          level: MAX_LEVEL,
          streak: 365,
          hunts: 9999,
          lastHunt: today(),
          handle: s.handle || "BOSS",
          avatar: "🐆",
          linkedWallets: [...new Set([...s.linkedWallets, ...ADMIN_WALLETS_CLIENT])].slice(-8),
        })),
      logHunt: () => {
        const s = get();
        const t = today();
        let streak = s.streak;
        if (s.lastHunt === t) {
          // already hunted today — keep streak, still count
        } else if (s.lastHunt && dayDiff(s.lastHunt, t) === 1) {
          streak = s.streak + 1;
        } else {
          streak = 1;
        }
        const gems = 10 + Math.min(40, streak * 5); // more gems on longer streaks
        const xp = s.xp + 25;
        set({
          lastHunt: t,
          streak,
          hunts: s.hunts + 1,
          gems: s.gems + gems,
          xp,
          level: Math.floor(xp / 500) + 1,
        });
      },
    }),
    { name: "coinpanther-profile" }
  )
);
