# SITE_GUIDE_FOR_AGENTS — Panther Digital (share this, not source files)

> Purpose: let any agent/chatbot understand, demo, and rebuild the site
> WITHOUT uploading full source. Paste this file + a preview URL.
> Live preview URL: (fill after `vercel --prod` — e.g. https://emergent-matrix.vercel.app)
> Workdir: `C:/emergent-matrix` · Stack: Next.js 16.3.3 Turbopack + React 19 + Tailwind 4 + three + zustand + Privy (env-gated)
> NEVER paste real keys. All keys optional, env-only, app works keyless/degraded.

## 1 — What it is
Minimal luxury crypto discovery radar (Panther Digital / PNTHR DGTL). Real data, no theater:
300-coin live feed, emergentScore 0–100, ticker gainers/surging, Score sort,
clean navi (logo always → /), no Privy banner, Sable paper-trading desk, NVIDIA AI.

## 2 — Pages (`src/app`)
| Route | Purpose |
|---|---|
| `/` | Home — loading splash + hero entry |
| `/about` | Real PNTHR wiki (design system, sources, roadmap) — file exports `WikiPage`, mislabeled, needs Sable+AI section |
| `/app` | Main radar dashboard (chains, trends, wallet connect) |
| `/avatar` | Lucy VRM/Live2D preview |
| `/bio/[[...waifu]]` | Waifu bio pages |
| `/bot` | Sable paper-trading console (admin-gated). Dossier → `/waifus/sable` |
| `/desktop` | Desktop launcher downloads |
| `/fan-art` | Fan-art gallery (localStorage) |
| `/portfolio` | On-chain portfolio (Solana + ETH) |
| `/product` | Pricing/packages |
| `/releases` | Changelog from sets data |
| `/search` | Card/coin search |
| `/waifus` | Squad cards index (IDs: rias/kuro/hikari/mio/sable) |
| `/waifus/[id]` | Per-waifu detail (static params from `src/lib/waifus.ts`) |
| `/wiki` | STALE hololive leftover — redirect/rewrite to PNTHR wiki |
| `/wiki/collecting` | STALE hololive TCG guide — rewrite or remove |
| `/wiki/talents/[slug]` | STALE hololive talents — rewrite or remove |
| `/wiki/waifus` | Squad mini-wiki, in sync (renders from lib) |

## 3 — API (`src/app/api`)
| Route | Method | Purpose |
|---|---|---|
| `/api/ai` | POST | NVIDIA NIM inference (Kimi K3 → DeepSeek). Body `{prompt, model?, system?, maxTokens?}`. No auth — quota risk, keep server key secret |
| `/api/bot/health` | GET | Admin-gated status + TP/SL auto-sweep |
| `/api/bot/history` | GET | Admin-gated closed trades + PnL |
| `/api/bot/positions` | GET | Admin-gated open positions |
| `/api/bot/sign` | POST | Admin-gated paper executor (no real funds) |
| `/api/bot/strategy` | GET, POST | Admin-gated strategy read/patch |
| `/api/coins/[id]` | GET | CoinGecko detail proxy |
| `/api/coins/markets` | GET | CoinGecko markets list (paging, Demo-key header) |
| `/api/coins/platforms` | GET | Coins/list + platforms, cached 24h |
| `/api/dex` | GET | DexScreener proxy (keyless) |
| `/api/fng` | GET | Fear & Greed (alternative.me) |
| `/api/global` | GET | CoinGecko global stats |
| `/api/helius` | GET, POST | Helius Solana proxy (key server-side) |
| `/api/hood` | GET | Robinhood-chain verifier, cached 24h |
| `/api/market/[cardId]` | GET | TCG market snapshot |
| `/api/news` | GET | Crypto news RSS aggregator |
| `/api/opensea` | GET | NFT trending (key opt, fallbacks) |
| `/api/pairs` | GET | GeckoTerminal + DexScreener pool feed |
| `/api/x-scan` | GET | KOL/meme signals (boosts + trending) |

## 4 — Lib / components
Lib: `admin.ts` (Bearer SHA-256 or wallet gate), `auth.ts` (local demo store),
`bot.ts` (paper engine), `coinIcons.ts`, `data.ts`, `deckRules.ts`, `decks.ts`,
`market.ts`, `meta.ts`, `panther.ts` (gems/xp), `sfx.ts` (WebAudio, no assets),
`store.ts`, `waifus.ts` (SOURCE OF TRUTH).
Components: `NavBar` (logo→/, 8-item TOP_NAV), `SiteChrome` (skips bespoke routes),
`AuthDialog`, `PrivyProvider` (env-gated, no banner), `HoloProjector`,
`PantherBackground`, `HeroParticles`, `SearchBar/Results`, card suite
(`CardGrid/Tile/Viewer/Carousel/Image`), `MarketPanel`, `TiltCard`, `Reveal`, `Timeline`.

## 5 — Squad + crons + models
Boss Lucy (@sageglowsbot) → head Rias → trio. Workdir `C:/emergent-matrix`.
| Waifu | Job | Schedule | ID |
|---|---|---|---|
| Lucy (boss) | command + review | — | lucy |
| Rias (head) | panther-nav-ux | every 6h | 00a627273861 |
| Kuro | panther-market | every 30m | 1d4a12cf83bd |
| Hikari | panther-ticker-feed | every 2h | f046435c05a7 |
| Mio | panther-auth | every 6h | 79d57a7e9bb9 |
| Sable | panther-paper-bot | on-demand | paper-only |
Models: crons `muse-spark-1.2-contributor-free` (opencode-free, free).
`/api/ai`: Kimi K3 → DeepSeek (server key only). Vision: Ollama moondream local.
Voice: Jessica → Jenny/edge. Zero paid APIs in hot path.

## 6 — Roadmap
LIVE (don't regress): 300-coin radar, ticker gainers/surging + 🔥 pill,
Score sort default + 90+ orange glow, logo-home, no Privy banner,
Sable desk ($10/$5, +8% TP / −6% SL), NVIDIA AI + trader picks + Spotlight.
NEXT: wallet route → radar page → extension page → wiki rewrite
(`/wiki` → PNTHR, `/about` + Sable/AI stack, keep 1240-page SSG building).

## 7 — Branches (2026-09-05 decision, do not revisit without boss)
- `master` = CANONICAL (v1.0.0 PNTHR DGTL, Electron exe, current). Build everything here.
- `lab/design` = archived cosmetic experiment (`/matrix` route only, no Electron, 1.4M deletions). NEVER merge into master; cherry-pick single files only.

## 8 — Deploy
Vercel = primary (git-deploy, `turbopack.root` set, 1240 static, warning
`@pixiv/three-vrm` expected). Netlify secondary (`netlify.toml`, `.next`).
Electron = standalone shell around prod build (offline-first, same /app + /bot).
Env names only: `COINGECKO_API_KEY`, `HELIUS_API_KEY`, `OPENSEA_API_KEY` (opt),
`NEXT_PUBLIC_ETHERSCAN_API_KEY` (opt), `ADMIN_BEARER_TOKEN` (bot gate),
`NVAPI_KEY` (server only), `NEXT_PUBLIC_PRIVY_APP_ID` (opt).

## 9 — How another agent demos without source
1. Open `<preview-url>/app` — radar, ticker, Score sort.
2. Open `<preview-url>/bot` — locked without admin token (expected).
3. Open `<preview-url>/waifus` + `/waifus/sable` — squad + dossier.
4. `GET <preview-url>/api/bot/health` without token → 401 (gate works).
5. `POST <preview-url>/api/ai` `{"prompt":"say hi"}` → AI reply (quota-gated).
Give them THIS file + the URL. No keys, no zip.

## 10 — Preservation rules
1. Never hardcode keys — env only, secrets server-side.
2. Keep SFW — only lucy-work + rias-waifu on /waifus.
3. Keep free-tier — no paid APIs in hot path.
4. Don't regress §6 LIVE list on any rebuild.
5. Coordinate builds — tree is often dirty + co-agent active; don't commit mid-edit.
6. `_archive/` is the labs graveyard — never import/build from it (excluded from tsc, git, Vercel, Electron). Revive by copying out, never linking in.
