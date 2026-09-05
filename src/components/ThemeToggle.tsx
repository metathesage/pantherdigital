"use client";
import { useEffect, useState } from "react";

/* Theme toggle — dark phase 1. Toggles .dark on <html>, persists,
   defaults to OS preference. View-transition morph when available. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pnhr-theme");
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const on = stored ? stored === "dark" : prefers;
      setDark(on);
      document.documentElement.classList.toggle("dark", on);
    } catch { /* private mode: stay light */ }
  }, []);

  const flip = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("pnhr-theme", next ? "dark" : "light"); } catch {}
    const apply = () => document.documentElement.classList.toggle("dark", next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vt = (document as any).startViewTransition;
    if (vt) vt.call(document, apply); else apply();
  };

  return (
    <button
      onClick={flip}
      title={dark ? "Lights on" : "Lights out"}
      aria-label="Toggle dark mode"
      className="fixed bottom-5 left-5 z-50 grid size-10 place-items-center rounded-full border border-[#0A0A0A]/10 bg-white/85 text-[16px] shadow-lg backdrop-blur-xl transition hover:scale-105 dark:border-white/15 dark:bg-[#101413]/85"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
