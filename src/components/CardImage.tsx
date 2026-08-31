"use client";

import { useState } from "react";
import { gradientFor, hashString, initialsOf, rarityClass } from "@/lib/meta";

interface PlaceholderProps {
  seed: string;
  title: string;
  subtitle?: string;
  badge?: string | null;
  colorList?: string[];
  className?: string;
}

export function PlaceholderArt({
  seed,
  title,
  subtitle,
  badge,
  colorList = ["neutral"],
  className = "",
}: PlaceholderProps) {
  const [from, to] = gradientFor(seed);
  const accent = colorHexOf(colorList[0]);
  const soft = "#f4f5fa";
  const stripeOffset = (hashString(seed) % 40) - 20;
  const id = `ph${hashString(seed)}`;

  return (
    <svg viewBox="0 0 300 420" role="img" aria-label={`${title} placeholder artwork`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="420" rx="18" fill={`url(#g-${id})`} />
      <rect width="300" height="420" rx="18" fill={`url(#glow-${id})`} />
      <g opacity="0.14" stroke="#ffffff" strokeWidth="26">
        {[...Array(6)].map((_, i) => (
          <line key={i} x1={-80 + i * 90 + stripeOffset} y1="-20" x2={40 + i * 90 + stripeOffset} y2="440" />
        ))}
      </g>
      <rect x="12" y="12" width="276" height="396" rx="12" fill={soft} opacity="0.94" />
      <rect x="12" y="12" width="276" height="10" rx="5" fill={accent} opacity="0.9" />
      <circle cx="150" cy="165" r="72" fill="#ffffff" stroke={accent} strokeWidth="3" />
      <circle cx="150" cy="165" r="86" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
      <text x="150" y="165" textAnchor="middle" dominantBaseline="central" fontSize="56" fontWeight="800" fill={accent} fontFamily="var(--font-geist-sans), sans-serif" letterSpacing="2">
        {initialsOf(title)}
      </text>
      <text x="150" y="292" textAnchor="middle" fontSize="19" fontWeight="700" fill="#14161d" fontFamily="var(--font-geist-sans), sans-serif">
        {clip(title)}
      </text>
      {subtitle && (
        <text x="150" y="318" textAnchor="middle" fontSize="12" fill="#71717a" fontFamily="var(--font-geist-sans), sans-serif" letterSpacing="1.5">
          {clip(subtitle.toUpperCase(), 30)}
        </text>
      )}
      <text x="288" y="42" textAnchor="end" fontSize="26" fontWeight="900" fill={accent} fontFamily="var(--font-geist-sans), sans-serif">
        {badge ?? ""}
      </text>
    </svg>
  );
}

function colorHexOf(token: string): string {
  switch (token) {
    case "red": return "#ef4d5e";
    case "blue": return "#2f80ed";
    case "green": return "#27ae60";
    case "purple": return "#7b61ff";
    case "yellow": return "#f2a900";
    case "white": return "#5b6472";
    default: return "#9aa3af";
  }
}

function clip(text: string, max = 22): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface CardImageProps {
  src: string | null;
  alt: string;
  /** Stable seed for the generated fallback artwork. */
  seed: string;
  title: string;
  subtitle?: string;
  rarity?: string | null;
  colorList?: string[];
  className?: string;
  eager?: boolean;
}

/**
 * Renders the official card scan when available and falls back to
 * generated placeholder art if the remote image fails to load.
 */
export default function CardImage({
  src,
  alt,
  seed,
  title,
  subtitle,
  rarity,
  colorList,
  className = "",
  eager = false,
}: CardImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <PlaceholderArt
        seed={seed}
        title={title}
        subtitle={subtitle}
        badge={rarity}
        colorList={colorList}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function RarityBadge({ rarity }: { rarity: string | null }) {
  if (!rarity) return null;
  return (
    <span className={rarityClass(rarity)} title={`Rarity ${rarity}`}>
      {rarity}
    </span>
  );
}
