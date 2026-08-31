/**
 * Scrapes the official hololive OFFICIAL CARD GAME (EN) card list into app data.
 *
 * Sources:
 *   - Product/set index : https://en.hololive-official-cardgame.com/cardlist/
 *   - Paginated listing : /cardlist/cardsearch_ex?expansion={code}&view=text&page={n}
 *
 * Outputs:
 *   - src/data/sets.json
 *   - src/data/cards.json
 *
 * Usage: node scripts/scrape-official.mjs [--only=hBP01,hBP02]
 */

import { writeFile } from "node:fs/promises";

const BASE = "https://en.hololive-official-cardgame.com";
const DELAY_MS = 120;
const CONCURRENCY = 3;
const MAX_PAGES_PER_SET = 80;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "holotcg-fan-database/1.0 (local dev scraper)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function decodeEntities(text) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------- Set index parsing --------------------------- */

async function fetchProductCategory(cat) {
  const html = await fetchText(`${BASE}/cat_product/${cat}/`);
  const items = [];
  for (const match of html.matchAll(/<li\s*>([\s\S]*?)<\/li>/g)) {
    const body = match[1];
    if (!body.includes('class="cate')) continue;
    const img = (body.match(/src="([^"]+)"/) ?? [])[1];
    const ttl = (
      body.match(/class="ttl"><span>[^<]*<\/span>([^<]*)<\/p>/) ?? []
    )[1];
    const dateRaw = ([...body.matchAll(/<dt>([^<]*)<\/dt>\s*<dd>([^<]*)<\/dd>/g)]
      .find((m) => /release/i.test(m[1])) ?? [])[2];
    const slug = (body.match(/\/products\/post\/([^"/]+)\//) ?? [])[1] ?? null;
    items.push({
      ttl: decodeEntities(ttl ?? "").trim(),
      cat,
      dateRaw: dateRaw ? decodeEntities(dateRaw).trim() : null,
      img: img?.startsWith("http") ? img : img ? BASE + img : null,
      slug,
    });
  }
  return items;
}

function parseLooseDate(raw) {
  if (!raw) return null;
  const months = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const match = raw.toLowerCase().match(/([a-z]+)\s+(\d{1,2}).*?(\d{4})/);
  if (!match) return null;
  const month = months[match[1]];
  if (month === undefined) return null;
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

const PRODUCT_CODE_HINTS = {
  "summer-hologram": "hEB01",
  "starter-hsd14-19": "hSD14–19",
};

async function scrapeProducts() {
  const cats = ["boosters", "decks", "accessories"];
  const results = [];
  for (const cat of cats) {
    try {
      results.push(...(await fetchProductCategory(cat)));
      await sleep(DELAY_MS);
    } catch {
      /* category page unavailable — skip */
    }
  }
  return results;
}

function normalizeName(text) {
  return text
    .toLowerCase()
    .replace(/hololive official card game/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function scrapeSetIndex() {
  const html = await fetchText(`${BASE}/cardlist/`);

  const itemRe =
    /<a class="anchor" href="\/cardlist\/cardsearch\/\?expansion=([^"]+)">([\s\S]*?)<\/a>/g;
  const dateRe = /Release Date<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i;

  const sets = [];
  for (const match of html.matchAll(itemRe)) {
    const [, code, body] = match;
    const name = stripTags((body.match(/class="name Sans">([^<]*)</) ?? [])[1] ?? "");
    const cat = (body.match(/class="cat (\w+)/) ?? [])[1] ?? "unknown";
    const thumb = (body.match(/src="([^"]+\.(?:png|jpg))"/) ?? [])[1];
    const dateHtml = (body.match(dateRe) ?? [])[1];
    const releaseDate = dateHtml
      ? stripTags(dateHtml)
          .replace(/(\w+) (\d{1,2}), (\d{4})/, (_, m, d, y) => `${y}-${String(new Date(`${m} 1, 2000`).getMonth() + 1).padStart(2, "0")}-${d.padStart(2, "0")}`)
      : null;

    if (!sets.some((s) => s.code === code)) {
      sets.push({
        code,
        name,
        category: cat.toLowerCase().endsWith("s") && cat !== "pr" ? cat.slice(0, -1) : cat,
        releaseDate,
        thumbUrl: thumb ? (thumb.startsWith("http") ? thumb : BASE + thumb) : null,
      });
    }
  }
  return sets;
}

/* --------------------------- Card listing parsing -------------------------- */

function parseCardBlock(block, expansionCode) {
  const idMatch = block.match(/\/cardlist\/\?id=(\d+)/);
  const imgMatch = block.match(/<img src="([^"]+\/cardlist\/[^"]+\.png)"/);
  const number = (block.match(/class="number">\s*([^<]+?)\s*</) ?? [])[1];
  if (!idMatch || !imgMatch || !number) return null;

  const name = (block.match(/class="name">\s*([^<]+?)\s*</) ?? [])[1];

  // dt/dd field map (dd may contain a color icon image)
  const fields = {};
  const dlRe = /<dt>\s*([^<]+?)\s*<\/dt>\s*(?:<dt>[\s\S]*?<\/dt>\s*)*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  for (const m of block.replace(/\n\s*/g, "\n").matchAll(dlRe)) {
    fields[m[1].trim()] = m[2];
  }

  const colorIcon = (fields["Color"] ?? "").match(/texticon\/type_(\w+)\.png/);
  const batonIcon = (fields["Baton Pass"] ?? "").match(/texticon\/(arts_\w+)\.png/);

  // Skill/effect sections
  const skills = [];
  const secRe =
    /<div class="((?:oshi|sp|buzz)?[\w -]*?(?:skill|keyword|extra|arts)[\w -]*?)">\s*<p>([\s\S]*?)<\/p>\s*<p>([\s\S]*?)<\/p>/gi;
  for (const m of block.matchAll(secRe)) {
    const kind = m[1].trim();
    const heading = stripTags(m[2]);
    const body = stripTags(m[3]);
    skills.push({ kind, heading, body });
  }

  const tagText = stripTags(fields["Tag"] ?? "");
  const tags = tagText ? tagText.split(/\s+/).filter((t) => t.startsWith("#")).map((t) => t.slice(1)) : [];

  const num = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const rarityFromPath = (imgMatch[1].match(/_([A-Z]{1,3}(?:R|C|Y)?)\.png$/) ?? [])[1];

  return {
    officialId: Number(idMatch[1]),
    cardNumber: number.trim(),
    name: name?.trim(),
    talent: null,
    type: stripTags(fields["Card Type"] ?? ""),
    rarity: stripTags(fields["Rarity"] ?? "") || rarityFromPath || null,
    color: colorIcon ? colorIcon[1] : null,
    hp: fields["HP"] !== undefined ? num(stripTags(fields["HP"])) : null,
    life: fields["LIFE"] !== undefined ? num(stripTags(fields["LIFE"])) : null,
    bloomLevel: stripTags(fields["Bloom Level"] ?? "") || null,
    levelLabel: stripTags(fields["Level"] ?? "") || null,
    batonPass: batonIcon ? !batonIcon[1].includes("null") : null,
    tags,
    skills,
    extraRule: stripTags(fields["Extra"] ?? "") || null,
    setImage: stripTags(fields["Card Set"] ?? ""),
    imageUrl: imgMatch[1].startsWith("http") ? imgMatch[1] : BASE + imgMatch[1],
    sourceUrl: `${BASE}/cardlist/?id=${idMatch[1]}&expansion=${expansionCode}`,
    expansionCode,
  };
}

async function scrapeExpansion(code) {
  const cards = [];
  for (let page = 1; page <= MAX_PAGES_PER_SET; page++) {
    let html;
    try {
      html = await fetchText(
        `${BASE}/cardlist/cardsearch_ex?expansion=${encodeURIComponent(code)}&keyword=&view=text&page=${page}`
      );
    } catch {
      break;
    }

    const blocks = html.split('<li class="ex-item">').slice(1);
    if (blocks.length === 0) break;

    for (const block of blocks) {
      const parsed = parseCardBlock(block, code);
      if (parsed) cards.push(parsed);
    }
    process.stdout.write(`  ${code} page ${page}: ${blocks.length} items\n`);
    await sleep(DELAY_MS);
  }
  return cards;
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  async function lane() {
    while (index < items.length) {
      const current = items[index++];
      results.push(await worker(current));
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, lane));
  return results;
}


/* ---------------------------------- Main ---------------------------------- */

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const setsOnly = args.includes("--sets-only");
const only = onlyArg ? onlyArg.split("=")[1].split(",") : null;

console.log("Fetching set index…");
let setIndex = await scrapeSetIndex();
for (const s of setIndex) s.id = s.id ?? s.code;
console.log(`Found ${setIndex.length} products.`);

// Enrich with the full /products/ catalogue (adds drops that have no card
// search page yet, e.g. announced future releases and pure accessories).
const productItems = await scrapeProducts();
for (const item of productItems) {
  const normItem = normalizeName(item.ttl);
  const existing = setIndex.find(
    (s) =>
      (normalizeName(s.name).length > 0 &&
        normalizeName(s.name).includes(normItem)) ||
      normItem.includes(normalizeName(s.name))
  );
  if (existing) {
    if (!existing.thumbUrl && item.img) existing.thumbUrl = item.img;
    if (!existing.releaseDate && item.dateRaw)
      existing.releaseDate = parseLooseDate(item.dateRaw);
    if (item.slug) existing.detailSlug = item.slug;
  } else if (item.ttl) {
    setIndex.push({
      id: item.slug ?? normalizeName(item.ttl),
      code: PRODUCT_CODE_HINTS[item.slug] ?? "TBA",
      name: item.ttl.replace(/^hololive OFFICIAL CARD GAME\s*/i, "").trim(),
      category: item.cat.replace(/s$/, ""),
      releaseDate: parseLooseDate(item.dateRaw),
      thumbUrl: item.img,
      detailSlug: item.slug,
    });
  }
}
console.log(`Merged product catalogue: ${setIndex.length} total products.`);

const cards = setsOnly
  ? JSON.parse(
      await (
        await import("node:fs/promises")
      ).readFile(new URL("../src/data/cards.json", import.meta.url), "utf8")
    )
  : null;

const scrapable = setsOnly
  ? []
  : setIndex.filter(
      (s) =>
        (!only || only.includes(s.code) || only.includes(s.id)) &&
        ["booster", "deck", "promo", "accessory"].includes(s.category)
    );

let perSetCards = [];
if (!setsOnly) {
  console.log(`Scraping ${scrapable.length} expansions…`);
  perSetCards = await runPool(scrapable, async (set) => {
    const scraped = await scrapeExpansion(set.id);
    console.log(`${set.id}: ${scraped.length} cards`);
    return { code: set.id, cards: scraped };
  });
}

const allCards = perSetCards.flatMap((entry) => entry.cards);
const byNumber = new Map();
for (const card of allCards) {
  if (!byNumber.has(card.cardNumber)) byNumber.set(card.cardNumber, card);
}
const uniqueCards = [...byNumber.values()].sort((a, b) =>
  a.cardNumber.localeCompare(b.cardNumber, "en", { numeric: true })
);
const finalCards = setsOnly ? cards : uniqueCards;

// Finalize shapes
const setsOut = setIndex.map((s) => ({
  id: s.id,
  code: s.code ?? s.id,
  name: s.name,
  category: s.category,
  region: "EN",
  releaseDate: s.releaseDate,
  coverImage: s.thumbUrl,
  totalCards: finalCards.filter((c) => c.setId === s.id || c.expansionCode === s.id).length,
  detailUrl: s.detailSlug ? `${BASE}/products/post/${s.detailSlug}/` : null,
}));

const cardsOut = finalCards.map((c) =>
  c.setId
    ? c // already in output shape (--sets-only passthrough)
    : {
        id: c.cardNumber,
        officialId: c.officialId,
        setId: c.expansionCode,
        cardNumber: c.cardNumber,
        name: c.name,
        type: c.type,
        rarity: c.rarity,
        color: c.color,
        hp: c.hp,
        life: c.life,
        bloomLevel: c.bloomLevel,
        batonPass: c.batonPass,
        tags: c.tags,
        skills: c.skills,
        imageUrl: c.imageUrl,
        sourceUrl: c.sourceUrl,
      }
);

await writeFile(
  new URL("../src/data/sets.json", import.meta.url),
  JSON.stringify(setsOut, null, 2)
);
await writeFile(
  new URL("../src/data/cards.json", import.meta.url),
  JSON.stringify(cardsOut, null, 2)
);

console.log(
  `\nWrote ${setsOut.length} sets and ${cardsOut.length} cards.` +
    `\nRarities: ${[...new Set(cardsOut.map((c) => c.rarity))].join(", ")}` +
    `\nTypes:    ${[...new Set(cardsOut.map((c) => c.type))].join(", ")}`
);
