import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-white/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold tracking-tight">
            Holo<span className="text-gradient">Hub</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
            A fast, fan-made database and visual index for the hololive
            OFFICIAL CARD GAME.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Explore
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/sets" className="text-zinc-600 hover:text-holo-blue">All Sets</Link></li>
            <li><Link href="/releases" className="text-zinc-600 hover:text-holo-blue">Release Dates</Link></li>
            <li><Link href="/search" className="text-zinc-600 hover:text-holo-blue">Card Browser</Link></li>
            <li><Link href="/wiki" className="text-zinc-600 hover:text-holo-blue">Wiki</Link></li>
            <li><Link href="/about" className="text-zinc-600 hover:text-holo-blue">About</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Disclaimer
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Fan-made project for demonstration purposes. Not affiliated with
            or endorsed by Cover Corp or hololive production. Card data is
            placeholder sample content.
          </p>
        </div>
      </div>
    </footer>
  );
}
