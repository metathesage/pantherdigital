import CardTile from "@/components/CardTile";
import type { TcgCard } from "@/types";

export default function CardGrid({ cards }: { cards: TcgCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <li key={card.id}>
          <CardTile card={card} />
        </li>
      ))}
    </ul>
  );
}
