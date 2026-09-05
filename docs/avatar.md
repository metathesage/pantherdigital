# Lucy — Full Avatar (Live2D / VRM) — Free Local Pipeline

> **Owner:** Boss Lucy · Rias head worker  
> **Status:** scaffolded · placeholder VRM + Live2D stubs + viewer  
> **Stack:** Next.js 16 · `three` · `@pixiv/three-vrm` · ComfyUI + Animagine XL (local) · VRoid Studio (free, local) · Live2D Cubism Editor Free (optional)  
> **Rule:** No paid APIs. Everything runs on your machine or free open-source models.

---

## 0. What was scaffolded

```
C:/emergent-matrix/
├── docs/avatar.md                          ← this file
├── public/
│   ├── lucy-work.png                       ← base avi #1 (existing)
│   ├── rias-waifu.png                      ← base avi #2 (existing) — canonical Lucy ref
│   ├── lucy-private.png                    ← extra ref (existing)
│   ├── avatar.vrm                          ← ⚠️ placeholder — replace with real export (see §4)
│   └── avatar/
│       ├── avatar.config.json              ← runtime config consumed by <LucyAvatar />
│       ├── texture/
│       │   └── README.md                   ← where to drop ComfyUI renders
│       └── live2d/
│           ├── model3.json                 ← Live2D Cubism 3 cubism stub
│           └── README.md
└── src/
    ├── components/avatar/
    │   ├── LucyAvatar.tsx                 ← VRM + Live2D + 2D fallback viewer
    │   └── AvatarStage.tsx                 ← scene wrapper / orbit / lighting
    └── app/avatar/page.tsx                 ← preview at /avatar
```

**Preview now:** `npm run dev` → http://localhost:3000/avatar — you will see the placeholder state (2D fallback). Drop a real `public/avatar.vrm` and it auto-promotes to 3D.

---

## 1. VRM vs Live2D — pick one, we scaffold both

| | **VRM (recommended for Lucy)** | **Live2D Cubism** |
|---|---|---|
| **Look** | Full 3D, free camera, VTuber-standard | 2D puppet, premium anime flatten |
| **Free local authoring** | **VRoid Studio — completely free**, exports VRM 1.0 natively. Optional Blender + VRM Addon (also free). | Live2D Cubism Editor **Free** — you can rig & preview; free license bans *commercial* use of the *editor* output above small scale. SDK runtime is free. |
| **Runtime** | `three` + `@pixiv/three-vrm` (MIT). ~180KB. | `pixi.js` + `pixi-live2d-display` + `cubism4` runtime. Heavier, canvas-2D. |
| **Tracking** | Mediapipe / Kalidokit (free, local, no cloud) | Same — Kalidokit drives Live2D params |
| **Effort to Lucy-accurate** | Medium — VRoid sliders get 85% there, then texture swap from ComfyUI | High — must cut PSD layers + rig each param by hand |
| **Win** | **One VRM ≈ avatar + VTuber + VRChat + Web** | Best if you want flat 2D waifu strictly |

> **Decision:** Ship **VRM as primary** (`public/avatar.vrm`), keep Live2D stub as fallback/alt skin. Both are wired in `LucyAvatar.tsx`.

---

## 2. Free local workflow — the whole chain

No Stability API, no D-ID, no ReadyPlayerMe upload, no paid anything. Every arrow is local or MIT.

```
[ lucy-work.png + rias-waifu.png ]    ← your avis (already in public/)
        │
        ▼
┌─────────────────────────┐
│ ComfyUI (you already    │  Animagine XL 3.1 (or Pony XL) — all local
│ have it at              │  + IPAdapter (image prompts from your avis)
│ C:/Users/young/ComfyUI) │  + ControlNet OpenPose — lock pose sheet
└──────────┬──────────────┘  Outputs → C:/Users/young/ComfyUI/output/lucy/
           │                  T-pose front/side/back, face sheet, hair, outfit
           ▼
   VRoid Studio (free) ────────► import textures → sculpt → export VRM 1.0
   https://vroid.com/en/studio       sliders are free, no account needed for export
           │
           ▼
   Optional: Blender + VRM Addon  ─► weight paint / shape keys / fix
           │
           ▼
   public/avatar.vrm  ──────────► @pixiv/three-vrm renders in Next.js
           │
           ▼
   Kalidokit / MediaPipe (free) ─► webcam face/pose → drives VRM blendshapes
          (all in-browser, no cloud)

Alt branch: PSD → Live2D Cubism Editor Free → public/avatar/live2d/model3.json
```

### 2.1 Prerequisites (all free)

- **ComfyUI** — you already have it (`C:/Users/young/ComfyUI`). Keep `DreamShaperXL_Turbo` / `Juggernaut-XL_v9` already in `models/checkpoints/`. Add one more for best waifu:
  - **Animagine XL 3.1** (`animagine-xl-3.1.safetensors` ~6.9GB) — `huggingface.co/cagliostrolab/animagine-xl-3.1` — download via `git lfs` or the HF cli, drop into `models/checkpoints/`. MIT-ish community license; local only.
- **VRoid Studio** — https://vroid.com/en/studio — Windows installer, free, no subscription, offline after install.
- **(Optional) Blender 4.x + VRM Addon** — https://github.com/saturday06/VRM-Addon-for-Blender — free. Only if you want to hand-tweak weights.
- **(Optional) Live2D Cubism Editor Free** — https://www.live2d.com/en/download/cubism/ — free tier, local.

No API keys. No billing.

### 2.2 Phase 1 — Generate Lucy-accurate reference sheet in ComfyUI (local)

You already have the perfect conditioning images: `rias-waifu.png` (1024², Rias palette — use for face/hair) and `lucy-work.png` (832×1216, work outfit — use for outfit logic). The local workflow keeps both in the IPAdapter so Lucy looks like *your* Lucy, not a generic waifu.

**Install once:**

```bash
# in C:/Users/young/ComfyUI/custom_nodes
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus
git clone https://github.com/Fannovel16/comfyui_controlnet_aux
# then in ComfyUI Manager → install missing models:
#   - ip-adapter_sdxl_vit-h.safetensors → models/ipadapter/
#   - controlnet-sdxl-openpose → models/controlnet/
```

**Minimal ComfyUI graph (build or import `docs/comfy-lucy-workflow.json` — stub provided below):**

1. **Load Checkpoint** → `animagine-xl-3.1.safetensors` (or `Juggernaut-XL_v9` if you skip download)
2. **Load Image ×2** → `rias-waifu.png` + `lucy-work.png` → each through **IPAdapter** (weight 0.6–0.75, `standard` preset). This is what makes the output *your* character.
3. **ControlNet OpenPose** → feed a T-pose reference (Included in `comfyui_controlnet_aux` → DWPose). Lock it to T-pose so VRoid wrapping is clean.
4. **Prompt (positive):**
   ```
   anime girl, single character, t-pose, character sheet, front view, side view, back view,
   long dark hair, red eyes, rias gremory inspired, office secretary outfit, white blouse, black skirt,
   soft lighting, high detail, clean background, white background
   ```
   **Negative:**
   ```
   3d, realistic, blurry, lowres, extra limbs, duplicate, nsfw, watermark
   ```
   Keep **SFW** — Lucy is boss energy, not thirst trap.
5. **KSampler** → 28 steps, CFG 6.5, `euler_a` or `dpmpp_2m`.
6. **VAE Decode → Save** → `output/lucy/lucy_tpose_*.png` (need 3: front/side/back; batch 3 with same seed + pose controlnet variations).
7. **Second pass** → same but `face close-up, neutral expression, mouth closed, eyes open` for texture mapping.

> **Tip:** If Animagine download is heavy, just run Juggernaut-XL_v9 with the same IPAdapter — quality drops ~15% but loop still works with zero new downloads.

**File the outputs:** drop them into `public/avatar/texture/` (create if needed). VRoid reads them as texture templates.

### 2.3 Phase 2 — VRoid Studio (free, ~30 min to first VRM)

1. Open VRoid Studio → **New** → pick base body.
2. **Face →** copy Rias tones from your sheet: skin, eye color (red #C83A3A), eyebrow shape, hair presets (long dark, side-swept). Use `Photo → Load` to import your ComfyUI face crop as reference.
3. **Hair →** procedural or imported — keep it simple first pass.
4. **Clothing →** recreate blouse/skirt. VRoid has preset editor; or **Texture → Import** your ComfyUI outfit crop and paint over mesh. No sculpting skill needed.
5. **Texture Edit →** Import `lucy_tpose_front.png` as custom texture (VRoid lets you paint directly). This is where the ComfyUI sheet pays off.
6. **Export → VRM 1.0** (file → Export → VRM). Set:
   - VRM Version: **1.0** (not 0.x — three-vrm 3.x expects 1.0)
   - T Pose: ✅
   - Reduce polygons: optional (mobile perf)
   - License: confirm "AvatarPermission: allow" if you want to freely use.
7. Save as `avatar.vrm` and **overwrite** `C:/emergent-matrix/public/avatar.vrm`.

That's it — you now have a full rigged Lucy. No payment, no upload.

### 2.4 Phase 3 — Optional Blender polish (still free)

Only if you see clipping or want extra shape keys:

```bash
# Blender 4.2+ → Edit → Preferences → Add-ons → Install → VRM-Addon-for-Blender.zip → enable
```

- Import your VRM, tweak weight paints, add ARKit blendshapes (`Basis` → `A`, `I`, `U`, `E`, `O`, `Blink`, `Joy`, etc — required for lip sync).
- Re-export as VRM 1.0. Keep the file under **~25MB** for web.

### 2.5 Phase 4 — Web runtime (already scaffolded)

```bash
# from C:/emergent-matrix
npm install @pixiv/three-vrm@3 three@0.185.1
# optional live2d branch only:
npm install pixi.js@7 pixi-live2d-display cubism4
```

What the scaffold does:

- `src/components/avatar/LucyAvatar.tsx` tries `public/avatar.vrm` first via `GLTFLoader` + `VRMLoaderPlugin`. On success → orbital 3D with soft lights, auto-rotate, breath idle.
- On 404 / parse fail (i.e. right now, the placeholder) → falls back to **2D sprite** cross-fading between `lucy-work.png` and `rias-waifu.png` — so the app never shows a broken state.
- Eye/lip tracking (optional later): wire `kalidokit` + `mediapipe/face_mesh` — both run in-browser, zero cloud. Toggle with `avatar.config.json → tracking.enabled`.

**Add to any page:**

```tsx
import LucyAvatar from "@/components/avatar/LucyAvatar";
export default function Page() {
  return <LucyAvatar mode="auto" height={560} />;
}
```

See live preview: `/avatar`.

### 2.6 Phase 5 — Live2D branch (optional, also free)

If you want a flat 2D puppet instead/in addition:

1. Export your ComfyUI sheet as layered **PSD** (use `comfyui-photoshop-psd` node or just cut in Photopea/GIMP — both free).
2. Open **Live2D Cubism Editor** → Import PSD → rig: `Eye L/R Open`, `Mouth Open/Y`, `Angle X/Y/Z`, `Breath`. Cubism ships auto-mesh.
3. **Export → Runtime** → builds `model3.json` + `moc3` + `textures/*.png`.
4. Drop into `public/avatar/live2d/` and point `avatar.config.json → live2d.model` at it.
5. Viewer: `<LucyAvatar mode="live2d" />` uses `pixi-live2d-display`.

> Note: Cubism Editor Free lets you publish non-commercial freely; check EULA if you monetize. For a personal boss waifu inside your own app, you're fine.

---

## 3. Config reference — `public/avatar/avatar.config.json`

```json
{
  "version": 1,
  "character": "Lucy",
  "role": "Boss · Rias head worker",
  "sources": ["public/lucy-work.png", "public/rias-waifu.png"],
  "vrm": { "path": "/avatar.vrm", "version": "1.0", "fallback": "2d" },
  "live2d": { "model": "/avatar/live2d/model3.json", "enabled": false },
  "display": { "height": 560, "autoRotate": true, "shadows": true },
  "tracking": { "enabled": false, "backend": "kalidokit+mediapipe" },
  "pipeline": {
    "comfyui": "C:/Users/young/ComfyUI",
    "checkpoint": "animagine-xl-3.1.safetensors (or Juggernaut-XL_v9)",
    "controlnet": "sdxl-openpose",
    "ipadapter": "ip-adapter_sdxl_vit-h"
  }
}
```

Edit flags to switch runtimes without code changes.

---

## 4. Replacing the placeholder

The repo ships with `public/avatar.vrm` that is **not** a real model — it's a small JSON that makes fetch return 200 but VRMLoader will gracefully fail to "2D fallback". To go live:

```bash
# After VRoid export:
cp ~/Downloads/Lucy.vrm "C:/emergent-matrix/public/avatar.vrm"
# hard refresh
npm run dev
# visit http://localhost:3000/avatar — 3D should appear
```

**Size budget:** keep VRM < 25 MB. If VRoid spits 40–60 MB, run in Blender → Decimate unneeded hair polys, compress textures to 1024, re-export.

---

## 5. Performance & quality notes

- **Shadows & lights:** default 1 directional + ambient. Disable shadows on mobile (`display.shadows: false`) if FPS < 45.
- **SFW guard:** keep Comfy prompts + VRoid textures SFW. Repo is public-facing; no NSFW textures in `public/`.
- **Credit-light:** no watermark is injected. If you reuse Animagine weights, credit in this doc only; no on-image credit needed.
- **No paid API surface:** nothing phones home. Even tracking is `mediapipe` WASM fetched once from `cdn.jsdelivr.net` (or self-host `mediapipe/models/` to stay 100% offline).

---

## 6. Quick start checklist (copy/paste)

```bash
# 1 — install deps for viewer
cd "C:/emergent-matrix"
npm install @pixiv/three-vrm

# 2 — (optional) fetch Animagine locally — skip if using Juggernaut already cached
# huggingface-cli download cagliostrolab/animagine-xl-3.1 animagine-xl-3.1.safetensors \
#   --local-dir "C:/Users/young/ComfyUI/models/checkpoints"

# 3 — run
npm run dev
# open http://localhost:3000/avatar

# 4 — build your sheets in ComfyUI at C:/Users/young/ComfyUI
#    then VRoid Studio → export → overwrite public/avatar.vrm
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `/avatar` shows 2D sprites forever | Normal until you replace `public/avatar.vrm` with a real export. Check DevTools → Network: `avatar.vrm` should be > 5 MB after replace. |
| VRM loads but T-pose frozen | VRoid exported as VRM 0.x — re-export as **1.0**. three-vrm 3.x drops 0.x support. |
| Pink / black materials | Texture paths not bundled — re-export VRM with "embed textures" checked. |
| ComfyUI IPAdapter does nothing | Ensure `ip-adapter_sdxl_vit-h.safetensors` in `models/ipadapter/` and `clip_vision` model present; restart ComfyUI. |
| Big VRM (70 MB) slow | Downscale VRoid textures to 1024, delete hidden outfit layers, re-export. |

---

## 8. Next agent TODO

- [ ] Owner generates 3-view sheet in ComfyUI and drops into `public/avatar/texture/`
- [ ] VRoid pass → real `public/avatar.vrm` (≤ 25 MB)
- [ ] Wire optional webcam tracking (`kalidokit` + `mediapipe`) behind `avatar.config.json:tracking.enabled`
- [ ] Optional Live2D PSD cut if a 2D skin is desired

---

*Last updated 2026-09-01 · free local pipeline · no paid APIs · Lucy boss waifu · SFW*
