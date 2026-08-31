"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CardImage from "@/components/CardImage";
import type { TcgCard } from "@/types";
import { colorTokens } from "@/lib/meta";

/**
 * Coverflow-style 3D carousel built with CSS transforms over real card
 * images. No WebGL required — works everywhere, keyboard accessible,
 * auto-rotates, pauses on hover/focus and honors reduced-motion.
 */
export default function CardCarousel({ cards }: { cards: TcgCard[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const count = cards.length;

  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 3800);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [paused, count]);

  if (count === 0) return null;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  }

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Featured cards carousel"
      aria-roledescription="carousel"
    >
      {/* Stage */}
      <div className="relative h-[340px] overflow-hidden sm:h-[400px]" style={{ perspective: "1400px" }}>
        {/* Water glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] h-40 w-[130%] -translate-x-1/2 rounded-[100%] bg-gradient-to-r from-holo-cyan/25 via-holo-blue/25 to-holo-purple/25 blur-2xl"
        />
        {cards.map((card, i) => {
          let offset = i - index;
          // wrap to shortest path around the ring
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;
          const abs = Math.abs(offset);
          const visible = abs <= Math.min(4, Math.floor(count / 2));
          const angle = offset * 42;
          const translateZ = 260 - abs * 90;
          const translateY = abs * 14;
          const opacity = visible ? 1 - abs * 0.16 : 0;
          const zIndex = 100 - abs;

          return (
            <div
              key={card.id}
              aria-hidden={offset !== 0}
              className="absolute left-1/2 top-1/2 transition-all duration-700 ease-out will-change-transform"
              style={{
                transform: `translate(-50%, -50%) translateY(${translateY}px) perspective(1100px) rotateY(${angle}deg) translateZ(${translateZ}px) scale(${offset === 0 ? 1 : 0.86})`,
                opacity,
                zIndex,
                pointerEvents: visible ? "auto" : "none",
              }}
            >
              <Link
                href={`/cards/${card.id}`}
                tabIndex={offset === 0 ? 0 : -1}
                aria-label={`${card.name ?? card.cardNumber}, featured card ${i + 1} of ${count}`}
                className={`group block w-32 rounded-xl shadow-xl ring-1 ring-white/60 sm:w-44 ${
                  offset === 0
                    ? "shadow-holo-blue/40 ring-2 ring-white"
                    : "brightness-[0.82]"
                }`}
                draggable={false}
              >
                <div className="shine relative overflow-hidden rounded-xl">
                  <CardImage
                    src={card.imageUrl}
                    alt={card.name ?? card.cardNumber}
                    seed={card.cardNumber}
                    title={card.name ?? card.cardNumber}
                    subtitle={card.type}
                    rarity={card.rarity}
                    colorList={colorTokens(card.color)}
                    eager={abs <= 1}
                    className="block aspect-[300/420] w-full object-cover"
                  />
                  {offset === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-950/70 to-transparent px-3 pb-2 pt-6 text-left">
                      <span className="block truncate text-xs font-bold text-white drop-shadow">
                        {card.name}
                      </span>
                      <span className="font-mono text-[10px] text-sky-100/80">{card.cardNumber}</span>
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous card"
          className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/70 text-sky-800 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex gap-1.5" role="tablist" aria-label="Choose featured card">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${card.name ?? card.cardNumber}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-gradient-to-r from-holo-blue to-holo-pink" : "w-2 bg-sky-900/20 hover:bg-sky-900/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next card"
          className="grid size-10 place-items-center rounded-full border border-white/70 bg-white/70 text-sky-800 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-blue"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
