import type { Metadata } from "next";
import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import { GridSkeleton } from "@/components/Skeleton";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search every hololive TCG card and set by name, talent, trait, or set code.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Search
      </h1>
      <p className="mt-2 max-w-xl text-zinc-500">
        Cards and sets, side by side. Combine text search with rarity, type,
        and color filters.
      </p>
      <div className="mt-8">
        <Suspense fallback={<GridSkeleton count={12} />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
