import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HELIUS_KEY = process.env.HELIUS_API_KEY || "";

function emptyResponse(message: string) {
  return { source: "Helius DAS", dataStatus: message, topSellingCollections: [], trendingCollections: [], topIndividualSales: [], liveFeed: [], collectionStats: [], nftDetails: [] };
}

export async function GET() {
  if (!HELIUS_KEY) return NextResponse.json(emptyResponse("HELIUS_API_KEY is not configured"), { status: 503 });
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "nft-analytics", method: "searchAssets", params: { tokenType: "nonFungible", page: 1, limit: 40, displayOptions: { showCollectionMetadata: true } } }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json(emptyResponse(`Helius returned ${response.status}`), { status: response.status });
    const json = await response.json();
    const assets = Array.isArray(json?.result?.items) ? json.result.items : [];
    const nftDetails = assets.map((asset: any) => ({
      collectionName: asset.grouping?.find((group: any) => group.group_key === "collection")?.collection_name ?? asset.content?.metadata?.collection ?? "Unclassified collection",
      contractAddress: asset.id ?? null,
      chain: "SOL",
      tokenId: asset.id ?? null,
      tokenName: asset.content?.metadata?.name ?? null,
      imageUrlHighRes: asset.content?.links?.image ?? asset.content?.files?.find((file: any) => file.mime?.startsWith("image/"))?.uri ?? null,
      description: asset.content?.metadata?.description ?? null,
      traits: asset.content?.metadata?.attributes ?? [],
      creator: asset.creators?.[0]?.address ?? null,
      marketplace: null,
      lastSale: null,
      floorPrice: null,
      volume24h: null,
      volume7d: null,
      volume30d: null,
      buyers24h: null,
      sellers24h: null,
      transactions24h: null,
      firstSeenOnChain: asset.supply?.edition_nonce ?? null,
      royalties: asset.royalty ?? null,
    }));
    return NextResponse.json({ ...emptyResponse("Metadata is live from Helius DAS; marketplace activity is only shown when returned by an approved sales source."), nftDetails }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json(emptyResponse(error instanceof Error ? error.message : "Unable to load NFT data"), { status: 500 });
  }
}
