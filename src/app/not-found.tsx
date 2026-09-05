import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4 py-16 text-center">
      <div className="animate-fade-up">
        <p className="font-mono text-xs font-medium tracking-widest text-zinc-500 uppercase">
          ERR 404 — route not found
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-zinc-100 sm:text-6xl">
          Lost in the void.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-zinc-400">
          This card slipped out of the binder — reprinted under a different
          number, or never pulled at all.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-[#5e6ad2] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#828fff]"
          >
            Back to base
          </Link>
          <Link
            href="/wiki"
            className="rounded-md border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
          >
            Wiki
          </Link>
        </div>
        <p className="mt-6 font-mono text-[11px] text-zinc-600">
          tip: press <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">/</kbd> to search your way back
        </p>
      </div>
    </div>
  );
}
