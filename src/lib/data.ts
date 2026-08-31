import setsJson from "@/data/sets.json";
import cardsJson from "@/data/cards.json";
import type { TcgCard, TcgSet } from "@/types";
import { rarityOrder, todayIso, colorTokens } from "@/lib/meta";

export const sets = setsJson as TcgSet[];
export const cards = cardsJson as TcgCard[];

const cardById = new Map(cards.map((c) => [c.id, c]));
const setById = new Map(sets.map((s) => [s.id, s]));

function compareByNumber(a: TcgCard, b: TcgCard): number {
  return a.cardNumber.localeCompare(b.cardNumber, "en", { numeric: true });
}

/** Sets sorted by release date; unannounced (null date) products last. */
export function getSets(): TcgSet[] {
  return [...sets].sort((a, b) => {
    if (!a.releaseDate && !b.releaseDate) return a.code.localeCompare(b.code);
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return b.releaseDate.localeCompare(a.releaseDate);
  });
}

export function getSetById(id: string): TcgSet | undefined {
  return setById.get(id);
}

export function getCardById(id: string): TcgCard | undefined {
  return cardById.get(id);
}

export function getCardsForSet(setId: string): TcgCard[] {
  return cards.filter((c) => c.setId === setId).sort(compareByNumber);
}

/** The most recently released expansion with cards. */
export function getLatestReleasedSet(): TcgSet | undefined {
  const today = todayIso();
  return getSets().find(
    (s) =>
      s.releaseDate !== null &&
      s.releaseDate <= today &&
      getCardsForSet(s.id).length > 0
  );
}

/**
 * Trending: top-rarity holomem pulled from the three most recently
 * released expansions — approximating what the community is opening now.
 */
export function getTrendingCards(count = 30): TcgCard[] {
  const today = todayIso();
  const recentSets = getSets()
    .filter(
      (s) =>
        s.releaseDate !== null &&
        s.releaseDate <= today &&
        getCardsForSet(s.id).length > 0
    )
    .slice(0, 3);

  if (recentSets.length === 0) return [];
  const setIdRank = new Map(recentSets.map((s, i) => [s.id, i]));

  return recentSets
    .flatMap((set) => getCardsForSet(set.id))
    .filter((card) => /holomem/i.test(card.type))
    .filter((card) => rarityOrder(card.rarity) >= rarityOrder("R"))
    .sort(
      (a, b) =>
        (setIdRank.get(a.setId) ?? 99) - (setIdRank.get(b.setId) ?? 99) ||
        rarityOrder(b.rarity) - rarityOrder(a.rarity) ||
        a.cardNumber.localeCompare(b.cardNumber, "en", { numeric: true })
    )
    .slice(0, count);
}

/** Upcoming announced releases. */
export function getUpcomingSets(): TcgSet[] {
  const today = todayIso();
  return getSets()
    .filter((s) => s.releaseDate !== null && s.releaseDate > today)
    .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

/* -------------------------------- Search ---------------------------------- */

export interface SearchOptions {
  rarity?: string[];
  type?: string[];
  color?: string[];
  year?: string;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

export function searchCards(query: string, opts: SearchOptions = {}): TcgCard[] {
  const q = normalize(query.trim());
  const terms = q.split(/\s+/).filter(Boolean);

  const results = cards.filter((card) => {
    if (opts.rarity?.length && !(card.rarity && opts.rarity.includes(card.rarity)))
      return false;
    if (opts.type?.length && !opts.type.includes(card.type)) return false;
    if (
      opts.color?.length &&
      !(card.color && opts.color.some((c) => colorMatches(card.color, c)))
    )
      return false;
    if (opts.year) {
      const set = setById.get(card.setId);
      if (!set?.releaseDate?.startsWith(opts.year)) return false;
    }
    if (!terms.length) return true;

    const haystack = [
      card.name ?? "",
      (card as { name_ja?: string | null }).name_ja ?? "",
      card.cardNumber,
      ...card.tags,
      card.bloomLevel ?? "",
      card.type,
    ]
      .map(normalize)
      .join(" ");
    return terms.every((t) => haystack.includes(t));
  });

  return results.sort((a, b) => {
    const aExact =
      terms.length > 0 && normalize(a.name ?? "").includes(q) ? 1 : 0;
    const bExact =
      terms.length > 0 && normalize(b.name ?? "").includes(q) ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return (
      rarityOrder(b.rarity) - rarityOrder(a.rarity) || compareByNumber(a, b)
    );
  });
}

/** Single-token filter matches any of the card's colors (dual-color aware). */
function colorMatches(cardColor: string | null | undefined, token: string): boolean {
  return colorTokens(cardColor).includes(token);
}

export function searchSets(query: string, opts: SearchOptions = {}): TcgSet[] {
  const q = normalize(query.trim());
  const terms = q.split(/\s+/).filter(Boolean);

  return sets.filter((set) => {
    if (opts.year && !set.releaseDate?.startsWith(opts.year)) return false;
    if (!terms.length) return true;
    const haystack = [set.name, set.code, set.category, set.region]
      .map(normalize)
      .join(" ");
    return terms.every((t) => haystack.includes(t));
  });
}

export interface SearchSuggestion {
  kind: "card" | "set";
  id: string;
  label: string;
  sublabel: string;
}

export function suggest(query: string, limit = 7): SearchSuggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const cardHits = searchCards(q).slice(0, limit);
  const setHits = searchSets(q).slice(0, Math.max(2, limit - cardHits.length));

  return [
    ...cardHits.map((card) => ({
      kind: "card" as const,
      id: card.id,
      label: card.name ?? card.cardNumber,
      sublabel: `${card.cardNumber} · ${card.rarity ?? "?"}`,
    })),
    ...setHits.map((set) => ({
      kind: "set" as const,
      id: set.id,
      label: set.name,
      sublabel: `${set.code} · ${set.category}`,
    })),
  ].slice(0, limit);
}

/** Distinct filter values present in the data. */
export function getDistinctRarities(): string[] {
  const present = new Set(cards.map((c) => c.rarity).filter(Boolean) as string[]);
  return [...present].sort((a, b) => rarityOrder(a) - rarityOrder(b));
}

export function getDistinctTypes(): string[] {
  return [...new Set(cards.map((c) => c.type))].sort();
}

export function getDistinctColors(): string[] {
  const tokens = new Set<string>();
  for (const card of cards) {
    for (const token of colorTokens(card.color)) tokens.add(token);
  }
  const order = ["white", "green", "red", "blue", "purple", "yellow", "neutral"];
  return [...tokens].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function getAllTalents(): string[] {
  const names = new Set<string>();
  for (const card of cards) {
    if (/holomem/i.test(card.type) && card.name) names.add(card.name);
  }
  return [...names].sort();
}
