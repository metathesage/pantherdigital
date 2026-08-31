import type { Metadata } from "next";
import SetsExplorer from "@/components/SetsExplorer";
import Reveal from "@/components/Reveal";
import { getSets } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sets",
  description:
    "Browse every hololive OFFICIAL CARD GAME set by region, product type, and release year.",
};

export default function SetsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          All Sets
        </h1>
        <p className="mt-2 max-w-xl text-zinc-500">
          Booster packs, trial decks, and special releases — filter by region,
          type, or year.
        </p>
      </Reveal>
      <div className="mt-8">
        <SetsExplorer sets={getSets()} />
      </div>
    </div>
  );
}
