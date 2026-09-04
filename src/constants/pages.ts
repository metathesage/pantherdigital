export const ALL_PAGES = [
  { href: "/", label: "Home", group: "Main", desc: "AI-powered crypto radar with real-time data" },
  { href: "/sets", label: "Sets", group: "Cards", desc: "Token categories and classification" },
  { href: "/releases", label: "Releases", group: "Cards", desc: "New token listings and alerts" },
  { href: "/search", label: "Card Browser", group: "Cards", desc: "Search and filter all cryptocurrencies" },
  { href: "/waifus", label: "Waifus", group: "Content", desc: "Panther Digital AI agent squad" },
  { href: "/wiki", label: "Wiki", group: "Content", desc: "Trading guides, DeFi explained, alpha strategies" },
  { href: "/wiki/collecting", label: "Collecting Guide", group: "Content", desc: "How to build and manage your portfolio" },
  { href: "/wiki/waifus", label: "Waifus Guide", group: "Content", desc: "Meet the Panther Digital AI agents" },
  { href: "/app", label: "App", group: "Main", desc: "Main dashboard with AI analysis and alerts" },
  { href: "/avatar", label: "Avatar", group: "Main", desc: "Profile customization and settings" },
  { href: "/bio", label: "Bios", group: "Main", desc: "Team and agent profiles" },
  { href: "/bot", label: "Bot Desk", group: "Main", desc: "Paper trading console and strategy tester" },
  { href: "/cards", label: "Cards", group: "Cards", desc: "Overview of all tracked tokens" },
  { href: "/decks", label: "Decks", group: "Play", desc: "Build and save token watchlists" },
  { href: "/packs", label: "Pack Simulator", group: "Play", desc: "Simulate token pack openings" },
  { href: "/collection", label: "Collection", group: "Play", desc: "Your tracked tokens and performance" },
  { href: "/portfolio", label: "Portfolio", group: "Play", desc: "Real on-chain portfolio tracker" },
  { href: "/fan-art", label: "Fan Art", group: "Community", desc: "Community creations and submissions" },
  { href: "/about", label: "About", group: "Info", desc: "Project information and roadmap" },
] as const;

export const NAV_GROUPS = ["Main", "Cards", "Content", "Play", "Community", "Info"] as const;

export const TOP_NAV = ALL_PAGES.filter((p) =>
  [
    "/",
    "/sets",
    "/releases",
    "/search",
    "/waifus",
    "/wiki",
    "/decks",
    "/packs",
    "/collection",
    "/fan-art",
    "/app",
    "/avatar",
    "/bio",
    "/bot",
    "/cards",
    "/portfolio",
  ].includes(p.href)
);