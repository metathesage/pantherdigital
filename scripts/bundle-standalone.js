// Bundles Next.js standalone output with the assets it needs to serve the
// production app inside the Electron shell. `next build` emits a standalone
// server.js but DOES NOT copy public/ (static assets) or .next/static/ (JS/CSS
// chunks) into the standalone tree — the server 404s on both without this.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname); // repo root (this file lives in scripts/)
const standalone = path.join(root, ".next", "standalone");

function copyDir(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`⚠  skip (missing ${path.relative(root, from)})`);
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`✓ ${path.relative(root, from)} → ${path.relative(root, to)}`);
}

if (!fs.existsSync(standalone)) {
  console.error("✗ .next/standalone not found — run `npm run build` first.");
  process.exit(1);
}

console.log("⏳ Bundling static assets into standalone…");
copyDir(path.join(root, "public"), path.join(standalone, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
console.log("✓ standalone ready for electron-builder.");