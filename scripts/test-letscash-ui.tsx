/**
 * SSR smoke test for the Robinhood Chain panel.
 *
 * Renders the real LetscashPanel component with the real snapshot payload through
 * react-dom/server and asserts the receipts, fee flow, rank tiers and tape all
 * make it into the markup. This executes the component code path — it is not a
 * re-implementation of the render.
 *
 * Run: npm run test:ui
 */
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import LetscashPanel, { LETSCASH_SORTS } from "../src/components/LetscashPanel";
import { snapshotData } from "../src/lib/letscash";

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

const data = {
  live: false,
  capturedAt: snapshotData.capturedAt,
  sourceUrl: "https://www.letscash.fun/",
  chain: snapshotData.chain,
  tokenomics: snapshotData.tokenomics,
  ranks: snapshotData.ranks,
  tape: snapshotData.tape,
};

const html = renderToStaticMarkup(
  createElement(LetscashPanel, { data, sort: "trending", onSort: () => {} })
);

test("panel renders without throwing and produces markup", () => {
  assert.ok(html.length > 2000, `markup suspiciously short: ${html.length} chars`);
});

test("chain receipts are rendered", () => {
  assert.match(html, /coins issued/);
  assert.match(html, /9,806/, "coins issued count missing");
  assert.match(html, /85,157/, "trader count missing");
  assert.match(html, /\$118\.28M|\$118\.3M/, "volume missing");
  assert.match(html, /CASHCAT bought/);
});

test("source attribution and live/snapshot state are honest", () => {
  assert.match(html, /letscash\.fun/, "must credit the source");
  assert.match(html, /snapshot/i, "must say snapshot when live:false");
  const liveHtml = renderToStaticMarkup(
    createElement(LetscashPanel, { data: { ...data, live: true }, sort: "trending", onSort: () => {} })
  );
  assert.match(liveHtml, /live/, "must say live when live:true");
});

test("all five board sorts render as controls", () => {
  for (const s of LETSCASH_SORTS) {
    assert.ok(html.includes(s.label), `sort control missing: ${s.label}`);
  }
  assert.match(html, /aria-pressed="true"/, "active sort must expose aria-pressed");
});

test("fee flow shows every destination and reconciles", () => {
  assert.match(html, /Where the fees went/);
  assert.match(html, /To creators/);
  assert.match(html, /Back into the coin/);
  assert.match(html, /To the platform/);
  assert.match(html, /\$1\.92M/, "total fees missing");
});

test("every rank tier renders with its threshold and count", () => {
  for (const r of snapshotData.ranks) {
    assert.ok(html.includes(r.label), `rank missing: ${r.label}`);
    assert.ok(html.includes(r.thresholdLabel), `threshold missing: ${r.thresholdLabel}`);
    assert.ok(html.includes(r.traders.toLocaleString()), `count missing for ${r.label}`);
  }
});

test("trade tape renders trades with side and cap", () => {
  assert.match(html, /Trading now/);
  assert.match(html, />buy</, "no buy rows");
  assert.match(html, />sell</, "no sell rows");
  const first = snapshotData.tape[0];
  assert.ok(html.includes(first.symbol), `first tape symbol ${first.symbol} missing`);
});

test("every tape row links to the real token page", () => {
  for (const t of snapshotData.tape.slice(0, 14)) {
    assert.ok(
      html.includes(`https://www.letscash.fun/token/${t.address}`),
      `tape link missing for ${t.symbol}`
    );
  }
});

test("panel carries an accessible region label", () => {
  assert.match(html, /aria-label="Robinhood Chain"/);
});

test("no NaN or undefined leaks into the markup", () => {
  assert.ok(!html.includes("NaN"), "NaN leaked into render");
  assert.ok(!/>\s*undefined\s*</.test(html), "undefined leaked into render");
});

console.log(`\n  LetscashPanel SSR — ${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("  ✓ all green\n");
