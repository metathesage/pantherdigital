export const ALL_PAGES = [
  { href: "/", label: "Home", group: "Main", desc: "AI-powered crypto radar with real-time data" },
  { href: "/app", label: "App", group: "Main", desc: "Main dashboard with AI analysis and alerts" },
  { href: "/bot", label: "Bot Desk", group: "Main", desc: "Paper trading console and strategy tester" },
  { href: "/portfolio", label: "Portfolio", group: "Main", desc: "Real on-chain portfolio tracker" },
  { href: "/waifus", label: "Waifus", group: "Panther", desc: "Panther Digital AI agent squad" },
  { href: "/avatar", label: "Avatar", group: "Panther", desc: "Profile customization and settings" },
  { href: "/bio", label: "Bios", group: "Panther", desc: "Team and agent profiles" },
  { href: "/search", label: "Search", group: "Discover", desc: "Search and filter all cryptocurrencies" },
  { href: "/wiki", label: "Wiki", group: "Discover", desc: "Trading guides, DeFi explained, alpha strategies" },
  { href: "/wiki/collecting", label: "Collecting Guide", group: "Discover", desc: "How to build and manage your portfolio" },
  { href: "/wiki/waifus", label: "Waifus Guide", group: "Discover", desc: "Meet the Panther Digital AI agents" },
  { href: "/product", label: "Product", group: "Discover", desc: "Subscription plans and referral program" },
  { href: "/desktop", label: "Desktop Apps", group: "Discover", desc: "Waifu dashboard and bot trading terminal" },
  { href: "/fan-art", label: "Fan Art", group: "Community", desc: "Community creations and submissions" },
  { href: "/about", label: "About", group: "Info", desc: "Project information and roadmap" },
] as const;

export const NAV_GROUPS = ["Main", "Panther", "Discover", "Community", "Info"] as const;

// Desktop top-nav subset (mobile menu + footer use ALL_PAGES).
export const TOP_NAV = ALL_PAGES.filter((p) =>
  ["/", "/app", "/bot", "/waifus", "/portfolio", "/product", "/wiki", "/about"].includes(p.href)
);
