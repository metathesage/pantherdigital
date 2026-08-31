"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CollectionState {
  wishlist: string[];
  collection: string[];
  toggleWishlist: (cardId: string) => void;
  toggleCollection: (cardId: string) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      wishlist: [],
      collection: [],
      toggleWishlist: (cardId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(cardId)
            ? state.wishlist.filter((id) => id !== cardId)
            : [...state.wishlist, cardId],
        })),
      toggleCollection: (cardId) =>
        set((state) => ({
          collection: state.collection.includes(cardId)
            ? state.collection.filter((id) => id !== cardId)
            : [...state.collection, cardId],
        })),
    }),
    { name: "holo-tcg-collection" }
  )
);

/* ------------------------------ Fan artwork ------------------------------- */

export interface FanArtItem {
  id: string;
  title: string;
  artist: string;
  /** Data URL of the (client-side downscaled) image. */
  image: string;
  nsfw: boolean;
  createdAt: number;
}

interface FanArtState {
  items: FanArtItem[];
  add: (item: FanArtItem) => void;
  remove: (id: string) => void;
}

export const MAX_FAN_ART = 30;

export const useFanArtStore = create<FanArtState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => ({
          items: [item, ...state.items].slice(0, MAX_FAN_ART),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
    }),
    { name: "holo-tcg-fan-art" }
  )
);
