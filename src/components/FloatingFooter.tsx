import Link from "next/link";
import { cards, getSets } from "@/lib/data";

/**
 * Small floating description pill (bottom-right on desktop) that doubles as
 * the site intro now that the home hero is gone.
 */
export default function FloatingFooter() {
  const sets = getSets();
  return (
    <aside
      aria-label="About this site"
      className="glass fixed bottom-4 right-4 z-40 hidden max-w-[240px] rounded-2xl p-4 md:block"
    >
      <p className="text-xs leading-relaxed text-zinc-600">
        <span className="font-bold text-zinc-800">
          Holo<span className="text-gradient">Hub</span>
        </span>{" "}
        — a fan-made database of the hololive OFFICIAL CARD GAME:{" "}
        <strong>{cards.length.toLocaleString()}</strong> real cards across{" "}
        <strong>{sets.length}</strong> products, scraped from the official EN
        card list.
      </p>
      <div className="mt-2.5 flex gap-3 text-xs font-semibold">
        <Link href="/about" className="text-holo-blue hover:underline">
          About
        </Link>
        <Link href="/wiki" className="text-holo-purple hover:underline">
          Wiki
        </Link>
        <a
          href="https://en.hololive-official-cardgame.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-600"
        >
          Official ↗
        </a>
      </div>
    </aside>
  );
}
