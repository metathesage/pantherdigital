export const ALL_PAGES = [
  { href: "/", label: "Home", group: "Main", desc: "Landing & latest" },
  { href: "/sets", label: "Sets", group: "Cards", desc: "Card game expansions" },
  { href: "/releases", label: "Releases", group: "Cards", desc: "Release schedule" },
  { href: "/search", label: "Card Browser", group: "Cards", desc: "Browse card database" },
  { href: "/waifus", label: "Waifus", group: "Content", desc: "Character gallery" },
  { href: "/wiki", label: "Wiki", group: "Content", desc: "Rules & talents" },
  { href: "/wiki/collecting", label: "Collecting Guide", group: "Content", desc: "How to collect" },
  { href: "/wiki/waifus", label: "Waifus Guide", group: "Content", desc: "Character wiki" },
  { href: "/app", label: "App", group: "Main", desc: "Main dashboard" },
  { href: "/avatar", label: "Avatar", group: "Main", desc: "Profile avatar" },
  { href: "/bio", label: "Bios", group: "Main", desc: "Character bios" },
  { href: "/bot", label: "Bot Desk", group: "Main", desc: "Bot utilities" },
  { href: "/cards", label: "Cards", group: "Cards", desc: "Card overview" },
  { href: "/decks", label: "Decks", group: "Play", desc: "Build & save decks" },
  { href: "/packs", label: "Pack Simulator", group: "Play", desc: "Open packs" },
  { href: "/collection", label: "Collection", group: "Play", desc: "Your cards" },
  { href: "/portfolio", label: "Portfolio", group: "Play", desc: "Your portfolio" },
  { href: "/fan-art", label: "Fan Art", group: "Community", desc: "Community art" },
  { href: "/about", label: "About", group: "Info", desc: "Project info" },
] as const;

export const NAV_GROUPS = ["Main", "Cards", "Content", "Play", "Community", "Info"] as const;

export const TOP_NAV = ALL_PAGES.filter((p) =>
  ["/", "/sets", "/releases", "/search", "/waifus", "/wiki", "/decks", "/packs", "/collection", "/fan-art", "/app", "/avatar", "/bio", "/bot", "/cards", "/portfolio"].includes(p.href)
);
