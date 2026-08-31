"use client";

import { useEffect, useState } from "react";
import type { TcgCard } from "@/types";

interface MarketComp {
  source: string;
  title: string;
  price: number;
  currency: string;
  url: string;
}

interface MarketLink {
  label: string;
  href: string;
  description: string;
}

interface Snapshot {
  live: boolean;
  comps: MarketComp[];
  estimate?: number;
  currency?: string;
  note?: string;
  links?: MarketLink[];
}

export default function MarketPanel({ card }: { card: TcgCard }) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "ready"; snapshot: Snapshot }
  >({ kind: "loading" });
  const [showSetup, setShowSetup] = useState(false);
  const [cert, setCert] = useState("");
  const [certError, setCertError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/market/${encodeURIComponent(card.id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((snapshot: Snapshot) => {
        if (!cancelled) setState({ kind: "ready", snapshot });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const links =
    state.kind === "ready" && state.snapshot.links ? state.snapshot.links : null;

  return (
    <section aria-label="Market and grading" className="mt-6 rounded-2xl border border-sky-950/10 bg-white/70 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Market & Grading
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSetup((v) => !v)}
            className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 transition hover:bg-black/[0.08]"
          >
            {showSetup ? "Hide setup" : "Enable live"}
          </button>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              state.kind === "ready" && state.snapshot.live
                ? "bg-emerald-100 text-emerald-700"
                : "bg-holo-blue/10 text-holo-blue"
            }`}
          >
            {state.kind === "ready" && state.snapshot.live ? "Live comps" : "Live links"}
          </span>
        </div>
      </div>

      {showSetup && (
        <div className="mt-3 rounded-xl bg-sky-950/[0.03] p-3.5 text-xs leading-relaxed text-zinc-500">
          <p className="font-semibold text-zinc-700">Why no embedded sales yet?</p>
          <p className="mt-1">
            eBay, Cardmarket and TCGPlayer block server-side scraping for
            non-customers, and PriceCharting doesn’t catalogue hololive OCG —
            so embedded comps need a free official API key. Add either to{" "}
            <code className="rounded bg-black/5 px-1 font-mono">.env.local</code> and restart:
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 font-mono text-[11px]">
            <li>EBAY_CLIENT_ID / EBAY_CLIENT_SECRET — developer.ebay.com</li>
            <li>TCGPLAYER_PUBLIC_KEY / PRIVATE_KEY — docs.tcgplayer.com</li>
          </ul>
          <p className="mt-1.5">
            Until then, the buttons below open live results for this exact card
            number — they always work.
          </p>
        </div>
      )}

      {/* PSA cert lookup */}
      <form
        className="mt-4 flex items-center gap-2 rounded-xl border border-sky-950/10 bg-white px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = cert.trim();
          if (/^[0-9]{7,10}$/.test(value)) {
            setCertError(null);
            window.open(`https://www.psacard.com/cert/${value}`, "_blank", "noopener");
          } else {
            setCertError("PSA cert numbers are 7–10 digits.");
          }
        }}
      >
        <span className="text-xs font-bold text-zinc-500">PSA Cert #</span>
        <input
          value={cert}
          onChange={(e) => setCert(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 88741234"
          aria-label="PSA certification number"
          className="h-8 min-w-0 flex-1 rounded-lg border border-sky-950/15 px-2 font-mono text-sm outline-none focus:border-holo-blue/60 focus:ring-2 focus:ring-holo-blue/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-holo-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-holo-cyan"
        >
          Verify ↗
        </button>
      </form>
      {certError && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-holo-pink">
          {certError}
        </p>
      )}

      {state.kind === "loading" && (
        <div className="mt-4 space-y-2" aria-hidden>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-9 w-full rounded-lg" />
          ))}
        </div>
      )}

      {state.kind === "error" && (
        <p className="mt-4 text-sm text-zinc-500">
          Could not load market data. Use the direct links below instead.
        </p>
      )}

      {state.kind === "ready" && (
        <>
          {state.snapshot.live && state.snapshot.comps.length > 0 ? (
            <>
              {state.snapshot.estimate !== undefined && (
                <div className="mt-4 flex items-baseline gap-2 rounded-xl bg-gradient-to-r from-holo-blue/10 to-holo-purple/10 px-4 py-3 ring-1 ring-holo-blue/15">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Median market value
                  </span>
                  <span className="text-2xl font-extrabold tabular-nums text-zinc-900">
                    ${state.snapshot.estimate.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    · {state.snapshot.comps.length} comps ({state.snapshot.currency})
                  </span>
                </div>
              )}
              <ul className="mt-3 divide-y divide-sky-950/5">
                {state.snapshot.comps.slice(0, 6).map((comp, i) => (
                  <li key={`${comp.source}-${i}`}>
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2 text-sm transition-colors hover:text-holo-blue"
                    >
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          comp.source === "eBay"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {comp.source}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-zinc-600">{comp.title}</span>
                      <span className="shrink-0 font-bold tabular-nums text-zinc-800">
                        ${comp.price.toFixed(2)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            state.snapshot.note && (
              <p className="mt-4 rounded-xl bg-sky-950/[0.03] p-3 text-xs leading-relaxed text-zinc-500">
                {state.snapshot.note}
              </p>
            )
          )}

          {links && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-sky-950/10 bg-white px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-holo-blue/40 hover:shadow-md"
                >
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-holo-blue">
                    {link.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">{link.description}</p>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
