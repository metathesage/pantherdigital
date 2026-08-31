"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll parallax layer. Translates its children vertically at `speed`
 * (positive = moves slower / lags behind scroll). Respects reduced motion.
 */
export default function ParallaxLayer({
  speed = 0.2,
  className = "",
  children,
}: {
  speed?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        const viewportMiddle = window.innerHeight / 2;
        const offset = (rect.top + rect.height / 2 - viewportMiddle) * speed;
        el!.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
