import { readFile, writeFile } from "node:fs/promises";

const BASE_JP = "https://hololive-official-cardgame.com";
const BASE_EN = "https://en.hololive-official-cardgame.com";

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "holotcg-jp-merge/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function scrapeJPSets() {
  const html = await fetchText(`${BASE_JP}/cardlist/`);
  const re = /<a class="anchor" href="\/cardlist\/cardsearch\/\?expansion=([^"]+)">([\s\S]*?)<\/a>/g;
  const sets = [];
  for (const m of html.matchAll(re)) {
    const code = m[1];
    const body = m[2];
    const name = stripTags((body.match(/class="name[^"]*">([^<]*)</) ?? [])[1] ?? code);
    if (!sets.some(s => s.code === code)) sets.push({ code, name: name || code });
  }
  return sets;
}

async function scrapeJPCards(code) {
  const cards = [];
  for (let page = 1; page <= 40; page++) {
    const url = `${BASE_JP}/cardlist/cardsearch_ex?expansion=${encodeURIComponent(code)}&keyword=&view=text&page=${page}`;
    let html;
    try { html = await fetchText(url); } catch { break; }
    const blocks = html.split('<li class="ex-item">').slice(1);
    if (!blocks.length) break;
    for (const block of blocks) {
      const idM = block.match(/\/cardlist\/\?id=(\d+)/);
      const imgM = block.match(/<img src="([^"]+\/cardlist\/[^"]+\.png)"/);
      const numM = block.match(/class="number">\s*([^<]+?)\s*</);
      const nameM = block.match(/class="name">\s*([^<]+?)\s*</);
      if (!idM || !imgM || !numM) continue;
      cards.push({
        officialId: Number(idM[1]),
        cardNumber: numM[1].trim(),
        name_ja: nameM?.[1]?.trim() ?? "",
        imageUrl: imgM[1].startsWith("http") ? imgM[1] : BASE_JP + imgM[1],
        setId: code,
        rawBlock: block.slice(0, 800),
      });
    }
    if (blocks.length < 15) break;
    await new Promise(r => setTimeout(r, 120));
  }
  return cards;
}

console.log("Fetching JP set index...");
const jpSets = await scrapeJPSets();
console.log(`JP sets found: ${jpSets.length}`, jpSets.map(s => s.code).join(", "));

// Load existing EN data
const setsPath = new URL("../src/data/sets.json", import.meta.url);
const cardsPath = new URL("../src/data/cards.json", import.meta.url);
const sets = JSON.parse(await readFile(setsPath, "utf8"));
const cards = JSON.parse(await readFile(cardsPath, "utf8"));

let addedSets = 0;
for (const js of jpSets) {
  if (!sets.some(s => s.id === js.code)) {
    sets.push({
      id: js.code + "_JP",
      code: js.code,
      name: js.name + " (JP)",
      category: "booster",
      region: "JP",
      releaseDate: null,
      coverImage: null,
      totalCards: 0,
      detailUrl: `${BASE_JP}/cardlist/?expansion=${js.code}`,
    });
    addedSets++;
  }
}

// For demo, fetch JP cards for first 3 sets only to avoid long run
const demoCodes = jpSets.slice(0, 3).map(s => s.code);
console.log(`Fetching JP cards for: ${demoCodes.join(", ")}`);
let jpCards = [];
for (const code of demoCodes) {
  const cs = await scrapeJPCards(code);
  console.log(`  ${code}: ${cs.length} JP cards`);
  // Merge Japanese names into existing cards where numbers match
  for (const jc of cs) {
    const existing = cards.find(c => c.cardNumber === jc.cardNumber);
    if (existing) {
      if (!existing.name_ja) existing.name_ja = jc.name_ja;
      if (!existing.imageUrlJP) existing.imageUrlJP = jc.imageUrl;
    } else {
      // New JP-only card
      cards.push({
        id: jc.cardNumber + "_JP",
        officialId: jc.officialId,
        setId: code + "_JP",
        cardNumber: jc.cardNumber,
        name: jc.name_ja,
        name_ja: jc.name_ja,
        type: "holomem",
        rarity: null,
        color: null,
        hp: null,
        life: null,
        bloomLevel: null,
        batonPass: null,
        tags: [],
        skills: [],
        imageUrl: jc.imageUrl,
        sourceUrl: `${BASE_JP}/cardlist/?id=${jc.officialId}&expansion=${code}`,
      });
    }
  }
  jpCards.push(...cs);
}

await writeFile(setsPath, JSON.stringify(sets, null, 2));
await writeFile(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Done. Added ${addedSets} JP sets, enriched ${jpCards.length} JP cards. Total sets: ${sets.length}, cards: ${cards.length}`);
