"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCollectionStore } from "@/lib/store";
import { cards, getSets } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import CardTile from "@/components/CardTile";
import { RarityBadge } from "@/components/CardImage";

const RARITY_VALUE: Record<string, number> = {
  C: 0.15,
  U: 0.4,
  R: 1.2,
  RR: 3.5,
  SR: 8,
  S: 5,
  P: 12,
  SY: 15,
  HR: 25,
  UR: 45,
  SEC: 80,
  OC: 35,
  OSR: 60,
  OUR: 90,
};

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}

export default function CollectionPage() {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const collection = useCollectionStore((s) => s.collection);
  const wishlist = useCollectionStore((s) => s.wishlist);
  const sets = getSets();

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
      </div>
    );
  }

  const ownedSet = new Set(collection);
  const ownedCards = cards.filter((c) => ownedSet.has(c.id));
  const totalValue = ownedCards.reduce((sum, c) => sum + (RARITY_VALUE[c.rarity ?? "C"] ?? 0.5), 0);
  const completion = cards.length ? (ownedCards.length / cards.length) * 100 : 0;

  // Per-set stats
  const perSet = sets
    .map((set) => {
      const setCards = cards.filter((c) => c.setId === set.id);
      const owned = setCards.filter((c) => ownedSet.has(c.id)).length;
      return { set, total: setCards.length, owned, pct: setCards.length ? (owned / setCards.length) * 100 : 0 };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.pct - a.pct);

  // Duplicates heuristic: low-rarity owned cards you likely have extras of + wishlist overlap
  const duplicates = ownedCards.filter((c) => ["C", "U"].includes(c.rarity ?? "")).slice(0, 12);
  const wishlistCards = cards.filter((c) => wishlist.includes(c.id)).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Collection<span className="text-gradient">.</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {user ? `Hi ${user.name} — ` : ""}
            {ownedCards.length} of {cards.length} cards owned
            {user ? ` · portfolio for ${user.identifier}` : " · guest portfolio (sign in to sync)"}
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-5 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform"
        >
          Add cards →
        </Link>
      </div>

      {/* Hero stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Completion</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{completion.toFixed(1)}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
            <div className="h-full bg-gradient-to-r from-holo-blue to-holo-purple transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">{ownedCards.length} / {cards.length} cards</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Est. portfolio value</p>
          <p className="mt-1 text-3xl font-black tracking-tight">${totalValue.toFixed(2)}</p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            Rarity-based estimate. Connect TCGPlayer/eBay keys for live market comps on card pages.
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Wishlist</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{wishlist.length}</p>
          <p className="mt-3 text-xs text-zinc-400">Cards you&apos;re hunting</p>
          {wishlistCards.length > 0 && (
            <div className="mt-3 flex -space-x-2 overflow-hidden">
              {wishlistCards.slice(0, 5).map((c) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.id}
                  src={c.imageUrl ?? ""}
                  alt=""
                  className="size-8 rounded-full object-cover ring-2 ring-white"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-set completion */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">Progress by set</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {perSet.map(({ set, owned, total, pct }) => (
            <Link
              key={set.id}
              href={`/sets/${set.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-sky-950/10 bg-white/80 p-3 backdrop-blur hover:border-holo-blue/30 hover:shadow-md transition-all"
            >
              <div className="grid size-12 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-holo-cyan/20 to-holo-purple/20 ring-1 ring-black/5">
                {set.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={set.coverImage} alt="" className="max-h-full object-contain" />
                ) : (
                  <span className="font-mono text-[9px] font-bold">{set.code}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold group-hover:text-holo-blue">{set.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full bg-gradient-to-r from-holo-blue to-holo-pink" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-zinc-400">
                    {owned}/{total}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Duplicates */}
      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">Likely duplicates</h2>
        <p className="mt-1 text-xs text-zinc-400">Common/uncommon owned cards — trade binder candidates.</p>
        {duplicates.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {duplicates.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="group overflow-hidden rounded-xl bg-white ring-1 ring-sky-950/10 hover:ring-holo-blue/30 transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.imageUrl ?? ""} alt={card.name ?? ""} className="aspect-[300/420] w-full object-cover" />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="truncate text-xs font-medium">{card.name}</span>
                  <RarityBadge rarity={card.rarity} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">No duplicates yet — mark some commons as owned.</p>
        )}
      </section>

      {/* Wishlist preview */}
      {wishlistCards.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Wishlist spotlight</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {wishlistCards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
