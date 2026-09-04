---
name: testing-avatar-vrm
description: How to run and test the pantherdigital (emergent-matrix) Next.js app locally, especially the /avatar VRM viewer and the main /, /app, /waifus, /portfolio routes.
---

# Testing pantherdigital / emergent-matrix locally

## Running the app
- `npm install` then `npm run dev` → http://localhost:3000 (Next.js 16 + Turbopack).
- A dev server may already be running on :3000 from a previous session. `next dev` refuses to
  start a second one and prints the existing PID — just use the running instance instead of
  killing it. First compile of a route takes ~20-30s, so wait generously after navigating.
- No env vars are required; the app runs keyless. `.env.local` API keys are optional.
- Consequence of keyless mode: the `/app` coin feed can stay at "0 real coins" / "Loading…"
  indefinitely (CoinGecko rate limiting). This is NOT a bug. Anything that needs a coin row
  (the coin detail drawer, radar dots, AI picks) may be untestable without keys. Say so
  explicitly rather than marking it passed. Filter pills still work and show
  "Showing 0 <Chain> coins · sorted by Score · Clear ×".

## Testing the /avatar VRM viewer
`src/components/avatar/AlinaAvatar.tsx` dynamically imports `@pixiv/three-vrm`, registers
`VRMLoaderPlugin` on a `GLTFLoader`, and loads **`/avatar.vrm`** (i.e. `public/avatar.vrm`).

Important: `public/avatar.vrm` shipped in the repo is a ~1.1 KB JSON stub
(`metaName: "Alina (placeholder)"`), so the viewer **always falls back to 2D** out of the box.
A screenshot of the 2D card proves nothing on its own — you must distinguish the failure modes:

- Read the browser console. The component logs
  `[AlinaAvatar] VRM not available, using 2D fallback: <reason>`.
  - `three-vrm not installed — falling back to 2D` → the dependency is missing/unresolvable (bad).
  - `Cannot read properties of undefined (reading 'bufferView')` / `placeholder VRM` → the
    module resolved and the loader actually parsed the stub asset (expected, good).
- Status badge top-right of the card: `◑ 2D STANDBY` vs green `● VRM LIVE`.

To prove the 3D path end-to-end, temporarily swap in a real VRM 1.0 model:
```bash
curl -sL -o /tmp/sample.vrm \
  https://github.com/pixiv/three-vrm/raw/dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm
cp public/avatar.vrm /tmp/avatar.vrm.bak
cp /tmp/sample.vrm public/avatar.vrm
# hard-reload http://localhost:3000/avatar → badge should turn green "● VRM LIVE",
# bottom-left card should read "ALINA · VRM 1.0", and a 3D humanoid should render
cp /tmp/avatar.vrm.bak public/avatar.vrm   # ALWAYS restore; public/ is tracked by git
```
Verify `git status --porcelain public/` is clean afterwards.

## Environment notes
- Headless Chrome here uses software WebGL (SwiftShader). Console warns
  "Automatic fallback to software WebGL has been deprecated" and logs
  "GPU stall due to ReadPixels" — three.js still renders correctly, so these are noise.
- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` is a
  pre-existing three r185 deprecation warning from AlinaAvatar.tsx, not an error.

## Devin Secrets Needed
- None for the avatar flow. Optional (for populated `/app` crypto data): a CoinGecko demo API
  key in `.env.local` (used as `x-cg-demo-api-key` by `src/app/api/coins/markets/route.ts`).
