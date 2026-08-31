"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  signIn: (user: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    { name: "holo-tcg-auth" }
  )
);
