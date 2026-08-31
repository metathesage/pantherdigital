"use client";

import dynamic from "next/dynamic";

const HeroParticles = dynamic(() => import("@/components/HeroParticles"), {
  ssr: false,
});

export default function HeroBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <HeroParticles />
    </div>
  );
}
