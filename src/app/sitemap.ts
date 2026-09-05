import type { MetadataRoute } from "next";
import cards from "@/data/cards.json";
import sets from "@/data/sets.json";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://coinpanther.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/app",
    "/matrix",
    "/portfolio",
    "/collection",
    "/sets",
    "/packs",
    "/decks",
    "/releases",
    "/search",
    "/fan-art",
    "/wiki",
    "/about",
  ].map((p) => ({ url: `${BASE}${p}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.7 }));

  const setPages = (sets as { id?: string; setId?: string }[]).slice(0, 200).map((s) => {
    const id = s.id ?? s.setId ?? "";
    return { url: `${BASE}/sets/${id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 };
  });

  const cardPages = (cards as { id?: string; cardId?: string }[]).slice(0, 500).map((c) => {
    const id = c.id ?? c.cardId ?? "";
    return { url: `${BASE}/cards/${id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.4 };
  });

  return [...staticPages, ...setPages, ...cardPages].filter((e) => !e.url.endsWith("/undefined"));
}
