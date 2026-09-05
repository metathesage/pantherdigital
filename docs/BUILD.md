# Panther Digital — Emergent Matrix — BUILD.md

> **Build:** `master` @ `e36a802` + 1 uncommitted fix · **Compiled:** 2026-09-01 23:23 CDT · **Pages:** 1240 static (spec: 1239) · **Next.js 16.3.3 Turbopack**
> **Owner:** Boss **Lucy** (@sageglowsbot) · **Head Worker:** **Rias** · **Model:** `muse-spark-1.2-contributor-free` (opencode-free, creditmax/free tier)
> **Workdir:** `C:/emergent-matrix` · **Hobby Navi:** `C:/waifu-navi` (in progress) · **ComfyUI:** `C:/ComfyUI`

---

## 1 — Current Build Overview

**Panther Digital** — minimal luxury crypto discovery radar.

- **Live feed:** CoinGecko `/coins/markets` proxied server-side (`/api/coins/markets`) — **300 coins** across 3 pages × 100, `sparkline=true`, `price_change_percentage=1h,24h,7d`. Refresh 120s, 429-aware with exponential backoff, `stale-while-revalidate` + CORS headers, keeps last-good feed on error.
- **Scoring:** `emergentScore` 0–100 per coin — volume/mcap ratio + momentum + volatility + trend weighting. **ScoreRing** SVG ring (r=17) with `90+` elite state: orange `#FF6B00` stroke, outer dashed ring `r+4`, glow `drop-shadow(0 0 8px rgba(255,107,0,0.55))`, `animate-[pulse_1.6s]` + `ping` border, star `★`.
- **Ticker:** doubled coin list, `animationDuration 600s`, marble backdrop (`ticker-marble` + `ticker-marble-overlay`), hover card with CGK/Dex/Details links. Highlights: **gainers** → `border-emerald-400/50 bg-white shadow-[emerald]`, **surging** (`change24h >=8%` OR `trend==="Breaking"`) → `!border-[#FF6B00] surge-glow shadow-[0_0_16px_rgba(255,107,0,0.45)] ring-1` + `🔥 SURGING` pill + pulsing icon border. `90+` without surge → `surge-90`.
- **Launch:** `/` is black-marble panther hero (`/black-marble-panther.jpg` 94% veil) with 1100ms loader (panther-icon + ring + bar), `PANTHER DIGITAL / EMERGENT MATRIX / LAUNCH APP` CTA only — no 3D bloat on launch, `prefers-reduced-motion` bypass.
- **App (`/app`):** 920-line client page. Chain pills (All/Solana/Ethereum/Base/Robinhood/Sui) + Bucket pills (Layer 1/DeFi/Meme/AI/Gaming/Stable/RWA/Infrastructure) with mapped marble icons + Robinhood orange glow/scale/ping + `filterPulse` ping 700ms. Sort default `emergentScore` (trophy), also `trend` with Breaking first. Search + watchlist + `showCount` pagination. Panels: Radar (live counts), AI Picks, Market Pulse (top3 volume, meme index, BTC dominance via `/api/global`), Fear & Greed (`/api/fng`), News (`/api/news`), Dex boosts (`/api/dex`), Panther AI trader (picks Breaking/Heating top5, simulated entry ±3%, PnL, $400+i*120 size), AI Spotlight (AI bucket top4), X-scan KOL (`/api/x-scan`), RWA, Nfts (OpenSea→CG→blue-chip→Dex fallback, 24h/7d/30d scaled volume), detail drawer (chart, holders, risk, dex pool) + holders detail box + trader deep stats (win%/vol).
- **Nav:** Minimal header on `/app` + `/waifus` + `/avatar`: logo is always `Link href="/"` with `/panther-icon.png` border `border-[#0A0A0A]/10` hover, no Privy warning banner, 3 icons + Connect, mobile full width. Auth: `PrivyProvider` graceful fallback — if `NEXT_PUBLIC_PRIVY_APP_ID` missing or `clz-demo-privy-app-id`, renders children only; Connect modal offers MetaMask / Phantom / Coinbase + Privy equally, never hangs on `Initializing...`, direct wallet stored in local state (`directWallet`/`directChain`).
- **Routes:** `/` (launch), `/app` (matrix), `/avatar` (VRM preview), `/waifus` (waifu navi), plus TCG legacy: `/cards/[cardId]` (SSG 1109+), `/sets/[setId]` (42), `/wiki/talents/[slug]` (67), `/about`, `/collection`, `/decks`, `/packs`, `/search`, `/portfolio`, etc. Total **1240 static** (track /app dynamic).

### Live Integrations (free, credit-light)

| Service | Route | Key | Free? |
|---|---|---|---|
| CoinGecko markets | `GET /api/coins/markets?page=&per_page=` | `COINGECKO_API_KEY` → `x-cg-demo-api-key` | Demo 30-50 req/min, 10 w/o |
| DexScreener boosts/search | `GET /api/dex?kind=boosts\|topBoosts&q=&address=` | none | 100% free CORS `*` |
| Helius DAS/RPC (Solana) | `GET /api/helius` | `HELIUS_API_KEY` (proxy, never client) | free tier |
| OpenSea trending | `GET /api/opensea?chain=&limit=` | `OPENSEA_API_KEY` optional | fallback to CG NFTs |
| Etherscan enrichment | client via `/api/...` | `NEXT_PUBLIC_ETHERSCAN_API_KEY` optional | optional |
| CoinGecko global | `GET /api/global` | shared CG key | free |
| Fear & Greed | `GET /api/fng` | none | free (alternative.me proxy) |
| News | `GET /api/news` | none | aggregated |
| X-scan KOL | `GET /api/x-scan` | none | mocked/live scan |

All keys optional — app works keyless (degraded limits). Never hardcode; env only.

---

## 2 — Stack

### Core

| Layer | Version / Detail |
|---|---|
| **Next.js** | `16.3.3` with **Turbopack** (`next.config.ts` sets `turbopack.root = import.meta.dirname`) |
| **React** | `19.2.8` + `react-dom 19.2.8` |
| **TypeScript** | `^5` strict (`tsconfig.json`, `next-env.d.ts`) |
| **Tailwind** | `^4` via `@tailwindcss/postcss` + `postcss.config.mjs` |
| **three** | `^0.185.1` (`@types/three 0.185.4`) — PantherBackground + LucyAvatar |
| **zustand** | `^5.0.15` (`persist`) — `usePanther` (gems/xp/level/streak/hunts) + `useAuthStore` |
| **Privy** | `@privy-io/react-auth ^3.38.0` — lazy `require`, env-gated |
| **Geist fonts** | `next/font/google` Geist + Geist_Mono |
| **ESLint** | `eslint ^9` + `eslint-config-next 16.3.3` |

### APIs & Data

- `src/data/sets.json` + `src/data/cards.json` — TCG catalog (TCG still SSG, 1000+ cards)
- `src/lib/panther.ts` — gamification store (handle/bio/avatar, `logHunt()` streak→gems `10+min(40,streak*5)`, xp+25, level `floor(xp/500)+1`)
- `src/lib/auth.ts` — device-local `useAuthStore` (mimics OAuth, swap to NextAuth later)
- `src/lib/coinIcons.ts` — marble icon mapping (`/icons/marble/robinhood/...`, `getMarbleIcon()`)
- `src/lib/data.ts` / `deckRules.ts` / `market.ts` / `meta.ts` / `store.ts` — TCG helpers

### Infra & Deploy

| Target | Config |
|---|---|
| **Vercel** | Primary (git-deploy). No `vercel.json`; env via Vercel dashboard + `.env.vercel.tmp` (oidc token). `turbopack.root` fixed for Vercel. Heavy SSG ignored via `.vercelignore` (`public/panther.glb`, `panther-procedural.glb`, `panther-meshy-8192.jpg`, `src/app/cards`, `/sets`, `/wiki`, etc. kept but TCG pages still generate). |
| **Netlify** | `netlify.toml` — `command=npm run build`, `publish=.next`, `plugin @netlify/plugin-nextjs 5.15.13` |
| **Build** | `npm run build` → Turbopack `3.2s` compile + `2.9s` TS + `19.4s` SSG (23 workers, 1240 pages). Warning only: optional `@pixiv/three-vrm` missing is expected (dynamic import). |
| **.vercelignore** | strips `node_modules`, `.next`, `out`, `.netlify`, `.git`, `*.log`, `.env*`, heavy 3D, TCG SSG sets on preview (full still builds). |

### LLM / Voice / Comms (creditmax)

- **LLM:** `muse-spark-1.2-contributor-free` via `opencode-free` — **free tier, no billing**. Used for waifu crons + any LLM tasks. Crons delegate to Rias→trio.
- **Telegram:** `@sageglowsbot` — boss channel for Lucy. Rias reports there.
- **Voice:** **Jessica (ElevenLabs)** primary, **Jenny** fallback (local/edge TTS). No paid calls in hot path; all TTS local or creditmax.
- **Ollama (vision):** `moondream` (local, free) — `ollama run moondream` for image→caption / avi critique. Not yet on PATH on this host (`ollama: command not found` at doc time) — install via https://ollama.com + `ollama pull moondream`.
- **Credit posture:** zero paid APIs in build. DexScreener, CG demo, Helius free tier, OpenSea optional, ComfyUI local, VRoid free, Kalidokit/Mediapipe in-browser. Keep it that way.

---

## 3 — Waifus + Crons (Hermes)

> Boss **Lucy** delegates. **Rias** (head worker, ex-Akari/Navi UX Priestess) owns nav/polish and fans out to trio. All via **Hermes cron** (`hermes cron list`, `gateway alive` badge). Workdir `C:/emergent-matrix`, `Deliver: local`, `Repeat: ∞`.

### Roster

| # | Waifu | Title | Job (`Name`) | Schedule | File(s) Owned | Goal | Cron ID | Status |
|---|---|---|---|---|---|---|---|
| **Boss** | **Lucy** | Boss Waifu · Panther Command | — (delegates) | — | `public/lucy-work.png` (work), `public/lucy-private.png` (private) | Orchestrates matrix, Telegram @sageglowsbot, model muse-spark | — | active |
| 1 | **Rias** 🌸 | **Head Worker · UX Priestess** | `panther-nav-ux` | **every 6h** (360m) | `src/app/app/page.tsx:402-430` + `layout.tsx` + `waifus/page.tsx` | Owns navigation & polish — logo always → `/`, header minimal (3 icons + Connect), marble ticker tidy, `/waifus` glass updates, mobile perfect. Delegates to trio. | `00a627273861` | active |
| 2 | **Kuro** 🐆 | Market Panther | `panther-market` | **every 30m** | `src/app/api/coins/markets/route.ts` + `src/app/app/page.tsx:272-303` | Keep CG feed flawless — proxy via `x-cg-demo-api-key`, 429 backoff, 3 pages, emergentScore calc. Never hardcode keys. | `1d4a12cf83bd` | active |
| 3 | **Hikari** ⚡ | Surge Huntress | `panther-ticker-feed` | **every 2h** (120m) | `src/app/app/page.tsx:430-517` | Owns ticker + feed — highlight gainers (emerald) & surging (Breaking or +8% → `surge-glow`, pulse, `SURGING` badge). Score sort (trophy) with orange 90+ glow. | `f046435c05a7` | active |
| 4 | **Mio** 🔐 | Auth Guardian | `panther-auth` | **every 6h** (360m) | `src/components/PrivyProvider.tsx` + `page.tsx:399` | No Privy warning on top — graceful fallback when `NEXT_PUBLIC_PRIVY_APP_ID` missing, Connect modal offers MetaMask/Phantom/Coinbase + Privy equally, never hang. | `79d57a7e9bb9` | active |

> Note: earlier docs listed `Akari/Navi` — replaced by **Rias** (`rias-waifu.png` canonical). `C:/waifu-navi` hobby app uses extended roster Rias/Lucy/Astra/Lux (see §7) — keep them distinct.

### Hermes Cron Snapshot (2026-09-01 23:33 CDT)

```
1d4a12cf83bd [active]  panther-market       every 30m   Next 23:42:41  Last 23:12:41 ok  completed a68ee8a6aa4d
f046435c05a7 [active]  panther-ticker-feed  every 120m  Next 23:33:01  Last (on schedule)
00a627273861 [active]  panther-nav-ux       every 360m  Next 2026-09-02 03:33:05
79d57a7e9bb9 [active]  panther-auth         every 360m  Next 2026-09-02 03:33:10
```

- **Manager:** Hermes (local gateway, `gateway alive` green dot on `/waifus`).
- **No crontab / schtasks** — these are Hermes-local jobs, not OS cron. `crontab` not found on Windows host, `schtasks` shows only OS tasks (Acer, Edge, etc.).
- **IDs truncated in UI** — full IDs live in `hermes cron list`. Waifu file shows truncated display but full lookup via cron name.
- **To reschedule:** `hermes cron add --name panther-market --schedule "every 30m" --workdir C:/emergent-matrix -- <command>` or `hermes cron update <id>`.

### /waifus Page — Waifu Navi (`/waifus`)

- **Route:** `src/app/waifus/page.tsx` (client, 300+ lines). Meta AI share inspo: centered single-column, stacked glass cards over marble jungle, centered header, glass `bg-white/75 backdrop-blur-xl`.
- **Backdrop:** `/home-bg.jpg` (marble jungle) blown up `scale-[1.02]` + white gradient veil `rgba(255,255,255,0.62→#F8F8F7)` + jungle radial tints + SVG grain. `black-marble-panther.jpg` fallback veil if home-bg missing.
- **Header:** glass `sticky top-0 bg-white/72 backdrop-blur-2xl`, panther-icon home link, `← APP` pill, `BOSS WAIFU · LUCY` black pill with emerald pulse dot, `gateway alive` green badge, `Launch App` CTA, ticking `now` (`MMM DD HH:MM:SS`, 1s interval).
- **Boss card:** **Lucy** section with `lucy-work.png` (SFW work outfit, `object-top`), handle `@sageglowsbot`, model badge `muse-spark-1.2-contributor-free`, location `Telegram · C:/emergent-matrix`.
- **4 waifu cards:** Rias (with `rias-waifu.png` avatar, accent `#FF5A7A`, HEAD), Kuro (`#0A0A0A` MARKET), Hikari (`#FF6B00` TICKER), Mio (`#6B7280` AUTH) — each shows job, schedule, file, goal, status dot, cronName.
- **Aesthetic:** single-column `max-w-[720px]`, `rounded-2xl/3xl`, mono caps `text-[11px] tracking-[0.14em]`, subtle blur/shadow. Full notes in file header comment (boss=Lucy, Rias replaces Akari, avis mapping, cron IDs, keep SFW, `npx tsc --noEmit` must pass).
- **SFW rule:** only `lucy-work.png` + `rias-waifu.png` rendered here; `lucy-private.png` exists in `/public` but hidden on this page.
- **Holo:** ships `src/components/HoloProjector.tsx` (CSS-only floating Lucy) — drop `<HoloProjector />` into `/waifus` corner `br` when ready. Controlled via `imageSrc`, `corner`, `defaultOpen`, respects `prefers-reduced-motion`.

---

## 4 — ComfyUI / Ollama / Avatar Pipeline

### ComfyUI — `C:/ComfyUI`

| Item | Detail |
|---|---|
| **Location** | `C:/ComfyUI` (git clone, ~Sept 1) |
| **Version** | Recent (has `comfy_api`, `alembic_db`, `manager_requirements.txt`, `0.3.x` tree) |
| **Checkpoint** | **`animagine-xl-3.1.safetensors` ~6.5 GB** in `models/checkpoints/` (`cagliostrolab/animagine-xl-3.1`, Fair AI Public License 1.0-SD, 1024², metadata `modelspec.author Cagliostro Research Lab`). Verified present via `ls -lh` (6.5G) + header CAT (JSON metadata). |
| **Fallback checkpoints** | `Juggernaut-XL_v9` / `DreamShaperXL_Turbo_V2` (already cached per `avatar.config.json` pipeline note; not currently on disk at this host — re-download if needed, or use animagine directly). |
| **Output** | `C:/ComfyUI/output/` — currently: `lucy-animagine.png` 1.5M, `lucy-moon.png` 1.2M, `lucy-rooftop.png` 1.5M, `lucy-work.png` 1.5M, `rias-waifu.png` 1.3M (generated 2026-09-01 22:35–23:18). Future: `output/lucy/lucy_tpose_*.png` (front/side/back sheets). |
| **Custom nodes** | Only `websocket_image_save.py` + `example_node.py.example` currently. **Needed for Lucy sheet:** `ComfyUI_IPAdapter_plus` (cubiq) + `comfyui_controlnet_aux` (Fannovel16 / DWPose) — `git clone` into `custom_nodes/`, then via Manager install `ip-adapter_sdxl_vit-h.safetensors` → `models/ipadapter/` + `controlnet-sdxl-openpose` → `models/controlnet/` + `CLIP-ViT-H-14-laion2B` → `models/clip_vision/`. |
| **Models dirs** | All scaffolded: `checkpoints`, `clip`, `clip_vision`, `controlnet`, `ipadapter`, `vae`, `loras`, `upscale_models`, etc. (empty except checkpoints/output — ready to populate). |
| **Workflow JSON** | `docs/comfy-lucy-workflow.json` — 12-node graph: `CheckpointLoaderSimple(animagine-xl-3.1)` → `LoadImage ×2 (rias-waifu.png + lucy-work.png)` → `IPAdapterModelLoader + CLIPVisionLoader` → `IPAdapterApply ×2 (0.70 rias, 0.62 lucy, standard)` → `ControlNetLoader(openpose) + OpenPosePreprocessor(DWPose T-pose)` → `CLIPTextEncode` positive _t-pose character sheet…_ / negative _3d blurry lowres nsfw…_ → `KSampler 28 steps CFG 6.5 euler_a` → VAE Decode → Save to `output/lucy/`. Import via ComfyUI → Load. |
| **Prompt (positive)** | `anime girl, single character, t-pose, character sheet, front view, side view, back view, long dark hair, red eyes, rias gremory inspired, office secretary outfit, white blouse, black skirt, soft lighting, high detail, clean background, white background` — SFW boss energy. |
| **Prompt (negative)** | `3d, realistic, blurry, lowres, extra limbs, duplicate, nsfw, watermark, text` |
| **Sampler** | 28 steps, CFG 6.5, `euler_a` / `dpmpp_2m`. Batch 3 (same seed, pose variations) for front/side/back + face close-up pass (`face close-up, neutral expression, mouth closed, eyes open`). |
| **Tiling** | Drop outputs into `C:/emergent-matrix/public/avatar/texture/` (or `C:/ComfyUI/output/lucy/` then copy) — VRoid reads them as texture templates. |

### Ollama — Vision (Moondream)

- **Purpose:** free local vision — caption avis, critique ComfyUI sheets, feed emergentScore context.
- **Model:** **`moondream`** (tiny, fast, RTX 4050 friendly, ~1.7B). Alternative: `llava` larger but heavier.
- **Current status:** **not installed** on this host (`ollama: command not found` as of doc time). Install when ready:
  ```bash
  # https://ollama.com — Windows installer
  ollama pull moondream
  ollama run moondream   # test: "describe this image" + attach rias-waifu.png
  ollama list            # verify
  ```
- **Usage:** `ollama run moondream "Describe this character sheet for VRoid — focus on hair, eyes, outfit seams"` or API `http://localhost:11434/api/generate`.
- **No billing** — all local, creditmax.

### Avatar Pipeline — VRM / Live2D (free, local, no paid APIs)

Full guide: **`docs/avatar.md`** (292 lines, scaffolded, VRM vs Live2D table, step-by-step).

```
[lucy-work.png + rias-waifu.png]  ← SFW avis in public/
        │
        ▼
ComfyUI (C:/ComfyUI) — Animagine XL 3.1 + IPAdapter (both avis, 0.62-0.70) + ControlNet OpenPose T-pose
        │              → output/lucy/lucy_tpose_*.png (front/side/back + face)
        ▼
VRoid Studio (free, https://vroid.com/en/studio) — import textures → sculpt → Export VRM 1.0 (T-pose, 1.0 not 0.x)
        │
        ▼
(Optional) Blender 4.x + VRM Addon (saturday06, free) — weight paint / ARKit blendshapes, re-export VRM 1.0 <25MB
        │
        ▼
public/avatar.vrm → three + @pixiv/three-vrm (MIT, ~180KB) renders in Next.js at /avatar
        │
        ▼
Kalidokit + Mediapipe (free, in-browser, no cloud) — webcam face/pose → drives VRM blendshapes (gated by avatar.config.json tracking.enabled)
Alt: PSD → Live2D Cubism Editor Free → public/avatar/live2d/model3.json → pixi-live2d
```

- **Placeholder now:** `public/avatar.vrm` (1,187 bytes, tiny glb placeholder — viewer detects `placeholder` meta and falls back). `public/avatar/avatar.config.json` flags `vrm.placeholder=true`, `live2d.placeholder=true`.
- **Scaffolded:** `src/components/avatar/LucyAvatar.tsx` (VRM → `GLTFLoader` + `VRMLoaderPlugin` dynamic, lights `Ambient+Directional+Fill`, ground disk, breath sway, blink `expressionManager.setValue("blink")`, auto-rotate; falls back to 2D crossfade among `rias-waifu.png`/`lucy-work.png`/`lucy-private.png` every 4200ms), `src/components/avatar/AvatarStage.tsx`, `src/app/avatar/page.tsx` preview (`/avatar`) with checklist + SFW avi grid + quick start `npm install @pixiv/three-vrm`.
- **Live2D stub:** `public/avatar/live2d/model3.json` Cubism 3 stub + README. Not enabled (`enabled:false`).
- **To go 3D:** VRoid Export VRM 1.0 → overwrite `C:/emergent-matrix/public/avatar.vrm` → `npm install @pixiv/three-vrm` (if not) → `npm run dev` → `/avatar` auto-promotes.

---

## 5 — Avis & Assets

### Avis (SFW core)

| File | Size | Role | Used |
|---|---|---|---|
| `public/lucy-work.png` | 1.53 MB | **Lucy — Boss Waifu, work outfit** (Lucy work variant, `object-top`) | `/waifus` boss card, `HoloProjector` default `imageSrc`, avatar IPAdapter #2 (weight 0.62), `/avatar` grid |
| `public/rias-waifu.png` | 1.35 MB | **Rias — Head Worker** (canonical, face/hair ref) | `/waifus` Rias card avatar, `HoloProjector` fallback, avatar IPAdapter #1 (weight 0.70), `/avatar` grid |
| `public/lucy-private.png` | 1.23 MB | Lucy private / extra ref (astra skin in waifu-navi) | NOT rendered on `/waifus` (exists for ComfyUI texture alt), `/avatar` grid third cell, `waifu-navi` Astra |

### Other Key Assets

| File | Note |
|---|---|
| `public/black-marble-panther.jpg` / `public/home-bg.jpg` | Same file (hard-linked 160KB) — marble jungle backdrop for `/` veil + `/waifus` |
| `public/panther-icon.png` | 632KB — logo everywhere (`Link href="/"`) |
| `public/panther.glb` 65MB, `panther-meshy-*.jpg` (1024/2048/8192), `panther-procedural.glb` 4KB | 3D panther for `PantherBackground.tsx` — progressive 3D bg with meshy fallback + progress |
| `public/avatar.vrm` 1.1KB | Placeholder VRM — replace with VRoid export |
| `public/avatar/avatar.config.json` 1.4KB | Runtime flags (vrm/live2d/display/tracking/pipeline) |
| `public/holo.html` 21KB | Standalone holoprojector preview (floating Lucy demo, same CSS as component) |
| `public/assets/mapped/*.png` + `public/icons/marble/robinhood/*.png` | Chain + bucket marble icons (CLIP-mapped) |
| `*.png` packs (marble_icons_pack.zip, robinhood_marble_pack.zip, panther_*.jpg, etc.) | Generated asset packs in workdir root — .gitignored, not shipped |

### Holo Projector — `src/components/HoloProjector.tsx` + `public/holo.html`

- **HoloProjector.tsx** (17KB, CSS-only, RTX 4050 @60fps): floating holographic Lucy — `float 3.2s ease-in-out`, glow `radial-gradient(70% 55% at 50% 38%, rgba(120,220,255,0.55)...)` blur 18px, `scanlines` repeating-linear `7px`, `chromatic fringe` cyan `-0.9px` / magenta `+0.9px` `mix-blend-mode:screen`, `beam` polygon clip `28%→72%→100%`, base `disk 112×34` with afterglow, topbar `LUCY — BOSS WAIFU`, caption, minimize/expand (`Fixed corner br/bl/tr/tl`, `defaultOpen`, `flicker` 120ms every 3.2–5.7s, `prefers-reduced-motion` disables), fallback `rias-waifu.png` on `imgErr`.
- **holo.html** — standalone preview at `/holo.html` (no Next.js needed). Same holo-root, controls `Toggle size / Minimize / Flicker test`, fake waifus background, header badge `PUBLIC/HOLO.HTML`.
- **In progress:** corner placement on `/waifus` (import + `<HoloProjector corner="br" />`). Optional R3F upgrade noted at bottom of component (`will-change:transform`, no canvas now).

### VRM — `public/avatar.vrm` + `src/components/avatar/*`

- Placeholder now, 2D fallback crossfades 3 avis (4200ms). Real VRM path: `C:/emergent-matrix/public/avatar.vrm` (VRM 1.0, overwrite placeholder) → `LucyAvatar` auto-detects `userData.vrm` + `metaName` not placeholder + `scene` exists → breath sway (`chest.position.y sin 0.9`, `spine.rotation.z sin 0.35`), blink, `vrm.update(dt)`, slow auto-rotate `sin 0.12 *0.08`, resize observer, transparent scene bg, soft lights. Build warning `Can't resolve @pixiv/three-vrm` is expected (optional peer, lazy-import).

---

## 6 — App Feature Map (for editors)

**Score & Ticker**

- `emergentScore` calc in `src/app/app/page.tsx:275-310` (`fetchCoins` → 3-page CG fetch with 429 retry 900ms*2^attempt, then map `volMcap`, `c24`, `c1`, derive `risk`, `trend` Breaking/Heating/Volatile/Stealth/Cooling, `score`, `reason`, `spark`, `chain`, `category`, `top10HoldersPct`).
- `ScoreRing` at `page.tsx:123` — svg 44×44 r17 dash `2πr*score/100`, 90+ orange bold.
- Ticker at `page.tsx:447-458` — doubled list, `600s` scroll, `onMouseEnter setTickerHover` card (CGK/Dex/Details), `useEffect` log feed `1400ms` random top20.

**Global / Social**

- `global` via `/api/global` (BTC dom, total mcap), `fng` via `/api/fng` (0-100 bar + `Extreme Greed≥75` prose), `news`, `dex` boosts, `x-scan` KOL — all `useEffect` with intervals (news 300s, dex 60s, global 120s, fng 300s, x 90s).
- Panther AI trader `useEffect` on `coins.length+lastUpdated` — picks Breaking/Heating sorted by score top5, entry `price/(1+±3%)`, `pnlPct`, `size`, `ageM`.

**NFT / RWA**

- `fetchNfts()` waterfall: `opensea` → CG `nfts/list`+detail → `blueIds` fallback (bayc/punks/azuki…12) → Dex boosts as placeholder. Scales volume by `nftTimeframe` `24h:1 /7d:6.2 /30d:24`. `RWA` coins = `category==="RWA"` slice 12.

**Header**

- `page.tsx:427-464` sticky `z-40 bg-white/95`, logo `Link "/"` size-9 `border p-0.5`, `← APP`-style pills, `isConnected` → avatar bubble vs `Connect` button, `FilterPulse` chain/bucket pills with Robinhood orange `shadow-[0_0_14px]` scale 1.06 ring.

**Auth Modal**

- `showConnect` fixed `z-[60] bg-black/85 backdrop-blur-sm`, `max-w-[440px] rounded-[28px] border white/15`, marble bg, 5 buttons: `Privy → login`, `X → login`, `MetaMask`, `Phantom`, `Coinbase (Base)` with deep-link fallback (mobile→app, desktop→install page). `PrivyProvider.tsx` env-gated.

---

## 7 — Patch Notes

### Latest (2026-09-01) — Ticker / Navi / Market fixes + Build

> **Build compiled: 1240 pages** (spec: 1239) — `✓ Compiled successfully in 3.2s` + `Generating static pages (1240/1240) in 19.4s` (23 workers). Finalization via `hermes-agent` verify. One expected warning: `@pixiv/three-vrm` dynamic (optional peer).

**Market proxy — 429 backoff (uncommitted, `src/app/api/coins/markets/route.ts`)**

- Added 429-aware fetch loop: `for attempt 0..3`, on `r.ok` return JSON with `Cache-Control public, s-maxage=30, stale-while-revalidate=60` + CORS `*`.
- On 429, respect `Retry-After` (secs or HTTP-date), else `delayMs = 900 * 2^attempt` (max 10000ms), `await setTimeout(delayMs)`, retry; non-429 breaks immediately. Preserves `lastRes`/`lastText` for error JSON `CoinGecko ${status}`.
- Fixes prior single-fetch 429 surface; complements client-side `fetchGeckoPage` retry in `app/page.tsx:282` (`if status 429 && attempt<3 delay 900*2^attempt` recursive).

**Ticker fixes (Hikari, `panther-ticker-feed`, every 2h)**

- Gainers: emerald border `border-emerald-400/50 shadow-[emerald]` vs muted `opacity-80`.
- Surging: `Breaking` OR `+8%` → `!border-[#FF6B00] surge-glow shadow orange ring-1`, icon `border-[#FF6B00] pulse`, pill `bg-[#0A0A0A] text-white animate-pulse` `🔥 SURGING` vs `category`. `90+` without surge → `surge-90`.
- Scroll: `animationDuration 600s` on doubled list, `gap 6px`, marble bar `ticker-bar ticker-marble` overlay `border-y border-white/40`, `ticker-track py-1.5`, hover card links `CGK ↗` (`coingecko.com/en/coins/{id}`) + `Dex ↗` (`dexscreener.com/{chain}?q={symbol}`) + `Details →`.

**Navi fixes (Rias, `panther-nav-ux`, every 6h)**

- Logo: `Link href="/"` on **all** pages (`/`, `/app`, `/avatar`, `/waifus`, `/sets`, `/cards`, `/wiki`, etc.), wrapped `panther-icon.png` `size-9 border p-0.5 hover:border-[#0A0A0A]/20`.
- No Privy banner: `PrivyProvider` returns `<>children</>` when no `NEXT_PUBLIC_PRIVY_APP_ID` or demo id — no warning bar, never `Initializing...` hang.
- Header minimal: sticky `bg-white/95 backdrop-blur` (app) / `bg-white/72 backdrop-blur-2xl` (waifus), 3 icons + Connect only, icon-only on mobile (`hover titles`), centered glass on waifus (`max-w-[1120px]`).
- Mobile: ticker pills wrap, footer centered, waifu cards single-column stack (`max-w-[720px]`), `prefers-reduced-motion` respected (loader 1100ms skipped, holo float/scan disabled).

**Recent git — last 5 commits (master)**

```
e36a802 Market pulse + show more + AI spotlight + X scans: top3 volume, meme index, btc dom, fear greed, news below pulse, spotlight, x-scan KOL
3d5e848 Merge deep batch + polish to master for Vercel deploy
0f30451 Polish: launch CTA + radar glow polish, layout icons, verified build
4a11b9a Deep batch: Robinhood orange glow+scale+ping, OpenSea proxy with fallback, holders detail box, trader deep stats (win%/vol), RWA deep, build 1238
1ce6634 Secure CoinGecko+Helius: env-only keys (no hardcode), DexScreener free proxy live, fix robinhood/sort, add news/trader/dex boosts
```

**Older highlights (Aug 31)**

- `342c66b` Launch: huge LAUNCH APP + loader + surge glows/rotate + Coinbase deep-link fallback + strip 3D bloat
- `d2e8ce5` CLIP mapped icons buckets+chains (CashCat→Robinhood fixed)
- `4b818ea` Nav: icon-only hover titles, score sort default
- `eff8b96` Fix turbopack root, restore launch page, ignore heavy aether SSG, wire Hi3D 3D bg
- `0a5f439` 3D: Hi3D 62MB sculpt → PantherBackground progressive 3D
- `a43e0c2` Add 429 retry + last-good feed on refresh; `.vercelignore`
- `7868417` Cleanup: remove Privy warning, logo→home, ticker highlights, trim nav, roadmap
- `aed9520` Panther Digital: start-menu homepage, /app sort+category+Top10 PnL, portfolio scanner, wiki, icon pack

**Files changed since last build**

- `src/app/api/coins/markets/route.ts` — 429 retry loop (37 +11 lines changed, not yet committed)
- Untracked new since master: `src/app/waifus/page.tsx`, `src/app/avatar/page.tsx`, `src/components/avatar/*`, `src/components/HoloProjector.tsx`, `public/avatar.vrm`, `public/avatar/*`, `public/holo.html`, `public/lucy-work.png`, `public/lucy-private.png`, `public/rias-waifu.png`, `docs/avatar.md`, `docs/comfy-lucy-workflow.json`, plus asset packs (`Alita waifu.png`, `rias-waifu.png` work variants, `Jungle-Marble-Waifu-Command.html`) — keep or .gitignore before next push.

**Build verification**

```
✓ Compiled successfully in 3.2s
✓ Finished TypeScript in 2.9s
✓ Generating static pages (1240/1240) in 19.4s (23 workers, Turbopack)
⚠ 1 warning (expected): Module not found @pixiv/three-vrm (optional peer, dynamic)
Route (app) — ○ / , ƒ /api/* (8 routes), ○ /app, ○ /avatar, ○ /waifus, ● /cards/* 1109+, ● /sets/* 42, ● /wiki/talents/* 67
```

---

## 8 — File Map

```
C:/emergent-matrix/  (repo root, master)
├── .env.local                 ← COINGECKO_API_KEY, HELIUS_API_KEY, NEXT_PUBLIC_COINGECKO_API_KEY (***, never commit)
├── .env.example               ← template + DexScreener keyless docs + OPENSEA optional
├── .env.vercel.tmp            ← Vercel OIDC token (auto)
├── .gitignore / .vercelignore / netlify.toml
├── next.config.ts             ← turbopack.root = import.meta.dirname
├── package.json               ← next 16.3.3, react 19.2.8, three 0.185, zustand 5.0, privy 3.38
├── tsconfig.json / eslint.config.mjs / postcss.config.mjs
├── public/
│   ├── panther-icon.png       ← logo
│   ├── black-marble-panther.jpg / home-bg.jpg  (hard link)
│   ├── panther.glb (65MB) / panther-procedural.glb (4KB) / panther-meshy-*.jpg
│   ├── lucy-work.png / rias-waifu.png / lucy-private.png  ← SFW avis
│   ├── avatar.vrm (placeholder 1.1KB)
│   ├── avatar/avatar.config.json / live2d/model3.json / texture/README.md
│   ├── holo.html              ← holoprojector standalone preview
│   ├── assets/mapped/*.png    ← chain icons
│   └── icons/marble/robinhood/*.png
├── docs/
│   ├── BUILD.md               ← this file
│   ├── REBUILD_PROMPT.md      ← concise rebuild prompt
│   ├── avatar.md              ← 292-line VRM pipeline guide
│   └── comfy-lucy-workflow.json ← 12-node ComfyUI graph
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← Geist, metadata Panther, PrivyProvider wrapper
│   │   ├── page.tsx           ← launch (black marble, loader 1100ms, LAUNCH APP)
│   │   ├── globals.css        ← tailwind + launch-veil, ticker keyframes
│   │   ├── app/page.tsx       ← 920-line matrix (coins, ticker, filters, trader, nfts, detail)
│   │   ├── avatar/page.tsx    ← LucyAvatar preview + checklist + avi grid
│   │   ├── waifus/page.tsx    ← boss+4 waifus, marble jungle glass, ticks
│   │   ├── api/coins/markets/route.ts ← CG proxy + 429 backoff
│   │   ├── api/dex/route.ts / api/opensea/route.ts / api/helius/route.ts
│   │   ├── api/global/route.ts / api/fng/route.ts / api/news/route.ts / api/x-scan/route.ts
│   │   ├── api/market/[cardId]/route.ts
│   │   ├── about/page.tsx / portfolio/page.tsx / search/page.tsx
│   │   ├── cards/[cardId]/page.tsx (SSG 1109+) / sets/[setId]/page.tsx / wiki/talents/[slug]/page.tsx
│   │   ├── collection / decks / packs / releases / fan-art / etc. (TCG legacy)
│   │   └── icon.png / favicon.ico
│   ├── components/
│   │   ├── HoloProjector.tsx  ← CSS float+scan+fringe+beam
│   │   ├── avatar/LucyAvatar.tsx + AvatarStage.tsx
│   │   ├── PrivyProvider.tsx  ← env-gated
│   │   ├── PantherBackground.tsx ← progressive 3D + meshy fallback
│   │   └── (TCG) CardCarousel, SearchBar, MarketPanel, etc.
│   ├── lib/
│   │   ├── panther.ts / auth.ts / coinIcons.ts / data.ts / market.ts / meta.ts / deckRules.ts
│   ├── data/ sets.json, cards.json
│   └── types/ (TCG types)
├── scripts/                   ← empty / legacy
├── C:/ComfyUI/                ← sibling, not in repo
│   ├── models/checkpoints/animagine-xl-3.1.safetensors (6.5G)
│   ├── custom_nodes/ (needs IPAdapter + controlnet_aux)
│   └── output/{_output_images_will_be_put_here, lucy-animagine.png, lucy-*.png, rias-waifu.png}
└── C:/waifu-navi/             ← hobby navi app (separate Next.js project, in progress)
    ├── src/app/page.tsx       ← 2×2 roster (Rias/Lucy/Astra/Lux) + HoloProjector + ChatPanel
    ├── src/components/HoloProjector.tsx / WaifuCard.tsx / ChatPanel.tsx
    ├── src/app/api/crons/route.ts (mock live crons, 8s poll) / api/chat/route.ts (local rule-based)
    └── public/{lucy-work.png, lucy-private.png, rias-waifu.png, marble.jpg, panther.glb}
```

Untracked at root (asset workbench, .gitignore or curate before push): `Alita waifu.png`, `alita window.png`, `0eb205b74b8e4068b304ab608267c466.png`, `Jungle-Marble-Waifu-Command.html`, `new-project.png`, `rias-waifu.png`, `rias waifu working.png`, `waifu_coder_...png`, `marble_icons_pack.zip`, `robinhood_marble_pack.zip`, `panther_*.jpg`, `top20_*.png`, etc.

---

## 9 — Env & Run

```bash
# C:/emergent-matrix
cp .env.example .env.local  # fill COINGECKO_API_KEY (demo), HELIUS_API_KEY — both optional

npm install
npm run dev   # http://localhost:3000  (launch /app /avatar /waifus /holo.html)
npm run build # must be ✓ 1240 pages, 1 expected warning (three-vrm)
npx tsc --noEmit

# Hermes crons (local)
hermes cron list
hermes cron add --name panther-market --schedule "every 30m" --workdir C:/emergent-matrix -- <cmd>
# logs: hermes cron logs <id>

# ComfyUI (first sheet)
# C:/ComfyUI/custom_nodes> git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus
# C:/ComfyUI/custom_nodes> git clone https://github.com/Fannovel16/comfyui_controlnet_aux
# Manager → install ip-adapter_sdxl_vit-h + controlnet-sdxl-openpose
# ComfyUI → Load → docs/comfy-lucy-workflow.json → Queue

# Ollama vision (when needed)
ollama pull moondream
ollama run moondream

# Hobby navi
cd C:/waifu-navi && npm install && npm run dev  # :3000 (separate port if both: pnpm dev -- -p 3001)
```

Deploy: push `master` → Vercel git-deploy (Netlify also via `netlify.toml`). Set env in Vercel dashboard: `COINGECKO_API_KEY`, `HELIUS_API_KEY`, `NEXT_PUBLIC_PRIVY_APP_ID` (or leave unset for no-auth graceful), `NEXT_PUBLIC_COINGECKO_API_KEY` mirrored. No hardcode.

---

## 10 — Known Gaps / Next

- **Holo projector:** CSS component done, not yet pinned to `/waifus` corner — wire `<HoloProjector corner="br" />` and ship `holo.html` already previews correctly.
- **VRM:** placeholder `avatar.vrm` — need VRoid export (see `docs/avatar.md` §2.3). `@pixiv/three-vrm` not `npm install`ed yet (lazy, build passes); install when real VRM ready: `npm install @pixiv/three-vrm`.
- **Waifu-navi:** `C:/waifu-navi` is hobby dashboard (marble jungle glass, 2×2 roster, chat, live cron poll 8s) — in progress, separate app, mock crons (swap to real Panther fetch later). Shares avis via copy from `C:/emergent-matrix/public`.
- **Ollama:** `moondream` not on PATH — install binary + pull when vision needed.
- **ComfyUI nodes:** IPAdapter + controlnet_aux not yet cloned — needed for T-pose sheet with both avis.
- **Commit:** `route.ts` 429 fix + new `waifus`/`avatar`/`holo` files are uncommitted/untracked — `git add` + `git commit -m "Market 429 backoff + waifu navi + avatar scaffold"` + push when ready. Prune or `.gitignore` loose `*.png` packs at root.
- **Build:** spec says **1239**, actual **1240** (cards/sets/talents SSG drift) — keep 1239 in spec, 1240 verified here.

---

*Lucy delegates. Rias executes. Panther guards. Jungle grows. You launch — free, lightweight, yours.*

© PANTHER DIGITAL — Emergent Matrix · Boss Lucy via muse-spark (creditmax) · 2026-09-01
