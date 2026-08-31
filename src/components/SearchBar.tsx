"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { suggest } from "@/lib/data";

export default function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => (query.trim().length >= 2 ? suggest(query) : []),
    [query]
  );

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open && event.key === "ArrowDown" && results.length) {
      setOpen(true);
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter": {
        event.preventDefault();
        const picked = results[activeIndex];
        if (picked) {
          go(picked.kind === "card" ? `/cards/${picked.id}` : `/sets/${picked.id}`);
        } else if (query.trim()) {
          go(`/search?q=${encodeURIComponent(query.trim())}`);
        }
        break;
      }
      case "Escape":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label="Search cards and sets"
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search cards, talents, sets…"
          className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-black/8 bg-white shadow-xl shadow-zinc-900/10 animate-pop"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-zinc-500">No matches found.</li>
          )}
          {results.map((item, index) => {
            const href =
              item.kind === "card" ? `/cards/${item.id}` : `/sets/${item.id}`;
            return (
              <li key={`${item.kind}-${item.id}`} role="option" aria-selected={index === activeIndex}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                    index === activeIndex ? "bg-holo-blue/5" : ""
                  }`}
                >
                  <span className="truncate font-medium text-zinc-800">{item.label}</span>
                  <span className="shrink-0 text-xs text-zinc-400">{item.sublabel}</span>
                </Link>
              </li>
            );
          })}
          {results.length > 0 && (
            <li className="border-t border-black/5">
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-holo-blue hover:bg-holo-blue/5"
              >
                See all results for “{query.trim()}”
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
