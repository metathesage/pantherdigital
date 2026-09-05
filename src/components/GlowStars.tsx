"use client";
import { useEffect, useRef } from "react";

export default function GlowStars({ count = 110 }: { count?: number }) {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = starsRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars: HTMLDivElement[] = [];
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className =
        i % 20 === 0 ? "glow-star glow-star--big" : i % 9 === 0 ? "glow-star glow-star--medium" : "glow-star";
      s.style.top = `${Math.round(Math.random() * 10000) / 100}%`;
      s.style.left = `${Math.round(Math.random() * 10000) / 100}%`;
      const dur = Math.round(Math.random() * 3000) + 3000;
      s.style.animationDuration = `${dur}ms`;
      s.style.animationDelay = `${Math.round(Math.random() * 3000)}ms`;
      if (reduced) s.style.animation = "none";
      el.appendChild(s);
      stars.push(s);
    }
    return () => stars.forEach((s) => s.remove());
  }, [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0">
      <div ref={starsRef} className="glow-stars" />
      <div className="glow-comet" />
    </div>
  );
}