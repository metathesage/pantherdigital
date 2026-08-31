"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getDistinctColors, getDistinctRarities, searchCards, searchSets } from "@/lib/data";
import { colorHex } from "@/lib/meta";
import CardGrid from "@/components/CardGrid";

export default function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [rarities, setRarities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const allRarities = useMemo(() => getDistinctRarities(), []);
  const allTypes = useMemo(
    () => [...new Set(searchCards("").map((c) => c.type))].sort(),
    []
  );
  const allColors = useMemo(() => getDistinctColors(), []);

  const cardResults = useMemo(
    () => searchCards(query, { rarity: rarities, type: types, color: colors }),
    [query, rarities, types, colors]
  );
  const setResults = useMemo(() => searchSets(query), [query]);

  function toggle<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function chip(active: boolean) {
    return `rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
      active
        ? "bg-holo-blue text-white shadow-md shadow-holo-blue/30 scale-105"
        : "bg-black/5 text-zinc-600 hover:bg-black/10 hover:scale-105"
    }`;
  }

  const hasQuery = query.trim().length > 0;
  const total = cardResults.length + setResults.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Advanced filters">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Rarity</span>
        {allRarities.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => toggle(rarities, setRarities, r)}
            aria-pressed={rarities.includes(r)}
            className={chip(rarities.includes(r))}
          >
            {r}
          </button>
        ))}
        <span className="mx-2 hidden h-4 w-px bg-black/10 sm:block" aria-hidden />
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Type</span>
        {allTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(types, setTypes, t)}
            aria-pressed={types.includes(t)}
            className={chip(types.includes(t))}
          >
            {t}
          </button>
        ))}
        <span className="mx-2 hidden h-4 w-px bg-black/10 sm:block" aria-hidden />
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Color</span>
        <div className="flex gap-1.5">
          {allColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(colors, setColors, c)}
              aria-pressed={colors.includes(c)}
              title={c.charAt(0).toUpperCase() + c.slice(1)}
              className={`size-6 rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-holo-blue ${
                colors.includes(c)
                  ? "scale-110 ring-2 ring-holo-blue ring-offset-2"
                  : "opacity-60 ring-1 ring-black/10"
              }`}
            >
              <span className="sr-only">{c}</span>
              <span
                aria-hidden
                className="block size-full rounded-full"
                style={{ backgroundColor: colorHex(c) }}
              />
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-500" aria-live="polite">
        {hasQuery ? (
          <>
            <strong className="text-zinc-800">{total}</strong> result{total === 1 ? "" : "s"} for “{query.trim()}”
          </>
        ) : (
          <>
            Browsing all <strong className="text-zinc-800">{cardResults.length}</strong> cards.
          </>
        )}
      </p>

      {cardResults.length > 0 && (
        <section aria-labelledby="card-results" className="mt-6">
          <h2 id="card-results" className="text-lg font-bold tracking-tight">
            Cards <span className="text-sm font-medium text-zinc-400">({cardResults.length})</span>
          </h2>
          <div className="mt-4">
            <CardGrid cards={cardResults} />
          </div>
        </section>
      )}

      {setResults.length > 0 && (
        <section aria-labelledby="set-results" className="mt-12">
          <h2 id="set-results" className="text-lg font-bold tracking-tight">
            Sets <span className="text-sm font-medium text-zinc-400">({setResults.length})</span>
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {setResults.map((set) => (
              <li key={set.id}>
                <Link href={`/sets/${set.id}`} className="block rounded-xl border border-black/8 bg-white p-4 transition hover:-translate-y-0.5 hover:border-holo-purple/30 hover:shadow-md">
                  <p className="font-mono text-xs font-bold text-zinc-400">{set.code}</p>
                  <p className="mt-1 font-semibold text-zinc-800">{set.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">{set.category} · {set.region}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {total === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-black/15 p-14 text-center animate-fade-up">
          <p className="text-lg font-semibold text-zinc-700">No results found.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => { setRarities([]); setTypes([]); setColors([]); }}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:-translate-y-0.5 hover:border-holo-purple/40 hover:text-holo-purple"
            >
              Clear filters
            </button>
            <Link
              href="/sets"
              className="rounded-xl bg-holo-blue px-4 py-2 text-sm font-semibold text-white shadow-md shadow-holo-blue/30 transition hover:-translate-y-0.5"
            >
              Browse all sets
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
