const PALETTE = ["#2f80ed", "#ff5c8a", "#7b61ff", "#f2a900", "#27ae60", "#00b4e6"];

export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientFor(seed: string): [string, string] {
  const a = PALETTE[hashString(seed) % PALETTE.length];
  const b = PALETTE[hashString(seed + "::b") % PALETTE.length];
  return [a, b];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ------------------------------- Rarity ---------------------------------- */

/** Display order for known rarities (lower = more common). */
export const RARITY_ORDER: Record<string, number> = {
  C: 10,
  U: 20,
  R: 30,
  RR: 40,
  SR: 50,
  S: 55,
  P: 60,
  SY: 70,
  HR: 80,
  UR: 90,
  SEC: 95,
  OC: 97,
  OSR: 99,
  OUR: 100,
};

export function rarityOrder(rarity: string | null): number {
  if (!rarity) return 0;
  return RARITY_ORDER[rarity.toUpperCase()] ?? 5;
}

const HIGH_RARITIES = new Set(["OC", "OSR", "SEC", "OUR", "HR", "UR"]);

export function rarityClass(rarity: string | null): string {
  const base =
    "inline-flex h-6 min-w-8 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-bold tracking-wide";
  if (!rarity) return `${base} bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200`;
  const key = rarity.toUpperCase();
  if (HIGH_RARITIES.has(key))
    return `${base} holo-chip bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200`;
  switch (key) {
    case "RR":
      return `${base} bg-violet-50 text-violet-700 ring-1 ring-violet-200`;
    case "SR":
    case "S":
      return `${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`;
    case "R":
      return `${base} bg-sky-50 text-sky-700 ring-1 ring-sky-200`;
    case "U":
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`;
    default:
      return `${base} bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200`;
  }
}

/* -------------------------------- Colors ---------------------------------- */

const SINGLE_COLOR_HEX: Record<string, string> = {
  white: "#8b95a5",
  green: "#27ae60",
  red: "#ef4d5e",
  blue: "#2f80ed",
  purple: "#7b61ff",
  yellow: "#f2a900",
  neutral: "#9aa3af",
};

export function colorTokens(color: string | null | undefined): string[] {
  if (!color) return ["neutral"];
  const cleaned = color.toLowerCase().trim();
  if (!cleaned || cleaned === "null") return ["neutral"];
  return cleaned.split("_");
}

export function colorHex(token: string): string {
  return SINGLE_COLOR_HEX[token] ?? "#9aa3af";
}

export function colorLabel(color: string | null | undefined): string {
  return colorTokens(color)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" / ");
}

/* -------------------------------- Dates ----------------------------------- */

export function formatDate(iso: string | null): string {
  if (!iso) return "TBA";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
