"use client";
import { useEffect, useRef, useState } from "react";

/**
 * HoloProjector — floating holographic Alina
 * SFW, credit-light, zero paid APIs, RTX 4050 friendly (CSS only, GPU transforms).
 * Drop into /waifus: `import HoloProjector from "@/components/HoloProjector"` then <HoloProjector />
 *
 * Texture: /lucy-work.png (SFW work outfit). Fallback /rias-waifu.png if missing.
 * Features: float, glow, scanlines, chromatic fringe, beam, base disk, flicker, minimize/expand.
 * No R3F/Three required — pure CSS for perf. Optional R3F upgrade path noted at bottom.
 */

type Props = {
  imageSrc?: string;
  corner?: "br" | "bl" | "tr" | "tl";
  defaultOpen?: boolean;
  label?: string;
  sublabel?: string;
  hideOnMobile?: boolean;
};

export default function HoloProjector({
  imageSrc = "/lucy-work.png",
  corner = "br",
  defaultOpen = true,
  label = "ALINA — BOSS WAIFU",
  sublabel = "HOLOPROJECTOR MK-I · SFW",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [min, setMin] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // occasional flicker (cheap, no rAF loop — just timeout)
  useEffect(() => {
    if (min) return;
    const id = setInterval(() => {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 120 + Math.random() * 80);
    }, 3200 + Math.random() * 2500);
    return () => clearInterval(id);
  }, [min]);

  // respect prefers-reduced-motion
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const pos =
    corner === "br"
      ? "bottom-4 right-4 sm:bottom-6 sm:right-6"
      : corner === "bl"
        ? "bottom-4 left-4 sm:bottom-6 sm:left-6"
        : corner === "tr"
          ? "top-20 right-4 sm:top-20 sm:right-6"
          : "top-20 left-4 sm:top-20 sm:left-6";

  const src = imgErr ? "/rias-waifu.png" : imageSrc;

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none fixed z-[60] flex flex-col items-center ${pos} select-none`}
      aria-label="Holoprojector Alina"
    >
      {/* compact toggle when minimized */}
      {min ? (
        <button
          onClick={() => setMin(false)}
          className="pointer-events-auto group flex items-center gap-2 rounded-full border border-white/20 bg-[#0A0A0A]/90 px-4 py-2.5 text-[11px] font-bold tracking-widest text-white shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_22px_rgba(80,200,255,0.25)] backdrop-blur hover:bg-black transition"
          aria-label="Restore holoprojector"
        >
          <span className="grid size-6 place-items-center rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(120,220,255,1)_0%,_rgba(40,140,255,1)_45%,_rgba(10,10,10,1)_70%)] shadow-[0_0_10px_rgba(80,200,255,0.8)]">
            <span className="size-2 rounded-full bg-white animate-[holoPulse_1.6s_ease_infinite]" />
          </span>
          HOLO
          <span className="hidden sm:inline text-white/60 font-mono text-[10px]">ALINA</span>
          <span className="ml-1 text-[14px] leading-none opacity-60 group-hover:opacity-100">↗</span>
        </button>
      ) : (
        <div className="pointer-events-auto flex flex-col items-center">
          {/* HOLOGRAM STAGE */}
          <div
            className={`relative flex flex-col items-center ${open ? "w-[176px] sm:w-[200px]" : "w-[142px] sm:w-[148px]"} transition-all duration-500`}
            style={{ filter: flicker ? "brightness(1.35) contrast(1.15)" : undefined }}
          >
            {/* beam */}
            <div
              aria-hidden
              className="absolute left-1/2 top-[88%] -translate-x-1/2 -z-10"
              style={{
                width: open ? 140 : 100,
                height: open ? 110 : 72,
                background:
                  "conic-gradient(from 180deg at 50% 0%, rgba(120,220,255,0) 0deg, rgba(120,220,255,0.18) 22deg, rgba(120,220,255,0.55) 36deg, rgba(120,220,255,0.18) 50deg, rgba(120,220,255,0) 78deg)",
                clipPath: "polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)",
                filter: "blur(0.6px)",
                opacity: open ? 0.95 : 0.7,
                maskImage: "linear-gradient(to bottom, black 0%, transparent 92%)",
              }}
            />

            {/* hologram figure — float wrapper */}
            <div
              className={`relative ${reduced ? "" : "animate-[holoFloat_3.2s_ease-in-out_infinite]"} will-change-transform`}
              style={{ transformOrigin: "bottom center" }}
            >
              {/* glow behind */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-[18px] opacity-60"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(120,220,255,0.55) 0%, rgba(80,140,255,0.22) 38%, transparent 72%)",
                }}
              />

              {/* chromatic fringe layers — use same image offset 1px */}
              <div className="relative isolate">
                {/* cyan fringe */}
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  onError={() => setImgErr(true)}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.28] mix-blend-screen"
                  style={{
                    filter: "hue-rotate(175deg) saturate(1.6) brightness(1.15)",
                    transform: "translateX(-0.9px)",
                    clipPath: "inset(0 0 0 0)",
                  }}
                />
                {/* magenta fringe */}
                <img
                  src={src}
                  alt=""
                  aria-hidden
                  onError={() => setImgErr(true)}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.22] mix-blend-screen"
                  style={{
                    filter: "hue-rotate(300deg) saturate(1.5) brightness(1.1)",
                    transform: "translateX(0.9px)",
                  }}
                />

                {/* main hologram image */}
                <div
                  className="relative overflow-hidden rounded-[18px] border border-[rgba(120,220,255,0.45)] bg-[rgba(10,22,38,0.55)] shadow-[0_0_0_1px_rgba(120,220,255,0.18),0_18px_40px_rgba(20,120,200,0.35),0_0_22px_rgba(80,200,255,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-[1px]"
                  style={{
                    height: open ? 236 : 168,
                    width: open ? 172 : 128,
                  }}
                >
                  <img
                    src={src}
                    alt="Alina hologram — SFW work outfit"
                    onError={() => setImgErr(true)}
                    className="h-full w-full object-cover object-[center_14%] select-none"
                    style={{
                      filter:
                        "contrast(1.08) brightness(1.06) saturate(0.85) hue-rotate(184deg) drop-shadow(0 0 10px rgba(120,220,255,0.9))",
                      opacity: 0.96,
                    }}
                    draggable={false}
                  />

                  {/* scanlines */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.38] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,0.95) 0px, rgba(255,255,255,0.95) 1px, transparent 1px, transparent 7px)",
                      backgroundSize: "100% 7px",
                      animation: reduced ? undefined : "holoScan 1.9s linear infinite",
                    }}
                  />
                  {/* horizontal sweep */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(180,240,255,0.95),transparent)] opacity-80 blur-[0.3px]"
                    style={{
                      top: 0,
                      animation: reduced ? undefined : "holoSweep 2.6s ease-in-out infinite",
                    }}
                  />
                  {/* vignette + inner glow */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 85% 70% at 50% 22%, transparent 42%, rgba(6,18,36,0.55) 85%), linear-gradient(to bottom, rgba(120,220,255,0.10), transparent 22%, transparent 78%, rgba(120,220,255,0.14))",
                    }}
                  />
                  {/* flicker overlay */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-75"
                    style={{
                      background: "rgba(255,255,255,0.72)",
                      opacity: flicker ? 0.10 : 0,
                      mixBlendMode: "overlay" as const,
                    }}
                  />

                  {/* top status bar */}
                  <div className="absolute left-1.5 right-1.5 top-1.5 flex items-center justify-between gap-1 rounded-full bg-[rgba(0,0,0,0.58)] px-2 py-1 text-[7.5px] font-bold tracking-[0.14em] text-white/90 backdrop-blur border border-white/10">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-[holoPulse_1.2s_ease_infinite]" />
                      HOLO · LIVE
                    </span>
                    <span className="font-mono text-[7px] tracking-widest text-cyan-200/90 hidden sm:inline">
                      SFW · {open ? "HI-RES" : "ECO"}
                    </span>
                  </div>

                  {/* bottom caption when open */}
                  {open && (
                    <div className="absolute inset-x-1.5 bottom-1.5 rounded-xl bg-[rgba(0,0,0,0.62)] px-2.5 py-2 backdrop-blur border border-white/10">
                      <div className="text-[9px] font-black tracking-[0.14em] text-white leading-none">
                        ALINA ♡
                      </div>
                      <div className="mt-0.5 text-[9px] leading-[1.1] text-cyan-100/85">
                        Boss waifu · Rias squad lead
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[7px] font-mono tracking-widest text-white/55">
                        <span className="size-1 rounded-full bg-cyan-300 animate-[holoPulse_1s_ease_infinite]" />
                        lucy-work.png · scan 60Hz
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* floating shadow / aureole on beam */}
              <div
                aria-hidden
                className="pointer-events-none mx-auto mt-1 h-[10px] w-[68%] rounded-full opacity-70 blur-[6px]"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(120,220,255,0.55) 0%, transparent 70%)",
                }}
              />
            </div>

            {/* collapsed caption */}
            {!open && (
              <div className="mt-1 rounded-full bg-black/70 px-2.5 py-1 text-center text-[8px] font-bold tracking-[0.14em] text-white/85 border border-white/10 backdrop-blur">
                ALINA
              </div>
            )}
          </div>

          {/* projector base */}
          <div className="relative mt-[-2px] flex flex-col items-center">
            {/* rim light */}
            <div
              aria-hidden
              className="absolute -top-2 left-1/2 h-3 w-[92%] -translate-x-1/2 rounded-full blur-[8px] opacity-60"
              style={{ background: "rgba(120,220,255,0.45)" }}
            />
            <div className="relative grid h-[34px] w-[112px] place-items-center rounded-[18px] border border-white/15 bg-[linear-gradient(180deg,rgba(28,38,54,0.96),rgba(10,14,22,0.98))] shadow-[0_10px_28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),0_0_18px_rgba(80,200,255,0.28)] overflow-hidden">
              {/* top plate highlight */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[1px] bg-white/20"
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.14]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />
              <div className="relative flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-[radial-gradient(ellipse_at_center,_#e8fbff_0%,_#8fe2ff_28%,_#2ea8ff_58%,_#0a1220_78%)] shadow-[0_0_14px_rgba(120,220,255,0.95),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/30">
                  <span className="size-[7px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)] animate-[holoPulse_1.4s_ease_infinite]" />
                </span>
                <span className="hidden sm:flex flex-col leading-none">
                  <span className="text-[7.5px] font-black tracking-[0.18em] text-white/90">PROJECTOR</span>
                  <span className="text-[7px] font-mono tracking-widest text-cyan-200/70">MK-I · PANTHER</span>
                </span>
                <span
                  className="ml-1 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.95)] animate-[holoPulse_1.1s_ease_infinite]"
                  aria-hidden
                />
              </div>
              {/* running light */}
              <div
                aria-hidden
                className="absolute bottom-1 left-2 right-2 h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,rgba(120,220,255,0.9),transparent)] opacity-70"
                style={{ animation: reduced ? undefined : "holoShimmer 2.2s linear infinite" }}
              />
            </div>
            <div
              aria-hidden
              className="mt-1 h-[5px] w-[78px] rounded-full bg-black/45 blur-[6px]"
            />
          </div>

          {/* controls */}
          <div className="mt-2 flex items-center gap-1 rounded-full border border-white/12 bg-black/65 p-1 backdrop-blur shadow-[0_8px_22px_rgba(0,0,0,0.45)]">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-black hover:bg-zinc-100 transition"
              aria-label={open ? "Collapse hologram" : "Expand hologram"}
            >
              {open ? "MINI" : "EXPAND"}
            </button>
            <button
              onClick={() => setMin(true)}
              className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-white hover:bg-white/15 transition"
              aria-label="Minimize projector"
            >
              ─
            </button>
            <a
              href="/waifus"
              className="rounded-full bg-[rgba(120,220,255,0.18)] border border-[rgba(120,220,255,0.35)] px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-cyan-100 hover:bg-[rgba(120,220,255,0.28)] transition"
            >
              WAIFUS ↗
            </a>
          </div>
          <div className="mt-1 text-center text-[7px] font-mono tracking-[0.14em] text-white/40">
            click image to {open ? "shrink" : "enlarge"} · pure CSS · no credits
          </div>
        </div>
      )}

      {/* click target to toggle size when not minimized — div not button to avoid hydration nesting */}
      {!min && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setOpen((v)=>!v);}}}
          aria-label="Toggle hologram size"
          className="pointer-events-auto absolute inset-0 -z-10 rounded-[24px] cursor-pointer"
          style={{ top: open ? -8 : 0 }}
        />
      )}

      <style>{`
        @keyframes holoFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
        @keyframes holoScan { from { background-position-y: 0 } to { background-position-y: 7px } }
        @keyframes holoSweep { 0% { transform: translateY(0); opacity: 0 } 8% { opacity: 1 } 55% { transform: translateY(${open ? 236 : 168}px); opacity: 0.9 } 100% { transform: translateY(${open ? 236 : 168}px); opacity: 0 } }
        @keyframes holoPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.55; transform: scale(0.78) } }
        @keyframes holoShimmer { 0% { background-position: -80px 0 } 100% { background-position: 80px 0 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes holoFloat { from { transform: none } to { transform: none } }
        }
      `}</style>
    </div>
  );
}

/*
  R3F UPGRADE PATH (when you want mesh):
  - npm i @react-three/fiber @react-three/drei
  - Replace <img> with <Canvas><HoloPlane texture={src} /></Canvas> using shaderMaterial:
    uniforms: time, scanDensity=400, fringe=0.002, glow=0.55
    vertex: vUv; fragment: sample texture 3x with uv±fringe, add scanlines = sin(vUv.y*scanDensity+time*8)*0.06, fresnel rim.
  - Keep the same projector base as HTML overlay. Performance: 1 draw call, <1ms on RTX 4050.
*/
