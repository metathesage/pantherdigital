import Link from "next/link";
import type { TcgSet } from "@/types";
import { formatDate, gradientFor, todayIso } from "@/lib/meta";

const CATEGORY_LABEL: Record<string, string> = {
  booster: "Booster",
  deck: "Deck",
  accessory: "Accessory",
  promo: "Promo",
};

export function SetCard({ set }: { set: TcgSet }) {
  const [from, to] = gradientFor(set.code);
  return (
    <Link
      href={`/sets/${set.id}`}
      className="card-hoverable group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue"
      aria-label={`${set.name} (${set.code})`}
    >
      <div className="card-frame overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <div
          className="relative flex h-32 items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}
        >
          {set.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={set.coverImage}
              alt=""
              loading="lazy"
              className="max-h-full w-auto object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <span className="font-mono text-2xl font-bold tracking-widest text-white drop-shadow">
              {set.code}
            </span>
          )}
          <span className="absolute bottom-2 right-3 rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {CATEGORY_LABEL[set.category] ?? set.category}
          </span>
          {set.releaseDate && set.releaseDate > todayIso() && (
            <span className="absolute left-3 top-3 rounded-md bg-holo-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              Upcoming
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-zinc-800 transition-colors group-hover:text-holo-blue">
            {set.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span>{formatDate(set.releaseDate)}</span>
            <span className={`rounded-full px-2 py-0.5 font-semibold ${
              set.region === "JP" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"
            }`}>
              {set.region}
            </span>
            <span className="ml-auto">{set.totalCards} cards</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface TimelineProps {
  sets: TcgSet[];
}

export function Timeline({ sets }: TimelineProps) {
  const sorted = [...sets].sort((a, b) =>
    (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999")
  );

  return (
    <ol className="snap-row relative flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-5 pt-2">
      <span
        aria-hidden
        className="absolute left-0 right-0 top-[38px] h-px bg-gradient-to-r from-holo-blue/40 via-holo-purple/40 to-holo-pink/40"
      />
      {sorted.map((set) => {
        const date = set.releaseDate ? new Date(`${set.releaseDate}T00:00:00Z`) : null;
        const upcoming = set.releaseDate !== null && set.releaseDate > todayIso();
        const [, to] = gradientFor(set.code);
        return (
          <li key={set.id} className="w-64 shrink-0 snap-start">
            <p className="mb-3 pl-1 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {date
                ? date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
                : "Unannounced"}
            </p>
            <span aria-hidden className="relative mb-4 block h-3 w-3">
              <span
                className="absolute inset-0 rounded-full ring-4 ring-white"
                style={{ backgroundColor: upcoming ? "#f2a900" : to }}
              />
            </span>
            <Link
              href={`/sets/${set.id}`}
              className="group block rounded-xl border border-black/8 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-holo-purple/30 hover:shadow-lg hover:shadow-holo-purple/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-zinc-500">{set.code}</span>
                {upcoming && (
                  <span className="rounded-full bg-holo-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-holo-gold">
                    Upcoming
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 group-hover:text-holo-blue">
                {set.name}
              </h3>
              <p className="mt-2 text-xs text-zinc-400">
                {formatDate(set.releaseDate)} · {CATEGORY_LABEL[set.category] ?? set.category}
              </p>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
