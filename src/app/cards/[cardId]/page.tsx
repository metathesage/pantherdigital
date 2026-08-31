import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CardViewer from "@/components/CardViewer";
import CardTile from "@/components/CardTile";
import Reveal from "@/components/Reveal";
import { RarityBadge } from "@/components/CardImage";
import { WishlistButton, CollectionButton } from "@/components/CollectionButton";
import { cards, getCardById, getSetById } from "@/lib/data";
import { colorHex, colorLabel, colorTokens, formatDate, rarityOrder } from "@/lib/meta";
import MarketPanel from "@/components/MarketPanel";
import PopChart from "@/components/PopChart";

interface Props {
  params: Promise<{ cardId: string }>;
}

export function generateStaticParams() {
  return cards.map((card) => ({ cardId: card.id }));
}

async function getCard(params: Props["params"]) {
  const { cardId } = await params;
  return getCardById(cardId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard(params);
  if (!card) return { title: "Card not found" };
  return {
    title: `${card.name ?? card.cardNumber} (${card.cardNumber})`,
    description: `${card.rarity ?? ""} ${card.type} · hololive OFFICIAL CARD GAME`,
  };
}

function skillStyle(kind: string): string {
  if (kind.includes("oshi")) return "border-l-holo-gold bg-amber-50/40";
  if (kind.includes("arts")) return "border-l-holo-pink bg-rose-50/40";
  if (kind.includes("keyword")) return "border-l-holo-purple bg-violet-50/40";
  return "border-l-holo-blue bg-white";
}

export default async function CardPage({ params }: Props) {
  const card = await getCard(params);
  if (!card) notFound();

  const set = getSetById(card.setId);

  // Related: shared tags first (real data), then same-set high rarities.
  const related = cards
    .filter((c) => c.id !== card.id)
    .map((c) => {
      let score = 0;
      score += c.tags.filter((t) => card.tags.includes(t)).length * 3;
      if (c.setId === card.setId) score += 2;
      score += rarityOrder(c.rarity) / 100;
      return { c, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.c.cardNumber.localeCompare(b.c.cardNumber, "en", { numeric: true })
    )
    .slice(0, 10)
    .map(({ c }) => c);
  const stats: Array<[string, string | number | null]> = [
    ["HP", card.hp],
    ["Life", card.life],
    ["Bloom Level", card.bloomLevel],
    ["Baton Pass", card.batonPass === null ? null : card.batonPass ? "Yes" : "No"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
        <Link href="/sets" className="hover:text-holo-blue hover:underline">Sets</Link>
        {set && (
          <>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/sets/${set.id}`} className="hover:text-holo-blue hover:underline">
              {set.code}
            </Link>
          </>
        )}
        <span aria-hidden className="mx-2">/</span>
        <span className="font-mono text-zinc-500">{card.cardNumber}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Image column */}
        <div>
          <CardViewer card={card} />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <CollectionButton cardId={card.id} />
            <WishlistButton cardId={card.id} />
          </div>
          <p className="mt-4 text-center text-xs text-zinc-400">
            Image © COVER ·{" "}
            <a
              href={card.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-holo-blue hover:underline"
            >
              Official card page
            </a>
          </p>
        </div>

        {/* Info column */}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest text-zinc-400">
            {card.cardNumber}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {card.name ?? card.cardNumber}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-black/5 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
              {card.type}
            </span>
            <RarityBadge rarity={card.rarity} />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-600">
              {colorTokens(card.color).map((token) => (
                <span
                  key={token}
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: colorHex(token) }}
                />
              ))}
              {colorLabel(card.color)}
            </span>
          </div>

          {stats.some(([, value]) => value !== null && value !== "") && (
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats
                .filter(([, value]) => value !== null && value !== "")
                .map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-black/8 bg-white px-3 py-2.5 text-center shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-zinc-800">
                      {value as string | number}
                    </dd>
                  </div>
                ))}
            </dl>
          )}

          {/* Skills & effects */}
          {card.skills.length > 0 && (
            <section aria-label="Skills and effects" className="mt-6 space-y-3">
              {card.skills.map((skill, index) => (
                <div
                  key={`${skill.kind}-${index}`}
                  className={`rounded-r-xl border-l-4 p-4 shadow-sm ring-1 ring-black/5 ${skillStyle(skill.kind)}`}
                >
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {skill.heading || skill.kind}
                  </h2>
                  <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-zinc-700">
                    {skill.body}
                  </p>
                </div>
              ))}
            </section>
          )}

          {card.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-holo-purple/10 hover:text-holo-purple"
                >
                  #{tag.replace(/\s+/g, "")}
                </Link>
              ))}
            </div>
          )}

          {/* Market & grading */}
          <MarketPanel card={card} />
          <div className="mt-4">
            <PopChart rarity={card.rarity} cardNumber={card.cardNumber} />
          </div>

          {set && (
            <Link
              href={`/sets/${set.id}`}
              className="group mt-6 flex items-center justify-between gap-4 rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-holo-blue/30 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {set.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={set.coverImage} alt="" loading="lazy" className="h-14 w-auto rounded-lg shadow" />
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    From this set
                  </p>
                  <p className="mt-0.5 font-semibold text-zinc-800 group-hover:text-holo-blue">
                    {set.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(set.releaseDate)} · {set.code}
                  </p>
                </div>
              </div>
              <span aria-hidden className="text-xl text-zinc-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-holo-blue">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-20">
          <Reveal>
            <h2 id="related-heading" className="text-2xl font-bold tracking-tight">
              Related Cards
            </h2>
            <ul className="snap-row mt-6 flex snap-x gap-4 overflow-x-auto pb-4">
              {related.map((rel) => (
                <li key={rel.id} className="w-40 shrink-0 snap-start sm:w-44">
                  <CardTile card={rel} />
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}
    </div>
  );
}
