"use client";

import { useEffect, useRef, useState } from "react";
import TiltCard from "@/components/TiltCard";
import CardImage from "@/components/CardImage";
import type { TcgCard } from "@/types";

function Lightbox({ card, onClose }: { card: TcgCard; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} enhanced view`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-sm animate-pop"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.imageUrl ?? ""}
        alt={card.name ?? card.cardNumber}
        className="max-h-[92vh] max-w-full rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="sr-only">Close enhanced view</span>
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function CardViewer({ card }: { card: TcgCard }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="relative">
      <TiltCard maxDeg={10} scale={1.02} className="mx-auto w-full max-w-sm">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block w-full cursor-zoom-in rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-holo-blue"
          aria-label="Open enhanced view"
        >
          <div className="shine relative overflow-hidden rounded-2xl shadow-2xl shadow-holo-purple/25 ring-1 ring-black/10">
            <CardImage
              src={card.imageUrl}
              alt={card.name ?? card.cardNumber}
              seed={card.cardNumber}
              title={card.name ?? card.cardNumber}
              subtitle={card.type}
              rarity={card.rarity}
              colorList={[...(card.color ?? "").split("_")]}
              eager
              className="block w-full"
            />
          </div>
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100">
            Click to enlarge
          </span>
        </button>
      </TiltCard>

      {lightboxOpen && <Lightbox card={card} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
