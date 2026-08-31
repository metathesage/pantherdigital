import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SetCardsBrowser from "@/components/SetCardsBrowser";
import Reveal from "@/components/Reveal";
import { getCardsForSet, getDistinctRarities, getSetById, getSets } from "@/lib/data";
import { formatDate, gradientFor, todayIso } from "@/lib/meta";
import { setEbayUrl, setTcgplayerUrl } from "@/lib/market";

interface Props {
  params: Promise<{ setId: string }>;
}

export function generateStaticParams() {
  return getSets().map((set) => ({ setId: set.id }));
}

async function getSet(params: Props["params"]) {
  const { setId } = await params;
  return getSetById(setId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const set = await getSet(params);
  if (!set) return { title: "Set not found" };
  return {
    title: `${set.name} (${set.code})`,
    description: `${set.code} · ${set.category} · Released ${formatDate(
      set.releaseDate
    )} · ${set.totalCards} cards in database.`,
  };
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/8 bg-white px-3.5 py-2 shadow-sm">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-zinc-800">{value}</dd>
    </div>
  );
}

export default async function SetPage({ params }: Props) {
  const set = await getSet(params);
  if (!set) notFound();

  const cards = getCardsForSet(set.id);
  const [from, to] = gradientFor(set.code);
  const upcoming = set.releaseDate !== null && set.releaseDate > todayIso();

  return (
    <div>
      {/* Banner */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(115deg, ${from}, ${to})` }}
      >
        <span aria-hidden className="absolute -right-16 -top-24 size-72 rounded-full bg-white/15 blur-2xl animate-float-slow" />
        <span aria-hidden className="absolute -bottom-28 left-1/4 size-64 rounded-full bg-white/10 blur-2xl" />
        {set.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={set.coverImage}
            alt=""
            aria-hidden
            className="absolute right-6 top-1/2 hidden max-h-[85%] -translate-y-1/2 rounded-xl shadow-2xl lg:block"
          />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href="/sets" className="hover:text-white hover:underline">Sets</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="font-mono">{set.code}</span>
          </nav>
          <p className="mt-5 inline-block rounded-lg bg-black/25 px-3 py-1 font-mono text-xs font-bold tracking-widest text-white backdrop-blur">
            {set.code} · {set.category} · {set.region}
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow sm:text-4xl">
            {set.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {upcoming && (
              <span className="rounded-md bg-holo-gold px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                Upcoming release
              </span>
            )}
          </div>

          <dl className="mt-7 flex flex-wrap gap-2.5">
            <MetaChip label="Released" value={formatDate(set.releaseDate)} />
            <MetaChip label="Cards in DB" value={String(cards.length)} />
            <MetaChip label="Region" value={set.region} />
            <MetaChip label="Category" value={set.category} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href={setTcgplayerUrl(set)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/90 px-4 py-2 text-xs font-bold text-zinc-800 shadow transition hover:-translate-y-0.5 hover:bg-white"
            >
              TCGPlayer →
            </a>
            <a
              href={setEbayUrl(set)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-black/25 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-black/40"
            >
              eBay listings →
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Reveal>
          <SetCardsBrowser
            cards={cards}
            rarities={getDistinctRarities().filter((r) =>
              cards.some((c) => c.rarity === r)
            )}
            types={[...new Set(cards.map((c) => c.type))].sort()}
            colors={(() => {
              const order = ["white", "green", "red", "blue", "purple", "yellow", "neutral"];
              const present = new Set(cards.flatMap((c) => c.color ? c.color.toLowerCase().split("_") : ["neutral"]));
              return [...present].sort((a, b) => order.indexOf(a) - order.indexOf(b));
            })()}
          />
        </Reveal>
      </div>
    </div>
  );
}
