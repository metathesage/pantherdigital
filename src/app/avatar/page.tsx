import LucyAvatar from "@/components/avatar/LucyAvatar";
import Link from "next/link";

export const metadata = {
  title: "Lucy Avatar — Emergent Matrix",
  description: "Lucy boss waifu — VRM / Live2D local pipeline preview. Place avatar.vrm to go 3D.",
};

export default function AvatarPreviewPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#0A0A0A]">
      {/* boss bar */}
      <div className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-10 place-items-center rounded-2xl border border-[#0A0A0A] bg-white overflow-hidden p-0.5 hover:bg-[#F8F8F7]" title="Home">
              <img src="/panther-icon.png" alt="home" className="h-8 w-8 object-contain" />
            </Link>
            <Link href="/app" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[11px] font-bold tracking-widest hover:border-[#0A0A0A]">← APP</Link>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-3 py-1 text-[11px] font-bold tracking-widest text-white">LUCY ♡ AVATAR PREVIEW</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/waifus" className="hidden sm:inline rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[11px] font-bold">WAIFUS</Link>
            <Link href="/app" className="rounded-full bg-[#0A0A0A] px-4 py-2 text-[12px] font-bold text-white hover:bg-black">Launch App ↗</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black tracking-[-0.03em] sm:text-[32px]">LUCY — FULL AVATAR</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#6B6B6B]">
              Option 3 scaffold: <span className="font-bold text-[#0A0A0A]">VRM primary + Live2D alt</span> · Free local pipeline (ComfyUI + Animagine + VRoid). Placeholder shows 2D now — drop <span className="font-mono font-bold">public/avatar.vrm</span> to promote to real 3D. No paid APIs.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A0A0A] bg-white px-4 py-3 text-[11px]">
            <div className="font-bold tracking-widest">ROUTE</div>
            <div className="mt-1 font-mono text-[#6B6B6B]">/avatar · docs/avatar.md · public/avatar.vrm</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          {/* stage */}
          <LucyAvatar mode="auto" height={560} />

          {/* controls + docs */}
          <div className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-[#0A0A0A] bg-white p-5">
              <div className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B]">FREE LOCAL PIPELINE</div>
              <ol className="mt-3 space-y-2 text-[13px] leading-5">
                <li><span className="font-bold">1. ComfyUI</span> <span className="text-[#6B6B6B]">→ Animagine XL 3.1 + IPAdapter (rias-waifu + lucy-work) + OpenPose → T-pose sheet →</span> <span className="font-mono text-[11px]">public/avatar/texture/</span></li>
                <li><span className="font-bold">2. VRoid Studio (free)</span> <span className="text-[#6B6B6B]">→ import sheets → sculpt → Export VRM 1.0 →</span> <span className="font-mono text-[11px]">public/avatar.vrm</span></li>
                <li><span className="font-bold">3. Web</span> <span className="text-[#6B6B6B]">→</span> <span className="font-mono text-[11px]">three + @pixiv/three-vrm</span> <span className="text-[#6B6B6B]">auto-promotes. Optional Kalidokit tracking local.</span></li>
              </ol>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href="/avatar.vrm" target="_blank" className="rounded-full bg-[#0A0A0A] py-2.5 text-center text-[12px] font-bold text-white hover:bg-black">Check /avatar.vrm</a>
                <Link href="/waifus" className="rounded-full border border-[#0A0A0A] bg-white py-2.5 text-center text-[12px] font-bold">Waifu Squad</Link>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-[#9A9A9A]">No paid APIs. Animagine + VRoid + three-vrm are all local/MIT. Replace placeholder when ready — viewer falls back gracefully until then.</p>
            </div>

            <div className="rounded-[20px] border border-[#E8E8E8] bg-white p-5">
              <div className="text-[12px] font-black tracking-tight">What&apos;s scaffolded</div>
              <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-[#444]">
                <li>✅ <span className="font-mono">public/avatar.vrm</span> placeholder (404-safe, viewer detects & falls back)</li>
                <li>✅ <span className="font-mono">public/avatar/avatar.config.json</span> runtime flags</li>
                <li>✅ <span className="font-mono">public/avatar/live2d/model3.json</span> Cubism stub</li>
                <li>✅ <span className="font-mono">src/components/avatar/LucyAvatar.tsx</span> (VRM + 2D fallback)</li>
                <li>✅ <span className="font-mono">docs/avatar.md</span> full free pipeline guide</li>
                <li className="text-[#9A9A9A]">⬜ Real VRM — run VRoid export when ready (docs §4)</li>
              </ul>
            </div>

            <div className="rounded-[20px] bg-[#0A0A0A] p-5 text-white">
              <div className="text-[11px] font-bold tracking-[0.16em] text-white/60">AVI SOURCES (SFW)</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src="/rias-waifu.png" alt="rias waifu" className="aspect-square w-full object-cover" />
                  <div className="p-2 text-[11px] font-semibold">rias-waifu.png</div>
                  <div className="px-2 pb-2 text-[10px] text-white/50">canonical · face/hair</div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src="/lucy-work.png" alt="lucy work" className="aspect-square w-full object-cover object-top" />
                  <div className="p-2 text-[11px] font-semibold">lucy-work.png</div>
                  <div className="px-2 pb-2 text-[10px] text-white/50">work outfit</div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src="/lucy-private.png" alt="lucy private" className="aspect-square w-full object-cover object-top" />
                  <div className="p-2 text-[11px] font-semibold">lucy-private.png</div>
                  <div className="px-2 pb-2 text-[10px] text-white/50">extra ref</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-white/50">Used as IPAdapter image prompts — no upload, no cloud. All ComfyUI-side, local.</p>
            </div>

            <div className="rounded-[20px] border border-[#E8E8E8] bg-[#F8F8F7] p-5">
              <div className="text-[11px] font-bold tracking-widest">QUICK START</div>
              <pre className="mt-3 overflow-auto rounded-xl bg-[#0A0A0A] p-3 text-[11px] leading-4 text-white">{`cd "C:/emergent-matrix"
npm install @pixiv/three-vrm
npm run dev
# open http://localhost:3000/avatar
# VRoid Studio → Export VRM 1.0 → overwrite public/avatar.vrm`}</pre>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-white p-4 text-[12px] leading-5 text-[#6B6B6B]">
          <span className="font-bold text-[#0A0A0A]">Docs:</span> full pipeline, ComfyUI graph, VRoid steps, Live2D alt, troubleshooting → <span className="font-mono">docs/avatar.md</span> · Keep SFW, credit-light.
        </div>

        <div className="mt-4 text-center text-[10px] tracking-[0.2em] text-[#9A9A9A]">© PANTHERDIGITAL — LUCY AVATAR · FREE LOCAL PIPELINE</div>
      </div>
    </div>
  );
}
