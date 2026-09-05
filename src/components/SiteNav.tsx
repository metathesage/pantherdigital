"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSfx } from "@/lib/sfx";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/app", label: "Radar" },
  { href: "/matrix", label: "Matrix" },
  { href: "/portfolio", label: "X-Ray" },
  { href: "/sets", label: "Sets" },
  { href: "/packs", label: "Packs" },
  { href: "/decks", label: "Decks" },
  { href: "/collection", label: "Collection" },
  { href: "/search", label: "Cards" },
  { href: "/releases", label: "Releases" },
  { href: "/fan-art", label: "Fan Art" },
  { href: "/wiki", label: "Wiki" },
  { href: "/about", label: "About" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  return (
    <nav aria-label="Site" className="sticky top-[64px] z-40 border-b border-[#E8E8E8] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-1.5 overflow-x-auto px-3 py-2 sm:px-6 [scrollbar-width:thin]">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            onClick={() => playSfx('click')}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]
              ${isActive(p.href)
                ? "border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-sm"
                : "border-transparent text-[#4A4A4A] hover:border-[#E8E8E8] hover:bg-[#F8F8F7] hover:text-[#0A0A0A]"
              }`}
          >
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}