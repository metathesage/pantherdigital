import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import talentsJson from "@/data/wiki/talents.json";
import glossaryJson from "@/data/wiki/glossary.json";
import milestonesJson from "@/data/wiki/milestones.json";

export const metadata: Metadata = {
  title: "Wiki",
  description:
    "hololive wiki: generations and talents, game glossary, lore timeline, and a collecting guide for the hololive OFFICIAL CARD GAME.",
};

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
const glossary = glossaryJson as Array<{ term: string; definition: string }>;
const milestones = milestonesJson as Array<{ year: string; label: string; detail: string }>;

const GEN_ORDER = [
  "Gen 0",
  "Gen 1",
  "Gen 2",
  "GAMERS",
  "Gen 3 · hololive Fantasy",
  "Gen 4 · hololive Force",
  "Gen 5 · NePoLaBo",
  "holoX",
  "Myth",
  "Promise",
  "Advent",
  "Justice",
  "Area 15",
  "HOLORO",
  "holoh3ro",
  "ReGLOSS",
  "Flow Glow",
];

export default function WikiPage() {
  const groups = new Map<string, Talent[]>();
  for (const talent of talents) {
    const key = talent.gen;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(talent);
  }
  const sortedGroups = [...groups.entries()].sort(
    (a, b) => GEN_ORDER.indexOf(a[0]) - GEN_ORDER.indexOf(b[0])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          holo<span className="text-gradient">Wiki</span>
        </h1>
        <p className="mt-2 max-w-xl text-zinc-500">
          Generations, talents, game mechanics, lore milestones, and how to
          collect — everything around the cards.
        </p>
      </Reveal>

      {/* Quick links */}
      <Reveal delay={60}>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { href: "#generations", title: "Generations", desc: `${talents.length} talents across ${sortedGroups.length} units` },
            { href: "#glossary", title: "Game Glossary", desc: "How the TCG actually works" },
            { href: "#timeline", title: "Lore Timeline", desc: "2017 → today" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="glass rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="font-bold text-zinc-800">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
            </a>
          ))}
        </div>
      </Reveal>

      {/* Generations */}
      <section id="generations" aria-labelledby="gen-heading" className="mt-16 scroll-mt-24">
        <h2 id="gen-heading" className="text-2xl font-bold tracking-tight">Generations & Talents</h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Tap any talent for their profile and every card they appear on. Unit
          and alternate-art cards (miComet, SorAZ, FUWAMOCO, Magical Girls,
          LAMBDUCK…) appear under their members’ pages.
        </p>
        <div className="mt-6 space-y-8">
          {sortedGroups.map(([gen, members]) => (
            <Reveal key={gen}>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-zinc-800">{gen}</h3>
                  <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-holo-blue/30 to-transparent" />
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {members.map((member) => (
                    <li key={member.slug}>
                      <Link
                        href={`/wiki/talents/${member.slug}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
                          member.status === "graduated"
                            ? "border-black/10 bg-black/[0.03] text-zinc-400 line-through decoration-holo-pink/50"
                            : "border-sky-950/10 bg-white/80 text-zinc-700 hover:border-holo-blue/40 hover:text-holo-blue backdrop-blur"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        {member.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section id="glossary" aria-labelledby="glossary-heading" className="mt-20 scroll-mt-24">
        <h2 id="glossary-heading" className="text-2xl font-bold tracking-tight">Game Glossary</h2>
        <div className="mt-6 space-y-2.5">
          {glossary.map((entry) => (
            <details key={entry.term} className="group rounded-xl border border-sky-950/10 bg-white/80 backdrop-blur">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-semibold text-zinc-800 marker:content-none">
                {entry.term}
                <span aria-hidden className="text-zinc-300 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-zinc-500">{entry.definition}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" aria-labelledby="timeline-heading" className="mt-20 scroll-mt-24">
        <h2 id="timeline-heading" className="text-2xl font-bold tracking-tight">Lore Timeline</h2>
        <ol className="relative mt-6 space-y-6 border-l-2 border-dashed border-holo-cyan/40 pl-6">
          {milestones.map((milestone, i) => (
            <li key={milestone.year} className="relative">
              <span
                aria-hidden
                className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full bg-white ring-2 ring-holo-blue/60"
              >
                <span className={i === milestones.length - 1 ? "size-2 rounded-full bg-holo-pink" : "size-2 rounded-full bg-holo-blue"} />
              </span>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-holo-blue">{milestone.year}</p>
              <p className="mt-0.5 font-semibold text-zinc-800">{milestone.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{milestone.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Collecting teaser */}
      <Reveal>
        <Link
          href="/wiki/collecting"
          className="group mt-16 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-holo-blue to-holo-purple p-6 text-white shadow-xl shadow-holo-blue/25 transition-transform duration-200 hover:-translate-y-1 sm:p-8"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">Guide</p>
            <p className="mt-1 text-xl font-extrabold">Collecting the hololive TCG</p>
            <p className="mt-1 text-sm text-white/80">
              Rarities explained, market tools, protection tips, JP vs EN editions.
            </p>
          </div>
          <span aria-hidden className="text-3xl transition-transform duration-200 group-hover:translate-x-1.5">→</span>
        </Link>
      </Reveal>
    </div>
  );
}
