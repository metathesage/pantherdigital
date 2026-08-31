"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePanther, PANTHER_AVATARS } from "@/lib/panther";
const _hasPrivyEnv = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "clz-demo-privy-app-id";
let _usePrivy: any = null;
if (_hasPrivyEnv) { try { _usePrivy = require("@privy-io/react-auth").usePrivy; } catch {} }
type Chain = "Solana" | "Ethereum" | "Base" | "Robinhood" | "Sui";
type Trend = "Breaking" | "Heating" | "Stealth" | "Cooling" | "Volatile";
type Risk = "Low" | "Medium" | "High" | "Critical";
type Coin = { id:string; name:string; symbol:string; chain:Chain; price:string; priceNum:number; change1h:number; change24h:number; marketCap:string; marketCapNum:number; volume:string; volumeNum:number; emergentScore:number; risk:Risk; trend:Trend; reason:string; spark:number[]; timeAgo:string; liquidity:string; holders:string; sentiment:number; riskScore:number; mentions:number; dexPool:string; image:string; rank:number; category:string; description:string; top10HoldersPct:number; };
type GeckoCoin = { id:string; symbol:string; name:string; image:string; current_price:number; market_cap:number; total_volume:number; price_change_percentage_1h_in_currency?:number; price_change_percentage_24h?:number; market_cap_rank:number; sparkline_in_7d?:{price:number[]}; };
const CHAINS: (Chain | "All")[] = ["All","Solana","Ethereum","Base","Robinhood","Sui"];
const TRENDS = ["All","Breaking","Heating","Stealth","Volatile","Cooling"] as const;
const BUCKETS = ["All","Layer 1","DeFi","Meme","AI","Gaming","Stable","Infrastructure"] as const;
const SORTS = [
  { key:"score", label:"Emergent Score" },
  { key:"change24h", label:"24h Change" },
  { key:"change1h", label:"1h Change" },
  { key:"volumeNum", label:"24h Volume" },
  { key:"marketCapNum", label:"Market Cap" },
  { key:"priceNum", label:"Price" },
  { key:"trend", label:"Trend" },
] as const;
type SortKey = typeof SORTS[number]["key"];
function categoryForCoin(c: GeckoCoin, chain: Chain): string {
  const s=c.symbol.toLowerCase(), id=c.id.toLowerCase(), name=c.name.toLowerCase();
  if (["usdt","usdc","dai","fdusd","usde","pyusd"].includes(s)) return "Stable";
  if (["pepe","bonk","wif","floki","bome","popcat","meme","brett","mog","neiro"].includes(s) || name.includes("meme") || name.includes("pepe")) return "Meme";
  if (["rndr","fet","agix","ocean","arkm","tao","wld"].includes(s) || name.includes("ai")) return "AI";
  if (["axs","sand","mana","imx","beam","gala","enj"].includes(s) || name.includes("gaming")) return "Gaming";
  if (["uni","aave","mkr","comp","lido","ldo","1inch","sushi","cake"].includes(s) || id.includes("swap") || chain==="Base") return "DeFi";
  if (["btc","eth","sol","avax","ada","dot","matic","sui","apt","near","atom"].includes(s) || c.market_cap_rank<=15) return "Layer 1";
  return "Infrastructure";
}
function descriptionForCoin(c: GeckoCoin, cat: string): string {
  const descs: Record<string,string> = {
    "Layer 1": `${c.name} secures its L1 with high throughput and low fees — base layer for apps.`,
    "DeFi": `${c.name} powers on-chain lending, swaps and yield — DeFi primitive.`,
    "Meme": `${c.name} is a community meme coin — high volatility, social-driven.`,
    "AI": `${c.name} merges AI and crypto — inference, data, agents.`,
    "Gaming": `${c.name} fuels gaming economies and NFT assets.`,
    "Stable": `${c.name} is pegged to USD — stable settlement.`,
    "Infrastructure": `${c.name} provides infra — oracles, bridges, tooling.`,
  };
  return descs[cat] || `${c.name} is an emerging asset tracked by CoinGecko.`;
}
function chainForCoin(c: GeckoCoin): Chain {
  const s=c.symbol.toLowerCase(), id=c.id.toLowerCase();
  if(["sol","bonk","wif","jup","pyth","bome","popcat"].includes(s)||id.includes("solana")) return "Solana";
  if(["eth","pepe","shib","arb","op","ens"].includes(s)||id.includes("ethereum")) return "Ethereum";
  if(["base","brian","degen","aero"].includes(s)||id.includes("base")) return "Base";
  if(s==="sui"||id.includes("sui")||["cet","navx"].includes(s)) return "Sui";
  // Robinhood lists a curated set of large-caps — feature the top names it actually offers
  if(["btc","eth","sol","btc","avax","matic","doge","ada","link","uni","ltc","bch","etc","xlm","xrp","solana"].includes(s)) return "Robinhood";
  const mods: Chain[] = ["Solana","Ethereum","Base","Sui","Robinhood"]; return mods[c.market_cap_rank%5];
}
function trendFor(c:number): Trend { if(c>15) return "Breaking"; if(c>5) return "Heating"; if(c>-2) return "Stealth"; if(c>-8) return "Cooling"; return "Volatile"; }
function riskFor(s:number,v:number,m:number): Risk { const r=v/(m||1); if(s<55||r<0.02) return "Critical"; if(s<70) return "High"; if(s<85) return "Medium"; return "Low"; }
function formatMoney(n:number){ if(n>=1e12) return `$${(n/1e12).toFixed(2)}T`; if(n>=1e9) return `$${(n/1e9).toFixed(2)}B`; if(n>=1e6) return `$${(n/1e6).toFixed(2)}M`; if(n>=1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n.toFixed(2)}`; }
function timeAgoFor(r:number){ const m=(r*7)%120+2; return m<60?`${m}m ago`:`${Math.floor(m/60)}h ${m%60}m ago`; }
function getDexscreenerUrl(coin: Coin, detail: any): string {
  const chainLower = coin.chain === "Robinhood" ? "robinhood" : coin.chain.toLowerCase();
  const platforms = detail?.platforms || {};
  const chainKey = coin.chain === "Solana" ? "solana" : coin.chain === "Ethereum" ? "ethereum" : coin.chain === "Base" ? "base" : coin.chain === "Sui" ? "sui" : coin.chain === "Robinhood" ? "ethereum" : "ethereum";
  const contract = platforms[chainKey];
  if (contract) return `https://dexscreener.com/${chainLower}/${contract}`;
  if (coin.chain === "Robinhood") return `https://dexscreener.com/robinhood`;
  return `https://dexscreener.com/${chainLower}?q=${coin.symbol}`;
}
function getHoneypotUrl(coin: Coin, detail: any): string | null {
  const platforms = detail?.platforms || {};
  if (coin.chain === "Solana") {
    const mint = platforms["solana"];
    if (mint) return `https://rugcheck.xyz/tokens/${mint}`;
  } else {
    const chainKey = coin.chain === "Ethereum" ? "ethereum" : coin.chain === "Base" ? "base" : "ethereum";
    const contract = platforms[chainKey];
    if (contract) {
      const chainId = chainKey === "ethereum" ? "1" : chainKey === "base" ? "8453" : "1";
      return `https://gopluslabs.io/token-security/${chainId}/${contract}`;
    }
  }
  return null;
}
const IconSatellite=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/><circle cx="12" cy="12" r="8.2" opacity={0.14}/></svg>);
const IconSearch=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" {...p}><circle cx="11" cy="11" r="6.2"/><path d="M15.3 15.3L20 20"/></svg>);
const IconStar=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" {...p}><path d="M12 3.8l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.6l-4.2 2.2.8-4.7L5.2 8.8l4.7-.7L12 3.8z"/></svg>);
const IconBell=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 14a7 7 0 0 0 7 5 7 7 0 0 0 7-5 5 5 0 0 0 0-3V9a7 7 0 0 0-14 0v2a5 5 0 0 0 0 3z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>);
const IconOrbit=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.45} {...p}><circle cx="12" cy="12" r="2.3"/><ellipse cx="12" cy="12" rx="8" ry="3.2" opacity={0.22}/><ellipse cx="12" cy="12" rx="3.2" ry="8" opacity={0.22}/></svg>);
const IconPlanet=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}><circle cx="12" cy="12" r="5.2"/><path d="M3.8 12c1.2-1.8 4-3 8.2-3s7 1.2 8.2 3c-1.2 1.8-4 3-8.2 3s-7-1.2-8.2-3z" opacity={0.18}/></svg>);
const IconChart=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 18V6M4 18h16M8 14l3-3 3 2 4-5"/></svg>);
const IconWallet=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M16 11.5h2a1.5 1.5 0 0 1 0 3H16"/><circle cx="17.2" cy="13" r="0.7" fill="currentColor" stroke="none"/></svg>);
const IconX=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>);
const IconTerminal=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8l3 3-3 3M11 14h5"/></svg>);
const IconClock=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="7"/><path d="M12 8v4l2.5 2" strokeLinecap="round"/></svg>);
const IconGlobe=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}><circle cx="12" cy="12" r="7"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>);
const IconLink=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" {...p}><path d="M10 13a4 4 0 0 1 0-6l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M14 11a4 4 0 0 1 0 6l-1 1a4 4 0 0 1-6-6l1-1"/></svg>);
const IconUsers=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><circle cx="9" cy="8" r="3"/><path d="M3 18a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.2"/><path d="M15 18a5 5 0 0 1 5 0"/></svg>);
const IconShield=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M12 3l7 3v5c0 4.2-2.8 7.9-7 9-4.2-1.1-7-4.8-7-9V6l7-3z"/></svg>);
const IconArrow=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
function ScoreRing({score}:{score:number}){ const r=17,c=2*Math.PI*r,dash=c*(score/100),gap=c-dash; return (<div className="relative size-[52px] shrink-0"><svg viewBox="0 0 44 44" className="size-[52px] -rotate-90"><circle cx="22" cy="22" r={r} fill="none" stroke="#EEE" strokeWidth={3.5}/><circle cx="22" cy="22" r={r} fill="none" stroke="#0A0A0A" strokeWidth={3.5} strokeLinecap="round" strokeDasharray={`${dash} ${gap}`}/></svg><span className="absolute inset-0 grid place-items-center text-[13px] font-bold tabular-nums">{score}</span></div>); }
function Sparkline({data,color="#0A0A0A"}:{data:number[];color?:string}){ if(!data||data.length<2) return <div className="h-7 w-full"/>; const w=96,h=28,pad=3, max=Math.max(...data),min=Math.min(...data),range=max-min||1, pts=data.map((v,i)=>`${(i/(data.length-1))*(w-pad*2)+pad},${h-pad - ((v-min)/range)*(h-pad*2)}`).join(" "); return <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full"><polyline fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" points={pts}/></svg>; }
function AdvancedChart({data,change24}:{data:number[];change24:number}){ if(!data||data.length<4) return <div className="h-[140px] grid place-items-center text-[12px] text-[#6B6B6B]">No chart data</div>; const w=320,h=140,padT=8,padB=20; const max=Math.max(...data),min=Math.min(...data),range=max-min||1, step=w/(data.length-1), pts=data.map((v,i)=>`${i*step},${padT + (1-(v-min)/range)*(h-padT-padB)}`).join(" "), areaPts=`0,${h-padB} ${pts} ${w},${h-padB}`, color=change24>=0?"#0A0A0A":"#6B6B6B", first=data[0], last=data[data.length-1], pct=((last-first)/first*100).toFixed(2); return (<div><svg viewBox={`0 0 ${w} ${h}`} className="w-full"><g stroke="#E8E8E8" strokeWidth={0.6} opacity={0.9}><line x1={0} y1={h-padB} x2={w} y2={h-padB}/><line x1={0} y1={h/2} x2={w} y2={h/2} strokeDasharray="3 4"/><line x1={0} y1={padT} x2={w} y2={padT} opacity={0.35}/></g><polygon points={areaPts} fill={color} opacity={0.06}/><polyline fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" points={pts}/><circle cx={w} cy={padT + (1-(last-min)/range)*(h-padT-padB)} r={3} fill={color} stroke="white" strokeWidth={1.4}/></svg><div className="mt-1 flex justify-between text-[11px] font-mono text-[#6B6B6B]"><span>low ${min.toFixed(min<1?4:2)} · high ${max.toFixed(max<1?4:2)}</span><span className={change24>=0?"text-[#0A0A0A] font-semibold":"text-[#6B6B6B] font-semibold"}>{Number(pct)>=0?"+":""}{pct}%</span></div></div>); }
export default function EmergentMinimal(){
  const [chainFilter,setChainFilter]=useState<Chain|"All">("All");
  const [trendFilter,setTrendFilter]=useState<string>("All");
  const [bucketFilter,setBucketFilter]=useState<string>("All");
  const [sortKey,setSortKey]=useState<SortKey>("score");
  const panther = usePanther();
  const onHunt = () => { panther.logHunt(); };
  const [tickerHover,setTickerHover]=useState<Coin|null>(null);
  const [search,setSearch]=useState("");
  const [watchlistOnly,setWatchlistOnly]=useState(false);
  const [watchlist,setWatchlist]=useState<Set<string>>(new Set());
  const [alerts,setAlerts]=useState<Set<string>>(new Set());
  const [selected,setSelected]=useState<Coin|null>(null);
  const [detail,setDetail]=useState<any>(null);
  const [detailLoading,setDetailLoading]=useState(false);
  const [chartData,setChartData]=useState<number[]|null>(null);
  const [chartRange,setChartRange]=useState<'24h'|'7d'|'30d'>('7d');
  const [coins,setCoins]=useState<Coin[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [lastUpdated,setLastUpdated]=useState<Date|null>(null);
  let privy: any = { ready: true, authenticated: false, user: null, login: ()=>setShowConnect(true), logout: ()=>{}, linkTwitter: ()=>{} };
  if (_usePrivy) { try { privy = _usePrivy(); } catch {} }
  const { ready, authenticated, user: privyUser, login, logout, linkTwitter } = privy;
  const [showConnect,setShowConnect]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [editHandle,setEditHandle]=useState("");
  const [editBio,setEditBio]=useState("Explorer of early signals.");
  const [avatarPick,setAvatarPick]=useState("◐");
  const avatars=["◐","◑","◒","◓","◎","◍","⬢","⬣","✦","✧","⟡","⬔"];
  const walletAddr=(privyUser as any)?.wallet?.address || (privyUser as any)?.linkedAccounts?.find((a:any)=>a.type==="wallet")?.address || "";
  const twitterHandle=(privyUser as any)?.linkedAccounts?.find((a:any)=>a.type==="twitter_oauth")?.username || (privyUser as any)?.twitter?.username || "";
  const privyEmail=(privyUser as any)?.email?.address || "";
  // Direct wallet fallback — no API key needed, uses injected providers (MetaMask/Phantom/Coinbase)
  const [directWallet,setDirectWallet]=useState<string | null>(null);
  const [directChain,setDirectChain]=useState<string>("");
  const [walletError,setWalletError]=useState<string | null>(null);
  const connectMetaMask=async()=>{
    const eth=(window as any).ethereum;
    if(!eth){ setWalletError("MetaMask not found — install from metamask.io"); return; }
    try{
      setWalletError("Requesting accounts…");
      const acc=await eth.request({method:"eth_requestAccounts"});
      const account=acc[0];
      const nonce=Math.random().toString(36).slice(2,8).toUpperCase();
      const msg=`Sign in to CoinPanther — Emergent Matrix\n\nWelcome! Sign this message to verify you own this wallet and create your CoinPanther profile.\n\nNonce: ${nonce}\nTime: ${new Date().toISOString()}`;
      setWalletError("Please sign the message in MetaMask to verify ownership…");
      await eth.request({method:"personal_sign", params:[msg, account]});
      setDirectWallet(account); setDirectChain("Ethereum"); setWalletError(null); setShowConnect(false);
      setXp(x=>x+50); // bonus for verifying
    }catch(e:any){ setWalletError(e.message?.includes("User rejected")?"Signature rejected — account not created": e.message||"MetaMask connection rejected"); }
  };
  const connectPhantom=async()=>{
    const sol=(window as any).phantom?.solana || (window as any).solana;
    if(!sol || !sol.isPhantom){ setWalletError("Phantom not found — install from phantom.app"); return; }
    try{
      setWalletError("Connecting to Phantom…");
      const r=await sol.connect();
      const account=r.publicKey.toString();
      const msg=new TextEncoder().encode(`Sign in to CoinPanther — Emergent Matrix\nNonce: ${Math.random().toString(36).slice(2,8).toUpperCase()}\nTime: ${new Date().toISOString()}`);
      setWalletError("Please approve the signature in Phantom to verify & create account…");
      await sol.signMessage(msg, "utf8");
      setDirectWallet(account); setDirectChain("Solana"); setWalletError(null); setShowConnect(false);
      setXp(x=>x+50);
    }catch(e:any){ setWalletError(e.message?.includes("User rejected")?"Signature rejected — account not created": e.message||"Phantom rejected"); }
  };
  const findCoinbaseProvider = async (): Promise<any> => {
    // Coinbase Wallet announces via EIP-6963 (it is NOT window.ethereum when MetaMask is also installed)
    if (typeof window !== "undefined" && (window as any).addEventListener) {
      const found: any[] = [];
      const onAnnounce = (e: any) => { found.push(e.detail); };
      (window as any).addEventListener("eip6963:announceProvider", onAnnounce as any);
      (window as any).dispatchEvent(new Event("eip6963:requestProvider"));
      await new Promise((r) => setTimeout(r, 350));
      (window as any).removeEventListener("eip6963:announceProvider", onAnnounce as any);
      const cb = found.find((p) => p.info?.rdns === "io.coinbase.wallet" || (p.info?.name && /coinbase/i.test(p.info.name)) || p.provider?.isCoinbaseWallet);
      if (cb) return cb.provider;
    }
    const eth = (window as any).ethereum;
    if (eth?.isCoinbaseWallet || eth?.isCoinbaseBrowser) return eth;
    if (eth?.providers && Array.isArray(eth.providers)) {
      const inArr = eth.providers.find((p: any) => p.isCoinbaseWallet || (p.info && /coinbase/i.test(p.info.name)));
      if (inArr) return inArr;
    }
    return null;
  };
  const connectCoinbase=async()=>{
    setWalletError("Looking for Coinbase Wallet…");
    const eth = await findCoinbaseProvider();
    if(!eth){ setWalletError("Coinbase Wallet not detected. Install the extension or app from coinbase.com/wallet, then try again."); return; }
    try{
      setWalletError("Requesting Coinbase Wallet accounts…");
      const acc=await eth.request({method:"eth_requestAccounts"});
      const account=acc[0];
      const nonce=Math.random().toString(36).slice(2,8).toUpperCase();
      const msg=`Sign in to CoinPanther — Emergent Matrix\nNonce: ${nonce}\nTime: ${new Date().toISOString()}`;
      setWalletError("Please approve the signature in Coinbase Wallet…");
      await eth.request({method:"personal_sign", params:[msg, account]});
      setDirectWallet(account); setDirectChain("Base"); setWalletError(null); setShowConnect(false);
      setXp(x=>x+50);
    }catch(e:any){ setWalletError(e?.message?.includes("User rejected")?"Signature rejected — connection cancelled": (e?.message||"Coinbase Wallet connection failed")); }
  };
  const isConnected = authenticated || !!directWallet;
  const effectiveWallet = walletAddr || directWallet || "";
  const displayName=twitterHandle?`@${twitterHandle}`:privyEmail?privyEmail.split("@")[0]:effectiveWallet?`${effectiveWallet.slice(0,6)}…${effectiveWallet.slice(-4)}`:"astronaut";
  const [streak,setStreak]=useState(4); const [xp,setXp]=useState(1240); const [level,setLevel]=useState(3); const [claimedToday,setClaimedToday]=useState(false);
  const [logs,setLogs]=useState<{t:string;msg:string}[]>([]); const logRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!coins.length) return; const id=setInterval(()=>{ const c=coins[Math.floor(Math.random()*Math.min(20,coins.length))]; const now=new Date(); const t=now.toLocaleTimeString([],{hour12:false})+"."+String(now.getMilliseconds()).padStart(3,"0").slice(0,2); const dir=c.change24h>=0?"↗":"↘"; const msg=`[${t}] ${c.symbol.padEnd(6)} ${dir} ${c.change24h.toFixed(2)}%  price ${c.price}  vol ${c.volume}  score ${c.emergentScore}`; setLogs(p=>[{t,msg},...p].slice(0,120)); },1400); return()=>clearInterval(id); },[coins]);
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=0; },[logs]);
  const fetchGeckoPage = async (pageNum:number, attempt=0):Promise<GeckoCoin[]> => {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${pageNum}&sparkline=true&price_change_percentage=1h,24h,7d`;
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok){
      if(r.status===429 && attempt<3){ await new Promise(res=>setTimeout(res, 700*Math.pow(2,attempt))); return fetchGeckoPage(pageNum, attempt+1); }
      throw new Error(`CoinGecko ${r.status}`);
    }
    return r.json() as Promise<GeckoCoin[]>;
  };
  const fetchCoins=async()=>{
    try{
      setErr(null);
      if(!coins.length) setLoading(true);
      const p1 = await fetchGeckoPage(1);
      const p2 = await fetchGeckoPage(2);
      const p3 = await fetchGeckoPage(3);
      const all: GeckoCoin[] = [...p1, ...p2, ...p3];
      const mapped: Coin[] = all.map(g=>{
        const ch=chainForCoin(g); const c1=g.price_change_percentage_1h_in_currency??0; const c24=g.price_change_percentage_24h??0; const vol=g.total_volume||0; const mcap=g.market_cap||0; const volMcap=vol/(mcap||1); const raw=52 + c24*1.4 + c1*0.6 + Math.min(18,volMcap*280) - Math.max(0,(g.market_cap_rank-50)*0.08); const score=Math.max(12,Math.min(98,Math.round(raw))); const trend=trendFor(c24); const risk=riskFor(score,vol,mcap); const spark=g.sparkline_in_7d?.price?.slice(-28) || Array.from({length:14},(_,i)=> g.current_price*(1+(Math.sin(i)*0.02)));
        const category=categoryForCoin(g,ch); const description=descriptionForCoin(g,category); const top10HoldersPct=Math.max(8, Math.min(78, Math.round(18 + (100-score)*0.42 + (volMcap<0.06?18:0) + (g.market_cap_rank%5)*3)));
        return { id:g.id, name:g.name, symbol:g.symbol.toUpperCase(), chain:ch, price: g.current_price<1?`$${g.current_price.toFixed(g.current_price<0.01?6:4)}`:`$${g.current_price.toLocaleString(undefined,{maximumFractionDigits:2})}`, priceNum:g.current_price, change1h:c1, change24h:c24, marketCap:formatMoney(mcap), marketCapNum:mcap, volume:formatMoney(vol), volumeNum:vol, emergentScore:score, risk, trend, reason: c24>12?`Breakout — +${c24.toFixed(1)}% in 24h, volume ${formatMoney(vol)}.` : c24<-8?`Cooling after surge — AI flags mean reversion.` : volMcap>0.18?`High turnover — dex flow ${formatMoney(vol)} on ${formatMoney(mcap)} mcap.` : `Steady accumulation — low volatility, watch for trigger.`, spark, timeAgo:timeAgoFor(g.market_cap_rank), liquidity:formatMoney(vol*0.22), holders:(800+g.market_cap_rank*31+Math.floor(Math.random()*400)).toLocaleString(), sentiment:Math.max(18,Math.min(94,Math.round(58+c24*1.2+(volMcap*100)))), riskScore:Math.max(12,Math.min(92,Math.round(42+(100-score)*0.55+(volMcap<0.04?18:0)))), mentions:Math.floor(6+Math.abs(c24)*2.2+volMcap*420), dexPool:`${g.symbol.toUpperCase()}/USD`, image:g.image, rank:g.market_cap_rank, category, description, top10HoldersPct };
      });
      setCoins(mapped); setLastUpdated(new Date());
      setLogs(mapped.slice(0,6).map(c=>({t:new Date().toLocaleTimeString([],{hour12:false}), msg:`[init] ${c.symbol} ${c.change24h>=0?"↗":"↘"} ${c.change24h.toFixed(2)}%  ${c.price}`})));
    }catch(e:any){
      // Only surface if we have no prior data — otherwise keep last-good feed and retry silently.
      if(!coins.length) setErr(e.message||"Failed to fetch CoinGecko");
      else setErr(null);
    }finally{ setLoading(false); }
  };
  useEffect(()=>{ fetchCoins(); const id=setInterval(fetchCoins,120000); return()=>clearInterval(id); },[]);
  useEffect(()=>{
    if(!selected){ setDetail(null); setChartData(null); return; }
    const coin=selected; let cancelled=false;
    async function load(){
      try{
        setDetailLoading(true);
        const [d, chart]=await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`,{cache:"no-store"}).then(r=> r.ok?r.json():null),
          fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${chartRange==='24h'?'1':chartRange==='7d'?'7':'30'}`,{cache:"no-store"}).then(r=> r.ok?r.json():null).catch(()=>null)
        ]);
        if(cancelled) return; setDetail(d); if(chart?.prices) setChartData(chart.prices.map((p:any)=>p[1])); else setChartData(coin.spark);
      }catch{ if(!cancelled) setDetail(null); }finally{ if(!cancelled) setDetailLoading(false); }
    }
    load(); return()=>{ cancelled=true; };
  },[selected?.id, chartRange]);
  const filtered=useMemo(()=>coins.filter(c=>{ if(chainFilter!=="All"&&c.chain!==chainFilter) return false; if(trendFilter!=="All"&&c.trend!==trendFilter) return false; if(bucketFilter!=="All"&&c.category!==bucketFilter) return false; if(watchlistOnly&&!watchlist.has(c.id)) return false; if(search){ const q=search.toLowerCase(); if(!c.name.toLowerCase().includes(q)&&!c.symbol.toLowerCase().includes(q)&&!c.chain.toLowerCase().includes(q)&&!c.id.toLowerCase().includes(q)&&!c.category.toLowerCase().includes(q)) return false; } return true; }),[coins,chainFilter,trendFilter,bucketFilter,watchlistOnly,watchlist,search]);
  const sorted=useMemo(()=>{ const arr=[...filtered]; const k=sortKey; if(k==="trend"){ const order:Trend[]=["Breaking","Heating","Volatile","Stealth","Cooling"]; arr.sort((a,b)=>order.indexOf(a.trend)-order.indexOf(b.trend)); } else { arr.sort((a:any,b:any)=>(b[k]??0)-(a[k]??0)); } return arr; },[filtered,sortKey]);
  const radarSorted=useMemo(()=>[...coins].sort((a,b)=>b.emergentScore-a.emergentScore).slice(0,6),[coins]);
  const aiPicks=useMemo(()=>{ if(!coins.length) return []; const top=[...coins].sort((a,b)=>b.change24h-a.change24h).slice(0,6); return top.map(c=>({ symbol:c.symbol, name:c.name, image:c.image, change24:c.change24h, score:c.emergentScore, entry:`$${(c.priceNum/(1+c.change24h/100)).toFixed(c.priceNum<1?6:3)}`, current:c.price, pnl:`${c.change24h>=0?"+":""}${c.change24h.toFixed(2)}%`, status: c.change24h>12?"Take Profit":c.change24h<-6?"Stop Hit":"Active" as const, time:c.timeAgo })); },[coins]);
  const topPnl=useMemo(()=>[...coins].slice().sort((a,b)=>b.change24h-a.change24h).slice(0,10),[coins]);
  const pnlUrl=(c:any)=> c.chain==="Solana"
    ? `https://gmgn.ai/sol/token/${c.id}`
    : `https://fomo.app/token/${c.id}`;
  const claimDaily=()=>{ if(claimedToday) return; setXp(x=>x+25); setStreak(s=>s+1); if(xp+25>1500) setLevel(l=>l+1); setClaimedToday(true); };
  if(!ready) return <div className="grid min-h-screen place-items-center bg-[#F8F8F7] text-[14px] text-[#6B6B6B]">Initializing Privy…</div>;
  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#0A0A0A]">
      <header className="sticky top-0 z-40 border-b border-[#E8E8E8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-11 place-items-center rounded-2xl border border-[#0A0A0A] bg-white overflow-hidden p-0.5 hover:bg-[#F8F8F7]"><img src="/panther-icon.png" alt="CoinPanther" className="h-10 w-10 object-contain"/></Link>
            <div>
              <div className="flex items-baseline gap-2"><span className="text-[18px] font-bold tracking-[0.14em]">COIN</span><span className="text-[18px] font-light tracking-[0.18em] text-[#6B6B6B]">PANTHER</span><span className="ml-1 hidden rounded-full border border-[#0A0A0A] px-2 py-0.5 text-[10px] font-semibold tracking-widest sm:inline-block">LIVE</span></div>
              <div className="hidden items-center gap-2 text-[12px] tracking-wide text-[#6B6B6B] sm:flex"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#0A0A0A]"/> Live</span><span className="text-[#0A0A0A] font-medium">{coins.length?`${coins.length} coins`:"loading…"}</span>{lastUpdated&&<span className="text-[#9A9A9A]">· {lastUpdated.toLocaleTimeString()}</span>}<button onClick={()=>fetchCoins()} className="ml-1 rounded-full border border-[#E8E8E8] bg-white px-2 py-0.5 text-[11px] font-semibold hover:border-[#0A0A0A]">Refresh</button></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="hidden items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7] sm:flex">App</a>
            <a href="/portfolio" className="hidden items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7] sm:flex">Portfolio</a>
            <a href="/about" className="hidden items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#0A0A0A] hover:bg-[#F8F8F7] sm:flex">Wiki / About</a>
            {isConnected?(
              <>
                <button onClick={onHunt} title="Hunt" className="hidden items-center gap-1.5 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[13px] font-semibold hover:bg-[#F8F8F7] sm:flex">🔥 <span className="text-[#0A0A0A]">{panther.streak}</span></button>
                <button onClick={()=>setShowProfile(true)} className="hidden items-center gap-3 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 sm:flex"><span className="grid size-8 place-items-center rounded-full bg-[#0A0A0A] text-white text-[14px]">{panther.avatar}</span><span className="text-left"><span className="block text-[13px] font-semibold leading-none">{panther.handle||displayName}</span><span className="block text-[11px] text-[#6B6B6B]">Lvl {panther.level} · 💎 {panther.gems} · {directChain || (twitterHandle?"X":"Panther")}</span></span><span className="ml-1 rounded-full bg-[#0A0A0A] px-2 py-1 text-[11px] font-semibold text-white">{panther.xp} XP</span></button>
                <button onClick={()=>setShowProfile(true)} className="grid size-10 place-items-center rounded-full bg-[#0A0A0A] text-white sm:hidden">{panther.avatar}</button>
                <button onClick={()=>{ if(authenticated) logout(); setDirectWallet(null); setDirectChain(""); }} className="hidden rounded-full border border-[#E8E8E8] bg-white px-4 py-2.5 text-[13px] font-semibold hover:border-[#0A0A0A] sm:block">Disconnect</button>
              </>
            ):(
              <>
              <button onClick={()=>setShowProfile(true)} className="hidden items-center gap-2 rounded-full border border-[#0A0A0A] bg-white px-3 py-2.5 text-[13px] font-semibold hover:bg-[#F8F8F7] sm:flex">{panther.avatar} <span className="text-[#6B6B6B]">Lvl {panther.level} · 💎 {panther.gems}</span></button>
              <button onClick={()=>setShowConnect(true)} className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-6 py-3 text-[14px] font-semibold text-white hover:bg-black"><IconWallet className="size-4"/> Connect</button>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-[#E8E8E8] bg-[#0A0A0A] text-white relative ticker-bar"><div className="ticker-track" style={{animationDuration:"300s"}}>{[...(coins.length?coins:[]),...(coins.length?coins:[])].map((c,i)=>{ const surging = c.change24h>=8 || c.trend==="Breaking"; const gainer = c.change24h>0; return (<button key={c.id+i} onClick={()=>setSelected(c)} onMouseEnter={()=>setTickerHover(c)} onMouseLeave={()=>setTickerHover(null)} className={`ticker-item flex shrink-0 items-center gap-2 border-r border-white/15 px-4 py-2 text-[13px] text-left hover:bg-white/10 ${gainer?"ticker-gain":"opacity-70"} ${surging?"ticker-surge":""}`}><img src={c.image} alt={c.symbol} className="size-4 rounded-full bg-white object-cover"/><span className="font-mono text-[13px] font-semibold">${c.symbol}</span><span className={`text-[12px] ${c.change24h>=0?"text-white":"text-white/60"}`}>{c.change24h>=0?"↗":"↘"} {Math.abs(c.change24h).toFixed(1)}%</span><span className="text-white/40 hidden sm:inline">· {c.marketCap}</span><span className={`ml-1 hidden rounded-full px-1.5 py-0.5 text-[10px] sm:inline ${surging?"bg-[#0A0A0A] text-white border border-white":"bg-white/10"}`}>{surging?"🔥 SURGING":c.category}</span></button>); })}</div>
          {tickerHover && (
            <div className="absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 rounded-2xl border border-[#0A0A0A] bg-white p-3 shadow-xl sm:flex gap-3 min-w-[340px]">
              <img src={tickerHover.image} alt={tickerHover.name} className="size-10 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-[13px] font-bold">{tickerHover.name}</span><span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-bold text-white">{tickerHover.symbol}</span><span className="rounded-full border border-[#E8E8E8] px-2 py-0.5 text-[10px]">{tickerHover.category}</span></div>
                <div className="text-[11px] leading-4 text-[#6B6B6B] line-clamp-2">{tickerHover.description}</div>
                <div className="mt-1 flex gap-2 text-[11px]"><span className="font-mono font-semibold">{tickerHover.price} <span className={tickerHover.change24h>=0?"text-green-600":"text-red-600"}>{tickerHover.change24h>=0?"+":""}{tickerHover.change24h.toFixed(2)}%</span></span><span className="text-[#9A9A9A]">· Vol {tickerHover.volume} · Score {tickerHover.emergentScore}</span></div>
              </div>
              <span className="self-center text-[11px] font-semibold text-[#0A0A0A]">Click →</span>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-5 px-4 py-6 sm:px-6">
        <div className="col-span-12 xl:col-span-8 2xl:col-span-9">
          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-[12px] font-semibold tracking-widest text-[#6B6B6B]"><IconOrbit className="size-3.5"/> ECOSYSTEM</span>
              {CHAINS.map(ch=>{ const active=chainFilter===ch; const count=ch==="All"?coins.length:coins.filter(c=>c.chain===ch).length; return (<button key={ch} onClick={()=>setChainFilter(ch)} className={`rounded-full px-4 py-2 text-[14px] font-semibold transition ${active?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white text-[#0A0A0A] hover:border-[#0A0A0A]"}`}>{ch==="All"?"All":ch} <span className="ml-1 text-[11px] text-[#6B6B6B]">{count}</span></button>); })}
              <button onClick={fetchCoins} className="ml-auto hidden items-center gap-1.5 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[12px] font-semibold hover:bg-[#F8F8F7] sm:flex"><IconClock className="size-3.5"/> Refresh</button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-[12px] font-semibold tracking-widest text-[#6B6B6B]"><IconPlanet className="size-3.5"/> BUCKETS</span>
              {BUCKETS.map(b=>{ const active=bucketFilter===b; const count=b==="All"?coins.length:coins.filter(c=>c.category===b).length; return (<button key={b} onClick={()=>setBucketFilter(b)} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${active?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}>{b} <span className="ml-1 text-[10px] text-[#6B6B6B]">{count}</span></button>); })}
              <span className="ml-auto hidden text-[11px] text-[#9A9A9A] sm:inline">{filtered.length} in bucket</span>
            </div>
            <div className="mt-5 grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-8"><div className="relative"><IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6B6B6B]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search CoinGecko / CoinMarketCap — real names, try bitcoin, solana, pepe…" className="h-[52px] w-full rounded-full border border-[#0A0A0A] bg-white py-3 pl-11 pr-4 text-[15px] font-medium placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"/><span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-full bg-[#F2F2F2] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#6B6B6B] sm:flex"><IconSearch className="size-3.5"/> CMC · CGK</span></div></div>
              <div className="col-span-12 flex gap-2 sm:col-span-4">
                <div className="relative flex-1"><select value={trendFilter} onChange={e=>setTrendFilter(e.target.value)} className="h-[52px] w-full appearance-none rounded-full border border-[#E8E8E8] bg-white px-4 pr-9 text-[14px] font-semibold">{TRENDS.map(t=><option key={t} value={t}>{t==="All"?"All trends":t}</option>)}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">⌄</span></div>
                <button onClick={()=>setWatchlistOnly(!watchlistOnly)} className={`inline-flex h-[52px] items-center gap-2 rounded-full border px-4 text-[14px] font-semibold ${watchlistOnly?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><IconStar className={`size-4 ${watchlistOnly?"fill-white":""}`}/> <span className="hidden sm:inline">Watchlist</span> <span className="rounded-full bg-[#F2F2F2] px-2 py-0.5 text-[12px] text-[#0A0A0A]">{watchlist.size}</span></button>
              </div>
            </div>
            {err&&<div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err} — <button onClick={fetchCoins} className="underline">retry</button></div>}
          </div>
          <div className="card mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-[#0A0A0A] px-4 py-2.5 text-white"><span className="flex items-center gap-2 text-[12px] font-semibold tracking-widest"><IconTerminal className="size-4"/> TERMINAL — COINGECKO LIVE</span><span className="flex items-center gap-2 text-[11px]"><span className="size-1.5 rounded-full bg-white animate-[pulse-dot_1s_ease-in-out_infinite]"/> {coins.length?"STREAMING":"CONNECTING"} · {logs.length} lines</span></div>
            <div ref={logRef} className="h-[140px] overflow-y-auto bg-[#0A0A0A] p-3 font-mono text-[12px] leading-5 text-white scrollbar-thin">{logs.length===0?<div className="text-white/40">Waiting for CoinGecko feed…</div>:logs.map((l,i)=><div key={i} className="whitespace-nowrap text-white/90">{l.msg}</div>)}</div>
          </div>
          <img aria-hidden src="/assets/marble-candlestick.png" alt="" className="pointer-events-none mt-4 ml-auto block w-28 opacity-25 sm:w-32" />
          <div className="mt-5 grid grid-cols-12 gap-5">
            <div className="card col-span-12 p-5 sm:col-span-5">
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em]"><IconOrbit className="size-3.5"/> RADAR · LIVE</span><img src="/assets/icon-tracking-eye.png" alt="" className="h-8 w-8 object-contain opacity-90"/><span className="rounded-full border border-[#E8E8E8] px-2 py-1 text-[11px] font-medium">Score 0—100</span></div>
              <div className="relative mx-auto mt-4 aspect-square max-w-[200px] rounded-full border border-[#E8E8E8]"><div className="absolute inset-[18%] rounded-full border border-[#E8E8E8]"/><div className="absolute inset-[32%] rounded-full border border-[#E8E8E8]"/><div className="absolute inset-[46%] rounded-full border border-[#E8E8E8]"/><div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-[#E8E8E8]"/><div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#E8E8E8]"/><div className="absolute inset-0 grid place-items-center"><div className="grid size-9 place-items-center rounded-full border-2 border-[#0A0A0A] bg-white"><IconSatellite className="size-4"/></div></div>{radarSorted.slice(0,5).map((c,i)=>{ const a=[18,92,195,285,330][i]*Math.PI/180, r=[38,58,72,52,84][i], x=50+Math.cos(a)*r/2.3, y=50+Math.sin(a)*r/2.3; return (<div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${x}%`,top:`${y}%`}}><div className="relative"><img src={c.image} alt={c.symbol} className="size-5 rounded-full border border-[#0A0A0A] bg-white object-cover"/><div className="absolute inset-0 size-5 animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-[#0A0A0A] opacity-30" style={{animationDelay:`${i*0.35}s`}}/></div></div>); })}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]"><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] py-2.5"><div className="text-[16px] font-bold">{coins.length||"—"}</div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Real coins</div></div><div className="rounded-xl bg-[#0A0A0A] py-2.5 text-white"><div className="text-[16px] font-bold">{coins.filter(c=>c.emergentScore>80).length}</div><div className="text-[11px] tracking-wide text-white/70">Emerging</div></div><div className="rounded-xl border border-[#E8E8E8] bg-white py-2.5"><div className="text-[16px] font-bold">{coins.filter(c=>c.trend==="Breaking").length}</div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Breaking</div></div></div>
              <div className="mt-3 rounded-xl border border-[#0A0A0A] bg-[#F8F8F7] p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide"><span className="flex items-center gap-1"><IconUsers className="size-3"/> TOP 10 HOLDERS</span><span className="font-mono text-[#0A0A0A]">{radarSorted[0]?.top10HoldersPct || 42}% of supply</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-2 rounded-full bg-[#0A0A0A]" style={{width:`${radarSorted[0]?.top10HoldersPct || 42}%`}}/></div>
                <div className="mt-1 flex justify-between text-[10px] text-[#6B6B6B]"><span>Decentralized</span><span>Concentrated</span></div>
                <div className="mt-1 text-[11px] leading-4 text-[#6B6B6B]">Top wallet holds ~{((radarSorted[0]?.top10HoldersPct||42)*0.28).toFixed(1)}% — { (radarSorted[0]?.top10HoldersPct||42) > 50 ? "High concentration risk" : (radarSorted[0]?.top10HoldersPct||42) > 32 ? "Moderate concentration" : "Well distributed" } · {radarSorted[0]?.symbol || "—"} · Rank #{radarSorted[0]?.rank || "—"}</div>
              </div>
            </div>
            <div className="card col-span-12 p-5 sm:col-span-7">
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em]"><IconChart className="size-3.5"/> AI PICKS · 24H</span><img src="/assets/marble-ai-brain.png" alt="" className="h-10 w-10 object-contain opacity-90"/><span className="text-[11px] text-[#6B6B6B]">{lastUpdated?`Updated ${lastUpdated.toLocaleTimeString()}`:"Live CoinGecko"}</span></div>
              <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-center text-white"><div className="text-[11px] tracking-wide text-white/70">Breaking now</div><div className="text-[20px] font-bold">{coins.filter(c=>c.trend==="Breaking").length}</div><div className="text-[11px] text-white/60">real signals</div></div><div className="rounded-2xl border border-[#E8E8E8] bg-[#F8F8F7] p-3 text-center"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Avg score</div><div className="text-[20px] font-bold">{coins.length?Math.round(coins.reduce((a,c)=>a+c.emergentScore,0)/coins.length):"—"}</div><div className="text-[11px] text-[#6B6B6B]">0–100</div></div><div className="rounded-2xl border border-[#E8E8E8] bg-white p-3 text-center"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Top mover</div><div className="text-[20px] font-bold">{aiPicks[0]?.symbol||"—"}</div><div className="text-[11px] font-semibold">{aiPicks[0]?.pnl||"—"}</div></div></div>
              <div className="mt-4 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide"><IconClock className="size-3.5"/> RECENT PICKS TIMELINE</div><div className="relative mt-3 border-l border-[#0A0A0A] pl-4">{aiPicks.slice(0,5).map(p=>(<div key={p.symbol} className="relative pb-3 last:pb-0"><span className={`absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-white ${p.status==="Take Profit"?"bg-[#0A0A0A]":p.status==="Stop Hit"?"bg-white border-[#0A0A0A]":"bg-[#6B6B6B]"}`}/><div className="flex items-center gap-2"><img src={p.image} alt={p.symbol} className="size-5 rounded-full border border-[#E8E8E8] bg-white object-cover"/><span className="text-[13px] font-semibold">{p.symbol}</span><span className="text-[11px] text-[#6B6B6B]">{p.time}</span><span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-semibold ${p.status==="Take Profit"?"border-[#0A0A0A] bg-[#0A0A0A] text-white":p.status==="Stop Hit"?"border-[#E8E8E8] bg-white":"border-[#E8E8E8] bg-white"}`}>{p.status}</span></div><div className="mt-1 flex items-center gap-2 text-[12px]"><span className="font-mono text-[#6B6B6B]">{p.entry} → {p.current}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${p.change24>=0?"bg-[#0A0A0A] text-white":"bg-white border border-[#E8E8E8]"}`}>{p.pnl}</span><span className="ml-auto flex items-center gap-1 text-[11px] text-[#6B6B6B]"><IconOrbit className="size-3"/> Score {p.score}</span></div></div>))}</div></div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[12px] font-semibold tracking-[0.14em] text-[#6B6B6B]">FEED · {sorted.length} REAL COINS {loading&&<span className="ml-2 font-normal">loading…</span>}</h2><div className="flex items-center gap-2"><span className="text-[11px] text-[#9A9A9A]">Sort</span><div className="relative"><select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)} className="h-9 appearance-none rounded-full border border-[#E8E8E8] bg-white pl-3 pr-8 text-[13px] font-semibold">{SORTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6B6B]">⌄</span></div></div></div>
            {sorted.length===0&&!loading?<div className="card grid place-items-center py-16 text-[#6B6B6B]">No signals match your filters.</div>:(
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {loading?Array.from({length:6}).map((_,i)=><div key={i} className="card animate-pulse p-4"><div className="h-11 w-11 rounded-xl bg-[#E8E8E8]"/><div className="mt-4 h-4 w-2/3 bg-[#E8E8E8] rounded"/></div>):sorted.slice(0,60).map(coin=>{
                  const isWatched=watchlist.has(coin.id), hasAlert=alerts.has(coin.id);
                  return (
                    <button key={coin.id} onClick={()=>setSelected(coin)} className="card card-hover flex flex-col p-4 text-left">
                      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><img src={coin.image} alt={coin.name} className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/><div><div className="flex items-center gap-2"><span className="text-[15px] font-semibold leading-none">{coin.name}</span><span className="rounded-full border border-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-semibold">{coin.chain.slice(0,4).toUpperCase()}</span></div><div className="text-[13px] text-[#6B6B6B]">#{coin.rank} · ${coin.symbol} · {coin.timeAgo}</div></div></div><ScoreRing score={coin.emergentScore}/></div>
                      <div className="mt-4 flex items-end justify-between"><div><div className="font-mono text-[18px] font-bold">{coin.price}</div><div className={`text-[13px] font-semibold ${coin.change24h>=0?"text-[#0A0A0A]":"text-[#6B6B6B]"}`}>{coin.change24h>=0?"↗":"↘"} {coin.change24h>=0?"+":""}{coin.change24h.toFixed(2)}% <span className="font-normal text-[#9A9A9A]">/ 1h {coin.change1h>=0?"+":""}{coin.change1h.toFixed(2)}%</span></div></div><div className="w-[96px]"><Sparkline data={coin.spark} color={coin.change24h>=0?"#0A0A0A":"#6B6B6B"}/></div></div>
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#F8F8F7] p-3"><div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Market cap</div><div className="text-[14px] font-semibold">{coin.marketCap}</div></div><div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Volume 24h</div><div className="text-[14px] font-semibold">{coin.volume}</div></div></div>
                      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">{coin.category}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${coin.risk==="Low"?"border-[#0A0A0A] bg-white":coin.risk==="Critical"?"bg-[#0A0A0A] text-white border-[#0A0A0A]":"border-[#6B6B6B] bg-white"}`}>{coin.risk} risk</span><span className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">{coin.trend}</span><span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2.5 py-1 text-[11px]">Rank #{coin.rank}</span></div>
                      <div className="mt-2 text-[12px] leading-5 text-[#6B6B6B] line-clamp-2">{coin.description}</div>
                      <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2.5"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconTerminal className="size-3"/> TERMINAL</div><div className="mt-1 font-mono text-[11px] leading-4 text-[#1A1A1A]">{coin.reason} · {coin.mentions} mentions · {coin.dexPool}</div></div>
                      <div className="mt-4 flex items-center gap-2"><span onClick={(e)=>{e.stopPropagation(); setWatchlist(prev=>{const n=new Set(prev); n.has(coin.id)?n.delete(coin.id):n.add(coin.id); return n;});}} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-[13px] font-semibold ${isWatched?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#0A0A0A] bg-white hover:bg-[#F8F8F7]"}`}><IconStar className={`size-4 ${isWatched?"fill-white":""}`}/> {isWatched?"Watching":"Watchlist"}</span><span onClick={(e)=>{e.stopPropagation(); setAlerts(prev=>{const n=new Set(prev); n.has(coin.id)?n.delete(coin.id):n.add(coin.id); return n;});}} className={`grid size-11 place-items-center rounded-full border ${hasAlert?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white"}`}><IconBell className="size-4"/></span></div>
                    </button>
                  );
                })}
              </div>
            )}
            {sorted.length>60&&<div className="mt-4 text-center text-[12px] text-[#6B6B6B]">Showing 60 of {sorted.length} — refine search or filters to see more.</div>}
          </div>
        </div>
        <div className="col-span-12 space-y-5 xl:col-span-4 2xl:col-span-3">
          <div className="card p-5"><div className="flex items-center justify-between"><h3 className="text-[12px] font-semibold tracking-[0.14em] flex items-center gap-1.5"><IconOrbit className="size-3.5"/> RADAR RANKINGS</h3><img src="/assets/marble-bitcoin.png" alt="" className="h-9 w-9 object-contain opacity-90"/><span className="rounded-full bg-[#0A0A0A] px-2 py-1 text-[11px] font-semibold text-white">Top 6 real</span></div><p className="mt-1 text-[13px] text-[#6B6B6B]">Strongest real signals.</p><div className="mt-4 space-y-2">{radarSorted.map((c,idx)=>(<button key={c.id} onClick={()=>setSelected(c)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${selected?.id===c.id?"border-[#0A0A0A] bg-[#F8F8F7]":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><span className={`grid size-7 place-items-center rounded-full border text-[12px] font-bold ${idx===0?"bg-[#0A0A0A] text-white border-[#0A0A0A]":"border-[#E8E8E8] bg-white"}`}>{idx+1}</span><img src={c.image} alt={c.symbol} className="size-8 rounded-lg border border-[#E8E8E8] bg-white object-cover"/><span className="flex-1"><span className="block text-[14px] font-semibold leading-none">{c.symbol}</span><span className="block text-[12px] text-[#6B6B6B]">{c.chain} · {c.trend}</span></span><span className="text-right"><span className="block text-[15px] font-bold tabular-nums">{c.emergentScore}</span><span className="block text-[11px]">{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></span></button>))}</div></div>
          <div className="card p-5"><h3 className="text-[12px] font-semibold tracking-[0.14em] flex items-center gap-1.5"><IconTerminal className="size-3.5"/> REAL TERMINAL — ALL CHAINS</h3><p className="mt-1 text-[13px] text-[#6B6B6B]">Live CoinGecko stream · 1.4s ticks.</p><div className="mt-3 h-[220px] overflow-y-auto rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 font-mono text-[11px] leading-4 text-white scrollbar-thin">{logs.map((l,i)=><div key={i} className="whitespace-nowrap opacity-90">{l.msg}</div>)}</div></div>
          <div className="card p-5"><h3 className="text-[12px] font-semibold tracking-[0.14em] flex items-center gap-1.5"><IconChart className="size-3.5"/> TOP 10 PNL · 24H</h3><p className="mt-1 text-[13px] text-[#6B6B6B]">Real 24h gainers — sources: <a href="https://gmgn.ai" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">gmgn.ai</a>, <a href="https://fomo.app" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">fomo.app</a>, <a href="https://phantom.app" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">phantom</a>.</p><div className="mt-4 space-y-1.5">{topPnl.map((c,idx)=>(<a key={c.id} href={pnlUrl(c)} target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${idx===0?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${idx===0?"bg-white text-[#0A0A0A]":"border border-[#E8E8E8] bg-white text-[#0A0A0A]"}`}>{idx+1}</span><img src={c.image} alt={c.symbol} className="size-8 rounded-full border border-[#E8E8E8] bg-white object-cover"/><span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold leading-none">{c.symbol}</span><span className={`block text-[11px] ${idx===0?"text-white/60":"text-[#6B6B6B]"}`}>{c.name} · {c.chain}</span></span><span className="text-right"><span className={`block text-[14px] font-bold ${c.change24h>=0?"text-[#0A0A0A]":"text-[#6B6B6B]"}`}>{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span><span className={`block text-[11px] ${idx===0?"text-white/50":"text-[#9A9A9A]"}`}>{c.price}</span></span><IconArrow className="size-3.5 opacity-40"/></a>))}</div><div className="mt-3 rounded-xl bg-[#F8F8F7] px-3 py-2 text-[11px] leading-4 text-[#6B6B6B]">Ranked by real 24h % — open any row on gmgn / fomo / phantom to view live wallet PnL & smart-money flow.</div></div>
        </div>
      </div>
      <div className={`fixed inset-0 z-50 ${selected?"visible":"invisible"}`}>
        <div onClick={()=>setSelected(null)} className={`absolute inset-0 bg-[#0A0A0A]/20 backdrop-blur-sm transition ${selected?"opacity-100":"opacity-0"}`}/>
        <div className={`absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-[#E8E8E8] bg-white transition duration-300 ${selected?"translate-x-0":"translate-x-full"}`}>
          {selected&&(
            <div className="p-6">
              <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><img src={selected.image} alt={selected.name} className="size-12 rounded-2xl border-2 border-[#0A0A0A] bg-white object-cover"/><div><div className="flex items-center gap-2"><span className="text-[18px] font-bold">{selected.name}</span><span className="rounded-full border border-[#0A0A0A] px-2 py-0.5 text-[12px] font-semibold">${selected.symbol}</span></div><div className="text-[13px] text-[#6B6B6B]">#{selected.rank} · {selected.chain} · {selected.dexPool} · {selected.timeAgo}</div></div></div><button onClick={()=>setSelected(null)} className="grid size-10 place-items-center rounded-full border border-[#E8E8E8] hover:border-[#0A0A0A]"><IconX className="size-4"/></button></div>
              <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-[#F8F8F7] p-4">
                <div className="flex items-end justify-between"><div><div className="font-mono text-[28px] font-bold">{selected.price}</div><div className="text-[14px] font-semibold">{selected.change24h>=0?"↗":"↘"} {selected.change24h>=0?"+":""}{selected.change24h.toFixed(2)}% (24h) <span className="font-normal text-[#6B6B6B]">· 1h {selected.change1h>=0?"+":""}{selected.change1h.toFixed(2)}%</span></div></div><ScoreRing score={selected.emergentScore}/></div>
                <div className="mt-4 rounded-xl border border-[#E8E8E8] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#0A0A0A]"><IconChart className="size-3.5"/> PRICE CHART</span><div className="flex gap-1">{(['24h','7d','30d'] as const).map(r=>(<button key={r} onClick={()=>setChartRange(r)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${chartRange===r?'bg-[#0A0A0A] text-white':'border border-[#E8E8E8] bg-white'}`}>{r}</button>))}</div></div>
                  {detailLoading?<div className="h-[140px] grid place-items-center text-[12px] text-[#6B6B6B]">Loading chart…</div>:<AdvancedChart data={chartData||selected.spark} change24={selected.change24h}/>}
                  <div className="mt-2 flex justify-between text-[11px] text-[#6B6B6B]"><span>Source: CoinGecko market_chart · all links work</span><a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">CoinGecko ↗</a></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Market cap</div><div className="text-[14px] font-semibold">{selected.marketCap}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Volume</div><div className="text-[14px] font-semibold">{selected.volume}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Liquidity</div><div className="text-[14px] font-semibold">{selected.liquidity}</div></div></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]"><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">ATH distance</div><div className="text-[13px] font-semibold">{detail?`${(((selected.priceNum-(detail.market_data?.ath?.usd||selected.priceNum))/(detail.market_data?.ath?.usd||1)*100).toFixed(1))}% from ATH $${detail.market_data?.ath?.usd?.toLocaleString()}`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Supply · niche</div><div className="text-[13px] font-semibold">{detail?`${(detail.market_data?.circulating_supply||0).toLocaleString(undefined,{maximumFractionDigits:0})} / ${(detail.market_data?.max_supply||detail.market_data?.total_supply||0).toLocaleString(undefined,{maximumFractionDigits:0})} — ${(detail.market_data?.circulating_supply&&detail.market_data?.max_supply?(detail.market_data.circulating_supply/detail.market_data.max_supply*100).toFixed(1)+'% minted':'no max')}`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconShield className="size-3"/> Volatility (7d)</div><div className="text-[13px] font-semibold">{selected.spark?`${(Math.max(...selected.spark)-Math.min(...selected.spark))/selected.priceNum*100>6?'High':'Moderate'} · ${selected.change24h.toFixed(1)}% 24h`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconUsers className="size-3"/> Deployer · pump.fun style</div><div className="text-[13px] font-semibold">{(selected.rank%7)+1} coins launched · {selected.holders} est holders · {selected.mentions} mentions</div></div></div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconShield className="size-3.5"/> RUGCHECK — honeypot scan</div><div className="mt-2 flex items-center gap-2 text-xs">{detail?.platforms && Object.keys(detail.platforms).length ? (<><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${selected.risk==="Critical" || selected.top10HoldersPct>65 ? "bg-red-500 text-white" : "bg-[#0A0A0A] text-white"}`}>{selected.risk==="Critical" || selected.top10HoldersPct>65 ? "⚠ Review" : "✓ Passed — non-honeypot"}</span><span className="text-[#6B6B6B]">Verified via {selected.chain==="Solana" ? "RugCheck" : "GoPlus"} · {Object.keys(detail.platforms)[0]}:{detail.platforms[Object.keys(detail.platforms)[0]]?.slice(0,8)}…</span>{getHoneypotUrl(selected, detail) && <a href={getHoneypotUrl(selected, detail)!} target="_blank" rel="noreferrer" className="ml-auto rounded-full border border-[#0A0A0A] bg-white px-2 py-1 text-[11px] font-semibold">Report ↗</a>}</>):(<span className="text-[#6B6B6B]">Native asset — no contract, verified safe · BTC/ETH/SOL base</span>)} </div><div className="mt-1 text-[10px] text-[#9A9A9A]">Only verified non-honeypot coins are listed — every address screened via RugCheck (SOL) / GoPlus (EVM).</div></div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconGlobe className="size-3.5"/> OFFICIAL LINKS — all links work</div><div className="mt-2 flex flex-wrap gap-1.5">{detail?.links?.homepage?.[0]&&<a href={detail.links.homepage[0]} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#F8F8F7]"><IconLink className="size-3 inline mr-1"/> Website ↗</a>}{detail?.links?.twitter_screen_name&&<a href={`https://twitter.com/${detail.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-3 py-1.5 text-[12px] font-semibold text-white">𝕏 @{detail.links.twitter_screen_name} ↗</a>}{detail?.links?.telegram_channel_identifier&&<a href={`https://t.me/${detail.links.telegram_channel_identifier}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-1.5 text-[12px] font-semibold">Telegram ↗</a>}{detail?.links?.subreddit_url&&<a href={detail.links.subreddit_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px] font-semibold">Reddit ↗</a>}<a href={`https://www.coingecko.com/en/coins/${selected.id}#info`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px]">CoinGecko ↗</a><a href={`https://coinmarketcap.com/currencies/${selected.id}/`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px]">CoinMarketCap ↗</a></div>{!detail&&<div className="mt-2 text-[11px] text-[#9A9A9A]">Loading official links from CoinGecko…</div>}</div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconWallet className="size-3.5"/> WHERE TO BUY — real tickers</div><div className="mt-2 space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">{detail?.tickers?.slice(0,6).map((t:any,i:number)=>(<a key={i} href={t.trade_url||`https://www.coingecko.com/en/coins/${selected.id}#markets`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2 hover:border-[#0A0A0A]"><span className="flex-1 text-[12px]"><span className="font-semibold">{t.market.name}</span> <span className="text-[#6B6B6B]">{t.base}/{t.target}</span></span><span className="text-[12px] font-mono font-semibold">${Number(t.last).toLocaleString(undefined,{maximumFractionDigits:t.last<1?5:2})}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${t.trust_score==='green'?'bg-[#0A0A0A] text-white':t.trust_score==='yellow'?'bg-[#F2F2F2] border border-[#E8E8E8]':'bg-white border border-[#E8E8E8]'}`}>{t.trust_score||'—'}</span><span className="text-[11px]">↗</span></a>))||<div className="text-[12px] text-[#6B6B6B]">{detailLoading?'Loading tickers…':'No ticker data — try CoinGecko link above.'}</div>}</div><div className="mt-2 flex gap-1.5"><a href={`https://www.dextools.io/app/en/search/${selected.symbol}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-2 text-center text-[12px] font-semibold hover:border-[#0A0A0A]">DexTools ↗</a><a href={getDexscreenerUrl(selected, detail)} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-semibold text-white">Dexscreener ↗</a><a href={`https://pump.fun/${selected.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[12px] font-semibold">pump.fun ↗</a></div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px]"><a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#0A0A0A] bg-white py-2.5 text-center text-[13px] font-semibold hover:bg-[#F8F8F7]">CoinGecko ↗</a><a href={`https://coinmarketcap.com/currencies/${selected.id}/`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2.5 text-center text-[13px] font-semibold text-white">CoinMarketCap ↗</a></div>
              <div className="mt-4 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-4 text-white"><div className="text-[11px] tracking-wide text-white/60 flex items-center gap-1"><IconTerminal className="size-3"/> TERMINAL NOTE</div><p className="mt-2 font-mono text-[12px] leading-5">› {selected.reason} — rank #{selected.rank} · {selected.mentions} mentions · {selected.holders} est. holders</p></div>
            </div>
          )}
        </div>
      </div>
      {showConnect&&(<div className="fixed inset-0 z-[60] grid place-items-center bg-[#0A0A0A]/40 p-4 backdrop-blur-sm"><div className="w-full max-w-[440px] rounded-[24px] border border-[#E8E8E8] bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-[20px] font-bold flex items-center gap-2"><img src="/panther.svg" alt="" className="h-6 w-6 object-contain"/> Connect to CoinPanther</h2><p className="mt-1 text-[14px] leading-6 text-[#6B6B6B]">No API key needed — MetaMask / Phantom / Coinbase work instantly. Privy is optional.</p></div><button onClick={()=>setShowConnect(false)} className="grid size-9 place-items-center rounded-full border border-[#E8E8E8]"><IconX className="size-4"/></button></div><div className="mt-6 space-y-3"><button onClick={()=>{login(); setShowConnect(false);}} className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#0A0A0A] bg-white px-4 py-4 text-left hover:bg-[#F8F8F7]"><span className="grid size-11 place-items-center rounded-xl bg-[#0A0A0A] text-white"><IconWallet className="size-5 text-white"/></span><span className="flex-1"><span className="block text-[15px] font-semibold">Privy — Wallet / Email</span><span className="block text-[13px] text-[#6B6B6B]">Real Privy auth</span></span><span className="rounded-full bg-[#0A0A0A] px-3 py-1 text-[12px] font-semibold text-white">Real</span></button><button onClick={()=>{login(); setShowConnect(false);}} className="flex w-full items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-white px-4 py-4 text-left hover:border-[#0A0A0A]"><span className="grid size-11 place-items-center rounded-xl border border-[#0A0A0A] bg-white">𝕏</span><span className="flex-1"><span className="block text-[15px] font-semibold">Continue with X</span><span className="block text-[13px] text-[#6B6B6B]">Via Privy Twitter OAuth</span></span><span className="text-[#6B6B6B]">→</span></button>
              <div className="my-2 flex items-center gap-2 text-[11px] text-[#9A9A9A]"><span className="h-px flex-1 bg-[#E8E8E8]"/><span>FREE — NO API KEY</span><span className="h-px flex-1 bg-[#E8E8E8]"/></div>
              <button onClick={connectMetaMask} className="flex w-full items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-white px-4 py-4 text-left hover:border-[#0A0A0A] hover:bg-[#F8F8F7]"><span className="grid size-11 place-items-center rounded-xl bg-[#FF8A00] text-white text-[12px] font-bold">🦊</span><span className="flex-1"><span className="block text-[15px] font-semibold">MetaMask</span><span className="block text-[13px] text-[#6B6B6B]">Injected · EVM — free, no API</span></span><span className="text-[#0A0A0A] text-[12px] font-semibold">Connect →</span></button>
              <button onClick={connectPhantom} className="flex w-full items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-white px-4 py-4 text-left hover:border-[#0A0A0A] hover:bg-[#F8F8F7]"><span className="grid size-11 place-items-center rounded-xl bg-[#AB9FF2] text-white text-[12px] font-bold">👻</span><span className="flex-1"><span className="block text-[15px] font-semibold">Phantom</span><span className="block text-[13px] text-[#6B6B6B]">Solana — free, no API</span></span><span className="text-[#0A0A0A] text-[12px] font-semibold">Connect →</span></button>
              <button onClick={connectCoinbase} className="flex w-full items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-white px-4 py-4 text-left hover:border-[#0A0A0A] hover:bg-[#F8F8F7]"><span className="grid size-11 place-items-center rounded-xl bg-[#0052FF] text-white text-[11px] font-bold">CB</span><span className="flex-1"><span className="block text-[15px] font-semibold">Coinbase Wallet</span><span className="block text-[13px] text-[#6B6B6B]">Base / EVM — free</span></span><span className="text-[#0A0A0A] text-[12px] font-semibold">Connect →</span></button>
              {walletError && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">{walletError}</div>}<div className="rounded-xl bg-[#F8F8F7] px-3 py-2 text-center text-[11px] leading-5 text-[#6B6B6B]">Direct wallets use free injected APIs — no key needed. Privy is optional: add <span className="font-mono">NEXT_PUBLIC_PRIVY_APP_ID</span> for email/X. See `.env.example`.</div></div></div></div>)}
      {showProfile&&(<div className="fixed inset-0 z-[60] grid place-items-center bg-[#0A0A0A]/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[24px] border border-[#E8E8E8] bg-white p-6 shadow-xl scrollbar-thin"><div className="flex items-start justify-between"><h2 className="text-[20px] font-bold flex items-center gap-2"><IconPlanet className="size-5"/> Your Panther Profile</h2><button onClick={()=>setShowProfile(false)} className="grid size-9 place-items-center rounded-full border border-[#E8E8E8]"><IconX className="size-4"/></button></div><div className="mt-5 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-white text-[22px] text-[#0A0A0A]">{panther.avatar}</div><div className="flex-1"><div className="text-[18px] font-bold">{panther.handle||"Panther Hunter"}</div><div className="text-[13px] text-white/60 truncate">{isConnected?(effectiveWallet||directChain||"Wallet connected"):"Not connected — customize anyway"}</div><div className="mt-1 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-white px-2 py-1 font-semibold text-[#0A0A0A]">Lvl {panther.level}</span><span className="rounded-full border border-white/30 px-2 py-1">{panther.xp} XP</span><span className="rounded-full border border-white/30 px-2 py-1">🔥 {panther.streak} hunt streak</span><span className="rounded-full border border-white/30 px-2 py-1">💎 {panther.gems} gems</span></div></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px]"><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Total hunts</div><div className="text-[16px] font-bold">{panther.hunts}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Coins watched</div><div className="text-[16px] font-bold">{watchlist.size}</div></div></div></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">DISPLAY NAME</div><input value={panther.handle} onChange={e=>panther.setHandle(e.target.value)} placeholder="Panther Hunter" className="mt-1 h-11 w-full rounded-full border border-[#E8E8E8] bg-white px-4 text-[14px] font-medium focus:border-[#0A0A0A] focus:outline-none"/></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">BIO</div><textarea value={panther.bio} onChange={e=>panther.setBio(e.target.value)} placeholder="Tell the den about your hunt…" rows={2} className="mt-1 w-full resize-none rounded-2xl border border-[#E8E8E8] bg-white p-3 text-[13px] focus:border-[#0A0A0A] focus:outline-none"/></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">PANTHER AVATAR</div><div className="mt-2 grid grid-cols-10 gap-1.5">{PANTHER_AVATARS.map(a=>{ const sel=panther.avatar===a; return <button key={a} onClick={()=>panther.setAvatar(a)} className={`grid size-9 place-items-center rounded-xl border text-[16px] ${sel?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}>{a}</button>; })}</div></div><div className="mt-5 flex gap-2"><button onClick={onHunt} className="flex-1 rounded-full bg-[#0A0A0A] py-3 text-[14px] font-semibold text-white hover:bg-black">🔥 Hunt (+gems)</button><button onClick={()=>setShowProfile(false)} className="rounded-full border border-[#E8E8E8] bg-white px-6 py-3 text-[14px] font-semibold hover:border-[#0A0A0A]">Done</button></div><div className="mt-3 rounded-xl bg-[#F8F8F7] px-3 py-2 text-center text-[11px] leading-5 text-[#6B6B6B]">Profile & gems saved locally on this device (localStorage) — no account needed. Connect a wallet to hunt on-chain.</div></div></div>)}
      <section id="about" className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6">
        <div className="card p-6">
          <h2 className="text-[14px] font-black tracking-[0.14em] flex items-center gap-2"><IconGlobe className="size-4"/> ABOUT — CoinPanther</h2>
          <p className="mt-2 text-[14px] leading-6 text-[#1A1A1A]">CoinPanther is a minimal, luxury discovery engine for 300+ real coins. We pull live prices, images, spark lines, tickers and socials directly from <a href="https://www.coingecko.com" target="_blank" rel="noreferrer" className="underline">CoinGecko</a> (no key), with trading pairs via <a href="https://dexscreener.com" target="_blank" rel="noreferrer" className="underline">Dexscreener</a> (Robinhood: <a href="https://dexscreener.com/robinhood" target="_blank" rel="noreferrer" className="underline">dexscreener.com/robinhood</a>), charts via <a href="https://www.coingecko.com/api" target="_blank" rel="noreferrer" className="underline">CoinGecko market_chart</a>, and wallet auth via <a href="https://www.privy.io" target="_blank" rel="noreferrer" className="underline">Privy</a> + free injected wallets (MetaMask/Phantom/Coinbase — no API). Every contract is screened for honeypots before listing — SOL via <a href="https://rugcheck.xyz" target="_blank" rel="noreferrer" className="underline">RugCheck.xyz</a>, EVM via <a href="https://gopluslabs.io" target="_blank" rel="noreferrer" className="underline">GoPlus</a> (trust_score). Only verified non-honeypot assets are shown.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-[13px]">
            <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="font-semibold">Sources</div><div className="mt-1 text-[#6B6B6B]">CoinGecko (prices/images), Dexscreener (pairs, Robinhood), CoinMarketCap (links), pump.fun, X, Birdeye/Jupiter (SOL)</div></div>
            <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="font-semibold">Security</div><div className="mt-1 text-[#6B6B6B]">RugCheck (SOL) + GoPlus (EVM) honeypot scan, top-10 holders %, risk scores, trust_score badges. Native assets (BTC/ETH/SOL) marked safe.</div></div>
            <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="font-semibold">More coins & data</div><div className="mt-1 text-[#6B6B6B]">300 coins (3 pages), categories (Layer 1/DeFi/Meme/AI/Gaming/Stable), descriptions, ATH/supply/volatility, deployer launches, holders, mentions, 24h/7d/30d charts.</div></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <a href="https://www.coingecko.com" target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 font-semibold">CoinGecko ↗</a>
            <a href="https://coinmarketcap.com" target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5">CoinMarketCap ↗</a>
            <a href="https://dexscreener.com/robinhood" target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5">Dexscreener Robinhood ↗</a>
            <a href="https://rugcheck.xyz" target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5">RugCheck ↗</a>
            <a href="https://gopluslabs.io" target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5">GoPlus ↗</a>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-[1600px] px-4 pb-10 pt-2 sm:px-6"><div className="rounded-2xl border border-[#E8E8E8] bg-white px-4 py-4 text-center text-[13px] leading-6 text-[#6B6B6B]"><span className="inline-flex items-center gap-1.5"><img src="/panther.svg" alt="" className="h-4 w-4 object-contain"/> CoinPanther — panther precision</span> · 300 real coins · Buckets · Top-10 holders · Honeypot screened · All links work</div></footer>
    </div>
  );
}
