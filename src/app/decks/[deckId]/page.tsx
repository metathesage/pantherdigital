"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import CardImage, { RarityBadge } from "@/components/CardImage";
import { useDeckStore } from "@/lib/decks";
import { checkDeck, deckToText, type Deck } from "@/lib/deckRules";
import { nowMs } from "@/lib/decks";
import { cards as allCards, getCardById, searchCards } from "@/lib/data";
import { colorHex, colorTokens, rarityOrder } from "@/lib/meta";
import type { TcgCard } from "@/types";

const TYPE_FILTERS = [
  "All",
  "holomem",
  "Oshi",
  "Support",
  "Cheer",
] as const;

export default function DeckBuilderPage() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();
  const decks = useDeckStore((s) => s.decks);
  const update = useDeckStore((s) => s.update);
  const remove = useDeckStore((s) => s.remove);

  const deck = decks.find((d) => d.id === params.deckId);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("All");
  const [copied, setCopied] = useState(false);

  if (!deck) {
    notFound();
  }
  const currentDeck: Deck = deck;

  const pool = useMemo(() => {
    const results = query.trim().length >= 2
      ? searchCards(query)
      : [...allCards].sort((a, b) => rarityOrder(b.rarity) - rarityOrder(a.rarity)).slice(0, 60);
    const filtered =
      typeFilter === "All"
        ? results.filter((c) => !/^oshi$/i.test(c.type))
        : typeFilter === "Oshi"
          ? results.filter((c) => /^oshi$/i.test(c.type))
          : results.filter((c) => c.type.toLowerCase().includes(typeFilter.toLowerCase()));
    return filtered.slice(0, 60);
  }, [query, typeFilter]);

  if (!deck) {
    notFound();
  }

  const check = checkDeck(deck, getCardById);
  const oshiCard = deck.oshi ? getCardById(deck.oshi) : undefined;
  const mainEntries = [...deck.entries]
    .filter((e) => e.cardId !== deck.oshi)
    .sort((a, b) => a.cardId.localeCompare(b.cardId));

  function save(mutator: (d: Deck) => Deck) {
    update({ ...mutator(currentDeck), updatedAt: nowMs() });
  }

  function addCard(cardId: string) {
    save((d) => {
      const existing = d.entries.find((e) => e.cardId === cardId);
      return {
        ...d,
        entries: existing
          ? d.entries.map((e) =>
              e.cardId === cardId ? { ...e, count: Math.min(e.count + 1, 8) } : e
            )
          : [...d.entries, { cardId, count: 1 }],
      };
    });
  }

  function setCount(cardId: string, count: number) {
    save((d) => ({
      ...d,
      entries:
        count <= 0
          ? d.entries.filter((e) => e.cardId !== cardId)
          : d.entries.map((e) => (e.cardId === cardId ? { ...e, count } : e)),
    }));
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(deckToText(currentDeck, getCardById));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const inputClass =
    "h-10 w-full rounded-xl border border-sky-950/15 bg-white px-3.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/decks" className="text-sm text-zinc-400 hover:text-holo-blue">
          ← Decks
        </Link>
        <input
          value={currentDeck.name}
          onChange={(e) => save((d) => ({ ...d!, name: e.target.value.slice(0, 40) }))}
          aria-label="Deck name"
          className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-2xl font-extrabold tracking-tight text-zinc-800 outline-none transition hover:border-sky-950/10 focus:border-holo-blue/50 focus:bg-white sm:text-3xl"
        />
        <button
          type="button"
          onClick={copyExport}
          className="rounded-xl border border-sky-950/15 bg-white px-4 py-2 text-xs font-bold text-zinc-600 transition hover:border-holo-blue/40 hover:text-holo-blue"
        >
          {copied ? "Copied!" : "Copy list"}
        </button>
        <button
          type="button"
          onClick={() => {
            remove(currentDeck.id);
            router.push("/decks");
          }}
          className="rounded-xl border border-sky-950/15 bg-white px-4 py-2 text-xs font-bold text-zinc-400 transition hover:border-holo-pink/40 hover:text-holo-pink"
        >
          Delete
        </button>
      </div>

      {/* Legality bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
        <span
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
            check.mainCount === 50
              ? "bg-emerald-100 text-emerald-700"
              : "bg-holo-gold/15 text-holo-gold"
          }`}
        >
          Main {check.mainCount}/50
        </span>
        <span
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
            check.oshiCount === 1
              ? "bg-emerald-100 text-emerald-700"
              : "bg-holo-gold/15 text-holo-gold"
          }`}
        >
          Oshi {check.oshiCount}/1
        </span>
        <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-xs font-bold text-zinc-500">
          {check.errors.length === 0 ? (
            <span className="text-emerald-600">Format legal</span>
          ) : (
            `${check.errors.length} legality issue${check.errors.length === 1 ? "" : "s"}`
          )}
        </span>
        {check.colorsUsed.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-bold text-zinc-500">
            {check.colorsUsed.map((c) => (
              <span key={c} aria-hidden className="size-3 rounded-full ring-2 ring-white" style={{ backgroundColor: colorHex(c) }} />
            ))}
            {check.unicolorOk ? "Unicolor OK" : "Multicolor"}
          </span>
        )}
      </div>

      {(check.errors.length > 0 || check.warnings.length > 0) && (
        <ul className="mt-3 space-y-1 text-xs leading-relaxed">
          {check.errors.map((err) => (
            <li key={err} className="text-holo-pink">• {err}</li>
          ))}
          {check.warnings.map((warn) => (
            <li key={warn} className="text-zinc-400">• {warn}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Card pool */}
        <section aria-label="Card pool">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the whole database — name, number, tag…"
            aria-label="Search cards to add"
            className={inputClass}
          />
          <div role="group" aria-label="Type filter" className="mt-2.5 flex gap-1.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                aria-pressed={typeFilter === t}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  typeFilter === t
                    ? "scale-105 bg-holo-purple text-white shadow-md shadow-holo-purple/30"
                    : "bg-black/5 text-zinc-600 hover:bg-black/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
            {pool.map((card) => {
              const inDeck = currentDeck.entries.find((e) => e.cardId === card.id)?.count ?? 0;
              return (
                <li key={card.id} className="relative animate-pop">
                  <PoolCard card={card} onAdd={() => addCard(card.id)} inDeckCount={inDeck} />
                </li>
              );
            })}
          </ul>
          {pool.length === 0 && (
            <p className="mt-8 text-center text-sm text-zinc-400">
              No matches — try a different search.
            </p>
          )}
        </section>

        {/* Deck panel */}
        <aside aria-label="Your deck" className="lg:sticky lg:top-20 lg:self-start">
          <div className="glass rounded-2xl p-4">
            {/* Oshi slot */}
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Oshi slot
            </h2>
            {oshiCard ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-holo-gold/40 bg-amber-50/50 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={oshiCard.imageUrl ?? ""} alt="" className="h-16 w-auto rounded-lg shadow" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-zinc-800">{oshiCard.name}</p>
                  <p className="font-mono text-[10px] text-zinc-400">{oshiCard.cardNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => save((d) => ({ ...d!, oshi: null }))}
                  aria-label="Remove Oshi"
                  className="shrink-0 rounded-lg p-1.5 text-zinc-300 hover:bg-rose-50 hover:text-holo-pink"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-sky-950/20 p-3 text-xs text-zinc-400">
                Pick an Oshi from the pool using the{" "}
                <span className="font-bold text-holo-gold">Oshi</span> filter.
              </p>
            )}

            {/* Main deck */}
            <h2 className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
              Main deck · {check.mainCount}
            </h2>
            <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto pr-1 snap-row">
              {mainEntries.length === 0 && (
                <li className="rounded-xl border border-dashed border-sky-950/20 p-4 text-center text-xs text-zinc-400">
                  Click cards in the pool to add them here.
                </li>
              )}
              {mainEntries.map((entry) => {
                const card = getCardById(entry.cardId)!;
                return (
                  <li
                    key={entry.cardId}
                    className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-sky-950/5"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorHex(colorTokens(card.color)[0]) }}
                    />
                    <span className="w-11 shrink-0 font-mono text-[10px] text-zinc-400">
                      {card.rarity}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">
                      {card.name ?? entry.cardId}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCount(entry.cardId, entry.count - 1)}
                        aria-label={`Remove one ${card.name}`}
                        className="grid size-5 place-items-center rounded bg-black/[0.04] text-xs font-black text-zinc-500 hover:bg-black/10"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold tabular-nums">
                        {entry.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCount(entry.cardId, entry.count + 1)}
                        aria-label={`Add one ${card.name}`}
                        className="grid size-5 place-items-center rounded bg-black/[0.04] text-xs font-black text-zinc-500 hover:bg-black/10"
                      >
                        +
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PoolCard({
  card,
  onAdd,
  inDeckCount,
}: {
  card: TcgCard;
  onAdd: () => void;
  inDeckCount: number;
}) {
  const isOshiType = /^oshi$/i.test(card.type);
  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-white/90 ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isOshiType ? "ring-holo-gold/50" : "ring-sky-950/10"
      }`}
    >
      <CardImage
        src={card.imageUrl}
        alt={card.name ?? card.cardNumber}
        seed={card.cardNumber}
        title={card.name ?? card.cardNumber}
        rarity={card.rarity}
        colorList={colorTokens(card.color)}
        className="block aspect-[300/420] w-full object-cover"
      />
      <div className="absolute left-1 top-1">
        <RarityBadge rarity={card.rarity} />
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${card.name} to deck`}
        className="absolute inset-x-1 bottom-1 translate-y-1 rounded-lg bg-gradient-to-r from-holo-blue to-holo-purple py-1.5 text-[10px] font-black uppercase tracking-wide text-white opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
      >
        + Add{inDeckCount > 0 ? ` (${inDeckCount})` : ""}
      </button>
      {inDeckCount > 0 && (
        <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-holo-blue to-holo-purple text-[10px] font-black text-white shadow">
          {inDeckCount}
        </span>
      )}
    </div>
  );
}
