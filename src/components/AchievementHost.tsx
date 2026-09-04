"use client";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/panther";
import { playSfx, isSfxEnabled, setSfxEnabled } from "@/lib/sfx";

type Toast = { id: number; label: string; desc: string };

/** Site-wide achievement toasts + SFX toggle. Mount once in Providers. */
export default function AchievementHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sfxOn, setSfxOn] = useState(true);

  useEffect(() => {
    setSfxOn(isSfxEnabled());
    let n = 0;
    const onUnlock = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      n += 1;
      const t = { id: n, label: def.label, desc: def.desc };
      setToasts((p) => [...p, t]);
      playSfx("fanfare");
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 4200);
    };
    window.addEventListener("pnthr-achievement", onUnlock);
    return () => window.removeEventListener("pnthr-achievement", onUnlock);
  }, []);

  return (
    <>
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-scale-in w-full rounded-2xl border border-amber-300/60 bg-[#0A0A0A] px-4 py-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.4)]"
          >
            <div className="text-[10px] font-bold tracking-[0.2em] text-amber-300">🏆 ACHIEVEMENT UNLOCKED</div>
            <div className="mt-0.5 text-[15px] font-black">{t.label}</div>
            <div className="text-[12px] text-white/60">{t.desc} · +25 💎</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { const v = !sfxOn; setSfxOn(v); setSfxEnabled(v); if (v) playSfx("click"); }}
        title={sfxOn ? "Mute sound effects" : "Enable sound effects"}
        aria-pressed={sfxOn}
        className="fixed bottom-5 right-5 z-[200] grid size-11 place-items-center rounded-full border border-[#E8E8E8] bg-white/90 text-lg shadow-lg backdrop-blur transition hover:scale-105"
      >
        {sfxOn ? "🔊" : "🔇"}
      </button>
    </>
  );
}

/** Helper: unlock + toast + sfx in one call (call from any page). */
export function celebrate(id: (typeof ACHIEVEMENTS)[number]["id"], already: boolean) {
  if (!already) return;
  try { window.dispatchEvent(new CustomEvent("pnthr-achievement", { detail: id })); }
  catch { playSfx("fanfare"); }
}
