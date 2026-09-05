import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Desktop Apps — PNTHR DGTL",
  description: "PNTHR DGTL desktop launchers: waifu dashboard and bot trading terminal (Windows preview builds).",
};

const APPS = [
  {
    name: "Waifu Dashboard",
    file: "waifu-dashboard",
    desc: "Floating companion panel — squad status, gateway pulse, quick links into the radar.",
  },
  {
    name: "Bot Terminal",
    file: "bot-terminal",
    desc: "Paper-trading console on your desktop — strategies, positions, live PnL.",
  },
];

export default function DesktopPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6B6B6B]">PNTHR DGTL · Desktop</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Desktop apps</h1>
      <p className="mt-3 leading-relaxed text-[#4A4A4A]">
        Windows preview launchers (HTML previews — full Electron exe packaging is next).
        Open the preview in your browser, or download the <code className="rounded bg-black/5 px-1 font-mono text-[13px]">.bat</code> to
        launch it from your desktop.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {APPS.map((a) => (
          <div key={a.file} className="card p-5">
            <h2 className="text-lg font-bold">{a.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">{a.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/desktop-apps/${a.file}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#0A0A0A] px-4 py-2 text-sm font-bold text-white hover:bg-black"
              >
                Open preview
              </a>
              <a
                href={`/desktop-apps/${a.file}.bat`}
                download
                className="rounded-full border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-semibold hover:border-[#0A0A0A]"
              >
                .bat ↓
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-[#6B6B6B]">
        Prefer the web app? <Link href="/app" className="font-semibold text-[#0A0A0A] underline">Launch radar →</Link>
      </p>
    </div>
  );
}
