"use client";
export function ScoreRing({score}:{score:number}) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const dash = c * (score/100);
  const gap = c - dash;
  const is90 = score >= 90;
  return (
    <div className={`relative size-[52px] shrink-0 ${is90 ? "drop-shadow-[0_0_8px_rgba(255,107,0,0.55)]" : ""}`}>
      <svg viewBox="0 0 44 44" className={`size-[52px] -rotate-90 ${is90 ? "animate-[pulse_1.6s_ease-in-out_infinite]" : ""}`}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#EEE" strokeWidth={3.5} />
        <circle cx="22" cy="22" r={r} fill="none" stroke={is90 ? "#FF6B00" : "#0A0A0A"} strokeWidth={is90 ? 4 : 3.5} strokeLinecap="round" strokeDasharray={`${dash} ${gap}`} style={is90 ? { filter: "drop-shadow(0 0 6px rgba(255,107,0,0.6))" } : undefined} />
        {is90 && <circle cx="22" cy="22" r={r+4} fill="none" stroke="#FF6B00" strokeWidth={0.9} opacity={0.35} strokeDasharray="2 3" />}
      </svg>
      <span className={`absolute inset-0 grid place-items-center text-[13px] font-bold tabular-nums ${is90 ? "text-[#FF6B00]" : ""}`}>
        {score}
        {is90 && <span className="ml-0.5 text-[10px]">★</span>}
      </span>
      {is90 && <span className="pointer-events-none absolute -inset-1 rounded-full border border-[#FF6B00]/30 animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]" />}
    </div>
  );
}
