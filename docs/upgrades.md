# Local Upgrades — 2026-09-01 (Lucy / Hikari — lightweight, free, SFW)

> **Host:** Windows 11 · `C:/Users/young` · Workdir `C:/emergent-matrix` (also `C:/Users/young/ComfyUI` for Comfy)  
> **Rule:** No paid APIs. All local, unlimited, open-source. Keep it lightweight — clones + small voices, no 10GB weight downloads.

---

## 1) Piper TTS — local unlimited neural voice

**What:** [piper-tts](https://github.com/OHF-voice/piper1-gpl) 1.7.0 (GPL-3.0) — offline, onnxruntime, no cloud.

**Install (Python 3.13):**
```bash
pip install piper-tts --no-cache-dir
# pip 26.2.1 → piper-tts 1.7.0 + onnxruntime 1.29.0 + numpy 2.5.2 + protobuf 7.36.1
# Location: C:\Users\young\AppData\Local\Programs\Python\Python313\Lib\site-packages
# Binary:   C:\Users\young\AppData\Local\Programs\Python\Python313\Scripts\piper.exe
pip show piper-tts
python -c "import piper; print(piper.__file__)"  # via Python 3.13
```

**Voice (lightweight, CC0):** `en_US-lessac-medium` — natural female US English, 22kHz, medium quality. ~63 MB ONNX.

- Upstream: `rhasspy/piper-voices` · `en/en_US/lessac/medium/en_US-lessac-medium.onnx` (63201294 bytes) + `.onnx.json` (4885 bytes, 22050 Hz, espeak `en-us`, noise_scale 0.667)
- Cached HF: `C:/Users/young/.cache/huggingface/models--rhasspy--piper-voices/...`
- Active copies:
  - `C:/Users/young/piper_voices/en_US-lessac-medium.onnx` (+ `.json`)
  - `C:/emergent-matrix/assets/voices/en_US-lessac-medium.onnx` (+ `.json`) — committed-lightweight mirror for project
- Download method (free, no API key):
  ```python
  from huggingface_hub import hf_hub_download
  hf_hub_download(repo_id="rhasspy/piper-voices", filename="en/en_US/lessac/medium/en_US-lessac-medium.onnx")
  hf_hub_download(repo_id="rhasspy/piper-voices", filename="en/en_US/lessac/medium/en_US-lessac-medium.onnx.json")
  ```

**Test — verified 2026-09-01:**
```bash
echo "Hello Lucy, this is a local Piper TTS test. Voice synthesis is unlimited and free." | piper --model "C:/Users/young/piper_voices/en_US-lessac-medium.onnx" --output_file sample.wav
# sample.wav: 243 KB, mono, 22050 Hz, 124160 frames, 5.63s — OK
# Also: C:/emergent-matrix/assets/voices/sample.wav
python -c "import wave; w=wave.open('sample.wav'); print(w.getnframes()/w.getframerate())"
```

**Usage:**
```bash
# single file
echo "Your text here" | piper -m C:/Users/young/piper_voices/en_US-lessac-medium.onnx -f out.wav
# from file, different data-dir
piper -m en_US-lessac-medium.onnx --data-dir C:/Users/young/piper_voices -i input.txt -f out.wav
# speak knobs: --length-scale 0.9 --noise-scale 0.667 --speaker 0 (only one speaker for lessac)
```

**Notes:** `python` default is 3.11.16 on this host; piper is installed for **Python 3.13.7** (`C:/Users/young/AppData/Local/Programs/Python/Python313/python.exe`). Use that binary or the Scripts/piper.exe shim. Add more voices the same way (e.g. `en_GB-alan-medium`, `en_US-amy-medium`) without reinstalling.

---

## 2) Ollama vision upgrade — `llava:7b`

**What:** LLaVA 7B (llama + CLIP projector) — local vision LLM, Apache 2.0, Q4_0, 4.7 GB. Satisfies `ollama pull llava` / `llava:7b` **or** `qwen2.5vl` requirement. Chose `llava:7b` for lightweight (qwen2.5vl ~similar/bigger; moondream already present).

**Install:**
```bash
# Ollama 0.23.2 at C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe (NOT on PATH — use full path or add to PATH)
"C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe" pull llava:7b
# layers: 170370233dd5 4.1GB + 72d6f08a42f6 624MB + 43070e2d4e53 11KB + ... → verifying sha256 → success
"C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe" list
# llava:7b  8dd30f6b0cb1  4.7 GB  — now present alongside moondream:latest (1.7GB), qwen3:8b (5.2GB) etc.
"C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe" show llava:7b
# Model: llama 7B, context 32768, embedding 4096, Q4_0
# Projector: clip 311.89M, embedding 1024, dims 768
# Capabilities: completion, vision
```

**Verified 2026-09-01:**
```bash
ollama run llava:7b "Say 'Lucy vision upgrade OK' in 5 words."
# → Lucy, your vision upgrade is approved!  ✓
```

**Vision usage (local):**
```bash
# text + image
ollama run llava:7b "Describe this image." --image ./path/to/image.jpg  # CLI helper (or via API)
# HTTP API (Ollama OpenAI-compat):
curl http://localhost:11434/api/generate -d '{"model":"llava:7b","prompt":"What is in the image?","images":["<base64>"]}'
```

**Alternative not pulled (to stay lightweight):** `qwen2.5vl:7b` (≈4-5 GB, also vision) — pull with `ollama pull qwen2.5vl` if you prefer Qwen. LLaVA already covers pose/scene description for the avatar pipeline.

---

## 3) ComfyUI extensions — AnimateDiff (video) + ControlNet (pose)

**ComfyUI base:** `C:/Users/young/ComfyUI` @ `comfyanonymous/ComfyUI` master 4e024cb1 (up-to-date). Checkpoints present: `DreamShaperXL_Turbo_V2.safetensors`, `Juggernaut-XL_v9.safetensors`. Models folder `C:/Users/young/ComfyUI/models` (animagine-xl-3.1 fits in `checkpoints/`).

**Custom nodes (all `C:/Users/young/ComfyUI/custom_nodes/`):**

| Node pack | Repo | Commit | Purpose | Install |
|-----------|------|--------|---------|---------|
| **ComfyUI-AnimateDiff-Evolved** | `Kosinkadink/ComfyUI-AnimateDiff-Evolved` | `9257651` (Merge PR #579, bump 1.6.0) | Video: AnimateDiff sampling, Evolved sampling, motion-lora, VideoHelperSuite-compatible | `git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git "C:/Users/young/ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved"` |
| **comfyui_controlnet_aux** | `Fannovel16/comfyui_controlnet_aux` | `59b1fc4` (Merge PR #622) | Pose/hint preprocessors: OpenPose, DWPose, Depth, Canny, etc. — feeds ControlNet | `git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git "C:/Users/young/ComfyUI/custom_nodes/comfyui_controlnet_aux"` |
| **ComfyUI-Advanced-ControlNet** | `Kosinkadink/ComfyUI-Advanced-ControlNet` | `27a67fe` (Merge PR #258, bump 1.6.0) | Makes ControlNet work with AnimateDiff context, keyframes, masks, SparseCtrl | `git clone https://github.com/Kosinkadink/ComfyUI-Advanced-ControlNet.git "C:/Users/young/ComfyUI/custom_nodes/ComfyUI-Advanced-ControlNet"` |

> Why 3? The prompt asks "AnimateDiff + ControlNet for video/pose". AnimateDiff-Evolved covers video; controlnet_aux covers pose detection (OpenPose/DW pose hint images); Advanced-ControlNet bridges them for temporally-aware control. All lightweight clones — **no motion models or ControlNet weights downloaded** to keep disk low.

**Post-clone (lightweight — no extra pip needed for verification; install only if Comfy complains):**
```bash
# Optional: install deps if ComfyUI logs missing modules after restart
# C:/Users/young/ComfyUI/custom_nodes/comfyui_controlnet_aux/requirements.txt
# C:/Users/young/ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved/  — check README for comfyui-video-helpersuite etc.
# pip install -r requirements.txt  — run with Python 3.12 that ComfyUI uses if needed
```

**Restart ComfyUI** after clone — nodes appear as `AnimateDiff`, `ControlNet Aux`, `Advanced ControlNet` in the node palette. If they error, `python -m pip install -r requirements.txt` in the relevant custom_node folder.

**Where to put weights (when you want them — not included now to stay light):**
- Motion models: `C:/Users/young/ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved/models/` or `C:/Users/young/ComfyUI/models/animatediff_models/` (e.g. `mm_sd_v15_v2.ckpt`, `mm_sd15_v3.safetensors` — ~1-2 GB each, HF `guoyww/animatediff`)
- ControlNet: `C:/Users/young/ComfyUI/models/controlnet/` (e.g. `control_v11p_sd15_openpose.pth`, `diffusers/controlnet-canny-sdxl` — put `.safetensors` there)
- Aux preprocessors auto-download annotator weights to `C:/Users/young/ComfyUI/custom_nodes/comfyui_controlnet_aux/ckpts/` or `~/.cache/torch/hub` on first use — no manual step.

**Verified:**
```
C:/Users/young/ComfyUI/custom_nodes/
  ComfyUI-AnimateDiff-Evolved/  → 9257651 ✓
  comfyui_controlnet_aux/       → 59b1fc4 ✓
  ComfyUI-Advanced-ControlNet/  → 27a67fe ✓
ls custom_nodes/AnE/README.md → "AnimateDiff for ComfyUI" ✓
ls custom_nodes/controlnet_aux/README.md → "ControlNet Auxiliary Preprocessors" ✓
```

---

## Quick smoke-test checklist

```bash
# Piper
"C:/Users/young/AppData/Local/Programs/Python/Python313/Scripts/piper.exe" --model C:/Users/young/piper_voices/en_US-lessac-medium.onnx --output_file test.wav <<< "Test"
# → test.wav 5s mono 22050Hz

# Ollama vision
"C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe" list | grep llava   # 4.7 GB
"C:/Users/young/AppData/Local/Programs/Ollama/ollama.exe" run llava:7b "Hello"  # streams

# ComfyUI
ls C:/Users/young/ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved
ls C:/Users/young/ComfyUI/custom_nodes/comfyui_controlnet_aux
# restart ComfyUI → check console for "[AnimateDiff] loaded" and ControlNet nodes available
```

## Credits / licenses

- Piper TTS + voice `lessac` — GPL-3.0 / CC0 — Home Assistant / Rhasspy
- LLaVA 7B — Apache 2.0 (llama + CLIP) via Ollama library
- AnimateDiff-Evolved — GPL-3.0 (Kosinkadink) — based on guoyww/AnimateDiff
- ControlNet Aux / Advanced-ControlNet — Apache 2.0 / GPL — lllyasviel / Kosinkadink / Fannovel16

---
*Generated by Hikari (Surge Huntress) for Boss Lucy, deleg_ Rias 1104021a meta busy — all local, all free, creditmax, SFW.*
