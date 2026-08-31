"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CardTile from "@/components/CardTile";
import { RarityBadge } from "@/components/CardImage";
import type { TcgCard } from "@/types";
import { colorHex, colorTokens, rarityOrder } from "@/lib/meta";

const PAGE_SIZE = 24;

type SortKey = "number" | "rarity" | "name";
type ViewMode = "grid" | "table";

export default function SetCardsBrowser({
  cards,
  rarities,
  types,
  colors,
}: {
  cards: TcgCard[];
  rarities: string[];
  types: string[];
  colors: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("number");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = cards.filter((card) => {
      if (
        activeRarities.length &&
        !(card.rarity && activeRarities.includes(card.rarity))
      )
        return false;
      if (activeTypes.length && !activeTypes.includes(card.type)) return false;
      if (
        activeColors.length &&
        !colorTokens(card.color).some((t) => activeColors.includes(t))
      )
        return false;
      if (!q) return true;
      return `${card.name ?? ""} ${card.cardNumber} ${card.tags.join(" ")}` 
        .toLowerCase()
        .includes(q);
    });

    switch (sort) {
      case "number":
        return result.sort((a, b) =>
          a.cardNumber.localeCompare(b.cardNumber, "en", { numeric: true })
        );
      case "rarity":
        return result.sort(
          (a, b) =>
            rarityOrder(b.rarity) - rarityOrder(a.rarity) ||
            a.cardNumber.localeCompare(b.cardNumber, "en", { numeric: true })
        );
      case "name":
        return result.sort((a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "")
        );
      default:
        return result;
    }
  }, [cards, query, activeRarities, activeTypes, activeColors, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageCards = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function toggle<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
    setPage(1);
  }

  function chip(active: boolean) {
    return `rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
      active
        ? "bg-holo-purple text-white shadow-md shadow-holo-purple/30 scale-105"
        : "bg-black/5 text-zinc-600 hover:bg-black/10 hover:scale-105"
    }`;
  }

  return (
    <section aria-label="Card list">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Quick search in this set…"
          aria-label="Quick search within this set"
          className="h-9 w-full max-w-[220px] rounded-lg border border-black/10 bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20 sm:w-56"
        />

        <div role="group" aria-label="Filter by rarity" className="flex flex-wrap gap-1.5">
          {rarities.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggle(activeRarities, setActiveRarities, r)}
              aria-pressed={activeRarities.includes(r)}
              className={chip(activeRarities.includes(r))}
            >
              {r}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Filter by color" className="flex gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(activeColors, setActiveColors, c)}
              aria-pressed={activeColors.includes(c)}
              title={c.charAt(0).toUpperCase() + c.slice(1)}
              className={`size-6 rounded-full ring-offset-2 transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-holo-blue ${
                activeColors.includes(c)
                  ? "scale-110 ring-2 ring-holo-purple"
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

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
          aria-label="Sort cards"
          className="ml-auto h-9 rounded-lg border border-black/10 bg-white px-2.5 text-sm text-zinc-700 outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        >
          <option value="number">Card number</option>
          <option value="rarity">Rarity</option>
          <option value="name">Name A–Z</option>
        </select>

        <div role="group" aria-label="View mode" className="flex overflow-hidden rounded-lg border border-black/10">
          {(["grid", "table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                view === mode
                  ? "bg-holo-blue text-white"
                  : "bg-white text-zinc-600 hover:bg-black/5"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <details className="mt-2.5">
        <summary className="w-fit cursor-pointer text-xs font-semibold text-zinc-500 hover:text-holo-blue">
          Card type filters ({types.length})
        </summary>
        <div role="group" aria-label="Filter by card type" className="mt-2 flex flex-wrap gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(activeTypes, setActiveTypes, t)}
              aria-pressed={activeTypes.includes(t)}
              className={chip(activeTypes.includes(t))}
            >
              {t}
            </button>
          ))}
        </div>
      </details>

      {(activeRarities.length > 0 || activeTypes.length > 0 || activeColors.length > 0 || query) && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setActiveRarities([]);
            setActiveTypes([]);
            setActiveColors([]);
            setPage(1);
          }}
          className="mt-3 text-xs font-semibold text-holo-pink hover:underline"
        >
          Reset filters
        </button>
      )}

      <p className="mt-4 text-sm text-zinc-400" aria-live="polite">
        Showing {pageCards.length} of {filtered.length} cards
      </p>

      {view === "grid" ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {pageCards.map((card) => (
            <li key={card.id} className="animate-pop">
              <CardTile card={card} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/8">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-zinc-400">
                <th scope="col" className="px-4 py-3 font-semibold">Number</th>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Bloom</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rarity</th>
                <th scope="col" className="px-4 py-3 font-semibold">HP</th>
              </tr>
            </thead>
            <tbody>
              {pageCards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-black/5 transition-colors last:border-0 hover:bg-holo-blue/[0.04]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-zinc-500">
                    <Link href={`/cards/${card.id}`} className="hover:text-holo-blue hover:underline">
                      {card.cardNumber}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 font-medium">
                    <Link href={`/cards/${card.id}`} className="text-zinc-800 hover:text-holo-blue">
                      {card.name ?? card.cardNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{card.type}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{card.bloomLevel ?? "–"}</td>
                  <td className="px-4 py-2.5"><RarityBadge rarity={card.rarity} /></td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-500">{card.hp ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage(safePage - 1)}
            disabled={safePage === 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-black/5 disabled:opacity-40"
          >
            Prev
          </button>
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              aria-current={safePage === i + 1 ? "page" : undefined}
              className={`size-8 rounded-lg text-sm font-semibold transition-all duration-200 ${
                safePage === i + 1
                  ? "scale-105 bg-holo-blue text-white shadow-md shadow-holo-blue/30"
                  : "text-zinc-600 hover:bg-black/5"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage(safePage + 1)}
            disabled={safePage === pageCount}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-black/5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
