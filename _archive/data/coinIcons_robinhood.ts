// Panther Digital - Full Marble Icon Map for Hermes / Muse Spark
// Drop all PNGs into /public/icons/marble/ and /public/icons/marble/robinhood/

export const MARBLE_BASE = '/icons/marble'

export const marbleIconMap: Record<string, string> = {
  // CRV HERO
  crv: 'crv_curve_single_1024.png',
  curve: 'crv_curve_single_1024.png',

  // Robinhood Chain Top 10 - LIVE from DEXTools
  cashcat: 'robinhood/cashcat_1024.png',
  virtual: 'robinhood/virtual_1024.png',
  bycocket: 'robinhood/bycocket_1024.png',
  wood: 'robinhood/wood_1024.png',
  juggernaut: 'robinhood/juggernaut_1024.png',
  arrow: 'robinhood/arrow_1024.png',
  dih: 'robinhood/dih_1024.png',
  hoodrat: 'robinhood/hoodrat_1024.png',
  elves: 'robinhood/elves_1024.png',
  hoodkitty: 'robinhood/hoodkitty_1024.png',
  
  // also uppercase versions for lookup
  CASHCAT: 'robinhood/cashcat_1024.png',
  VIRTUAL: 'robinhood/virtual_1024.png',
  BYCOCKET: 'robinhood/bycocket_1024.png',
}

export function getMarbleIcon(symbol: string): string {
  const key = symbol.toLowerCase().trim()
  const file = marbleIconMap[key] || marbleIconMap[key.toUpperCase()]
  if (file) return `${MARBLE_BASE}/${file.replace('robinhood/','robinhood/')}`
  // check if file already includes folder
  if (file?.startsWith('robinhood/')) return `${MARBLE_BASE}/${file}`
  return `${MARBLE_BASE}/panther_square_icon_1024.png`
}

// Combined with your previous top20
export const allIcons = {
  ...marbleIconMap,
  btc: 'marble_bitcoin_sculpture_cut.png',
  eth: 'exp1_ethereum_1024.png',
  sol: 'marble_solana_sculpture_cut.png',
}
