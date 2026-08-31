"use client";

import { useEffect, useState } from "react";
import CardTile from "@/components/CardTile";
import { cards, getCardById } from "@/lib/data";
import { useCollectionStore } from "@/lib/store";
import type { TcgCard } from "@/types";

/**
 * "Most Wanted" ranks cards by real usage of this browser:
 * wishlist adds count double, owned adds single. Data lives in localStorage.
 */
export default function MostWanted({ limit = 8 }: { limit?: number }) {
  const mounted = useMounted();
  const wishlist = useCollectionStore((s) => s.wishlist);
  const collection = useCollectionStore((s) => s.collection);

  const ranked: Array<{ card: TcgCard; score: number }> = [];
  if (mounted) {
    const scores = new Map<string, number>();
    for (const id of collection) scores.set(id, (scores.get(id) ?? 0) + 1);
    for (const id of wishlist) scores.set(id, (scores.get(id) ?? 0) + 2);
    for (const [id, score] of scores) {
      const card = getCardById(id);
      if (card && card.imageUrl) ranked.push({ card, score });
    }
    ranked.sort(
      (a, b) =>
        b.score - a.score ||
        a.card.cardNumber.localeCompare(b.card.cardNumber)
    );
  }

  if (!mounted || ranked.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
        <p className="text-sm text-zinc-500">
          Nothing here yet — add cards to your{" "}
          <strong className="text-holo-pink">wishlist</strong> or{" "}
          <strong className="text-holo-blue">collection</strong> and your
          personal most-wanted list builds itself.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {wishlist.length + collection.length > 0
            ? "Ranking includes only cards with artwork."
            : `${cards.length} cards tracked across the database.`}
        </p>
      </div>
    );
  }

  return (
    <ol className="snap-row flex snap-x gap-4 overflow-x-auto pb-4">
      {ranked.slice(0, limit).map(({ card }, index) => (
        <li key={card.id} className="relative w-40 shrink-0 snap-start sm:w-44">
          <span className="absolute -left-1.5 -top-1.5 z-10 grid size-7 place-items-center rounded-full bg-gradient-to-br from-holo-pink to-holo-purple font-mono text-xs font-black text-white shadow-lg">
            {index + 1}
          </span>
          <CardTile card={card} />
        </li>
      ))}
    </ol>
  );
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer one frame so this never fights hydration.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}
