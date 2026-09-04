"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cards, getSets } from "@/lib/data";
import { useCollectionStore } from "@/lib/store";
import CardImage from "@/components/CardImage";
import { colorTokens } from "@/lib/meta";
import { usePanther } from "@/lib/panther";
import { playSfx } from "@/lib/sfx";

import { RARITY_WEIGHTS } from "@/lib/deckRules";

const PACK_SIZE = 8;

// Guarantee at least one R+ in final slot
const RARE_POOL_RARITIES = new Set(["R", "RR", "SR", "S", "SY", "OC", "OSR", "HR", "UR", "SEC", "OUR"]);

function weightedPick(pool: typeof cards): (typeof cards)[number] {
  const weights = pool.map((c) => RARITY_WEIGHTS[c.rarity ?? "C"] ?? 0.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function makePack(setId: string) {
  const pool = cards.filter((c) => c.setId === setId);
  if (pool.length === 0) return [];
  const rarePool = pool.filter((c) => RARE_POOL_RARITIES.has(c.rarity ?? ""));
  const picks: typeof cards = [];
  for (let i = 0; i < PACK_SIZE - 1; i++) picks.push(weightedPick(pool));
  // Final slot: rare+
  picks.push(rarePool.length ? weightedPick(rarePool) : weightedPick(pool));
  // Shuffle
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks;
}

export default function PacksPage() {
  const sets = useMemo(() => getSets().filter((s) => s.category === "booster"), []);
  const defaultSet = useMemo(() => sets.find((s) => cards.some((c) => c.setId === s.id))?.id ?? sets[0]?.id ?? "hBP01", [sets]);
  const [selected, setSelected] = useState<string>(defaultSet);
  const [pack, setPack] = useState<ReturnType<typeof makePack> | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [ripped, setRipped] = useState(false);
  const [history, setHistory] = useState<typeof cards>([]);
  const collectionAdd = useCollectionStore((s) => s.collection);
  const toggleCollection = useCollectionStore((s) => s.toggleCollection);

  const selectedSet = sets.find((s) => s.id === selected);

  function openPack() {
    const p = makePack(selected);
    setPack(p);
    setRevealed(new Array(PACK_SIZE).fill(false));
    setRipped(false);
    setTimeout(() => setRipped(true), 300);
    setHistory((h) => [...p, ...h].slice(0, 100));
    const hot = p.some((c) => /UR|SSR|SP|SEC|OUR/i.test(c.rarity ?? ""));
    playSfx(hot ? "fanfare" : "swoosh");
    usePanther.getState().addXp(5);
  }

  function revealAll() {
    setRevealed(new Array(PACK_SIZE).fill(true));
    playSfx("coins");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pack Simulator<span className="text-gradient">.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Rip virtual booster packs with rarity-weighted odds. Nothing leaves this device — add hits to your collection if you like them.
          </p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-11 rounded-xl border border-sky-950/15 bg-white px-4 text-sm font-medium"
        >
          {sets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {/* Pack area */}
      <div className="glass mt-8 flex flex-col items-center rounded-3xl p-6 sm:p-10">
        {!pack ? (
          <>
            <div className="relative">
              {selectedSet?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedSet.coverImage} alt={selectedSet.name} className="h-56 w-auto rounded-2xl shadow-2xl ring-1 ring-black/10" />
              ) : (
                <div className="grid h-56 w-40 place-items-center rounded-2xl bg-gradient-to-br from-holo-blue to-holo-purple text-white shadow-2xl">
                  <span className="font-mono text-xs font-bold">{selected}</span>
                </div>
              )}
              <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-holo-pink/20 blur-2xl" />
            </div>
            <button
              onClick={openPack}
              className="btn-shine mt-8 rounded-full bg-gradient-to-r from-holo-blue to-holo-pink px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl hover:-translate-y-1 transition-transform"
            >
              Rip Pack — 8 cards
            </button>
            <p className="mt-3 text-xs text-zinc-400">Odds mirror rarity distribution • OSR ~0.7% per card</p>
          </>
        ) : (
          <>
            <div className={`relative w-full max-w-3xl transition-all duration-500 ${ripped ? "scale-100 opacity-100" : "scale-95 opacity-60"}`}>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${ripped ? "pointer-events-none -translate-y-32 opacity-0" : "opacity-100"}`}>
                <div className="h-32 w-48 rounded-xl bg-gradient-to-br from-holo-blue via-holo-purple to-holo-pink shadow-xl animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pack.map((card, i) => {
                  const isRare = (RARITY_WEIGHTS[card.rarity ?? ""] ?? 0) < 5;
                  return (
                    <button
                      key={`${card.id}-${i}`}
                      onClick={() => setRevealed((r) => r.map((v, idx) => (idx === i ? true : v)))}
                      className={`group relative overflow-hidden rounded-xl ring-1 transition-all duration-700 ${revealed[i] ? "ring-white" : "ring-black/5"} ${isRare && revealed[i] ? "shadow-lg shadow-holo-pink/30" : ""}`}
                      style={{ transform: revealed[i] ? "rotateY(0deg)" : "rotateY(8deg)", transitionDelay: `${i * 60}ms` }}
                    >
                      {revealed[i] ? (
                        <>
                          <CardImage
                            src={card.imageUrl}
                            alt={card.name ?? ""}
                            seed={card.cardNumber}
                            title={card.name ?? card.cardNumber}
                            rarity={card.rarity}
                            colorList={colorTokens(card.color)}
                            className="aspect-[300/420] w-full object-cover"
                          />
                          <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow ${isRare ? "bg-gradient-to-r from-holo-pink to-holo-purple" : "bg-black/60"}`}>
                            {card.rarity}
                          </span>
                        </>
                      ) : (
                        <div className="flex aspect-[300/420] w-full items-center justify-center bg-gradient-to-br from-sky-900 via-holo-blue to-holo-purple p-3 text-center">
                          <span className="font-mono text-xs font-bold text-white/80">Tap to reveal</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!revealed.every(Boolean) && (
                <button onClick={revealAll} className="rounded-full border border-sky-950/15 bg-white px-6 py-2.5 text-sm font-bold hover:border-holo-blue/40">
                  Reveal all
                </button>
              )}
              <button onClick={openPack} className="btn-shine rounded-full bg-gradient-to-r from-holo-blue to-holo-pink px-8 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg">
                Rip another
              </button>
              <button
                onClick={() => {
                  pack.forEach((c) => {
                    if (!collectionAdd.includes(c.id)) toggleCollection(c.id);
                  });
                }}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-bold ring-1 ring-sky-950/10 hover:ring-holo-blue/30"
              >
                Add all to collection
              </button>
              <button onClick={() => setPack(null)} className="rounded-full px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-600">
                Close
              </button>
            </div>
          </>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Session pulls — {history.length} cards</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {history.slice(0, 40).map((c, i) => (
              <Link key={`${c.id}-${i}`} href={`/cards/${c.id}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl ?? ""} alt={c.name ?? ""} className="h-20 w-auto rounded-lg object-cover ring-1 ring-black/10 hover:ring-holo-blue/40" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
