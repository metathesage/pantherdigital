import { NextResponse } from "next/server";
import { getCardById } from "@/lib/data";
import { getMarketLinks, getMarketSnapshot } from "@/lib/market";

export const dynamic = "force-dynamic";

/**
 * Live market snapshot for a card.
 * Returns keyless deep links when no marketplace API keys are configured,
 * and real comparables (eBay Browse / TCGPlayer APIs) when they are.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const card = getCardById(cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const snapshot = await getMarketSnapshot(card);
  return NextResponse.json({
    cardId: card.id,
    links: getMarketLinks(card),
    ...snapshot,
  });
}
