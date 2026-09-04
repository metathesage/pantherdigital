import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// POST /api/ai — free NVIDIA NIM inference (Kimi K3 default), server-side only.
// Key lives in NVAPI_KEY env (local .env.local / Vercel env) — never exposed to client.
// Body: { prompt: string; model?: string; system?: string; maxTokens?: number }
const BASE = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "moonshotai/kimi-k3";
const FALLBACK_MODEL = "deepseek-ai/deepseek-v4-pro-0813";

export async function POST(req: Request) {
  const key = process.env.NVAPI_KEY || "";
  if (!key) {
    return NextResponse.json(
      { error: "NVAPI_KEY not set — add it to .env.local (free at build.nvidia.com)" },
      { status: 503 }
    );
  }
  let body: { prompt?: string; model?: string; system?: string; maxTokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const prompt = (body.prompt || "").slice(0, 4000);
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const messages: { role: string; content: string }[] = [];
  if (body.system) messages.push({ role: "system", content: body.system.slice(0, 1000) });
  messages.push({ role: "user", content: prompt });

  const models = [body.model || DEFAULT_MODEL, FALLBACK_MODEL];
  for (const model of models) {
    try {
      const r = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_completion_tokens: Math.min(body.maxTokens || 500, 2000),
        }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const text: string | null = j?.choices?.[0]?.message?.content ?? null;
      if (text) return NextResponse.json({ text, model, ts: new Date().toISOString() });
    } catch { /* try fallback */ }
  }
  return NextResponse.json({ error: "NVIDIA NIM request failed (rate limit?) — try again shortly" }, { status: 502 });
}
