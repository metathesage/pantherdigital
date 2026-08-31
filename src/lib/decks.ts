"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Deck } from "@/lib/deckRules";

interface DeckState {
  decks: Deck[];
  create: (deck: Deck) => void;
  update: (deck: Deck) => void;
  remove: (id: string) => void;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set) => ({
      decks: [],
      create: (deck) => set((state) => ({ decks: [deck, ...state.decks] })),
      update: (deck) =>
        set((state) => ({
          decks: state.decks.map((d) => (d.id === deck.id ? deck : d)),
        })),
      remove: (id) =>
        set((state) => ({ decks: state.decks.filter((d) => d.id !== id) })),
    }),
    { name: "holo-tcg-decks" }
  )
);

export function newDeckId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowMs(): number {
  return Date.now();
}
