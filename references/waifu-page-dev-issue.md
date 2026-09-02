# Waifu Page & TTS Updates (2026-09)

## Waifu Page Dev Rendering

`/waifus` on localhost:3000 may show `display:none` in raw HTTP output due to Next.js Turbopack dev CSS. Browser renders correctly after hydration. Use `npm run start` for production-mode inspection, or check via browser tool.

## TTS Provider

MiniMax `speech-02-hd` is out of balance (`code 1008`). Switch to Edge:

```
hermes config set tts.provider edge
hermes config set tts.edge.voice en-US-JennyNeural
```

Edge is free/unlimited; retains Jessica voice preference.

## Here.now

The `here.now` skill publishes static site files to live URLs. Use for deploying waifu page or full radar when Vercel is blocked.