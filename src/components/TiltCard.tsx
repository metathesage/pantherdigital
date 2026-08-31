"use client";

import { useRef } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  maxDeg?: number;
  scale?: number;
  className?: string;
}

export default function TiltCard({
  children,
  maxDeg = 12,
  scale = 1.03,
  className = "",
}: TiltCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = bodyRef.current;
    if (!el) return;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * maxDeg * 2;
      const ry = (px - 0.5) * maxDeg * 2;
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
        2
      )}deg) scale(${scale})`;
      el.style.setProperty("--shine-x", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--shine-y", `${(py * 100).toFixed(1)}%`);
    });
  }

  function handleLeave() {
    cancelAnimationFrame(frameRef.current);
    const el = bodyRef.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      className={`tilt-scene ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div ref={bodyRef} className="tilt-body transition-transform duration-200 ease-out">
        {children}
      </div>
    </div>
  );
}
