"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import AuthDialog from "@/components/AuthDialog";
import { useAuthStore } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/sets", label: "Sets" },
  { href: "/releases", label: "Releases" },
  { href: "/search", label: "Cards" },
  { href: "/decks", label: "Decks" },
  { href: "/packs", label: "Packs" },
  { href: "/collection", label: "Collection" },
  { href: "/fan-art", label: "Fan Art" },
  { href: "/wiki", label: "Wiki" },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const menuRef = useRef<HTMLDivElement>(null);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-sky-950/10 bg-white/70 backdrop-blur-md">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6"
        >
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-holo-blue via-holo-purple to-holo-pink text-white shadow-lg shadow-holo-blue/30"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M12 3l7.5 4.2v9.6L12 21l-7.5-4.2V7.2L12 3z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight">
                Holo<span className="text-gradient">Hub</span>
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wider text-zinc-400 lg:block">
                Fan-made hololive TCG hub
              </span>
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-sm mx-auto">
            <SearchBar />
          </div>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:text-holo-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue ${
                      active ? "text-holo-blue" : "text-zinc-600"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-holo-blue to-holo-pink"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Auth area */}
          <div className="relative ml-auto lg:ml-0" ref={menuRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-sky-950/10 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-holo-cyan to-holo-purple text-sm font-black text-white">
                  {(user.name.replace(/^@/, "")[0] ?? "?").toUpperCase()}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-semibold text-zinc-700 sm:block">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="btn-shine rounded-xl bg-gradient-to-r from-holo-blue to-holo-purple px-4 py-2 text-sm font-bold text-white shadow-md shadow-holo-blue/30 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Sign in
              </button>
            )}

            {user && menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-sky-950/10 bg-white shadow-xl animate-pop"
              >
                <p className="border-b border-sky-950/5 px-4 py-2.5 text-xs text-zinc-400">
                  Signed in via {user.provider === "x" ? "X" : "email"}
                  <span className="block truncate font-medium text-zinc-500">{user.identifier}</span>
                </p>
                <Link href="/decks" role="menuitem" className="block px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-holo-blue/5 hover:text-holo-blue">
                  My Decks
                </Link>
                <Link href="/collection" role="menuitem" className="block px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-holo-pink/5 hover:text-holo-pink">
                  My Collection
                </Link>
                <Link href="/packs" role="menuitem" className="block px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-holo-purple/5 hover:text-holo-purple">
                  Pack Simulator
                </Link>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="block w-full border-t border-sky-950/5 px-4 py-2.5 text-left text-sm font-medium text-zinc-500 hover:bg-black/[0.03]"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="grid size-10 place-items-center rounded-lg text-zinc-700 hover:bg-black/5 lg:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>

        {open && (
          <div id="mobile-nav" className="border-t border-sky-950/10 bg-white px-4 pb-4 pt-2 lg:hidden animate-fade-up">
            <div className="mb-3">
              <SearchBar />
            </div>
            <ul className="grid gap-1">
              {[...NAV_LINKS, { href: "/about", label: "About" }].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2.5 text-base font-medium text-zinc-700 hover:bg-black/5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </>
  );
}
