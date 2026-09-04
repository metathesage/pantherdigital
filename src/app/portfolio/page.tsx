"use client";
import { useState, useEffect, useMemo } from "react";
import { usePanther } from "@/lib/panther";

/* ----------------------------------------------------------------------------
 * Real on-chain data only. No mocked balances, prices, tokens, or P&L.
 *  - Solana: public mainnet RPC (keyless) + Jupiter token list/price (keyless).
 *  - Ethereum: public LlamaRPC (keyless) for native balance; Etherscan V2
 *    (optional NEXT_PUBLIC_ETHERSCAN_API_KEY) for ERC-20 holdings + history.
 * Cost-basis / missed-gains is intentionally NOT shown — it would require
 * guessing buy prices, which is mock data.
 * ------------------------------------------------------------------------- */

type Holding = {
  symbol: string;
  name: string;
  image: string;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  chain: "ETH" | "SOL";
  mint?: string;
};
type Txn = {
  hash: string;
  time: number; // ms epoch
  status: "ok" | "fail";
  feeEth: number | null;
  valueEth: number; // native value if transfer, else 0
  type: "swap" | "transfer" | "contract" | "mint" | "other";
  counterparty: string | null;
  chain: "ETH" | "SOL";
};
type Nft = {
  id: string;
  name: string;
  image: string;
  collection: string;
};
type Snapshot = { total: number; at: number };
type Stats = {
  txCount: number;
  successRate: number;
  activeFrom: number | null;
  activeTo: number | null;
  uniqueCounterparties: number;
  defiSwaps: number;
  totalGasEth: number;
  largestTxEth: number;
  memeExposurePct: number;
  tokenCount: number;
  nativeSymbol: string;
  nativeBalance: number;
  nativePriceUsd: number;
  totalValueUsd: number;
  enriched: boolean; // false when Etherscan key missing (ETH)
};

const SOL_NATIVE = "So11111111111111111111111111111111111111112";
const SOL_RPC = "https://api.mainnet-beta.solana.com";
const ETH_RPC = "https://eth.llamarpc.com";
// Known DEX / program ids (used to classify activity, not for calls)
const SOL_DEX = new Set([
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV", // Jupiter v6
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // pump.fun
]);
const ETH_DEX = new Set([
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3 Router
  "0x1111111254eeb25477b68fb85ed929f73a960582", // 1inch
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // Sushi
  "0xdef1c0ded9bec7f1a1670819833240f027b25e", // 0x / CowSwap
]);
const MEMES = new Set([
  "PEPE", "BONK", "WIF", "FLOKI", "BOME", "POPCAT", "MEME", "BRETT", "MOG",
  "NEIRO", "SHIB", "DOGE", "WOJAK", "TURBO", "SLERF",
]);

function detectChain(addr: string): "ETH" | "SOL" | null {
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return "ETH";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return "SOL";
  return null;
}
const fmtUsd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B`
  : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M`
  : n >= 1e3 ? `$${(n / 1e3).toFixed(2)}K`
  : `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtDate = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

async function rpcPost(url: string, method: string, params: any[]) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  return r.json();
}

async function fetchNativePrices(): Promise<{ eth: number; sol: number }> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd",
      { cache: "no-store" }
    ).then((x) => x.json());
    return { eth: r?.ethereum?.usd ?? 0, sol: r?.solana?.usd ?? 0 };
  } catch {
    return { eth: 0, sol: 0 };
  }
}

async function fetchDexPrice(mint: string): Promise<{ price: number; logo: string | null; symbol: string | null }> {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    }).then((x) => x.json());
    const pairs: any[] = r?.pairs || [];
    if (!pairs.length) return { price: 0, logo: null, symbol: null };
    // Prefer a pair where our mint is the base (priceUsd is then ours directly)
    let best = pairs
      .filter((p) => p.baseToken?.address?.toLowerCase() === mint.toLowerCase() && p.priceUsd)
      .sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    if (best) {
      return {
        price: best.priceUsd ?? 0,
        logo: best.info?.imageUrl ?? null,
        symbol: best.baseToken.symbol?.toUpperCase() ?? null,
      };
    }
    // Fallback: mint is the quote — price of our token = 1 / priceUsd (base in USD)
    best = pairs
      .filter((p) => p.quoteToken?.address?.toLowerCase() === mint.toLowerCase() && p.priceUsd)
      .sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    if (best) {
      return {
        price: best.priceUsd ? 1 / best.priceUsd : 0,
        logo: best.info?.imageUrl ?? null,
        symbol: best.quoteToken.symbol?.toUpperCase() ?? null,
      };
    }
    return { price: 0, logo: null, symbol: null };
  } catch {
    return { price: 0, logo: null, symbol: null };
  }
}

async function fetchSolana(addr: string): Promise<{ holdings: Holding[]; txns: Txn[]; stats: Stats }> {
  const [balanceRes, tokenRes, nativePriceRes] = await Promise.all([
    rpcPost(SOL_RPC, "getBalance", [addr]),
    rpcPost(SOL_RPC, "getTokenAccountsByOwner", [
      addr,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" },
    ]),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => null),
  ]);
  const lamports: number = balanceRes?.result?.value ?? 0;
  const accounts: any[] = tokenRes?.result?.value ?? [];
  const nativePrice: number = nativePriceRes?.solana?.usd ?? 0;

  // Native SOL holding
  const holdings: Holding[] = [
    {
      symbol: "SOL",
      name: "Solana",
      image: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png",
      amount: lamports / 1e9,
      priceUsd: nativePrice,
      valueUsd: (lamports / 1e9) * nativePrice,
      chain: "SOL",
      mint: SOL_NATIVE,
    },
  ];
  // Price each SPL mint via DexScreener (keyless, CORS *); cap concurrency to avoid rate limits
  const topMints = accounts
    .map((a: any) => ({ mint: a.account.data.parsed.info.mint, ui: a.account.data.parsed.info.tokenAmount?.uiAmount ?? 0 }))
    .filter((x: any) => x.ui > 0)
    .slice(0, 40);
  const withPrices: Holding[] = [];
  const BATCH = 6;
  for (let i = 0; i < topMints.length; i += BATCH) {
    const slice = topMints.slice(i, i + BATCH);
    const results = await Promise.all(slice.map(async (x: any) => {
      const { price, logo, symbol } = await fetchDexPrice(x.mint);
      return {
        symbol: symbol || x.mint.slice(0, 5).toUpperCase(),
        name: symbol || "SPL token",
        image: logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${x.mint}`,
        amount: x.ui,
        priceUsd: price,
        valueUsd: x.ui * price,
        chain: "SOL" as const,
        mint: x.mint,
      };
    }));
    withPrices.push(...results);
  }
  holdings.push(...withPrices);
  holdings.sort((a, b) => b.valueUsd - a.valueUsd);

  // Transaction history (keyless, public RPC)
  const sigRes = await rpcPost(SOL_RPC, "getSignaturesForAddress", [addr, { limit: 40 }]);
  const sigs: any[] = sigRes?.result ?? [];
  const txns: Txn[] = [];
  const counterparties = new Set<string>();
  let defiSwaps = 0;
  let totalFees = 0;
  let largest = 0;
  // Pull full tx detail for the first 12 to classify swaps / counterparties
  const detailSlice = sigs.slice(0, 12);
  await Promise.all(
    detailSlice.map(async (s: any) => {
      const txRes = await rpcPost(SOL_RPC, "getTransaction", [
        s.signature,
        { encoding: "json", maxSupportedTransactionVersion: 0 },
      ]);
      const tx = txRes?.result;
      let type: Txn["type"] = "other";
      let counterparty: string | null = null;
      const insns = tx?.transaction?.message?.instructions ?? [];
      const keys: string[] = tx?.transaction?.message?.accountKeys ?? [];
      let sawDex = false;
      for (const ins of insns) {
        const pid = ins?.programId;
        if (pid && SOL_DEX.has(pid)) sawDex = true;
      }
      if (sawDex) type = "swap";
      // counterparties = real accounts in the tx that aren't the wallet or known programs
      for (const k of keys) {
        if (k !== addr && !SOL_DEX.has(k) && !k.startsWith("11111111111111111111111111111111")) {
          counterparties.add(k);
          if (!counterparty) counterparty = k;
        }
      }
      if (sawDex) defiSwaps++;
      const fee = (tx?.meta?.fee ?? 0) / 1e9;
      totalFees += fee;
      const val = (tx?.meta?.postBalances?.[0] ?? 0) / 1e9;
      if (val > largest) largest = val;
      txns.push({
        hash: s.signature,
        time: (s.blockTime ?? 0) * 1000,
        status: s.err ? "fail" : "ok",
        feeEth: fee,
        valueEth: 0,
        type,
        counterparty,
        chain: "SOL",
      });
    })
  );
  // Fill remaining signatures without full detail
  for (const s of sigs.slice(12)) {
    txns.push({
      hash: s.signature,
      time: (s.blockTime ?? 0) * 1000,
      status: s.err ? "fail" : "ok",
      feeEth: null,
      valueEth: 0,
      type: "other",
      counterparty: null,
      chain: "SOL",
    });
  }

  const memeValue = holdings.filter((h) => MEMES.has(h.symbol)).reduce((a, h) => a + h.valueUsd, 0);
  const total = holdings.reduce((a, h) => a + h.valueUsd, 0);
  const times = txns.map((t) => t.time).filter(Boolean);
  const stats: Stats = {
    txCount: sigs.length,
    successRate: sigs.length ? (sigs.filter((s) => !s.err).length / sigs.length) * 100 : 0,
    activeFrom: times.length ? Math.min(...times) : null,
    activeTo: times.length ? Math.max(...times) : null,
    uniqueCounterparties: counterparties.size,
    defiSwaps,
    totalGasEth: totalFees,
    largestTxEth: largest,
    memeExposurePct: total ? (memeValue / total) * 100 : 0,
    tokenCount: holdings.length,
    nativeSymbol: "SOL",
    nativeBalance: lamports / 1e9,
    nativePriceUsd: nativePrice,
    totalValueUsd: total,
    enriched: true,
  };
  return { holdings, txns, stats };
}

async function fetchEthereum(addr: string): Promise<{ holdings: Holding[]; txns: Txn[]; stats: Stats }> {
  const key = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  const prices = await fetchNativePrices();
  const balRes = await rpcPost(ETH_RPC, "eth_getBalance", [addr, "latest"]);
  const wei = balRes?.result ? Number(balRes.result) : 0;
  const ethBal = wei / 1e18;
  const holdings: Holding[] = [
    {
      symbol: "ETH",
      name: "Ethereum",
      image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
      amount: ethBal,
      priceUsd: prices.eth,
      valueUsd: ethBal * prices.eth,
      chain: "ETH",
    },
  ];

  let txns: Txn[] = [];
  let enriched = false;
  let tokenCount = 1;

  if (key) {
    enriched = true;
    const [txlistRes, tokRes] = await Promise.all([
      fetch(`https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch(`https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenlist&address=${addr}&apikey=${key}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]);
    const txs: any[] = txlistRes?.status === "1" ? txlistRes.result : [];
    const toks: any[] = tokRes?.status === "1" ? tokRes.result : [];

    // Token metadata + price via CoinGecko contract endpoint (best-effort, rate-limited)
    for (const t of toks.slice(0, 25)) {
      const contract: string = t.contractAddress;
      let meta: any = null;
      try {
        meta = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${contract}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      } catch { meta = null; }
      const bal = Number(t.balance) / Math.pow(10, Number(t.tokenDecimal || 18));
      const price = meta?.market_data?.current_price?.usd ?? 0;
      if (bal <= 0) continue;
      holdings.push({
        symbol: (meta?.symbol || t.tokenSymbol || "TOK").toUpperCase(),
        name: meta?.name || t.tokenName || "Unknown token",
        image: meta?.image?.small || `https://api.dicebear.com/7.x/identicon/svg?seed=${contract}`,
        amount: bal,
        priceUsd: price,
        valueUsd: bal * price,
        chain: "ETH",
        mint: contract,
      });
      tokenCount++;
    }
    holdings.sort((x, y) => y.valueUsd - x.valueUsd);

    const counterparties = new Set<string>();
    let defiSwaps = 0;
    let totalGas = 0;
    let largest = 0;
    for (const tx of txs) {
      const isError = tx.isError === "1";
      const to = (tx.to || "").toLowerCase();
      let type: Txn["type"] = "transfer";
      if (tx.contractAddress && tx.contractAddress !== "0x0000000000000000000000000000000000000000") type = "mint";
      else if (tx.input && tx.input !== "0x") type = ETH_DEX.has(to) ? "swap" : "contract";
      if (type === "swap") defiSwaps++;
      const val = Number(tx.value) / 1e18;
      if (val > largest) largest = val;
      totalGas += (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18;
      const other = tx.from?.toLowerCase() === addr.toLowerCase() ? tx.to : tx.from;
      if (other) counterparties.add(other);
      txns.push({
        hash: tx.hash,
        time: Number(tx.timeStamp) * 1000,
        status: isError ? "fail" : "ok",
        feeEth: (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18,
        valueEth: val,
        type,
        counterparty: other || null,
        chain: "ETH",
      });
    }
    txns.sort((a, b) => b.time - a.time);
    const memeValue = holdings.filter((h) => MEMES.has(h.symbol)).reduce((a, h) => a + h.valueUsd, 0);
    const total = holdings.reduce((a, h) => a + h.valueUsd, 0);
    const times = txns.map((t) => t.time).filter(Boolean);
    return {
      holdings,
      txns,
      stats: {
        txCount: txs.length,
        successRate: txs.length ? (txs.filter((t) => t.status === "ok").length / txs.length) * 100 : 0,
        activeFrom: times.length ? Math.min(...times) : null,
        activeTo: times.length ? Math.max(...times) : null,
        uniqueCounterparties: counterparties.size,
        defiSwaps,
        totalGasEth: totalGas,
        largestTxEth: largest,
        memeExposurePct: total ? (memeValue / total) * 100 : 0,
        tokenCount,
        nativeSymbol: "ETH",
        nativeBalance: ethBal,
        nativePriceUsd: prices.eth,
        totalValueUsd: total,
        enriched: true,
      },
    };
  }

  // No Etherscan key: native balance only, honest empty activity
  const total = holdings.reduce((a, h) => a + h.valueUsd, 0);
  return {
    holdings,
    txns,
    stats: {
      txCount: 0,
      successRate: 0,
      activeFrom: null,
      activeTo: null,
      uniqueCounterparties: 0,
      defiSwaps: 0,
      totalGasEth: 0,
      largestTxEth: 0,
      memeExposurePct: 0,
      tokenCount,
      nativeSymbol: "ETH",
      nativeBalance: ethBal,
      nativePriceUsd: prices.eth,
      totalValueUsd: total,
      enriched: false,
    },
  };
}

const DEMO_SOL = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"; // public, real, fully keyless

// ---- Solana NFTs via Helius DAS (server proxy keeps the key off-client) ----
async function fetchSolNfts(addr: string): Promise<{ nfts: Nft[]; unavailable: boolean }> {
  try {
    const r = await fetch("/api/helius", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAssetsByOwner",
        params: { ownerAddress: addr, page: 1, limit: 100, displayOptions: { showCollectionMetadata: true } },
      }),
      cache: "no-store",
    });
    if (r.status === 503) return { nfts: [], unavailable: true };
    if (!r.ok) return { nfts: [], unavailable: false };
    const j = await r.json();
    const items: unknown[] = j?.result?.items ?? [];
    const nfts: Nft[] = items
      .filter((a) => {
        const x = a as { interface?: string; compression?: { compressed?: boolean }; content?: { metadata?: { name?: string } } };
        return x.interface === "ProgrammableNFT" || x.interface === "MplCoreAsset" || x.compression?.compressed;
      })
      .slice(0, 48)
      .map((a) => {
        const x = a as {
          id?: string;
          content?: { metadata?: { name?: string }; links?: { image?: string } };
          grouping?: { group_key: string; group_value: string }[];
        };
        const col = x.grouping?.find((g) => g.group_key === "collection")?.group_value ?? "";
        return {
          id: String(x.id ?? Math.random()),
          name: x.content?.metadata?.name || "Unnamed NFT",
          image: x.content?.links?.image || "",
          collection: col ? `${col.slice(0, 4)}…${col.slice(-4)}` : "1/1",
        };
      });
    return { nfts, unavailable: false };
  } catch {
    return { nfts: [], unavailable: false };
  }
}

// ---- Session snapshots: honest tracked-PnL (first scan = baseline, no guessing) ----
function loadSnapshots(addr: string): Snapshot[] {
  try {
    const v = JSON.parse(localStorage.getItem(`pnthr-snaps-${addr}`) || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function saveSnapshot(addr: string, total: number) {
  try {
    const snaps = loadSnapshots(addr);
    const last = snaps[snaps.length - 1];
    // one snapshot per hour max — keeps the sparkline meaningful
    if (last && Date.now() - last.at < 3600_000) return snaps;
    const next = [...snaps, { total, at: Date.now() }].slice(-60);
    localStorage.setItem(`pnthr-snaps-${addr}`, JSON.stringify(next));
    return next;
  } catch { return []; }
}

export default function PortfolioPage() {
  const panther = usePanther();
  const [input, setInput] = useState("");
  const [chain, setChain] = useState<"ETH" | "SOL" | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [nftsUnavailable, setNftsUnavailable] = useState(false);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [activeTab, setActiveTab] = useState<"holdings" | "nfts" | "activity" | "stats">("holdings");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(()=>{ try{ const v=JSON.parse(localStorage.getItem("cp_recent_wallets")||"[]"); if(Array.isArray(v)) setRecent(v); }catch{} },[]);

  useEffect(() => {
    const c = detectChain(input.trim());
    setChain(c);
  }, [input]);

  const handleScan = async (addr?: string) => {
    const target = (addr || input).trim();
    const c = detectChain(target);
    if (!c) {
      setError("Enter a valid ETH (0x…) or SOL address.");
      return;
    }
    setError(null);
    setAddress(target);
    setChain(c);
    // persist to recent + panther linked wallets (user accounts)
    try{
      const next=[target,...recent.filter(a=>a!==target)].slice(0,8);
      setRecent(next); localStorage.setItem("cp_recent_wallets", JSON.stringify(next));
      panther.addWallet(target);
    }catch{}
    setLoading(true);
    try {
      const result = c === "SOL" ? await fetchSolana(target) : await fetchEthereum(target);
      setHoldings(result.holdings);
      setTxns(result.txns);
      setStats(result.stats);
      // gamification: scan rewards + achievements (all from real data)
      try {
        const { playSfx } = await import("@/lib/sfx");
        const { celebrate } = await import("@/components/AchievementHost");
        const st = usePanther.getState();
        st.addXp(10);
        playSfx("success");
        celebrate("first-scan", st.unlock("first-scan"));
        if (result.stats.totalValueUsd >= 10_000) celebrate("whale-spotter", st.unlock("whale-spotter"));
        if (result.stats.totalValueUsd >= 10_000) playSfx("fanfare");
      } catch { /* gamification never blocks data */ }
      setSnaps(saveSnapshot(target, result.stats.totalValueUsd));
      if (c === "SOL") {
        const { nfts: found, unavailable } = await fetchSolNfts(target);
        setNfts(found);
        setNftsUnavailable(unavailable);
        if (found.length > 0) {
          try {
            const { celebrate } = await import("@/components/AchievementHost");
            celebrate("nft-hunter", usePanther.getState().unlock("nft-hunter"));
          } catch {}
        }
      } else {
        setNfts([]);
        setNftsUnavailable(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load wallet data. The public RPC may be rate-limited — try again shortly.";
      setError(msg);
      try { (await import("@/lib/sfx")).playSfx("error"); } catch {}
      setHoldings([]);
      setTxns([]);
      setStats(null);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectInjected = async (kind: "metamask" | "phantom" | "coinbase") => {
    try {
      if (kind === "phantom") {
        const sol = (window as any).phantom?.solana || (window as any).solana;
        if (!sol?.isPhantom) { setError("Phantom not detected."); return; }
        const r = await sol.connect();
        setInput(r.publicKey.toString());
        handleScan(r.publicKey.toString());
      } else {
        // EIP-6963 discovery for MetaMask / Coinbase Wallet
        const found: any[] = [];
        const onAnn = (e: any) => found.push(e.detail);
        (window as any).addEventListener("eip6963:announceProvider", onAnn as any);
        (window as any).dispatchEvent(new Event("eip6963:requestProvider"));
        await new Promise((r) => setTimeout(r, 350));
        (window as any).removeEventListener("eip6963:announceProvider", onAnn as any);
        const want = kind === "coinbase" ? "io.coinbase.wallet" : null;
        const p =
          found.find((f) => (want ? f.info?.rdns === want : !/coinbase/i.test(f.info?.name || "")))?.provider ||
          (window as any).ethereum;
        if (!p) { setError(`${kind} provider not detected.`); return; }
        const acc = await p.request({ method: "eth_requestAccounts" });
        setInput(acc[0]);
        handleScan(acc[0]);
      }
    } catch (e: any) {
      setError(e?.message || "Wallet connection rejected.");
    }
  };

  const whaleTier = useMemo(() => {
    if (!stats) return "—";
    const v = stats.totalValueUsd;
    if (v >= 1_000_000) return "Mega whale";
    if (v >= 100_000) return "Whale";
    if (v >= 10_000) return "Dolphin";
    if (v >= 1_000) return "Shrimp";
    return "Plankton";
  }, [stats]);

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <div className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="grid size-9 place-items-center rounded-xl border border-[#0A0A0A] bg-white p-1">
            <img src="/assets/icon-wallet.png" alt="PNTHR DGTL" className="h-7 w-7 object-contain" />
            </a>
            <div>
              <div className="text-[16px] font-bold tracking-widest">PORTFOLIO</div>
              <div className="text-[11px] tracking-widest text-[#6B6B6B]">REAL ON-CHAIN DATA</div>
            </div>
          </div>
          <a href="/app" className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#0A0A0A] hover:text-white transition-colors">
            ← PNTHR DGTL
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-widest text-[#6B6B6B]">
            <span className="size-2 rounded-full bg-[#0A0A0A]" /> WALLET INPUT — ETH + SOL (auto-detect)
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste 0x… (ETH) or So111… (SOL)"
                className="h-[56px] w-full rounded-full border border-[#E8E8E8] bg-white px-5 pr-24 text-[15px] font-medium text-[#0A0A0A] placeholder:text-[#9A9A9A] focus:border-[#0A0A0A] focus:outline-none"
              />
              <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-bold ${chain === "ETH" ? "bg-[#0A0A0A] text-white" : chain === "SOL" ? "bg-[#0A0A0A] text-white" : "bg-[#F8F8F7] text-[#9A9A9A]"}`}>
                {chain || "AUTO"}
              </span>
            </div>
            <button
              onClick={() => handleScan()}
              disabled={loading || !chain}
              className="h-[56px] rounded-full bg-[#0A0A0A] px-7 text-sm font-bold text-white disabled:opacity-30 hover:bg-black"
            >
              {loading ? "Scanning…" : "Scan Wallet →"}
            </button>
            <button
              onClick={() => { setInput(DEMO_SOL); setTimeout(() => handleScan(DEMO_SOL), 100); }}
              className="h-[56px] rounded-full border border-[#0A0A0A] bg-white px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7]"
            >
              Try SOL address
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => connectInjected("metamask")} className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7]">MetaMask</button>
            <button onClick={() => connectInjected("coinbase")} className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7]">Coinbase Wallet</button>
            <button onClick={() => connectInjected("phantom")} className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7]">Phantom</button>
            <span className="ml-auto flex items-center gap-2 text-[11px] text-[#6B6B6B]"><span className="grid size-6 place-items-center rounded-full bg-[#0A0A0A] text-white">{panther.avatar}</span> {panther.handle||"Panther"} · Lvl {panther.level} · 💎 {panther.gems}</span>
          </div>
          {(recent.length>0 || panther.linkedWallets.length>0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-widest text-[#6B6B6B]">HISTORY</span>
              {Array.from(new Set([...panther.linkedWallets, ...recent])).slice(0,8).map(a=>(
                <button key={a} onClick={()=>{setInput(a); handleScan(a);}} className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[11px] font-mono hover:border-[#0A0A0A]">{short(a)}</button>
              ))}
              <button onClick={()=>{ setRecent([]); try{localStorage.removeItem("cp_recent_wallets");}catch{} }} className="text-[11px] text-[#9A9A9A] underline">clear</button>
            </div>
          )}
          {error && <div className="mt-3 rounded-xl border border-[#0A0A0A] bg-[#F8F8F7] px-3 py-2 text-[13px]">{error}</div>}
          {address && stats && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 font-mono font-bold">{short(address)}</span>
              <span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-1.5">{chain} · {stats.tokenCount} tokens</span>
              <span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-1.5">{stats.txCount} txns</span>
              {!stats.enriched && <span className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5">Add NEXT_PUBLIC_ETHERSCAN_API_KEY for ERC-20 + history</span>}
            </div>
          )}
        </div>

        {!address ? (
          <div className="mt-6 grid place-items-center rounded-2xl border border-[#E8E8E8] bg-white py-16 text-[#6B6B6B]">
            Enter a wallet above to read its real balances, holdings, and on-chain activity. No API key needed for Solana; Ethereum native balance is always shown.
          </div>
        ) : loading ? (
          <div className="mt-6 grid place-items-center rounded-2xl border border-[#E8E8E8] bg-white py-16 text-[#6B6B6B]">Loading on-chain data…</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="col-span-2 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white lg:col-span-1">
                <div className="text-xs tracking-widest text-white/70">TOTAL VALUE</div>
                <div className="mt-2 font-mono text-3xl font-bold">{fmtUsd(stats?.totalValueUsd ?? 0)}</div>
                <div className="mt-1 text-xs text-white/60">{stats?.nativeSymbol} @ ${stats?.nativePriceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
                <div className="text-xs tracking-widest text-[#6B6B6B]">TOKENS</div>
                <div className="mt-2 font-mono text-3xl font-bold">{stats?.tokenCount}</div>
                <div className="mt-1 text-xs text-[#9A9A9A]">distinct assets</div>
              </div>
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
                <div className="text-xs tracking-widest text-[#6B6B6B]">ACTIVITY</div>
                <div className="mt-2 font-mono text-3xl font-bold">{stats?.txCount}</div>
                <div className="mt-1 text-xs text-[#9A9A9A]">{stats?.successRate.toFixed(0)}% success</div>
              </div>
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
                <div className="text-xs tracking-widest text-[#6B6B6B]">WHALE TIER</div>
                <div className="mt-2 font-mono text-3xl font-bold">{whaleTier}</div>
                <div className="mt-1 text-xs text-[#9A9A9A]">by holdings value</div>
              </div>
            </div>

            {/* Tracked PnL + allocation + activity — all derived from real scans */}
            {(() => {
              const base = snaps.length > 0 ? snaps[0].total : null;
              const cur = stats?.totalValueUsd ?? 0;
              const pnl = base != null && base > 0 ? cur - base : null;
              const pnlPct = base != null && base > 0 ? (pnl! / base) * 100 : null;
              const top = holdings.slice(0, 6);
              const topSum = top.reduce((a, h) => a + h.valueUsd, 0) || 1;
              const PALETTE = ["#0A0A0A", "#9945FF", "#14F195", "#FF6B00", "#6B6B6B", "#C4B5FD"];
              let acc = 0;
              const segs = top.map((h, i) => {
                const frac = h.valueUsd / topSum;
                const s = { h, i, from: acc, to: acc + frac };
                acc += frac;
                return s;
              });
              const R = 54, C = 2 * Math.PI * R;
              // activity per week (last 12 weeks, real tx timestamps)
              const buckets = new Array(12).fill(0);
              for (const t of txns) {
                if (!t.time) continue;
                const w = Math.floor((Date.now() - t.time) / (7 * 86400_000));
                if (w >= 0 && w < 12) buckets[11 - w] += 1;
              }
              const maxB = Math.max(1, ...buckets);
              const pts = buckets.map((b, i) => `${(i / 11) * 100},${28 - (b / maxB) * 26}`).join(" ");
              return (
                <div className="mt-4 grid grid-cols-12 gap-4">
                  <div className="col-span-12 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white lg:col-span-4">
                    <div className="text-xs font-bold tracking-widest text-white/70">TRACKED PNL</div>
                    {pnl == null ? (
                      <div className="mt-2 text-sm text-white/70">First scan saved as baseline — rescan later to track this wallet&apos;s PnL. No guessed buy prices, ever.</div>
                    ) : (
                      <>
                        <div className={`mt-2 font-mono text-3xl font-bold ${pnl >= 0 ? "text-[#14F195]" : "text-red-400"}`}>
                          {pnl >= 0 ? "+" : ""}{fmtUsd(pnl).replace("$-", "-$")} <span className="text-lg">({pnlPct! >= 0 ? "+" : ""}{pnlPct!.toFixed(1)}%)</span>
                        </div>
                        <div className="mt-1 text-xs text-white/60">since {new Date(snaps[0].at).toLocaleDateString()} · {snaps.length} snapshot{snaps.length === 1 ? "" : "s"}</div>
                      </>
                    )}
                    {snaps.length > 1 && (
                      <svg viewBox="0 0 100 30" className="mt-3 h-14 w-full" preserveAspectRatio="none" aria-hidden>
                        <polyline points={snaps.map((s, i) => {
                          const vals = snaps.map((x) => x.total);
                          const mn = Math.min(...vals), mx = Math.max(...vals);
                          const y = mx === mn ? 15 : 28 - ((s.total - mn) / (mx - mn)) * 26;
                          return `${snaps.length === 1 ? 50 : (i / (snaps.length - 1)) * 100},${y}`;
                        }).join(" ")} fill="none" stroke="#14F195" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div className="col-span-12 rounded-2xl border border-[#E8E8E8] bg-white p-5 sm:col-span-6 lg:col-span-4">
                    <div className="text-xs font-bold tracking-widest">ALLOCATION · TOP 6</div>
                    <div className="mt-3 flex items-center gap-4">
                      <svg viewBox="0 0 130 130" className="size-28 shrink-0" aria-hidden>
                        <circle cx="65" cy="65" r={R} fill="none" stroke="#F1F1F0" strokeWidth="16" />
                        {segs.map((s) => (
                          <circle key={s.h.symbol} cx="65" cy="65" r={R} fill="none" stroke={PALETTE[s.i % PALETTE.length]} strokeWidth="16"
                            strokeDasharray={`${(s.to - s.from) * C} ${C}`} strokeDashoffset={-s.from * C}
                            transform="rotate(-90 65 65)" strokeLinecap="butt" />
                        ))}
                      </svg>
                      <div className="min-w-0 space-y-1.5 text-[12px]">
                        {segs.map((s) => (
                          <div key={s.h.symbol} className="flex items-center gap-1.5">
                            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[s.i % PALETTE.length] }} />
                            <span className="font-bold">{s.h.symbol}</span>
                            <span className="ml-auto font-mono text-[#6B6B6B]">{((s.to - s.from) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 rounded-2xl border border-[#E8E8E8] bg-white p-5 sm:col-span-6 lg:col-span-4">
                    <div className="text-xs font-bold tracking-widest">ACTIVITY · 12 WEEKS</div>
                    <svg viewBox="0 0 100 30" className="mt-3 h-20 w-full" preserveAspectRatio="none" aria-hidden>
                      <polyline points={pts} fill="none" stroke="#9945FF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <div className="mt-2 flex justify-between text-[11px] text-[#9A9A9A]">
                      <span>{txns.length} txns tracked</span>
                      <span>{stats?.defiSwaps ?? 0} swaps</span>
                      <span>{stats?.successRate.toFixed(0)}% success</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="mt-6 flex gap-2 overflow-x-auto">
              {(["holdings", "nfts", "activity", "stats"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize ${activeTab === t ? "bg-[#0A0A0A] text-white" : "border border-[#E8E8E8] bg-white text-[#0A0A0A] hover:border-[#0A0A0A]"}`}
                >
                  {t === "nfts" ? `NFTs${nfts.length ? ` (${nfts.length})` : ""}` : t}
                </button>
              ))}
            </div>

            {activeTab === "holdings" && (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E8E8E8] bg-white">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-[#E8E8E8] bg-[#F8F8F7] text-xs tracking-widest text-[#6B6B6B]">
                    <tr>
                      <th className="p-3 text-left">Asset</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Value</th>
                      <th className="p-3 text-right">Chain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.mint || h.symbol} className="border-b border-[#E8E8E8] last:border-0 hover:bg-[#F8F8F7]">
                        <td className="p-3 flex items-center gap-2">
                          <img src={h.image} alt="" className="size-7 rounded-full bg-white object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                          <span className="font-bold">{h.symbol}</span>
                          <span className="text-[#9A9A9A]">{h.name}</span>
                        </td>
                        <td className="p-3 text-right font-mono">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                        <td className="p-3 text-right font-mono">${h.priceUsd ? h.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}</td>
                        <td className="p-3 text-right font-mono font-bold">{fmtUsd(h.valueUsd)}</td>
                        <td className="p-3 text-right"><span className="rounded-full border border-[#E8E8E8] px-2 py-0.5 text-[11px]">{h.chain}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "nfts" && (
              <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold tracking-widest">NFT COLLECTION {chain === "SOL" ? "· SOLANA" : ""}</div>
                  {nfts.length > 0 && <span className="rounded-full bg-[#0A0A0A] px-3 py-1 text-[11px] font-bold text-white">{nfts.length} pieces</span>}
                </div>
                {chain !== "SOL" ? (
                  <div className="grid place-items-center py-14 text-center text-sm text-[#6B6B6B]">
                    NFT reveal is Solana-only for now — scan a SOL address to see its collection.
                  </div>
                ) : nftsUnavailable ? (
                  <div className="grid place-items-center py-14 text-center text-sm text-[#6B6B6B]">
                    NFT lookup needs a Helius key (set HELIUS_API_KEY in .env.local).<br />Holdings + activity above are fully keyless.
                  </div>
                ) : nfts.length === 0 ? (
                  <div className="grid place-items-center py-14 text-center text-sm text-[#6B6B6B]">
                    No NFTs found in this wallet — cNFTs, ProgrammableNFTs and MplCore assets show up here.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {nfts.map((n) => (
                      <div key={n.id} className="group overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white transition hover:-translate-y-1 hover:shadow-lg">
                        {n.image ? (
                          <img src={n.image} alt={n.name} loading="lazy" className="aspect-square w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="grid aspect-square w-full place-items-center bg-[#F8F8F7] text-3xl">🖼️</div>
                        )}
                        <div className="p-2.5">
                          <div className="truncate text-[13px] font-bold">{n.name}</div>
                          <div className="truncate font-mono text-[11px] text-[#9A9A9A]">{n.collection}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-white">
                {txns.length === 0 ? (
                  <div className="grid place-items-center py-16 text-sm text-[#6B6B6B]">
                    {stats?.enriched ? "No transactions found for this address." : "Transaction history needs an Etherscan API key (set NEXT_PUBLIC_ETHERSCAN_API_KEY). Solana history loads automatically."}
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E8E8]">
                    {txns.slice(0, 40).map((t) => (
                      <div key={t.hash} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.status === "ok" ? "border border-[#0A0A0A] bg-white" : "bg-[#0A0A0A] text-white"}`}>{t.status === "ok" ? "ok" : "fail"}</span>
                        <span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2 py-0.5 text-[11px] font-semibold capitalize">{t.type}</span>
                        <a href={t.chain === "SOL" ? `https://solscan.io/tx/${t.hash}` : `https://etherscan.io/tx/${t.hash}`} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-[#0A0A0A] underline">{short(t.hash)}</a>
                        <span className="text-[#6B6B6B]">{t.counterparty ? `→ ${short(t.counterparty)}` : ""}</span>
                        <span className="ml-auto text-[12px] text-[#9A9A9A]">{fmtDate(t.time)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && stats && (
              <div className="mt-6 grid grid-cols-12 gap-4">
                <div className="col-span-12 rounded-2xl border border-[#E8E8E8] bg-white p-5 lg:col-span-6">
                  <div className="text-xs font-bold tracking-widest">ON-CHAIN FOOTPRINT</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Total transactions</span><span className="font-mono font-bold">{stats.txCount}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Success rate</span><span className="font-bold">{stats.successRate.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">First active</span><span className="font-bold">{fmtDate(stats.activeFrom)}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Last active</span><span className="font-bold">{fmtDate(stats.activeTo)}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Unique counterparties</span><span className="font-mono font-bold">{stats.uniqueCounterparties}</span></div>
                  </div>
                </div>
                <div className="col-span-12 rounded-2xl border border-[#E8E8E8] bg-white p-5 lg:col-span-6">
                  <div className="text-xs font-bold tracking-widest">NETWORK BEHAVIOR</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">DeFi swaps detected</span><span className="font-mono font-bold">{stats.defiSwaps}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Total gas paid</span><span className="font-mono font-bold">{stats.totalGasEth.toFixed(4)} {stats.nativeSymbol}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Largest tx</span><span className="font-mono font-bold">{stats.largestTxEth.toFixed(4)} {stats.nativeSymbol}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Distinct tokens</span><span className="font-mono font-bold">{stats.tokenCount}</span></div>
                  </div>
                </div>
                <div className="col-span-12 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white">
                  <div className="text-xs font-bold tracking-widest text-white/70">EXPOSURE</div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[11px] tracking-widest text-white/60">MEMECOIN EXPOSURE</div>
                      <div className="mt-1 font-mono text-2xl font-bold">{stats.memeExposurePct.toFixed(1)}%</div>
                      <div className="text-[11px] text-white/50">of holdings value in known memes</div>
                    </div>
                    <div>
                      <div className="text-[11px] tracking-widest text-white/60">WHALE TIER</div>
                      <div className="mt-1 font-mono text-2xl font-bold">{whaleTier}</div>
                      <div className="text-[11px] text-white/50">by total holdings value</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3 text-[12px] leading-5 text-white/70">
                    All figures are derived from live on-chain data — balances, token accounts, and transaction history. Cost-basis P&L and "missed gains" are intentionally omitted because they would require guessing buy prices.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
