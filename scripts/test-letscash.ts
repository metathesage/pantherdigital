/**
 * Tests for the letscash.fun data layer.
 *
 * Run: npm test        (node --import tsx scripts/test-letscash.ts)
 *
 * These exercise the real functions in src/lib/letscash.ts — no re-implementations.
 * The HTML fixture is SYNTHETIC: this sandbox has no outbound network, so we cannot
 * capture real letscash.fun markup here. It is shaped from the structure of the
 * rendered board (token link → name → cap → change → age → tax/burn → socials) and
 * exists to prove the parser is wired correctly and degrades safely, not to certify
 * it against live markup. The snapshot fallback is what makes that safe.
 */
import assert from "node:assert/strict";
import {
  parseMoney,
  parseAgeSeconds,
  parseBoardHtml,
  parseChainStats,
  emergentScore,
  riskLabel,
  ageLabel,
  shortAddress,
  formatUsd,
  snapshotData,
  MIN_LIVE_TOKENS,
  sortTokens,
} from "../src/lib/letscash";

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
  } catch (e) {
    failures.push(`${name}\n      ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------- parseMoney
test("parseMoney handles suffixed, comma and bare values", () => {
  assert.equal(parseMoney("2.17M"), 2170000);
  assert.equal(parseMoney("26.5K"), 26500);
  assert.equal(parseMoney("$118,278,311"), 118278311);
  assert.equal(parseMoney("$1.5B"), 1500000000);
  assert.equal(parseMoney("9,806"), 9806);
  assert.equal(parseMoney("97"), 97);
});
test("parseMoney returns 0 for junk rather than NaN", () => {
  assert.equal(parseMoney(undefined), 0);
  assert.equal(parseMoney(""), 0);
  assert.equal(parseMoney("n/a"), 0);
  assert.ok(Number.isFinite(parseMoney("n/a")));
});

// ----------------------------------------------------------- parseAgeSeconds
test("parseAgeSeconds converts every unit the board uses", () => {
  assert.equal(parseAgeSeconds("3141s"), 3141);
  assert.equal(parseAgeSeconds("41m"), 2460);
  assert.equal(parseAgeSeconds("7h ago"), 25200);
  assert.equal(parseAgeSeconds("8d ago"), 691200);
  assert.equal(parseAgeSeconds("garbage"), 0);
});

// --------------------------------------------------------------- ageLabel
test("ageLabel matches letscash.fun's own style", () => {
  assert.equal(ageLabel(3600), "1h ago");
  assert.equal(ageLabel(25200), "7h ago");
  assert.equal(ageLabel(691200), "8d ago");
  assert.equal(ageLabel(120), "2m ago");
  assert.equal(ageLabel(-5), "—");
});

// --------------------------------------------------------- shortAddress/formatUsd
test("shortAddress abbreviates like the board (0x0D25…38cc)", () => {
  assert.equal(shortAddress("0x0D257cA40d40090BE60C2d2Ed5bB3535392838cc"), "0x0D25…38cc");
  assert.equal(shortAddress(""), "—");
});
test("formatUsd matches the board's $2.17M / $26.5K formatting", () => {
  assert.equal(formatUsd(2170000), "$2.17M");
  assert.equal(formatUsd(26500), "$26.5K");
  assert.equal(formatUsd(null), "—");
});

// ------------------------------------------------------------- emergentScore
const base = snapshotData.tokens.find((t) => t.symbol === "HOOD10")!;
test("emergentScore is deterministic and bounded 8–99", () => {
  const a = emergentScore(base);
  const b = emergentScore({ ...base });
  assert.equal(a, b, "same input must give same score");
  for (const t of snapshotData.tokens) {
    const s = emergentScore(t);
    assert.ok(s >= 8 && s <= 99, `${t.symbol} scored ${s}, outside 8–99`);
  }
});
test("emergentScore rewards momentum and punishes dumps", () => {
  const up = emergentScore({ ...base, change24h: 90 });
  const down = emergentScore({ ...base, change24h: -40 });
  assert.ok(up > down, `up ${up} should exceed down ${down}`);
});
test("emergentScore rewards verified supply burn", () => {
  const plain = emergentScore({ ...base, burnedPct: null });
  const burned = emergentScore({ ...base, burnedPct: 20 });
  assert.ok(burned > plain, `burned ${burned} should exceed plain ${plain}`);
});
test("emergentScore rewards survivorship at equal momentum", () => {
  // Isolate the survivorship term: same coin, same +10%, different age.
  const survivor = emergentScore({ ...base, change24h: 10, ageSeconds: 30 * 86400 });
  const fresh = emergentScore({ ...base, change24h: 10, ageSeconds: 3600 });
  assert.ok(
    survivor > fresh,
    `30d survivor ${survivor} should beat 1h coin ${fresh} at equal momentum`
  );
});
test("emergentScore lets momentum lead on a trending board, but risk flags the fresling", () => {
  // A 678% one-hour print IS the top trending item on a launchpad — momentum
  // is allowed to win. Safety is expressed through riskLabel, not the score.
  const moonshot = { ...base, change24h: 678, ageSeconds: 3600 };
  const survivor = emergentScore({ ...base, change24h: 10, ageSeconds: 30 * 86400 });
  assert.ok(emergentScore(moonshot) > survivor, "momentum should lead trending");
  assert.equal(riskLabel(emergentScore(moonshot), moonshot), "Critical", "sub-day coin must be Critical");
  const wink = snapshotData.tokens.find((t) => t.symbol === "WINK")!;
  assert.equal(riskLabel(emergentScore(wink), wink), "Low", "34d, $201K cap, 18% burned should be Low risk");
});
test("riskLabel escalates on thin caps regardless of score", () => {
  assert.equal(riskLabel(95, { ...base, marketCapUsd: 3300 }), "Critical");
  assert.equal(riskLabel(95, { ...base, ageSeconds: 3600 }), "Critical");
});

// ----------------------------------------------------------------- snapshot
test("snapshot is internally consistent and above the live-parse floor", () => {
  assert.ok(snapshotData.tokens.length >= MIN_LIVE_TOKENS, "snapshot must clear MIN_LIVE_TOKENS");
  assert.equal(snapshotData.chain.coinsIssued, 9806);
  assert.equal(snapshotData.chain.traders, 85157);
  assert.equal(snapshotData.ranks.length, 7);
  assert.equal(snapshotData.ranks[0].key, "copper");
  assert.equal(snapshotData.ranks[6].key, "cashking");
  // Every token needs the fields the UI renders.
  for (const t of snapshotData.tokens) {
    assert.match(t.address, /^0x[a-fA-F0-9]{40}$/, `${t.symbol} bad address`);
    assert.ok(t.marketCapUsd > 0, `${t.symbol} missing cap`);
    assert.ok(Number.isFinite(t.change24h), `${t.symbol} bad change`);
    assert.ok(t.ageSeconds > 0, `${t.symbol} bad age`);
    assert.match(t.image, /^https:\/\//, `${t.symbol} bad image`);
  }
});
test("tokenomics adds up: fees = creators + burn + platform", () => {
  const { toCreatorsEth, selfBurnEth, platformEth, totalFeesEth } = snapshotData.tokenomics;
  const sum = toCreatorsEth + selfBurnEth + platformEth;
  assert.ok(Math.abs(sum - totalFeesEth) / totalFeesEth < 0.01, `Ξ${sum} vs total Ξ${totalFeesEth}`);
});
test("rank thresholds are strictly increasing", () => {
  for (let i = 1; i < snapshotData.ranks.length; i += 1) {
    assert.ok(
      snapshotData.ranks[i].thresholdEth > snapshotData.ranks[i - 1].thresholdEth,
      `${snapshotData.ranks[i].key} threshold not greater than previous`
    );
  }
});

// ------------------------------------------------------------- parseBoardHtml
const FIXTURE = `
<html><body>
<div id="board">
  <a href="/token/0x0D257cA40d40090BE60C2d2Ed5bB3535392838cc">
    <img src="https://emerald-rational-coyote-952.mypinata.cloud/ipfs/bafkreihqpf7dg7" />
  </a>
  <div>
    <span>8d ago</span><span>Tax 5%</span>
    <h3>Robinhood10 Index</h3><div>HOOD10</div>
    <div>$2.17M</div><div>▼29.1%</div>
    <div>0x0D25…38cc</div>
    <a href="https://x.com/hood10xyz">x</a><a href="https://hood10.xyz/">web</a>
  </div>
  <a href="/token/0x8ad5A580c4215086Dec828d8626b95A06D7D00cc">
    <img src="https://emerald-rational-coyote-952.mypinata.cloud/ipfs/bafkreid7sfskhe" />
  </a>
  <div>
    <span>34d ago</span><span>Self burn</span>
    <h3>WinkCat</h3><div>WINK</div>
    <div>$201.5K</div><div>▲93.1%</div>
    <div>18% burned</div>
    <a href="https://t.me/WinkCatRBH">tg</a>
  </div>
  <a href="/token/0x80D658E33adf1986Ee0cE4Bb7ba108BcA69350cc">no price here at all</a>
</div>
</body></html>`;

test("parseBoardHtml extracts rows from board markup", () => {
  const rows = parseBoardHtml(FIXTURE);
  assert.ok(rows.length >= 2, `expected >=2 rows, got ${rows.length}`);
  const hood = rows.find((r) => r.address.toLowerCase() === "0x0d257ca40d40090be60c2d2ed5bb3535392838cc");
  assert.ok(hood, "HOOD10 row missing");
  assert.equal(hood!.marketCapUsd, 2170000);
  assert.equal(hood!.change24h, -29.1);
  assert.equal(hood!.ageSeconds, 691200);
  assert.equal(hood!.taxPct, 5);
  assert.equal(hood!.socials.x, "https://x.com/hood10xyz");
  assert.equal(hood!.socials.web, "https://hood10.xyz/");
  assert.match(hood!.image, /^https:\/\//);
});
test("parseBoardHtml reads burn % and telegram", () => {
  const rows = parseBoardHtml(FIXTURE);
  const wink = rows.find((r) => r.symbol === "WINK" || r.address.toLowerCase().startsWith("0x8ad5"));
  assert.ok(wink, "WINK row missing");
  assert.equal(wink!.burnedPct, 18);
  assert.equal(wink!.change24h, 93.1);
  assert.equal(wink!.socials.tg, "https://t.me/WinkCatRBH");
});
test("parseBoardHtml drops rows with no price and dedupes by address", () => {
  const rows = parseBoardHtml(FIXTURE);
  assert.ok(
    !rows.some((r) => r.address.toLowerCase() === "0x80d658e33adf1986ee0ce4bb7ba108bca69350cc"),
    "priceless row should have been dropped"
  );
  const dup = parseBoardHtml(FIXTURE + FIXTURE);
  assert.equal(dup.length, rows.length, "duplicate addresses must be deduped");
});
test("parseBoardHtml returns [] on junk so the caller falls back to the snapshot", () => {
  assert.deepEqual(parseBoardHtml(""), []);
  assert.deepEqual(parseBoardHtml("<html><body>nothing to see</body></html>"), []);
  assert.deepEqual(parseBoardHtml(undefined as unknown as string), []);
});
test("parseChainStats reads the homepage counters", () => {
  const stats = parseChainStats(
    `<div><b>9,806</b> coins issued</div><div><b>$118.24M</b> volume</div><div><b>1.7M</b> CASHCAT bought</div><div><b>85,157</b> traders</div>`
  );
  assert.ok(stats, "stats should parse");
  assert.equal(stats!.coinsIssued, 9806);
  assert.equal(stats!.volumeUsd, 118240000);
  assert.equal(stats!.traders, 85157);
  assert.equal(stats!.cashcatBought, 1700000);
  assert.equal(parseChainStats("junk"), null);
});

// ---------------------------------------------------------------- sortTokens
test("sortTokens implements every letscash.fun board sort", () => {
  const toks = snapshotData.tokens;
  const mcap = sortTokens(toks, "mcap");
  assert.equal(mcap[0].symbol, "HOOD10", "HOOD10 is the biggest cap on chain");
  for (let i = 1; i < mcap.length; i += 1) {
    assert.ok(mcap[i - 1].marketCapUsd >= mcap[i].marketCapUsd, "mcap sort broken");
  }
  const newest = sortTokens(toks, "newest");
  assert.ok(newest[0].ageSeconds <= newest[1].ageSeconds, "newest sort broken");
  const oldest = sortTokens(toks, "oldest");
  assert.ok(oldest[0].ageSeconds >= oldest[1].ageSeconds, "oldest sort broken");
  const burned = sortTokens(toks, "burned");
  assert.equal(burned[0].burnedPct, 19, "most-burned should lead");
  const trending = sortTokens(toks, "trending");
  for (let i = 1; i < trending.length; i += 1) {
    assert.ok(
      emergentScore(trending[i - 1]) >= emergentScore(trending[i]),
      "trending sort must follow emergentScore"
    );
  }
});
test("sortTokens does not mutate its input", () => {
  const toks = [...snapshotData.tokens];
  const before = toks.map((t) => t.symbol).join(",");
  sortTokens(toks, "mcap");
  assert.equal(toks.map((t) => t.symbol).join(","), before);
});

// ------------------------------------------------------------------- report
console.log(`\n  letscash data layer — ${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("  ✓ all green\n");
