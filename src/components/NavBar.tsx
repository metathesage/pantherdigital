"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import AuthDialog from "@/components/AuthDialog";
import { useAuthStore } from "@/lib/auth";
import { TOP_NAV, ALL_PAGES } from "@/constants/pages";

const labelEnhance = (label: string) => {
  const m: Record<string, string> = {
    Home: "🏠 Home",
    App: "📊 App",
    "Bot Desk": "🤖 Bot Desk",
    Waifus: "🐆 Waifus",
    Portfolio: "💼 Portfolio",
    Search: "🔍 Search",
    Wiki: "📖 Wiki",
    "Collecting Guide": "🎒 Collecting",
    "Waifus Guide": "🐾 Waifus Guide",
    Product: "💎 Product",
    "Desktop Apps": "💻 Desktop",
    "Fan Art": "🎨 Fan Art",
    About: "ℹ️ About",
    Avatar: "👤 Avatar",
    Bios: "👥 Bios",
  };
  return m[label] || label;
};

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signOut = useAuthStore((s) => s.signOut);
  const menuRef = useRef<HTMLDivElement>(null);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#00FF88]/15 bg-[#080C0B]/85 backdrop-blur-xl">
        <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img src="/p_monogram_icon.png" alt="PNTHR DGTL" className="size-9 rounded-xl object-contain bg-black border border-white/10 shadow-lg group-hover:shadow-[#00FF88]/20 transition-shadow" />
            <span className="leading-tight">
              <span className="block text-[17px] font-black tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                PNTHR<span className="text-[#00FF88]">DGTL</span>
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 lg:block">
                Panther Digital
              </span>
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-sm mx-auto">
            <SearchBar />
          </div>

          <ul className="ml-auto hidden items-center gap-0.5 lg:flex">
            {TOP_NAV.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    title={link.desc}
                    className={`relative rounded-lg px-3 py-2 text-[13px] font-semibold tracking-wide transition-colors ${
                      active ? "text-[#00FF88] bg-[#00FF88]/10" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {labelEnhance(link.label)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="relative ml-auto lg:ml-0" ref={menuRef}>
            {!hydrated ? (
              <span className="block h-9 w-20 animate-pulse rounded-full bg-white/10" aria-hidden />
            ) : user ? (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:bg-white"
              >
                <span className="grid size-8 place-items-center rounded-full bg-[#080C0B] text-sm font-black text-[#00FF88] border border-[#00FF88]/20">
                  {(user.name.replace(/^@/, "")[0] ?? "?").toUpperCase()}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-semibold text-zinc-800 sm:block">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-full bg-[#00FF88] px-5 py-2 text-sm font-black text-black shadow-lg shadow-[#00FF88]/20 hover:bg-[#B6FFBB] transition-colors"
              >
                Sign in
              </button>
            )}
            {user && menuOpen && (
              <div role="menu" className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1A18] shadow-xl">
                <p className="border-b border-white/5 px-4 py-3 text-xs text-white/40">
                  via {user.provider === "x" ? "X" : "email"}
                  <span className="block truncate font-medium text-white/70">{user.identifier}</span>
                </p>
                <Link href="/portfolio" role="menuitem" className="block px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-[#00FF88]">Portfolio</Link>
                <Link href="/waifus" role="menuitem" className="block px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-[#00FF88]">Waifus</Link>
                <button role="menuitem" type="button" onClick={() => { signOut(); setMenuOpen(false); }} className="block w-full border-t border-white/5 px-4 py-2.5 text-left text-sm font-medium text-white/40 hover:bg-white/5">Sign out</button>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-nav" className="grid size-10 place-items-center rounded-xl bg-white/5 text-white lg:hidden">
            <span className="sr-only">Toggle navigation</span>
            <svg viewBox="0 0 24 24" fill="none" className="size-5">{open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}</svg>
          </button>
        </nav>
      </header>

      {open && (
        <div id="mobile-nav" className="border-t border-white/10 bg-[#080C0B] px-4 pb-4 pt-2 lg:hidden">
          <div className="mb-3"><SearchBar /></div>
          <ul className="grid gap-1">
            {ALL_PAGES.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium text-white/80 hover:bg-white/5 hover:text-white">
                  <span>{labelEnhance(link.label)}</span>
                  <span className="text-[11px] text-white/30">{link.group}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </>
  );
}
