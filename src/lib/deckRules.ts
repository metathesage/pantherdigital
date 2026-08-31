import type { TcgCard } from "@/types";
import { colorTokens } from "@/lib/meta";

export interface DeckCardEntry {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  entries: DeckCardEntry[];
  /** Official card id of the chosen Oshi holomem. */
  oshi?: string | null;
}

export interface DeckCheck {
  mainCount: number;
  oshiCount: number;
  errors: string[];
  warnings: string[];
  unicolorOk: boolean;
  colorsUsed: string[];
}

export const RARITY_WEIGHTS: Record<string, number> = {
  C: 55,
  U: 25,
  R: 12,
  RR: 5,
  SR: 1.8,
  S: 1,
  P: 0.5,
  SY: 0.4,
  OC: 0.6,
  OSR: 0.7,
  HR: 0.3,
  UR: 0.2,
  SEC: 0.1,
  OUR: 0.1,
};

const MAIN_DECK_TARGET = 50;
const DEFAULT_MAX_COPIES = 4;

function isOshi(card: TcgCard): boolean {
  return /^oshi$/i.test(card.type.trim());
}

function maxCopies(card: TcgCard): number {
  if (/limited/i.test(card.type)) return 1;
  return DEFAULT_MAX_COPIES;
}

/** Full legality check against official-format basics. */
export function checkDeck(
  deck: Pick<Deck, "entries" | "oshi">,
  cardOf: (id: string) => TcgCard | undefined
): DeckCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  const mainEntries = deck.entries.filter((entry) => {
    const card = cardOf(entry.cardId);
    return card && !isOshi(card);
  });
  const mainCount = mainEntries.reduce((sum, e) => sum + e.count, 0);
  const oshiCount =
    deck.entries.find((e) => e.cardId === deck.oshi)?.count ?? 0;

  if (mainCount !== MAIN_DECK_TARGET) {
    errors.push(
      `Main deck must be exactly ${MAIN_DECK_TARGET} cards (currently ${mainCount}).`
    );
  }

  if (!deck.oshi || oshiCount === 0) {
    errors.push("Choose exactly 1 Oshi holomem.");
  }

  const colors = new Set<string>();
  const oshiEntry = deck.oshi
    ? deck.entries.find((e) => e.cardId === deck.oshi)
    : undefined;
  for (const entry of [...mainEntries, ...(oshiEntry ? [oshiEntry] : [])]) {
    const card = cardOf(entry.cardId);
    if (!card) continue;
    for (const token of colorTokens(card.color)) {
      if (token !== "neutral") colors.add(token);
    }
    const cap = maxCopies(card);
    if (entry.count > cap) {
      errors.push(
        `${card.name ?? card.cardNumber}: ${entry.count} copies (limit ${cap}${/limited/i.test(card.type) ? ", LIMITED" : ""}).`
      );
    }
  }

  const unicolorOk = colors.size <= 1;
  if (!unicolorOk && colors.size > 0) {
    warnings.push(
      `Multicolor deck (${[...colors].join(" / ")}) — fine for open format, illegal in Unicolor events.`
    );
  }

  return {
    mainCount,
    oshiCount,
    errors,
    warnings,
    unicolorOk,
    colorsUsed: [...colors],
  };
}

export function deckToText(
  deck: Deck,
  cardOf: (id: string) => TcgCard | undefined
): string {
  const lines: string[] = [];
  lines.push(`# ${deck.name}`);
  if (deck.oshi) {
    const oshi = cardOf(deck.oshi);
    if (oshi) lines.push(`1x ${oshi.cardNumber} ${oshi.name ?? ""} [Oshi]`);
  }
  const sorted = [...deck.entries]
    .filter((e) => e.cardId !== deck.oshi)
    .sort((a, b) => a.cardId.localeCompare(b.cardId));
  for (const entry of sorted) {
    const card = cardOf(entry.cardId);
    lines.push(`${entry.count}x ${entry.cardId} ${card?.name ?? ""}`.trimEnd());
  }
  return lines.join("\n");
}
