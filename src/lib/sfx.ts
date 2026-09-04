"use client";
// Tiny WebAudio SFX engine — zero assets, zero cost, respects
// prefers-reduced-motion (treated as prefers-reduced-sound here).

let ctx: AudioContext | null = null;
let enabled = true;

try {
  const raw = localStorage.getItem("pnthr-sfx");
  if (raw === "off") enabled = false;
} catch { /* ssr-safe */ }

export function isSfxEnabled() { return enabled; }
export function setSfxEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem("pnthr-sfx", v ? "on" : "off"); } catch {}
}

function ac(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!enabled) return null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function blip(freq: number, dur = 0.09, type: OscillatorType = "sine", gain = 0.12, when = 0) {
  const c = ac();
  if (!c) return;
  try {
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* silent */ }
}

export const sfx = {
  /** hover tick on nav links */
  hover() { blip(1320, 0.04, "sine", 0.04); },
  /** primary click */
  click() { blip(660, 0.07, "triangle", 0.1); },
  /** successful scan / sign-in / unlock */
  success() { blip(523, 0.1, "sine", 0.12); blip(784, 0.12, "sine", 0.12, 0.09); blip(1046, 0.16, "sine", 0.1, 0.18); },
  /** error buzz */
  error() { blip(220, 0.16, "sawtooth", 0.07); blip(165, 0.2, "sawtooth", 0.06, 0.1); },
  /** coins / gems earned */
  coins() { blip(988, 0.08, "square", 0.05); blip(1319, 0.12, "square", 0.05, 0.07); },
  /** rare pull / whale alert */
  fanfare() {
    blip(523, 0.1, "triangle", 0.12); blip(659, 0.1, "triangle", 0.12, 0.1);
    blip(784, 0.1, "triangle", 0.12, 0.2); blip(1046, 0.24, "triangle", 0.14, 0.3);
  },
  /** swipe / tab switch */
  swoosh() { blip(440, 0.06, "sine", 0.06); blip(660, 0.06, "sine", 0.05, 0.05); },
};

export type SfxName = keyof typeof sfx;
export function playSfx(name: SfxName) {
  try { sfx[name](); } catch { /* silent */ }
}
