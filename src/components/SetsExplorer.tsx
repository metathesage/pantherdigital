"use client";

import { useMemo, useState } from "react";
import { SetCard } from "@/components/Timeline";
import type { TcgSet } from "@/types";
import { todayIso } from "@/lib/meta";

type SortKey = "newest" | "oldest" | "name";

export default function SetsExplorer({ sets }: { sets: TcgSet[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<"all" | "JP" | "EN">("all");
  const [category, setCategory] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const categories = useMemo(
    () => [...new Set(sets.map((s) => s.category))].sort(),
    [sets]
  );
  const years = useMemo(
    () =>
      [...new Set(sets.map((s) => s.releaseDate?.slice(0, 4)).filter(Boolean))].sort(
        (a, b) => (b ?? "").localeCompare(a ?? "")
      ),
    [sets]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = sets.filter((set) => {
      if (region !== "all" && set.region !== region) return false;
      if (category !== "all" && set.category !== category) return false;
      if (year !== "all" && !set.releaseDate?.startsWith(year)) return false;
      if (!q) return true;
      return `${set.name} ${set.code}`.toLowerCase().includes(q);
    });

    switch (sort) {
      case "newest":
        return result.sort(
          (a, b) => (b.releaseDate ?? "9999").localeCompare(a.releaseDate ?? "9999")
        );
      case "oldest":
        return result.sort(
          (a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999")
        );
      case "name":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result;
    }
  }, [sets, query, region, category, year, sort]);

  function chip(active: boolean) {
    return `rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
      active
        ? "bg-holo-blue text-white shadow-md shadow-holo-blue/30 scale-105"
        : "bg-black/5 text-zinc-600 hover:bg-black/10 hover:scale-105"
    }`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or code…"
          aria-label="Filter sets by name or code"
          className="h-10 w-full max-w-xs rounded-xl border border-black/10 bg-white px-3.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20 sm:w-64"
        />

        <div role="group" aria-label="Region filter" className="flex gap-1.5">
          {(["all", "EN", "JP"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRegion(r)} className={chip(region === r)}>
              {r === "all" ? "All regions" : r}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Product category filter"
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm capitalize text-zinc-700 outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Release year filter"
          className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        >
          <option value="all">Any year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort sets"
          className="ml-auto h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-zinc-400" aria-live="polite">
        {filtered.length} product{filtered.length === 1 ? "" : "s"}
        {" · "}
        {filtered.filter((s) => s.releaseDate && s.releaseDate > todayIso()).length} upcoming
      </p>

      <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((set) => (
          <li key={set.id} className="animate-pop">
            <SetCard set={set} />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-12 text-center">
          <p className="font-semibold text-zinc-600">No products match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRegion("all");
              setCategory("all");
              setYear("all");
            }}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-holo-blue hover:bg-holo-blue/5"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
