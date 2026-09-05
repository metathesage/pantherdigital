"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-bold tracking-[0.3em] text-amber-400">SIGNAL LOST</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">The trail went dark</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {error.message || "PNTHR DGTL lost the signal on this page. The hunt continues."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-amber-400/60 hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
