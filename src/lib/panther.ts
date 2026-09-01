"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PANTHER_AVATARS = [
  "◐", "◑", "◒", "◓", "◎", "◍", "⬢", "⬣", "✦", "✧", "⟡", "⬔", "🐾", "🦁", "🌸",
];

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
  setHandle: (v: string) => void;
  setBio: (v: string) => void;
  setAvatar: (v: string) => void;
  logHunt: () => void;  // records a discovery; advances streak + grants gems
  addWallet: (addr: string) => void;
  removeWallet: (addr: string) => void;
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
      setHandle: (v) => set({ handle: v.slice(0, 24) }),
      setBio: (v) => set({ bio: v.slice(0, 140) }),
      setAvatar: (v) => set({ avatar: v }),
      addWallet: (addr) => set((s) => ({ linkedWallets: s.linkedWallets.includes(addr) ? s.linkedWallets : [...s.linkedWallets, addr].slice(-8) })),
      removeWallet: (addr) => set((s) => ({ linkedWallets: s.linkedWallets.filter((a) => a !== addr) })),
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
