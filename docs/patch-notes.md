# Patch Notes

## 2026-09-03 — PNTHR DGTL Rebrand + TCG Archive
**Build:** `npm run build` ✓ (23s) — routes `/_not-found /about /app /avatar /bot /fan-art /portfolio /product /releases /search /waifus /wiki`

### Branding
- `src/app/icon.png` → `p_monogram_icon.png` (297K, was panther-icon)
- `public/p_monogram_icon.png` tracked, root drafts gitignored
- `NavBar` header: dark `#080C0B/85` + `backdrop-blur-xl`, `p_monogram` logo `size-9 rounded-xl bg-black border-white/10`, wordmark `PNTHR` + `DGTL` in `#00FF88`, Space Grotesk Black
- `Footer` → dark `#080C0B`, p_monogram brand, groups `Main Panther Discover Community Info`, descs under each link, `© Panther Digital` + `Product →` CTA
- `Search`/`Releases` metadata → `PNTHR DGTL` (was hololive TCG)

### Navigation
- `src/constants/pages.ts` rebuilt: 15 pages (was 19), groups `Main Panther Discover Community Info`
  - Removed TCG: `Cards Sets Packs Decks Collection` (now in `card-prodigy/emergent-tcg-archive/`)
  - `TOP_NAV` = `Home App Bot Waifus Portfolio Product Wiki About` (8, was 9)
- `NavBar` emoji via `labelEnhance`, mobile menu shows `label + group`, user menu → `Portfolio/Waifus` only
- `Footer` renders all `NAV_GROUPS` with `ALL_PAGES.filter(group)` + desc

### TCG Archive
- Copied to `C:\Users\young\OneDrive\Documents\Desktop\sage\apps\WEB APP\card-prodigy\emergent-tcg-archive\`
  - `cards/[cardId] sets/[setId] packs decks collection` + 9 components `CardCarousel CardGrid CardImage CardTile CardViewer CollectionButton SetCardsBrowser SetsExplorer TiltCard`
- Deleted from `src/app` (5 routes): `cards collection decks packs sets` → 404, keeps `fan-art` (Community)
- `.gitignore` hides local drafts: `Coin-Panther-Brand-Ui.html Pnthr-Dgtl-*.html cyber_*.jpg lucy*.png p_monogram_icon.png public/cyber* public/lucy* public/waifus/ radar_*.png`

### Build / Deploy
- `npm run build` ✓ 23.3s, no TCG routes in `○ /` list
- Vercel team-blocked (still `UNKNOWN/BLOCKED` — code is ready, deploy when limit cleared)
- Local `http://localhost:3000` (or 3001) — dev auto-restarts via Hermes gateway, may need `taskkill /PID <pid> /F` in Admin PS or reboot to clear stale cache

### Known / Next
- Desktop apps still `desktop-apps/*.html + .bat` (html+bats, not exe) — needs Electron wrapper for real standalone
- Solana portfolio fix — deferred per request (last prio)
- Brand/media kit page — next polish pass
- `public/p_monogram_icon.png` + `cyber_panther_editorial.jpg` etc drafts remain on disk but gitignored

---

## 2026-09-03 — Product + Desktop Apps + Nav Polish (earlier)
- `src/app/product/page.tsx` — 3 packages `Basic/Pro/Enterprise` + referral `10%` copy link
- `desktop-apps/waifu-dashboard.html + bot-terminal.html + .bat` launchers
- `NavBar labelEnhance` emoji (🏠 📊 🤖 🐆 etc) desktop+mobile
- `npm run build` ✓ 1238 pages → later ✓ 23s after TCG strip

## 2026-09-03 — Robinhood + Waifu + Bot
- `chainForCoin` deterministic hash 20% Robinhood, `isRH` ring `bg-[#00C805] scale-[1.06] ring-2`
- `/api/hood` DexScreener verify `chainId === robinhood`
- Waifu 5 (Lucy boss + Rias/Kuro/Hikari/Mio), Bot Desk `/bot` paper $9.53
