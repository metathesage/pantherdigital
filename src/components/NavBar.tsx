"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { useAuthStore } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/app", label: "Radar" },
  { href: "/coins", label: "Coins" },
  { href: "/blockchains", label: "Blockchains" },
  { href: "/nfts", label: "NFTs" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const active = (href: string) => href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return <>
    <header className="sticky top-0 z-50 border-b border-[#262a2d] bg-[#0b0d0f]/95 text-[#f7f7f5] backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/app" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-9 place-items-center overflow-hidden rounded-xl border border-[#f7f7f5] bg-[#f7f7f5] p-0.5"><img src="/panther-icon.png" alt="CoinPanther" className="size-full object-contain" /></span>
          <span className="hidden leading-tight sm:block"><span className="block text-sm font-bold tracking-[0.18em]">COINPANTHER</span><span className="block text-[9px] font-medium uppercase tracking-[0.16em] text-[#92999d]">Market intelligence</span></span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${active(link.href) ? "bg-[#f7f7f5] text-[#0b0d0f]" : "text-[#92999d] hover:bg-[#16191b] hover:text-[#f7f7f5]"}`}>{link.label}</Link>)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? <div className="relative"><button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-[#262a2d] px-2 py-1.5 text-xs font-semibold"><span className="grid size-7 place-items-center rounded-full bg-[#f7f7f5] text-[#0b0d0f]">{(user.name[0] ?? "?").toUpperCase()}</span><span className="hidden max-w-24 truncate sm:block">{user.name}</span></button>{open && <div className="absolute right-0 top-11 z-10 w-40 overflow-hidden rounded-xl border border-[#262a2d] bg-[#16191b] p-1 shadow-xl"><Link href="/portfolio" className="block rounded-lg px-3 py-2 text-sm hover:bg-[#262a2d]">Portfolio</Link><button onClick={() => { signOut(); setOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#92999d] hover:bg-[#262a2d]">Sign out</button></div>}</div> : <button onClick={() => setAuthOpen(true)} className="rounded-full bg-[#f7f7f5] px-4 py-2 text-[13px] font-bold text-[#0b0d0f] hover:bg-white">Sign in</button>}
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" className="grid size-10 place-items-center rounded-full border border-[#262a2d] md:hidden"><span className="sr-only">Toggle navigation</span><span className="text-lg">{open ? "×" : "☰"}</span></button>
        </div>
      </nav>
      {open && <div id="mobile-nav" className="border-t border-[#262a2d] bg-[#0b0d0f] px-4 py-3 md:hidden"><div className="grid gap-1">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-3 text-sm font-semibold ${active(link.href) ? "bg-[#f7f7f5] text-[#0b0d0f]" : "text-[#92999d] hover:bg-[#16191b]"}`}>{link.label}</Link>)}</div></div>}
    </header>
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
  </>;
}
