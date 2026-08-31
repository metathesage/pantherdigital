export type Region = "JP" | "EN";

export type SetCategory = "booster" | "deck" | "accessory" | "promo";

/** Product/release scraped from the official EN card list. */
export interface TcgSet {
  id: string;
  code: string;
  name: string;
  category: SetCategory | string;
  region: Region;
  /** ISO date, or null when officially unannounced. */
  releaseDate: string | null;
  coverImage: string | null;
  totalCards: number;
  /** Official product page, when one exists. */
  detailUrl?: string | null;
}

/**
 * Card scraped from the official EN card list.
 * All fields are sourced verbatim from en.hololive-official-cardgame.com.
 */
export interface CardSkill {
  /** Section class on the official page, e.g. "oshi skill", "sp arts", "keyword". */
  kind: string;
  heading: string;
  body: string;
}

export interface TcgCard {
  id: string;
  officialId: number;
  setId: string;
  cardNumber: string;
  name: string;
  /** Japanese name when available (JP edition) */
  name_ja?: string | null;
  type: string;
  rarity: string | null;
  /** Single ("red") or dual ("blue_red") color token; null/empty = colorless. */
  color: string | null;
  hp: number | null;
  life: number | null;
  bloomLevel: string | null;
  batonPass: boolean | null;
  tags: string[];
  skills: CardSkill[];
  imageUrl: string | null;
  /** JP edition scan when available */
  imageUrlJP?: string | null;
  sourceUrl: string;
}
