"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Device-local account layer for the demo build.
 * The shape mirrors what an OAuth session provides, so swapping in
 * NextAuth (X provider + email magic link) later only touches this file.
 */
export interface User {
  id: string;
  name: string;
  /** email address, or x:<handle> for X sign-ins */
  identifier: string;
  provider: "x" | "email";
}

interface AuthState {
  user: User | null;
  /** true once the persisted session has rehydrated (client-only) */
  hydrated: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "pnthr-auth",
      version: 1,
      // SSR-safe: localStorage only touched in the browser.
      // Without this, persist crashes on the server and sign-ins silently fail.
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }) as AuthState,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      // One-time rescue: carry over sessions saved under the legacy key
      // (users who "couldn't sign in" were stuck on the old storage entry).
      migrate: (persisted: unknown) => {
        try {
          const raw = localStorage.getItem("holo-tcg-auth");
          if (raw) {
            const old = JSON.parse(raw);
            const user = old?.state?.user ?? old?.user ?? null;
            localStorage.removeItem("holo-tcg-auth");
            if (user?.id) return { user } as AuthState;
          }
        } catch { /* start fresh */ }
        return (persisted ?? {}) as AuthState;
      },
    }
  )
);
