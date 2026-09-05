type SfxKind = 'click' | 'pop' | 'unlock';

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  const c = ctx as AudioContext;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  return c;
}

function tone(freq: number, duration = 0.12, type: OscillatorType = 'sine', gainPeak = 0.08) {
  const c = getContext();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);
    const now = c.currentTime;
    g.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.start(now);
    o.stop(now + duration + 0.02);
  } catch {}
}

export function playSfx(kind: SfxKind) {
  // respect reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  switch (kind) {
    case 'click':
      tone(880, 0.13, 'sine', 0.08);
      break;
    case 'pop':
      tone(1200, 0.08, 'triangle', 0.07);
      setTimeout(() => tone(1600, 0.06, 'sine', 0.05), 30);
      break;
    case 'unlock':
      tone(660, 0.15, 'sine', 0.07);
      setTimeout(() => tone(990, 0.18, 'sine', 0.07), 120);
      break;
  }
}
