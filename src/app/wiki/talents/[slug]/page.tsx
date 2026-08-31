import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardTile from "@/components/CardTile";
import Reveal from "@/components/Reveal";
import { searchCards } from "@/lib/data";
import talentsJson from "@/data/wiki/talents.json";

interface Talent {
  slug: string;
  name: string;
  branch: string;
  gen: string;
  debutYear: number | null;
  color: string;
  status: string;
  bio: string;
}

const talents = talentsJson as Talent[];

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return talents.map((talent) => ({ slug: talent.slug }));
}

function getTalent(slug: string): Talent | undefined {
  return talents.find((t) => t.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const talent = getTalent(slug);
  if (!talent) return { title: "Talent not found" };
  return {
    title: talent.name,
    description: `${talent.name} — ${talent.gen} (${talent.branch}). Profile, lore, and every hololive TCG card they appear on.`,
  };
}

export default async function TalentPage({ params }: Props) {
  const { slug } = await params;
  const talent = getTalent(slug);
  if (!talent) notFound();

  const allCards = searchCards(talent.name);
  const cards = allCards.filter(
    (card) =>
      /holomem/i.test(card.type) &&
      (card.name?.toLowerCase() === talent.name.toLowerCase() ||
        card.tags.some((tag) => tag.toLowerCase() === talent.name.toLowerCase()))
  );
  const featured = (cards.length > 0 ? cards : allCards).filter((c) => c.imageUrl);
  const genPeers = talents.filter(
    (t) => t.gen === talent.gen && t.slug !== talent.slug
  );

  return (
    <div>
      {/* Banner */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(120deg, ${talent.color}33, transparent 55%), linear-gradient(115deg, #0e2a4a, #123c6b)`,
        }}
      >
        <span aria-hidden className="absolute -right-16 -top-24 size-72 rounded-full bg-white/10 blur-2xl animate-float-slow" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70">
            <Link href="/wiki" className="hover:text-white hover:underline">Wiki</Link>
            <span aria-hidden className="mx-2">/</span>
            <span>Talents</span>
          </nav>
          <h1 className="mt-5 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight text-white drop-shadow sm:text-4xl">
            <span
              aria-hidden
              className="inline-block size-5 rounded-full ring-2 ring-white/70"
              style={{ backgroundColor: talent.color }}
            />
            {talent.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {talent.branch}
            </span>
            <span className="rounded-lg bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {talent.gen}
            </span>
            {talent.debutYear && (
              <span className="rounded-lg bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Debuted {talent.debutYear}
              </span>
            )}
            {talent.status !== "active" && (
              <span className="rounded-lg bg-holo-pink/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Graduated
              </span>
            )}
          </div>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/90">{talent.bio}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Cards */}
        <Reveal>
          <section aria-labelledby="cards-heading">
            <div className="flex items-end justify-between gap-4">
              <h2 id="cards-heading" className="text-2xl font-bold tracking-tight">
                Cards featuring {talent.name.split(" ")[0]}
              </h2>
              <Link href={`/search?q=${encodeURIComponent(talent.name)}`} className="shrink-0 text-sm font-semibold text-holo-blue hover:underline">
                Search results →
              </Link>
            </div>
            {featured.length > 0 ? (
              <>
                <p className="mt-1.5 text-sm text-zinc-500">{featured.length} real cards in the database.</p>
                <ul className="snap-row mt-6 flex snap-x gap-4 overflow-x-auto pb-4">
                  {featured.map((card) => (
                    <li key={card.id} className="w-40 shrink-0 snap-start sm:w-44">
                      <CardTile card={card} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500">
                No cards found in the current database yet.
              </p>
            )}
          </section>
        </Reveal>

        {/* Gen peers */}
        {genPeers.length > 0 && (
          <Reveal delay={100}>
            <section aria-labelledby="peers-heading" className="mt-16">
              <h2 id="peers-heading" className="text-2xl font-bold tracking-tight">
                More from {talent.gen}
              </h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {genPeers.map((peer) => (
                  <li key={peer.slug}>
                    <Link
                      href={`/wiki/talents/${peer.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-950/10 bg-white/80 px-3.5 py-1.5 text-sm font-medium text-zinc-700 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-holo-purple/40 hover:text-holo-purple"
                    >
                      <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: peer.color }} />
                      {peer.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
