import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getSets } from "@/lib/data";
import { formatDate, todayIso } from "@/lib/meta";

export const metadata: Metadata = {
  title: "Releases — PNTHR DGTL",
  description: "Panther Digital releases and product updates.",
};

function groupKey(iso: string | null): string {
  return iso ? iso.slice(0, 7) : "tba";
}

export default function ReleasesPage() {
  const today = todayIso();
  const sets = getSets();

  const upcoming = sets.filter((s) => s.releaseDate && s.releaseDate > today);
  const released = sets.filter((s) => !s.releaseDate || s.releaseDate <= today);

  const groups = new Map<string, typeof sets>();
  for (const set of released) {
    const key = groupKey(set.releaseDate);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(set);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Release Dates
        </h1>
        <p className="mt-2 max-w-xl text-zinc-500">
          Every official EN product, newest first. Upcoming releases are
          announced by COVER — dates can shift.
        </p>
      </Reveal>

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mt-10">
          <h2 id="upcoming-heading" className="text-xl font-bold tracking-tight">
            Upcoming
          </h2>
          <ul className="mt-4 space-y-3">
            {upcoming.map((set) => (
              <li key={set.id}>
                <ReleaseRow set={set} highlight />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 space-y-12">
        {sortedGroups.map(([key, groupSets]) => (
          <section key={key} aria-labelledby={`rel-${key}`} >
            <Reveal>
              <h2 id={`rel-${key}`} className="text-xl font-bold tracking-tight">
                {key === "tba"
                  ? "Date TBA"
                  : new Date(`${key}-15T00:00:00Z`).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
              </h2>
              <ul className="mt-4 space-y-3">
                {groupSets.map((set) => (
                  <li key={set.id}>
                    <ReleaseRow set={set} />
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
        ))}
      </div>
    </div>
  );
}

function ReleaseRow({ set, highlight = false }: { set: ReturnType<typeof getSets>[number]; highlight?: boolean }) {
  return (
    <Link
      href={`/sets/${set.id}`}
      className={`group flex items-center gap-4 rounded-2xl border bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
        highlight
          ? "border-holo-gold/40 hover:border-holo-gold"
          : "border-black/8 hover:border-holo-blue/30"
      }`}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-50 ring-1 ring-black/5">
        {set.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={set.coverImage} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-mono text-[10px] font-bold text-zinc-400">{set.code}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-800 group-hover:text-holo-blue">
          {set.name}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {formatDate(set.releaseDate)} · {set.category} · {set.totalCards} cards
        </p>
      </div>
      {highlight ? (
        <span className="shrink-0 rounded-full bg-holo-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-holo-gold">
          Upcoming
        </span>
      ) : null}
      <span aria-hidden className="hidden shrink-0 text-lg text-zinc-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-holo-blue sm:block">→</span>
    </Link>
  );
}
