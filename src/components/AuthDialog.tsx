"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/auth";

/**
 * Sign-in dialog with X / email options.
 * Demo build: profiles persist on this device. The User shape mirrors an
 * OAuth session so NextAuth (X provider + email) can replace this 1:1.
 */
export default function AuthDialog({ onClose }: { onClose: () => void }) {
  const signIn = useAuthStore((s) => s.signIn);
  const [mode, setMode] = useState<"x" | "email">("x");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submitX(event: React.FormEvent) {
    event.preventDefault();
    const clean = handle.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{2,15}$/.test(clean)) {
      setError("Enter a valid X handle (letters, numbers, underscores).");
      return;
    }
    signIn({
      id: `x:${clean.toLowerCase()}`,
      name: `@${clean}`,
      identifier: `x:${clean.toLowerCase()}`,
      provider: "x",
    });
    onClose();
  }

  function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a display name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email doesn’t look right.");
      return;
    }
    signIn({
      id: `email:${email.trim().toLowerCase()}`,
      name: name.trim(),
      identifier: email.trim().toLowerCase(),
      provider: "email",
    });
    onClose();
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-sky-950/15 bg-white px-3.5 text-sm outline-none transition focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      className="fixed inset-0 z-[110] grid place-items-center bg-sky-950/60 p-4 backdrop-blur-sm animate-pop"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold tracking-tight">
          Join the <span className="text-gradient">stage</span>
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Save decks, checklists and your portfolio.{" "}
          <span className="font-medium text-zinc-500">
            Stored on this device in the demo build — plug in real X/email
            OAuth for production.
          </span>
        </p>

        <div className="mt-4 flex rounded-xl bg-black/[0.04] p-1 text-sm font-semibold">
          {(["x", "email"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setError(null);
              }}
              aria-pressed={mode === tab}
              className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
                mode === tab
                  ? "bg-white shadow text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab === "x" ? "X (Twitter)" : "Email"}
            </button>
          ))}
        </div>

        {mode === "x" ? (
          <form onSubmit={submitX} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Handle
              </span>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-400">@</span>
                <input
                  autoFocus
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="hololivefan"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Continue with X
            </button>
          </form>
        ) : (
          <form onSubmit={submitEmail} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Display name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pekora Enjoyer"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple py-3 text-sm font-bold text-white shadow-md shadow-holo-blue/30 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Continue with Email
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-holo-pink">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 hover:bg-black/[0.04]"
        >
          Maybe later — I’ll browse as guest
        </button>
      </div>
    </div>
  );
}
