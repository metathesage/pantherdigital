"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* =========================================================
   PNHR DGTL — Trading Bot Waifu Dashboard · /bot
   Paper-trading console (admin-only API, token stored locally).
   Same marble-jungle + glass language as /waifus.
   ========================================================= */

type Health = {
  ok: boolean;
  balance: number;
  strategy: { maxPositions: number; positionUsd: number; takeProfitPct: number; stopLossPct: number; minScore: number };
  open: any[];
  openCount: number;
  realizedPnlUsd: number;
  history: any[];
  swept?: any[];
};

const TOKEN_KEY = "pnhr-bot-token";

async function call(path: string, token: string, init?: RequestInit) {
  const r = await fetch(path, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `request failed ${r.status}`);
  return j;
}

export default function BotDashboard() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // open-position form
  const [coinId, setCoinId] = useState("bitcoin");
  const [symbol, setSymbol] = useState("BTC");
  const [walletKind, setWalletKind] = useState<"coinbase" | "phantom">("coinbase");
  const [walletAddr, setWalletAddr] = useState("");
  const [size, setSize] = useState("5");

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      refresh(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async (t?: string) => {
    const tk = t ?? token;
    if (!tk) return;
    setLoading(true);
    setErr(null);
    try {
      const h = await call("/api/bot/health", tk);
      setData(h);
      setUnlocked(true);
      localStorage.setItem(TOKEN_KEY, tk);
    } catch (e: any) {
      setErr(e.message || "unlock failed");
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const openTrade = async () => {
    setErr(null);
    try {
      await call("/api/bot/sign", token, {
        method: "POST",
        body: JSON.stringify({
          action: "open",
          coinId: coinId.trim(),
          symbol: symbol.trim(),
          wallet: `${walletKind}:${walletAddr.trim() || "paper"}`,
          sizeUsd: Number(size) || undefined,
        }),
      });
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const closeTrade = async (id: string) => {
    setErr(null);
    try {
      await call("/api/bot/sign", token, { method: "POST", body: JSON.stringify({ action: "close", id }) });
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="relative min-h-screen text-[#0A0A0A] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src="/home-bg.jpg" alt="" aria-hidden className="h-full w-full object-cover object-[center_30%] scale-[1.02]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.62)_0%,rgba(248,248,247,0.84)_36%,rgba(248,248,247,0.96)_68%,#F8F8F7_92%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="grid size-9 place-items-center overflow-hidden rounded-xl border border-[#0A0A0A]/10 bg-white p-0.5 shadow-sm" title="Home">
              <img src="/panther-icon.png" alt="home" className="h-7 w-7 object-contain" />
            </Link>
            <Link href="/waifus" className="rounded-full border border-[#0A0A0A]/10 bg-white/80 px-3 py-1.5 text-[11px] font-bold tracking-widest backdrop-blur hover:border-[#0A0A0A]">← WAIFUS</Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> TRADER · PAPER BOT
            </span>
          </div>
          <button onClick={() => refresh()} disabled={loading || !token} className="rounded-full bg-[#0A0A0A] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-40">
            {loading ? "…" : "Refresh ⟳"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-4 pb-14 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-[860px] text-center">
          <p className="text-[11px] font-bold tracking-[0.28em] text-[#6B6B6B]">PANTHER DIGITAL · PAPER TRADING</p>
          <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] sm:text-[38px] leading-[0.95]">
            BOT <span className="font-light text-[#6B6B6B]">DASHBOARD</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-5 text-[#6B6B6B]">
            Admin-only console. Paper bankroll — no real funds move. Connect
            <span className="font-bold text-[#0A0A0A]"> Coinbase</span> or
            <span className="font-bold text-[#0A0A0A]"> Phantom</span> by address, paper-trade $5–10 positions.
          </p>
          <div className="mx-auto mt-5 h-px w-full max-w-[520px] bg-gradient-to-r from-transparent via-[#0A0A0A]/15 to-transparent" />
        </div>

        {!unlocked && (
          <div className="mx-auto mt-6 max-w-[520px] rounded-[24px] border border-white/65 bg-white/75 p-5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
            <div className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">ADMIN TOKEN</div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && refresh()}
              placeholder="paste ADMIN_BEARER_TOKEN"
              className="mt-2 w-full rounded-xl border border-[#E8E8E8] bg-white px-3 py-2.5 font-mono text-[13px] outline-none focus:border-[#0A0A0A]"
            />
            <button onClick={() => refresh()} disabled={!token || loading} className="mt-3 w-full rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40">
              {loading ? "Unlocking…" : "Unlock Dashboard 🔓"}
            </button>
            {err && <div className="mt-2 text-center text-[12px] font-semibold text-red-600">{err}</div>}
          </div>
        )}

        {unlocked && data && (
          <>
            <div className="mx-auto mt-6 grid max-w-[860px] grid-cols-3 gap-3 text-center">
              {[
                { label: "PAPER BALANCE", value: `$${data.balance.toFixed(2)}` },
                { label: "OPEN", value: `${data.openCount}/${data.strategy.maxPositions}` },
                { label: "REALIZED PNL", value: `${data.realizedPnlUsd >= 0 ? "+" : ""}$${data.realizedPnlUsd.toFixed(2)}`, tone: data.realizedPnlUsd >= 0 ? "text-emerald-600" : "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-[20px] border border-white/60 bg-white/75 px-3 py-4 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <div className="text-[10px] font-bold tracking-[0.16em] text-[#9A9A9A]">{s.label}</div>
                  <div className={`mt-1 text-[22px] font-black tabular-nums ${s.tone || ""}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-4 max-w-[860px] rounded-[24px] border border-white/65 bg-white/75 p-5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.07)]">
              <div className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">OPEN PAPER POSITION · ${data.strategy.positionUsd}/trade · TP +{data.strategy.takeProfitPct}% · SL {data.strategy.stopLossPct}%</div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <input value={coinId} onChange={(e) => setCoinId(e.target.value)} placeholder="coin id" className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-[#0A0A0A]" />
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="SYM" className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-[#0A0A0A]" />
                <select value={walletKind} onChange={(e) => setWalletKind(e.target.value as any)} className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 text-[12px] font-bold outline-none">
                  <option value="coinbase">Coinbase</option>
                  <option value="phantom">Phantom</option>
                </select>
                <input value={walletAddr} onChange={(e) => setWalletAddr(e.target.value)} placeholder="wallet address" className="col-span-2 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-[#0A0A0A]" />
                <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="$" className="rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 font-mono text-[12px] outline-none focus:border-[#0A0A0A]" />
              </div>
              <button onClick={openTrade} className="mt-3 w-full rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[13px] font-bold text-white sm:w-auto">Open Paper Long ↗</button>
              {err && <div className="mt-2 text-[12px] font-semibold text-red-600">{err}</div>}
            </div>

            <div className="mx-auto mt-4 grid max-w-[860px] grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/65 bg-white/75 p-5 backdrop-blur-2xl">
                <div className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">OPEN POSITIONS</div>
                <div className="mt-2 space-y-2">
                  {data.open.length === 0 && <div className="text-[12px] text-[#9A9A9A]">flat — no open positions</div>}
                  {data.open.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-2xl border border-[#E8E8E8] bg-white px-3 py-2">
                      <span className="font-mono text-[13px] font-black">${p.symbol}</span>
                      <span className="font-mono text-[11px] text-[#6B6B6B]">@ ${p.entry} · ${p.sizeUsd}</span>
                      <button onClick={() => closeTrade(p.id)} className="ml-auto rounded-full border border-[#0A0A0A] px-3 py-1 text-[11px] font-bold hover:bg-[#0A0A0A] hover:text-white">Close</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/65 bg-white/75 p-5 backdrop-blur-2xl">
                <div className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">HISTORY</div>
                <div className="mt-2 space-y-2">
                  {data.history.length === 0 && <div className="text-[12px] text-[#9A9A9A]">no closed trades yet</div>}
                  {data.history.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-2xl border border-[#E8E8E8] bg-white px-3 py-2">
                      <span className="font-mono text-[13px] font-black">${p.symbol}</span>
                      <span className={`font-mono text-[11px] font-bold ${p.pnlUsd >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {p.pnlUsd >= 0 ? "+" : ""}{p.pnlPct?.toFixed(1)}% ({p.pnlUsd >= 0 ? "+" : ""}${p.pnlUsd?.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 text-center text-[10px] tracking-[0.20em] text-[#9A9A9A]">© PANTHERDIGITAL — PAPER BOT · ADMIN ONLY · NO REAL FUNDS</div>
      </main>
    </div>
  );
}
