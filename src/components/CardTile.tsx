import Link from "next/link";
import CardImage, { RarityBadge } from "@/components/CardImage";
import type { TcgCard } from "@/types";
import { colorHex, colorTokens } from "@/lib/meta";

export default function CardTile({ card }: { card: TcgCard }) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="card-hoverable group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue"
      aria-label={`${card.name ?? card.cardNumber}, ${card.rarity ?? ""} ${card.type}`}
    >
      <div className="card-frame relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm ring-1 ring-sky-950/10">
        <div className="shine absolute inset-0 z-[3] rounded-2xl" aria-hidden />
        <CardImage
          src={card.imageUrl}
          alt={card.name ?? card.cardNumber}
          seed={card.cardNumber}
          title={card.name ?? card.cardNumber}
          subtitle={card.type}
          rarity={card.rarity}
          colorList={colorTokens(card.color)}
          className="block aspect-[300/420] w-full object-cover"
        />
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <RarityBadge rarity={card.rarity} />
        </div>
        {colorTokens(card.color).map((token) => (
          <span
            key={token}
            aria-hidden
            title={token}
            className="absolute right-2.5 top-3 size-3.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: colorHex(token) }}
          />
        ))}
        <div className="border-t border-sky-950/5 bg-white/85 px-3 py-2">
          <p className="truncate text-sm font-semibold text-zinc-800">
            {card.name ?? card.cardNumber}
          </p>
          <p className="truncate text-xs text-zinc-400">
            {[card.bloomLevel, card.hp != null ? `HP ${card.hp}` : card.life != null ? `Life ${card.life}` : null]
              .filter(Boolean)
              .join(" · ") || card.type}
          </p>
        </div>
      </div>
    </Link>
  );
}
