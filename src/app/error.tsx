"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-bold tracking-[0.3em] text-[#6B6B6B]">SIGNAL LOST</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">Something slipped off the radar</h2>
        <p className="mt-2 text-sm text-[#6B6B6B]">{error.message || "An unexpected error occurred."}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            Try again
          </button>
          <Link href="/" className="rounded-full border border-[#E8E8E8] px-5 py-2.5 text-sm font-semibold hover:border-[#0A0A0A]">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
