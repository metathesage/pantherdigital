"use client";

import { useSyncExternalStore } from "react";
import { useCollectionStore } from "@/lib/store";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function WishlistButton({ cardId }: { cardId: string }) {
  const mounted = useMounted();
  const { wishlist, toggleWishlist } = useCollectionStore();
  const active = mounted && wishlist.includes(cardId);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(cardId)}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
        active
          ? "border-holo-pink/40 bg-holo-pink/10 text-holo-pink"
          : "border-black/10 bg-white text-zinc-600 hover:border-holo-pink/30 hover:text-holo-pink"
      }`}
    >
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className="size-4" aria-hidden>
        <path
          d="M12 21s-7.5-4.7-9.7-9A5.6 5.6 0 0112 5.7a5.6 5.6 0 019.7 6.3c-2.2 4.3-9.7 9-9.7 9z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {active ? "In Wishlist" : "Add to Wishlist"}
    </button>
  );
}

export function CollectionButton({ cardId }: { cardId: string }) {
  const mounted = useMounted();
  const { collection, toggleCollection } = useCollectionStore();
  const active = mounted && collection.includes(cardId);

  return (
    <button
      type="button"
      onClick={() => toggleCollection(cardId)}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
        active
          ? "border-holo-blue/40 bg-holo-blue/10 text-holo-blue"
          : "border-black/10 bg-white text-zinc-600 hover:border-holo-blue/30 hover:text-holo-blue"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <path
          d="M12 3l7.5 4.2v9.6L12 21l-7.5-4.2V7.2L12 3zm0 3.8L8.5 8.8v4.6L12 15.4l3.5-2v-4.6L12 6.8z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {active ? "Owned" : "Mark Owned"}
    </button>
  );
}
