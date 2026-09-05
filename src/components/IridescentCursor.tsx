"use client";
import { useEffect, useRef } from "react";

/* CHILL TUBES CURSOR — soju22 tubes1, tamed for PNTHR DGTL.
   Pen default: 16 fat neon tubes, 200-intensity lights, lerp .5 (twitchy).
   Ours: 4 thin iridescent tubes, dim lights, slow lerp — aura, not rave.
   Native cursor stays. Desktop only (pointer:fine), off on reduced-motion. */

const PALETTE = ["#38BDF8", "#A78BFA", "#F472B6", "#22D3EE"]; // holo tokens
const LIGHTS = ["#38BDF8", "#A78BFA", "#F472B6", "#22D3EE"];

export default function IridescentCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    let app: { tubes?: { setColors: (c: string[]) => void; setLightsColors: (c: string[]) => void } } | null = null;
    let dead = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import("threejs-components/build/cursors/tubes1.min.js");
        if (dead) return;
        const TubesCursor = mod.default ?? mod.TubesCursor;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app = new TubesCursor(canvas, {
          tubes: {
            count: 4,
            colors: [...PALETTE],
            minRadius: 0.004,
            maxRadius: 0.022,
            minTubularSegments: 24,
            maxTubularSegments: 64,
            material: { metalness: 0.7, roughness: 0.35, transparent: true, opacity: 0.55 },
            lights: { intensity: 60, colors: [...LIGHTS] },
            lerp: 0.16,
            noise: 0.12,
          },
        });
      } catch {
        /* WebGL/CDN-less environments: silently no cursor. Page unaffected. */
      }
    })();

    // click → rotate palette (same hues, new order). Chill reshuffle, no neon roulette.
    let shift = 0;
    const onClick = () => {
      if (!app?.tubes) return;
      shift = (shift + 1) % PALETTE.length;
      const rot = (a: string[]) => [...a.slice(shift), ...a.slice(0, shift)];
      app.tubes.setColors(rot(PALETTE));
      app.tubes.setLightsColors(rot(LIGHTS));
    };
    window.addEventListener("click", onClick);

    return () => {
      dead = true;
      window.removeEventListener("click", onClick);
      // tubes1 has no dispose; canvas GC'd with unmount. Single-mount in root layout.
      app = null;
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="iridescent-cursor" />;
}
