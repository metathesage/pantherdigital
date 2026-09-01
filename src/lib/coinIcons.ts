export const robinhoodIcons = {
  CASHCAT: "/icons/marble/robinhood/cashcat_1024.png",
  VIRTUAL: "/icons/marble/robinhood/virtual_1024.png",
  BYCOCKET: "/icons/marble/robinhood/bycocket_1024.png",
  WOOD: "/icons/marble/robinhood/wood_1024.png",
  JUGGERNAUT: "/icons/marble/robinhood/juggernaut_1024.png",
  ARROW: "/icons/marble/robinhood/arrow_1024.png",
  DIH: "/icons/marble/robinhood/dih_1024.png",
  HOODRAT: "/icons/marble/robinhood/hoodrat_1024.png",
  ELVES: "/icons/marble/robinhood/elves_1024.png",
  HOODKITTY: "/icons/marble/robinhood/hoodkitty_1024.png",
} as const;

export type RobinhoodSymbol = keyof typeof robinhoodIcons;

export function getMarbleIcon(sym: string) {
  const key = sym.toUpperCase() as RobinhoodSymbol;
  return (robinhoodIcons as Record<string, string>)[key] || `/icons/marble/${sym.toLowerCase()}_1024.png`;
}

export function getCoinIcon(sym: string, fallback?: string) {
  const marble = getMarbleIcon(sym);
  // marble exists for robinhood set; otherwise use CoinGecko fallback
  if (marble.includes("/robinhood/") && (robinhoodIcons as Record<string, string>)[sym.toUpperCase()]) return marble;
  return fallback || marble;
}
