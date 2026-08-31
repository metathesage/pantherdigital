"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { newDeckId, useDeckStore } from "@/lib/decks";
import { checkDeck } from "@/lib/deckRules";
import { getCardById } from "@/lib/data";

export default function DecksPage() {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const decks = useDeckStore((s) => s.decks);
  const create = useDeckStore((s) => s.create);
  const remove = useDeckStore((s) => s.remove);
  const [newName, setNewName] = useState("");
  const ownerId = user?.id ?? "guest";
  const myDecks = decks.filter((d) => d.ownerId === ownerId);

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    create({
      id: newDeckId(),
      name: newName.trim(),
      ownerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      entries: [],
      oshi: null,
    });
    setNewName("");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Deck Builder<span className="text-gradient">.</span>
      </h1>
      <p className="mt-2 max-w-xl text-zinc-500">
        Build toward the official format: exactly 50 main-deck cards, 1 Oshi,
        respect copy limits.
      </p>

      {!mounted ? null : !user ? (
        <div className="glass mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
          <p className="text-sm text-zinc-600">
            You’re building as <strong>guest</strong> (saved on this device).
            Sign in to keep portfolios separate per account.
          </p>
          <Link
            href="/"
            className="rounded-xl border border-sky-950/15 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-holo-blue/40 hover:text-holo-blue"
          >
            Sign in from the top bar →
          </Link>
        </div>
      ) : null}

      <form onSubmit={onCreate} className="mt-8 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={40}
          placeholder={`New deck name…`}
          aria-label="New deck name"
          className="h-12 flex-1 rounded-xl border border-sky-950/15 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        />
        <button
          type="submit"
          className="btn-shine shrink-0 rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-6 text-sm font-bold text-white shadow-md shadow-holo-blue/30 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Create deck
        </button>
      </form>

      {mounted && myDecks.length > 0 && (
        <ul className="mt-8 space-y-3">
          {myDecks.map((deck) => {
            const check = checkDeck(deck, getCardById);
            return (
              <li key={deck.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-sky-950/10 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/decks/${deck.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-bold text-zinc-800 hover:text-holo-blue">
                      {deck.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {check.mainCount}/50 main ·{" "}
                      {check.oshiCount > 0 ? "Oshi chosen" : "no Oshi"} ·{" "}
                      {check.errors.length === 0 ? (
                        <span className="font-semibold text-emerald-600">legal</span>
                      ) : (
                        <span className="font-semibold text-holo-gold">
                          {check.errors.length} issue{check.errors.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </p>
                  </Link>
                  <Link
                    href={`/decks/${deck.id}`}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-4 py-2 text-xs font-bold text-white shadow transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    Open builder
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(deck.id)}
                    aria-label={`Delete ${deck.name}`}
                    className="shrink-0 rounded-lg p-2 text-zinc-300 transition-colors hover:bg-rose-50 hover:text-holo-pink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mounted && myDecks.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-sky-950/20 p-14 text-center">
          <p className="text-lg font-semibold text-zinc-700">No decks yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            Name your first deck above, then hunt cards in the built-in pool.
            Legality is checked live as you go.
          </p>
        </div>
      )}
    </div>
  );
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}
