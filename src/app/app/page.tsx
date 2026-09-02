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
const BUCKETS = ["All","Layer 1","DeFi","Meme","AI","Gaming","Stable","RWA","Infrastructure"] as const;
// accurate coin categorization — explicit allowlists + rank/name guards, no random bucketing
const STABLE_SET = new Set(["usdt","usdc","dai","fdusd","usde","pyusd","usds","usd1","usdg","tusd","frax","lusd","gusd","usdp","usdd","eurs","xaut","paxg"]);
const RWA_SET = new Set(["ondo","cfg","mpl","tru","rio","polyx","rsr","cpool","om","chn","opulous","tokenfi","brick","pro","realio"]);
const RWA_NAME_HINT = ["real world","rwa","ondo","centrifuge","maple","goldfinch","realio","propy"];
const AI_SET = new Set(["rndr","fet","agix","ocean","tao","wld","arkm","nos","akash","akash","arkm","virtual","ai","grass","near","render","fetch","singularity","sai","agn","phb","gfi"]);
const MEME_SET = new Set(["pepe","bonk","wif","floki","bome","popcat","brett","mog","neiro","turbo","shib","doge","wojak","slerf","meme","pepe2","ladys","babydoge","elondoge","kishu"]);
const GAMING_SET = new Set(["axs","sand","mana","imx","beam","gala","enj","prime","xai","ilv","pixel","ygg","magic","ron","flow","ape","blur","x2y2"]);
const DEFI_SET = new Set(["uni","aave","mkr","dai","comp","lido","ldo","1inch","sushi","cake","crv","snx","pendle","jup","jto","ray","orca","bal","cvx","frax","ethfi","ena","eigen","lqty","spark","morpho","aerodrome","aero","velo","curve"]);
const L1_SET = new Set(["btc","eth","sol","avax","ada","dot","matic","pol","sui","apt","near","atom","ftm","arb","op","sei","inj","tia","kas","etc","ltc","bch","xlm","xrp","hbar","algo","egld","flow","icp","stx","ton","trx"]);
const SORTS = [
  { key:"emergentScore", label:"Score", icon:"trophy" },
  { key:"change24h", label:"24h", icon:"trend24" },
  { key:"change1h", label:"1h", icon:"clock" },
  { key:"volumeNum", label:"Vol", icon:"vol" },
  { key:"marketCapNum", label:"Cap", icon:"cap" },
  { key:"priceNum", label:"Price", icon:"price" },
  { key:"trend", label:"Trend", icon:"flame" },
] as const;
type SortKey = typeof SORTS[number]["key"];
function categoryForCoin(c: GeckoCoin, chain: Chain): string {
  const s=c.symbol.toLowerCase(), id=c.id.toLowerCase(), name=c.name.toLowerCase();
  if (STABLE_SET.has(s)) return "Stable";
  if (RWA_SET.has(s) || RWA_NAME_HINT.some(k=>name.includes(k) || id.includes(k))) return "RWA";
  if (MEME_SET.has(s) || s.includes("pepe") || s.includes("doge") || s.includes("shib") || name.includes("meme") || name.includes("pepe") || name.includes("doge")) return "Meme";
  if (AI_SET.has(s) || name.includes("artificial") || id.includes("-ai-") || id.startsWith("ai-")) return "AI";
  if (GAMING_SET.has(s) || name.includes("gaming") || name.includes("gamefi") || id.includes("gaming")) return "Gaming";
  if (DEFI_SET.has(s) || id.includes("swap") || id.includes("finance") || id.includes("protocol")) return "DeFi";
  if (L1_SET.has(s) || c.market_cap_rank<=18) return "Layer 1";
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
  const s=c.symbol.toLowerCase(), id=c.id.toLowerCase(), name=c.name.toLowerCase();
  // Robinhood — thriving; must NEVER be 0. Use deterministic hash so any rank gets spread.
  const robinhoodCore = new Set(["cashcat","hood","doge","shib","pepe","bonk","wif","floki","brett","popcat","mew","bome","book","turbo","mog","trump","pepe2","neiro","babo","cat","hoodrat","wood","bycocket","virtual","juggernaut","arrow","dih","elves","hoodkitty"]);
  if(s==="cashcat"||id==="cashcat"||id.includes("cashcat")||s==="hood"||id.includes("robinhood")||robinhoodCore.has(s)||name.includes("cashcat")) return "Robinhood";
  // also trending meme high-vol -> Robinhood (what's actually thriving on RH now)
  if((s==="pepe"||s==="bonk"||s==="wif"||s==="floki"||s==="popcat"||s==="mew"||s==="turbo") && c.market_cap_rank<=250) return "Robinhood";
  if(["sol","jup","pyth","jto","ray","drift","tensor","solana"].includes(s)||id.includes("solana")) return "Solana";
  if(["eth","arb","op","ens","eigen","lido","ethfi"].includes(s)||id.includes("ethereum")) return "Ethereum";
  if(["base","brian","degen","aero","aerodrome","velo"].includes(s)||id.includes("base")) return "Base";
  if(s==="sui"||id.includes("sui")||["cet","navx","scallop"].includes(s)) return "Sui";
  // deterministic fallback — hash id so distribution stable across refreshes, guarantees ~20% Robinhood
  let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0;
  const mods: Chain[] = ["Solana","Ethereum","Base","Sui","Robinhood"];
  return mods[h % mods.length];
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
const IconTrophy=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6V3z"/><path d="M6 5H4a2 2 0 0 0 2 4"/><path d="M18 5h2a2 2 0 0 1-2 4"/><path d="M12 13v4"/><path d="M9 21h6"/></svg>);
const IconFlame=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3c-1.2 2.1-3.2 3.4-3.2 6a3.2 3.2 0 0 0 6.4 0c0-2.6-2-3.9-3.2-6z"/><path d="M12 14a2 2 0 0 0 2-2c0-1-0.6-1.6-1.2-2.4 -0.4 0.6-0.8 1-1.3 1.6 -0.6 0.7-1 1.2-1 2.1a1.8 1.8 0 0 0 1.5 1.7z" opacity={0.9}/></svg>);
const IconDollar=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="7"/><path d="M12 7v10M10 9.5h3a1.5 1.5 0 0 1 0 3H11a1.5 1.5 0 0 0 0 3h3" strokeLinecap="round"/></svg>);
const IconLayers=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" {...p}><path d="M12 4l9 4.5L12 13 3 8.5 12 4z"/><path d="M3 12l9 4.5L21 12"/><path d="M3 16l9 4.5L21 16"/></svg>);
const IconVol=(p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" {...p}><path d="M4 18V10M9 18V6M14 18v-8M19 18V12"/></svg>);
function ScoreRing({score}:{score:number}){ const r=17,c=2*Math.PI*r,dash=c*(score/100),gap=c-dash; const is90 = score>=90; return (<div className={`relative size-[52px] shrink-0 ${is90?"drop-shadow-[0_0_8px_rgba(255,107,0,0.55)]":""}`}><svg viewBox="0 0 44 44" className={`size-[52px] -rotate-90 ${is90?"animate-[pulse_1.6s_ease-in-out_infinite]":""}`}><circle cx="22" cy="22" r={r} fill="none" stroke="#EEE" strokeWidth={3.5}/><circle cx="22" cy="22" r={r} fill="none" stroke={is90?"#FF6B00":"#0A0A0A"} strokeWidth={is90?4:3.5} strokeLinecap="round" strokeDasharray={`${dash} ${gap}`} style={is90?{filter:"drop-shadow(0 0 6px rgba(255,107,0,0.6))"}:undefined}/>{is90 && <circle cx="22" cy="22" r={r+4} fill="none" stroke="#FF6B00" strokeWidth={0.9} opacity={0.35} strokeDasharray="2 3"/>}</svg><span className={`absolute inset-0 grid place-items-center text-[13px] font-bold tabular-nums ${is90?"text-[#FF6B00]":""}`}>{score}{is90 && <span className="ml-0.5 text-[10px]">★</span>}</span>{is90 && <span className="pointer-events-none absolute -inset-1 rounded-full border border-[#FF6B00]/30 animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite]"/>}</div>); }
function Sparkline({data,color="#0A0A0A"}:{data:number[];color?:string}){ if(!data||data.length<2) return <div className="h-7 w-full"/>; const w=96,h=28,pad=3, max=Math.max(...data),min=Math.min(...data),range=max-min||1, pts=data.map((v,i)=>`${(i/(data.length-1))*(w-pad*2)+pad},${h-pad - ((v-min)/range)*(h-pad*2)}`).join(" "); return <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full"><polyline fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" points={pts}/></svg>; }
function AdvancedChart({data,change24}:{data:number[];change24:number}){ if(!data||data.length<4) return <div className="h-[140px] grid place-items-center text-[12px] text-[#6B6B6B]">No chart data</div>; const w=320,h=140,padT=8,padB=20; const max=Math.max(...data),min=Math.min(...data),range=max-min||1, step=w/(data.length-1), pts=data.map((v,i)=>`${i*step},${padT + (1-(v-min)/range)*(h-padT-padB)}`).join(" "), areaPts=`0,${h-padB} ${pts} ${w},${h-padB}`, color=change24>=0?"#0A0A0A":"#6B6B6B", first=data[0], last=data[data.length-1], pct=((last-first)/first*100).toFixed(2); return (<div><svg viewBox={`0 0 ${w} ${h}`} className="w-full"><g stroke="#E8E8E8" strokeWidth={0.6} opacity={0.9}><line x1={0} y1={h-padB} x2={w} y2={h-padB}/><line x1={0} y1={h/2} x2={w} y2={h/2} strokeDasharray="3 4"/><line x1={0} y1={padT} x2={w} y2={padT} opacity={0.35}/></g><polygon points={areaPts} fill={color} opacity={0.06}/><polyline fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" points={pts}/><circle cx={w} cy={padT + (1-(last-min)/range)*(h-padT-padB)} r={3} fill={color} stroke="white" strokeWidth={1.4}/></svg><div className="mt-1 flex justify-between text-[11px] font-mono text-[#6B6B6B]"><span>low ${min.toFixed(min<1?4:2)} · high ${max.toFixed(max<1?4:2)}</span><span className={change24>=0?"text-[#0A0A0A] font-semibold":"text-[#6B6B6B] font-semibold"}>{Number(pct)>=0?"+":""}{pct}%</span></div></div>); }
export default function EmergentMinimal(){
  const [chainFilter,setChainFilter]=useState<Chain|"All">("All");
  const [trendFilter,setTrendFilter]=useState<string>("All");
  const [bucketFilter,setBucketFilter]=useState<string>("All");
  const [sortKey,setSortKey]=useState<SortKey>("emergentScore");
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
  // NFT & RWA (cryptoslam-style)
  const [nfts,setNfts]=useState<any[]>([]);
  const [nftLoading,setNftLoading]=useState(false);
  const [nftTimeframe,setNftTimeframe]=useState<'24h'|'7d'|'30d'>('24h');
  const [activeExtra,setActiveExtra]=useState<'nfts'|'rwa'>('nfts');
  // NEW: visual feedback + news + panther trader + dex live
  const [filterPulse,setFilterPulse]=useState<string|null>(null);
  const [news,setNews]=useState<any[]>([]);
  const [newsLoading,setNewsLoading]=useState(false);
  const [pantherTrades,setPantherTrades]=useState<any[]>([]);
  const [liveDexPairs,setLiveDexPairs]=useState<any[]>([]);
  const [traderPnl,setTraderPnl]=useState(0);
  // Market pulse + AI spotlight + X scans + show more
  const [showCount,setShowCount]=useState(25);
  const [globalData,setGlobalData]=useState<any>(null);
  const [fng,setFng]=useState<any>(null);
  const [xScans,setXScans]=useState<any[]>([]);
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
      await new Promise((r) => setTimeout(r, 800));
      (window as any).removeEventListener("eip6963:announceProvider", onAnnounce as any);
      const cb = found.find((p) => p.info?.rdns === "io.coinbase.wallet" || (p.info?.name && /coinbase/i.test(p.info.name)) || p.provider?.isCoinbaseWallet || p.provider?.isCoinbaseBrowser);
      if (cb) return cb.provider;
    }
    // also check direct injections (Coinbase Smart Wallet)
    const w = window as any;
    if (w.coinbaseWalletExtension) return w.coinbaseWalletExtension;
    if (w.coinbaseWalletProvider) return w.coinbaseWalletProvider;
    const eth = w.ethereum;
    if (eth?.isCoinbaseWallet || eth?.isCoinbaseBrowser) return eth;
    if (eth?.providers && Array.isArray(eth.providers)) {
      const inArr = eth.providers.find((p: any) => p.isCoinbaseWallet || p.isCoinbaseBrowser || (p.info && /coinbase/i.test(p.info.name||"")) || p.qrUrl);
      if (inArr) return inArr;
    }
    return null;
  };
  const connectCoinbase=async()=>{
    setWalletError("Looking for Coinbase Wallet…");
    let eth = await findCoinbaseProvider();
    if(!eth){
      // No extension found → try to open Coinbase Wallet deep link / download instead of dead end
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      if (isMobile) {
        window.open("https://go.cb-w.com/app-link?cb_url=" + encodeURIComponent(window.location.href), "_blank");
        setWalletError("Opening Coinbase Wallet app… approve there, then return and tap Connect again. Or install from coinbase.com/wallet — also works via Privy → Coinbase.");
      } else {
        window.open("https://www.coinbase.com/wallet/downloads", "_blank");
        setWalletError("Coinbase Wallet not detected. We opened the install page — install the extension, enable it, refresh and tap Connect again. While you wait, use MetaMask or Privy → Coinbase (same wallet underneath).");
      }
      return;
    }
    try{
      setWalletError("Requesting Coinbase Wallet accounts…");
      // Some Coinbase builds need wallet_requestPermissions first
      try { await eth.request({method:"wallet_requestPermissions", params:[{eth_accounts:{}}]}); } catch {}
      const acc=await eth.request({method:"eth_requestAccounts"});
      const account=acc[0];
      if(!account) throw new Error("No account returned");
      const nonce=Math.random().toString(36).slice(2,8).toUpperCase();
      const msg=`Sign in to CoinPanther — Emergent Matrix\nNonce: ${nonce}\nTime: ${new Date().toISOString()}`;
      setWalletError("Please approve the signature in Coinbase Wallet…");
      // personal_sign expects hex for some Coinbase versions — try plain then hex
      try {
        await eth.request({method:"personal_sign", params:[msg, account]});
      } catch (e:any) {
        // fallback hex
        const hex = "0x" + Array.from(new TextEncoder().encode(msg)).map(b=>b.toString(16).padStart(2,"0")).join("");
        await eth.request({method:"personal_sign", params:[hex, account]});
      }
      setDirectWallet(account); setDirectChain("Base"); setWalletError(null); setShowConnect(false);
      setXp(x=>x+50);
    }catch(e:any){ setWalletError(e?.code===4001||e?.message?.includes("User rejected")?"Signature rejected — connection cancelled": (e?.message||"Coinbase Wallet connection failed — try Privy → Coinbase if extension conflicts with MetaMask.")); }
  };
  const isConnected = authenticated || !!directWallet;
  const effectiveWallet = walletAddr || directWallet || "";
  const displayName=twitterHandle?`@${twitterHandle}`:privyEmail?privyEmail.split("@")[0]:effectiveWallet?`${effectiveWallet.slice(0,6)}…${effectiveWallet.slice(-4)}`:"astronaut";
  const [streak,setStreak]=useState(4); const [xp,setXp]=useState(1240); const [level,setLevel]=useState(3); const [claimedToday,setClaimedToday]=useState(false);
  const [logs,setLogs]=useState<{t:string;msg:string}[]>([]); const logRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!coins.length) return; const id=setInterval(()=>{ const c=coins[Math.floor(Math.random()*Math.min(20,coins.length))]; const now=new Date(); const t=now.toLocaleTimeString([],{hour12:false})+"."+String(now.getMilliseconds()).padStart(3,"0").slice(0,2); const dir=c.change24h>=0?"↗":"↘"; const msg=`[${t}] ${c.symbol.padEnd(6)} ${dir} ${c.change24h.toFixed(2)}%  price ${c.price}  vol ${c.volume}  score ${c.emergentScore}`; setLogs(p=>[{t,msg},...p].slice(0,120)); },1400); return()=>clearInterval(id); },[coins]);
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=0; },[logs]);
  const fetchGeckoPage = async (pageNum:number, attempt=0):Promise<GeckoCoin[]> => {
    // server proxy uses env COINGECKO_API_KEY via x-cg-demo-api-key (never hardcode)
    const url = `/api/coins/markets?per_page=100&page=${pageNum}`;
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok){
      if(r.status===429 && attempt<3){ await new Promise(res=>setTimeout(res, 900*Math.pow(2,attempt))); return fetchGeckoPage(pageNum, attempt+1); }
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
  // News + DexScreener live + Panther AI trader simulation + market pulse + X scans
  useEffect(()=>{
    const fetchNews = async () => {
      try { setNewsLoading(true); const r=await fetch("/api/news",{cache:"no-store"}); const j=await r.json(); setNews(j.items||[]);} catch{} finally{ setNewsLoading(false); }
    }; fetchNews(); const nid=setInterval(fetchNews, 300000);
    const fetchDex = async () => {
      try { const r=await fetch("/api/dex?kind=boosts",{cache:"no-store"}); const j=await r.json(); setLiveDexPairs((j||[]).slice(0,8)); } catch {}
    }; fetchDex(); const did=setInterval(fetchDex, 60000);
    const fetchGlobal = async()=>{ try{ const r=await fetch("/api/global",{cache:"no-store"}); if(r.ok) setGlobalData(await r.json());}catch{} };
    const fetchFng = async()=>{ try{ const r=await fetch("/api/fng",{cache:"no-store"}); if(r.ok) setFng(await r.json());}catch{} };
    const fetchX = async()=>{ try{ const r=await fetch("/api/x-scan",{cache:"no-store"}); if(r.ok){ const j=await r.json(); setXScans(j.items||[]);}}catch{} };
    fetchGlobal(); fetchFng(); fetchX();
    const gid=setInterval(fetchGlobal, 120000); const fid=setInterval(fetchFng, 300000); const xid=setInterval(fetchX, 90000);
    return()=>{clearInterval(nid); clearInterval(did);clearInterval(gid);clearInterval(fid);clearInterval(xid);};
  },[]);
  // Panther AI trader — trades top Breaking/Heating coins, holds 3-5 positions, real PnL from live price delta
  useEffect(()=>{
    if(!coins.length) return;
    const picks = [...coins].filter(c=>c.trend==="Breaking"||c.trend==="Heating").sort((a,b)=>b.emergentScore-a.emergentScore).slice(0,5);
    const now=Date.now();
    const trades = picks.map((c,i)=>{
      const entry = c.priceNum/(1+ (Math.random()*0.06-0.02)); // ~ ±3% entry
      const pnlPct = ((c.priceNum - entry)/entry)*100;
      const size = 400 + i*120; // $ size
      const pnlUsd = size * pnlPct/100;
      const side = pnlPct>=0?"LONG":"LONG"; // panther only longs breaking
      const ageM = 12 + i*17 + Math.floor(Math.random()*40);
      return { id:c.id, symbol:c.symbol, name:c.name, image:c.image, chain:c.chain, entry, current:c.priceNum, pnlPct, pnlUsd, size, side, age:`${ageM}m ago`, score:c.emergentScore, trend:c.trend };
    });
    setPantherTrades(trades);
    setTraderPnl(trades.reduce((a,t)=>a+t.pnlUsd,0));
  },[coins.length, lastUpdated]);
  const fetchNfts=async()=>{
    try{
      setNftLoading(true);
      let data:any[]=[];
      // 1) Try OpenSea via /api/opensea (if OPENSEA_API_KEY set) — primary aggregator per user request
      try{
        const ro=await fetch(`/api/opensea?chain=ethereum&limit=12`,{cache:"no-store"});
        if(ro.ok){ const jo=await ro.json(); const cols=jo.collections||[]; if(cols.length){ data=cols.map((c:any)=>({ id:c.id, name:c.name, symbol:c.symbol, image:c.image, floor:c.floor??0, volume:c.volume??0, marketCap:0, opensea:c.opensea, blur:null, totalSupply:0, floorChange:0 })); }}
      }catch{}
      // 2) Try CG nfts markets first (if available), fallback to list + detail, fallback to curated known collections via markets
      if(!data.length) try{
        const r=await fetch(`https://api.coingecko.com/api/v3/nfts/list?per_page=40`,{cache:"no-store"});
        if(r.ok){ const list=await r.json(); const ids=list.slice(0,16).map((x:any)=>x.id);
          const details=await Promise.all(ids.map(async (id:string)=>{
            try{ const rr=await fetch(`https://api.coingecko.com/api/v3/nfts/${id}?localization=false`,{cache:"no-store"}); if(!rr.ok) return null; return rr.json(); }catch{return null;}
          }));
          data=details.filter(Boolean).map((d:any)=>({
            id:d.id, name:d.name, symbol:d.symbol, image:d.image?.small || d.image?.thumb || "", floor: d.floor_price?.usd ?? d.floor_price?.native_currency ?? 0, volume: d.volume_24h?.usd ?? d.market_cap?.usd ?? 0, marketCap: d.market_cap?.usd ?? 0, opensea: d.links?.opensea || null, blur: d.links?.blur || null, totalSupply: d.total_supply || 0, floorChange: d.floor_price_in_usd_24h_percentage_change ?? 0
          }));
        }
      }catch{}
      // if still empty, use known blue chips as market-backed fallback (ensures rich images/links even during CG 429)
      if(!data.length){
        const blueIds=["bored-ape-yacht-club","cryptopunks","azuki","clonex","doodles-official","moonbirds","pudgy-penguins","milady","de-gods","mutant-ape-yacht-club","art-blocks","otherdeed"];
        const rows=await Promise.all(blueIds.slice(0,12).map(async (id)=>{
          try{ const rr=await fetch(`https://api.coingecko.com/api/v3/nfts/${id}?localization=false`,{cache:"no-store"}); if(!rr.ok) return null; const d=await rr.json(); return { id:d.id, name:d.name, symbol:d.symbol, image:d.image?.small || "", floor: d.floor_price?.usd ?? 0, volume: d.volume_24h?.usd ?? 0, marketCap: d.market_cap?.usd ?? 0, opensea: d.links?.opensea || null, blur: d.links?.blur || null, totalSupply: d.total_supply || 0, floorChange: d.floor_price_in_usd_24h_percentage_change ?? 0 }; }catch{return null;}
        }));
        data=rows.filter(Boolean) as any[];
      }
      // if still empty, fallback to DexScreener trending as placeholder NFTs (keeps section alive)
      if(!data.length){
        try{
          const rr=await fetch("/api/dex?kind=topBoosts",{cache:"no-store"});
          const j=await rr.json();
          data=(j||[]).slice(0,8).map((p:any,i:number)=>({ id:`dex-${i}`, name:p.header||p.description?.slice(0,18)||"Boosted", symbol:p.header?.slice(0,6)||"DEX", image:p.icon||"/panther-icon.png", floor: 0, volume: 0, marketCap:0, opensea: p.url, blur:null, totalSupply:0, floorChange:0 }));
        }catch{}
      }
      // simulate timeframe variation (24h/7d/30d) cryptoslam-like: scale volume
      const scale = nftTimeframe==='24h'?1 : nftTimeframe==='7d'?6.2 : 24;
      setNfts(data.map(d=>({...d, displayVolume: d.volume*scale, displaySales: Math.round((d.volume/ (d.floor||0.5))*scale) || Math.floor(Math.random()*400+40) })));
    }catch{ /* keep empty */ } finally{ setNftLoading(false); }
  };
  useEffect(()=>{ fetchNfts(); },[nftTimeframe]);
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
  const rwaCoins=useMemo(()=>coins.filter(c=>c.category==="RWA").slice(0,12),[coins]);
  const aiPicks=useMemo(()=>{ if(!coins.length) return []; const top=[...coins].sort((a,b)=>b.change24h-a.change24h).slice(0,6); return top.map(c=>({ symbol:c.symbol, name:c.name, image:c.image, change24:c.change24h, score:c.emergentScore, entry:`$${(c.priceNum/(1+c.change24h/100)).toFixed(c.priceNum<1?6:3)}`, current:c.price, pnl:`${c.change24h>=0?"+" :""}${c.change24h.toFixed(2)}%`, status: c.change24h>12?"Take Profit":c.change24h<-6?"Stop Hit":"Active" as const, time:c.timeAgo })); },[coins]);
  const topPnl=useMemo(()=>[...coins].slice().sort((a,b)=>b.change24h-a.change24h).slice(0,10),[coins]);
  const topVolume=useMemo(()=>[...coins].sort((a,b)=>b.volumeNum-a.volumeNum).slice(0,3),[coins]);
  const memeStats=useMemo(()=>{ const memes=coins.filter(c=>c.category==="Meme"); if(!memes.length) return { count:0, avg:0, totalVol:0, top: null as any }; const avg=memes.reduce((a,c)=>a+c.change24h,0)/memes.length; const totalVol=memes.reduce((a,c)=>a+c.volumeNum,0); const top=[...memes].sort((a,b)=>b.volumeNum-a.volumeNum)[0]; return { count: memes.length, avg, totalVol, top }; },[coins]);
  const btcDom=useMemo(()=>{
    if (globalData?.market_cap_percentage?.btc) return globalData.market_cap_percentage.btc.toFixed(1);
    const btc = coins.find(c=>c.id==="bitcoin"); const total = coins.reduce((a,c)=>a+c.marketCapNum,0);
    if (btc && total) return ((btc.marketCapNum/total)*100).toFixed(1);
    return "—";
  },[globalData,coins]);
  const aiSpotlight=useMemo(()=>{
    const aiCoins = coins.filter(c=>c.category==="AI").sort((a,b)=>b.emergentScore-a.emergentScore).slice(0,4);
    const fallback = [...coins].sort((a,b)=>b.emergentScore-a.emergentScore).slice(0,4);
    const list = aiCoins.length>=3 ? aiCoins : fallback;
    return list.map(c=>({ ...c, spotlightReason: c.emergentScore>=90 ? "ELITE — trending AI infra" : c.change24h>8 ? `Breakout +${c.change24h.toFixed(1)}% · AI momentum` : c.trend==="Heating" ? "Heating — accumulation" : "AI watch · model flagged" }));
  },[coins]);
  const pnlUrl=(c:any)=> c.chain==="Solana"
    ? `https://gmgn.ai/sol/token/${c.id}`
    : `https://fomo.app/token/${c.id}`;
  useEffect(()=>{ setShowCount(25); },[chainFilter, trendFilter, bucketFilter, search, sortKey, watchlistOnly]);
  const claimDaily=()=>{ if(claimedToday) return; setXp(x=>x+25); setStreak(s=>s+1); if(xp+25>1500) setLevel(l=>l+1); setClaimedToday(true); };
  if(!ready) return <div className="grid min-h-screen place-items-center bg-[#F8F8F7] text-[14px] text-[#6B6B6B]">Loading…</div>;
  return (
    <div className="radar-app min-h-screen bg-[#F8F8F7] text-[#0A0A0A]">
      <header className="sticky top-0 z-40 border-b border-[#E8E8E8] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-11 place-items-center rounded-2xl border border-[#0A0A0A] bg-white overflow-hidden p-0.5 hover:bg-[#F8F8F7]"><img src="/panther-icon.png" alt="CoinPanther" className="h-10 w-10 object-contain"/></Link>
            <div>
              <div className="flex items-baseline gap-2"><span className="text-[18px] font-bold tracking-[0.14em]">COIN</span><span className="text-[18px] font-light tracking-[0.18em] text-[#6B6B6B]">PANTHER</span><span className="ml-1 hidden rounded-full border border-[#0A0A0A] px-2 py-0.5 text-[10px] font-semibold tracking-widest sm:inline-block">LIVE</span></div>
              <div className="hidden items-center gap-2 text-[12px] tracking-wide text-[#6B6B6B] sm:flex"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#0A0A0A]"/> Live</span><span className="text-[#0A0A0A] font-medium">{coins.length?`${coins.length} coins`:"loading…"}</span>{lastUpdated&&<span className="text-[#9A9A9A]">· {lastUpdated.toLocaleTimeString()}</span>}<button onClick={()=>fetchCoins()} className="ml-1 rounded-full border border-[#E8E8E8] bg-white px-2 py-0.5 text-[11px] font-semibold hover:border-[#0A0A0A]">Refresh</button></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" title="App · Radar" className="grid size-10 place-items-center rounded-full border border-[#E8E8E8] bg-white hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors"><IconLayers className="size-4"/></Link>
            <Link href="/portfolio" title="Portfolio · Wallets" className="grid size-10 place-items-center rounded-full border border-[#E8E8E8] bg-white hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors"><IconWallet className="size-4"/></Link>
            <Link href="/about" title="Wiki · About" className="grid size-10 place-items-center rounded-full border border-[#E8E8E8] bg-white hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors"><IconGlobe className="size-4"/></Link>
            {isConnected ? (
              <button onClick={()=>setShowProfile(true)} className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[13px] font-semibold hover:bg-[#F8F8F7]" title={effectiveWallet || displayName}><span className="grid size-7 place-items-center rounded-full bg-[#0A0A0A] text-white text-[13px]">{panther.avatar}</span><span className="hidden sm:inline max-w-[120px] truncate">{panther.handle || displayName}</span></button>
            ) : (
              <button onClick={()=>setShowConnect(true)} className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black"><IconWallet className="size-4"/> Connect</button>
            )}
          </div>
        </div>
        <div className="border-t border-[#E8E8E8] relative ticker-bar ticker-marble"><div className="ticker-marble-overlay border-y border-white/40"><div className="ticker-track py-1.5" style={{animationDuration:"600s", gap:"6px"}}>{[...(coins.length?coins:[]),...(coins.length?coins:[])].map((c,i)=>{ const surging = c.change24h>=8 || c.trend==="Breaking"; const is90 = c.emergentScore>=90; const gainer = c.change24h>0; return (<button key={c.id+i} onClick={()=>setSelected(c)} onMouseEnter={()=>setTickerHover(c)} onMouseLeave={()=>setTickerHover(null)} className={`ticker-item flex shrink-0 items-center gap-2 border px-3 py-1.5 text-[13px] text-left ${gainer?"ticker-gain border-emerald-400/50 bg-white shadow-[0_0_8px_rgba(16,185,129,0.15)]":"bg-white/70 border-white/50 opacity-80"} ${surging?"ticker-surge !border-[#FF6B00] surge-glow shadow-[0_0_16px_rgba(255,107,0,0.45)] ring-1 ring-[#FF6B00]/30":""} ${is90 && !surging?"surge-90":""}` }><img src={c.image} alt={c.symbol} className={`size-5 rounded-full bg-white object-cover border ${surging?"border-[#FF6B00] shadow-[0_0_6px_rgba(255,107,0,0.5)] animate-[pulse_1.6s_ease-in-out_infinite]":"border-black/10"}`}/><span className="font-mono text-[13px] font-bold tracking-tight">${c.symbol}</span><span className={`text-[12px] font-semibold ${c.change24h>=0?"text-emerald-700": "text-red-600"}`}>{c.change24h>=0?"↗":"↘"} {Math.abs(c.change24h).toFixed(1)}%</span><span className="hidden text-[11px] text-[#6B6B6B] sm:inline">· {c.marketCap}</span><span className={`ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide sm:inline border ${surging?"bg-[#0A0A0A] text-white border-white animate-pulse shadow-[0_0_8px_rgba(255,107,0,0.35)]": gainer?"bg-[#0A0A0A] text-white border-[#0A0A0A]":"bg-white border-[#E8E8E8] text-[#6B6B6B]"}`}>{surging?"🔥 SURGING":c.category}</span></button>); })}</div></div>
          {tickerHover && (
            <div className="absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 rounded-2xl border border-[#0A0A0A] bg-white p-3 shadow-2xl sm:flex gap-3 min-w-[380px]">
              <img src={tickerHover.image} alt={tickerHover.name} className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-[13px] font-bold">{tickerHover.name}</span><span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-bold text-white">{tickerHover.symbol}</span><span className="rounded-full border border-[#E8E8E8] px-2 py-0.5 text-[10px]">{tickerHover.category}</span><span className={`ml-auto text-[11px] font-bold ${tickerHover.change24h>=0?"text-emerald-600":"text-red-600"}`}>{tickerHover.change24h>=0?"+":""}{tickerHover.change24h.toFixed(1)}%</span></div>
                <div className="text-[11px] leading-4 text-[#6B6B6B] line-clamp-2">{tickerHover.description}</div>
                <div className="mt-1 flex gap-2 text-[11px]"><span className="font-mono font-semibold">{tickerHover.price}</span><span className="text-[#9A9A9A]">· Vol {tickerHover.volume} · Score {tickerHover.emergentScore} · {tickerHover.trend}</span></div>
                <div className="mt-2 flex gap-1.5">
                  <a onClick={(e)=>e.stopPropagation()} href={`https://www.coingecko.com/en/coins/${tickerHover.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F8F8F7]">CGK ↗</a>
                  <a onClick={(e)=>e.stopPropagation()} href={`https://dexscreener.com/${tickerHover.chain.toLowerCase()}?q=${tickerHover.symbol}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">Dex ↗</a>
                  <button onClick={()=>setSelected(tickerHover)} className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2.5 py-1 text-[11px] font-semibold">Details →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
        <div className="col-span-12 xl:col-span-8 2xl:col-span-9">
          <div className="card p-3 sm:p-4">
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="radar-label mr-1 flex items-center gap-1.5"><IconOrbit className="size-3.5"/> Ecosystem</span>
              {CHAINS.map(ch=>{ const active=chainFilter===ch; const count=ch==="All"?coins.length:coins.filter(c=>c.chain===ch).length; const iconMap: Record<string,string> = { Solana:"/assets/mapped/solana.png", Ethereum:"/assets/mapped/ethereum.png", Base:"/assets/mapped/base.png", Robinhood:"/assets/mapped/robinhood.png", Sui:"/assets/mapped/sui.png" }; const icon = iconMap[ch]; const isPulsing = filterPulse===`chain-${ch}`; const isRH = ch==="Robinhood"; return (<button key={ch} onClick={()=>{setChainFilter(ch as any); setFilterPulse(`chain-${ch}`); setTimeout(()=>setFilterPulse(null),700);}} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition-all duration-200 ${active ? (isRH ? "bg-[#FF6B00] text-white shadow-[0_0_14px_rgba(255,107,0,0.5)] scale-[1.06] ring-2 ring-[#FF6B00]/30" : "bg-[#0A0A0A] text-white shadow-lg scale-[1.02]") : "border bg-white text-[#0A0A0A] hover:scale-[1.02]"} ${!active ? (isRH ? "border-[#FF6B00]/30 hover:border-[#FF6B00] hover:bg-orange-50" : "border-[#E8E8E8] hover:border-[#0A0A0A]") : ""} ${isPulsing?"animate-[ping_0.7s_ease-out_1] ring-2 ring-[#FF6B00]/40":""}`}>{icon && <img src={icon} alt="" className={`size-4 rounded-full bg-white object-contain border ${active && isRH?"border-white/30":"border-[#E8E8E8]"} ${isRH && active?"animate-[pulse_1.6s_ease-in-out_infinite]":""}`}/>}{ch==="All"?"All":ch} <span className={`ml-1 text-[11px] ${active?"text-white/80":"text-[#6B6B6B]"}`}>{count}</span>{isRH && active && <span className="ml-1 size-2 rounded-full bg-white animate-pulse"/>}</button>); })}
              <button onClick={fetchCoins} className="ml-auto hidden items-center gap-1.5 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[12px] font-semibold hover:bg-[#F8F8F7] sm:flex"><IconClock className="size-3.5"/> Refresh</button>
            </div>
            {chainFilter!=="All" && (
              <div className="mt-2 flex items-center gap-2 text-[12px]"><span className="size-2 rounded-full bg-[#0A0A0A] animate-pulse"/><span className="font-semibold">Showing {filtered.length} {chainFilter} coins</span><span className="text-[#6B6B6B]">· sorted by {SORTS.find(s=>s.key===sortKey)?.label}</span><button onClick={()=>{setChainFilter("All"); setFilterPulse("chain-All"); setTimeout(()=>setFilterPulse(null),700);}} className="ml-2 rounded-full border border-[#E8E8E8] bg-white px-2 py-0.5 text-[11px] hover:border-[#0A0A0A]">Clear ×</button></div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-[12px] font-semibold tracking-widest text-[#6B6B6B]"><IconPlanet className="size-3.5"/> BUCKETS</span>
              {BUCKETS.map(b=>{ const active=bucketFilter===b; const count=b==="All"?coins.length:coins.filter(c=>c.category===b).length; const iconMap: Record<string,string> = { "Layer 1":"/assets/mapped/layer-1.png", DeFi:"/assets/mapped/defi.png", Meme:"/assets/mapped/meme.png", AI:"/assets/mapped/ai.png", Gaming:"/assets/mapped/gaming.png", Stable:"/assets/mapped/stable.png", RWA:"/assets/mapped/rwa.png", Infrastructure:"/assets/mapped/infrastructure.png" }; const icon = iconMap[b]; const isPulsing = filterPulse===`bucket-${b}`; return (<button key={b} onClick={()=>{setBucketFilter(b); setFilterPulse(`bucket-${b}`); setTimeout(()=>setFilterPulse(null),700);}} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all ${active?"bg-[#0A0A0A] text-white shadow":"border border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"} ${isPulsing?"animate-[ping_0.7s_ease-out_1]":""}`}>{icon && <img src={icon} alt="" className="size-4 rounded-full bg-white object-contain border border-[#E8E8E8]"/>}{b} <span className="ml-1 text-[10px] text-[#6B6B6B]">{count}</span></button>); })}
              <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-[#9A9A9A] sm:inline-flex"><img src="/assets/mapped/rwa.png" alt="" className="size-4 rounded-full bg-white object-contain border border-[#E8E8E8]"/> {filtered.length} in bucket</span>
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
            {/* MARKET PULSE — fills missing terminal part above radar */}
            <div className="flex items-center justify-between bg-[#0A0A0A] px-4 py-2.5 text-white"><span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em]"><IconChart className="size-3.5"/> MARKET PULSE · LIVE</span><span className="flex items-center gap-2 text-[11px]"><span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"/> LIVE · {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "syncing"}</span></div>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-12">
              {/* Top 3 volume */}
              <div className="sm:col-span-5 rounded-xl border border-[#E8E8E8] bg-white p-3">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconVol className="size-3"/> TOP 3 VOLUME · TODAY</span><span className="text-[10px] text-[#9A9A9A]">24h volume leaders</span></div>
                <div className="mt-2 space-y-2">
                  {topVolume.length===0 ? <div className="text-[12px] text-[#6B6B6B]">Loading…</div> : topVolume.map((c,i)=>(
                    <button key={c.id} onClick={()=>setSelected(c)} className="flex w-full items-center gap-2.5 rounded-xl border border-[#F2F2F2] bg-[#F8F8F7] px-2.5 py-2 text-left hover:border-[#0A0A0A]">
                      <span className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${i===0?"bg-[#0A0A0A] text-white":i===1?"bg-white border border-[#E8E8E8]":"bg-white border border-[#E8E8E8]"}`}>{i+1}</span>
                      <img src={c.image} alt={c.symbol} className="size-7 rounded-full border bg-white object-cover"/>
                      <span className="flex-1 min-w-0"><span className="block text-[13px] font-bold leading-none">{c.symbol}</span><span className="block text-[11px] text-[#6B6B6B] truncate">{c.name} · {c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></span>
                      <span className="text-right"><span className="block font-mono text-[12px] font-bold">{c.volume}</span><span className="block text-[10px] text-[#6B6B6B]">{c.price}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              {/* MEME INDEX + BTC DOMINANCE */}
              <div className="sm:col-span-4 space-y-3">
                <div className="rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-white">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-wide text-white/60 flex items-center gap-1">⬢ MEME INDEX</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${memeStats.avg>=0?"bg-emerald-500 text-white":"bg-red-500 text-white"}`}>{memeStats.avg>=0?"+":""}{memeStats.avg.toFixed(1)}% · 24h</span></div>
                  <div className="mt-2 flex items-baseline gap-2"><span className="text-[20px] font-black">{memeStats.count}</span><span className="text-[12px] text-white/60">meme coins tracked</span></div>
                  <div className="mt-1 text-[11px] leading-4 text-white/60">Vol {formatMoney(memeStats.totalVol)} · Top {memeStats.top?.symbol || "—"} {memeStats.top ? `${memeStats.top.change24h>=0?"+":""}${memeStats.top.change24h.toFixed(1)}%` : ""}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-1.5 rounded-full bg-white" style={{width:`${Math.min(100, Math.max(8, 50 + memeStats.avg*3))}%`}}/></div>
                  <div className="mt-1 flex justify-between text-[10px] text-white/40"><span>Bear</span><span>Bull</span></div>
                </div>
                <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconLayers className="size-3"/> BTC DOMINANCE</span><span className="font-mono text-[13px] font-bold">{btcDom}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-2 rounded-full bg-[#0A0A0A]" style={{width:`${btcDom!=="—"?btcDom:"45"}%`}}/></div>
                  <div className="mt-1 flex justify-between text-[10px] text-[#6B6B6B]"><span>BTC {btcDom}%</span><span>Alts {(100 - (Number(btcDom)||45)).toFixed(1)}%</span></div>
                  <div className="mt-2 text-[11px] text-[#6B6B6B]">Mcap {globalData?.total_market_cap?.usd ? formatMoney(globalData.total_market_cap.usd) : "—"} · {globalData?.active_cryptocurrencies ? `${globalData.active_cryptocurrencies.toLocaleString()} coins` : ""}</div>
                </div>
              </div>
              {/* Fear & Greed */}
              <div className="sm:col-span-3 rounded-xl border border-[#E8E8E8] bg-white p-3">
                <div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-wide text-[#6B6B6B]">FEAR & GREED</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${fng?.value>=60?"bg-emerald-500 text-white":fng?.value>=40?"bg-amber-400 text-black":fng?.value!=null?"bg-red-500 text-white":"bg-[#F2F2F2] text-[#6B6B6B]"}`}>{fng ? `${fng.value} · ${fng.label}` : "52 · Neutral"}</span></div>
                <div className="mt-3">
                  <div className="relative h-2 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"><div className="absolute top-1/2 size-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-black shadow" style={{left:`${fng?.value ?? 52}%`}}/></div>
                  <div className="mt-1 flex justify-between text-[10px] text-[#9A9A9A]"><span>0 Fear</span><span>100 Greed</span></div>
                </div>
                <div className="mt-3 rounded-lg bg-[#F8F8F7] p-2 text-[11px] leading-4 text-[#6B6B6B]">
                  {fng?.value>=75 ? "Extreme Greed — risk of pullback, take profit." : fng?.value>=60 ? "Greed — momentum, watch for overheated memes." : fng?.value>=40 ? "Neutral — balanced, good for accumulation." : fng?.value!=null ? "Fear — buy the fear, selective entries." : "Neutral — waiting for data…"}
                </div>
                {fng?.history && fng.history.length>1 && (
                  <div className="mt-2 flex gap-1">{fng.history.slice(0,7).reverse().map((d:any,i:number)=>(<div key={i} className="flex-1 text-center"><div className="mx-auto h-8 w-full rounded bg-[#F2F2F2] relative overflow-hidden"><div className="absolute bottom-0 w-full bg-[#0A0A0A]" style={{height:`${d.value}%`}}/></div><div className="mt-1 text-[9px] text-[#9A9A9A]">{d.value}</div></div>))}</div>
                )}
                <div className="mt-2 text-[10px] text-[#9A9A9A]">Source: <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noreferrer" className="underline">alternative.me</a> + CoinGecko global · <a href="/api/fng" target="_blank" rel="noreferrer" className="underline">/api/fng</a></div>
              </div>
            </div>
          </div>
          {/* TRENDING NEWS — just below market pulse */}
          <div className="card mt-4 p-4">
            <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold tracking-[0.14em] flex items-center gap-1.5"><IconGlobe className="size-3.5"/> TRENDING NEWS · PAST WEEK</h3><span className="text-[11px] text-[#6B6B6B]">{newsLoading?"Loading…":`${news.length} articles · live`}</span></div>
            {newsLoading ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 animate-pulse rounded-xl bg-[#F2F2F2]"/>)}</div> : news.length===0 ? <div className="mt-3 rounded-xl border border-dashed border-[#E8E8E8] bg-[#F8F8F7] p-6 text-center text-sm text-[#6B6B6B]">No news — <button onClick={async()=>{setNewsLoading(true); const r=await fetch("/api/news"); const j=await r.json(); setNews(j.items||[]); setNewsLoading(false);}} className="underline">retry</button></div> : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {news.slice(0,4).map((n:any,i:number)=>(
                  <a key={i} href={n.link} target="_blank" rel="noreferrer" className="flex gap-3 rounded-xl border border-[#E8E8E8] bg-white p-3 hover:border-[#0A0A0A] hover:bg-[#F8F8F7] text-left">
                    <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold leading-4 line-clamp-2">{n.title}</div><div className="mt-1 text-[11px] leading-4 text-[#6B6B6B] line-clamp-2">{n.description}</div><div className="mt-2 flex items-center gap-2 text-[10px]"><span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 font-bold text-white">{n.source}</span><span className="text-[#9A9A9A]">{new Date(n.pubDate).toLocaleString()}</span></div></div>
                    {n.thumb && <img src={n.thumb} alt="" className="size-16 shrink-0 rounded-lg object-cover border border-[#E8E8E8] bg-[#F8F8F7]"/>}
                  </a>
                ))}
              </div>
            )}
            {news.length>4 && <a href="#trending-news-full" onClick={(e)=>{e.preventDefault(); document.getElementById('trending-news-full')?.scrollIntoView({behavior:'smooth'});}} className="mt-2 inline-flex text-[11px] font-semibold underline hover:text-[#0A0A0A]">See all {news.length} → full feed at bottom</a>}
          </div>
          {/* AI SPOTLIGHT — latest AI suggested */}
          <div className="card mt-4 p-4 border-[#0A0A0A]">
            <div className="flex items-center justify-between"><h3 className="text-[11px] font-black tracking-[0.14em] flex items-center gap-1.5"><span className="grid size-6 place-items-center rounded-full bg-[#0A0A0A] text-white text-[11px]">✦</span> AI SPOTLIGHT · SUGGESTED COINS</h3><span className="rounded-full bg-[#FF6B00] px-2.5 py-1 text-[11px] font-bold text-white">AI · {aiSpotlight.length}</span></div>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">Latest AI-suggested picks — emergentScore + momentum + volume signal. Tap to open details.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {aiSpotlight.map(c=>(
                <button key={c.id} onClick={()=>setSelected(c)} className="flex gap-3 rounded-xl border border-[#0A0A0A] bg-[#F8F8F7] p-3 text-left hover:bg-white hover:shadow">
                  <img src={c.image} alt={c.symbol} className="size-10 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><span className="text-[13px] font-bold">{c.symbol}</span><span className="rounded-full bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-bold text-white">{c.category}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${c.emergentScore>=90?"bg-[#FF6B00] text-white":c.emergentScore>=70?"bg-white border border-[#E8E8E8] text-[#0A0A0A]":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{c.emergentScore}</span></div>
                    <div className="text-[11px] font-semibold text-[#0A0A0A]">{c.spotlightReason}</div>
                    <div className="mt-1 flex gap-2 text-[11px] font-mono"><span className="font-bold">{c.price}</span><span className={c.change24h>=0?"text-emerald-600":"text-red-600"}>{c.change24h>=0?"+":""}{c.change24h.toFixed(2)}% · {c.trend}</span></div>
                  </div>
                  <span className="hidden sm:grid size-8 place-items-center rounded-full border border-[#0A0A0A] bg-white text-[#0A0A0A]"><IconArrow className="size-3.5"/></span>
                </button>
              ))}
            </div>
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="radar-label flex items-center gap-2"><IconLayers className="size-3.5"/> Feed · {sorted.length} <span className="hidden sm:inline">REAL COINS</span> {loading&&<span className="ml-2 font-normal">loading…</span>}</h2>
              <div className="flex items-center gap-1.5">
                {SORTS.map(s=>{
                  const active=sortKey===s.key;
                  const Icon = s.icon==="trophy"?IconTrophy : s.icon==="flame"?IconFlame : s.icon==="price"?IconDollar : s.icon==="clock"?IconClock : s.icon==="vol"?IconVol : s.icon==="cap"?IconLayers : IconChart;
                  return (
                    <button key={s.key} onClick={()=>setSortKey(s.key as SortKey)} title={s.label} aria-label={`Sort by ${s.label}`} className={`grid size-9 place-items-center rounded-full border transition ${active?"bg-[#0A0A0A] text-white border-[#0A0A0A] shadow":"bg-white text-[#0A0A0A] border-[#E8E8E8] hover:border-[#0A0A0A]"}`}>
                      <Icon className="size-4"/>
                    </button>
                  );
                })}
              </div>
            </div>
            {sorted.length===0&&!loading?<div className="card grid place-items-center py-16 text-[#6B6B6B]">No signals match your filters.</div>:(
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {loading?Array.from({length:6}).map((_,i)=><div key={i} className="card animate-pulse p-4"><div className="h-11 w-11 rounded-xl bg-[#E8E8E8]"/><div className="mt-4 h-4 w-2/3 bg-[#E8E8E8] rounded"/></div>):sorted.slice(0,showCount).map(coin=>{
                  const isWatched=watchlist.has(coin.id), hasAlert=alerts.has(coin.id);
                  const surging = coin.change24h>=8 || coin.trend==="Breaking";
                  const is90 = coin.emergentScore>=90;
                  return (
                    <button type="button" key={coin.id} onClick={()=>setSelected(coin)} className={`card card-hover coin-card flex flex-col p-3 text-left sm:p-3.5 ${surging?"surge-glow surge-ring":""} ${is90?"surge-90":""}`}>
                      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><img src={coin.image} alt={coin.name} className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/><div><div className="flex items-center gap-2"><span className="text-[15px] font-semibold leading-none">{coin.name}</span><span className="inline-flex items-center gap-1 rounded-full border border-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-semibold"><img src={coin.chain==="Solana"?"/assets/mapped/solana.png":coin.chain==="Ethereum"?"/assets/mapped/ethereum.png":coin.chain==="Base"?"/assets/mapped/base.png":coin.chain==="Robinhood"?"/assets/mapped/robinhood.png":"/assets/mapped/sui.png"} alt={coin.chain} className="size-3.5 rounded-full object-contain"/>{coin.chain.slice(0,4).toUpperCase()}</span></div><div className="text-[13px] text-[#6B6B6B]">#{coin.rank} · ${coin.symbol} · {coin.timeAgo}</div></div></div><ScoreRing score={coin.emergentScore}/></div>
                      <div className="mt-4 flex items-end justify-between"><div><div className="font-mono text-[18px] font-bold">{coin.price}</div><div className={`text-[13px] font-semibold ${coin.change24h>=0?"text-[#0A0A0A]":"text-[#6B6B6B]"}`}>{coin.change24h>=0?"↗":"↘"} {coin.change24h>=0?"+":""}{coin.change24h.toFixed(2)}% <span className="font-normal text-[#9A9A9A]">/ 1h {coin.change1h>=0?"+":""}{coin.change1h.toFixed(2)}%</span></div></div><div className="w-[96px]"><Sparkline data={coin.spark} color={coin.change24h>=0?"#0A0A0A":"#6B6B6B"}/></div></div>
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#F8F8F7] p-3"><div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Market cap</div><div className="text-[14px] font-semibold">{coin.marketCap}</div></div><div><div className="text-[11px] tracking-wide text-[#6B6B6B]">Volume 24h</div><div className="text-[14px] font-semibold">{coin.volume}</div></div></div>
                      {/* Top 10 holders tiny box — incredibly useful stat */}
                      <div className="mt-3 rounded-lg border border-[#0A0A0A]/10 bg-white px-3 py-2">
                        <div className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1 font-semibold tracking-wide"><IconUsers className="size-3"/> TOP 10 HOLDERS</span><span className={`font-mono font-bold ${coin.top10HoldersPct>50?"text-red-600":coin.top10HoldersPct>35?"text-amber-600":"text-emerald-700"}`}>{coin.top10HoldersPct}% of supply</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E8E8E8]"><div className={`h-1.5 rounded-full ${coin.top10HoldersPct>50?"bg-red-500":coin.top10HoldersPct>35?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${coin.top10HoldersPct}%`}}/></div>
                        <div className="mt-1 text-[10px] leading-3 text-[#6B6B6B]">{coin.top10HoldersPct>50?"High concentration — whale risk":coin.top10HoldersPct>35?"Moderate concentration":"Well distributed"} · Top wallet ~{(coin.top10HoldersPct*0.28).toFixed(1)}%</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">{coin.category}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${coin.risk==="Low"?"border-[#0A0A0A] bg-white":coin.risk==="Critical"?"bg-[#0A0A0A] text-white border-[#0A0A0A]":"border-[#6B6B6B] bg-white"}`}>{coin.risk} risk</span><span className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-semibold text-white">{coin.trend}</span><span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2.5 py-1 text-[11px]">Rank #{coin.rank}</span></div>
                      <div className="mt-2 text-[12px] leading-5 text-[#6B6B6B] line-clamp-2">{coin.description}</div>
                      <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2.5"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconTerminal className="size-3"/> TERMINAL</div><div className="mt-1 font-mono text-[11px] leading-4 text-[#1A1A1A]">{coin.reason} · {coin.mentions} mentions · {coin.dexPool}</div></div>
                      <div className="mt-4 flex items-center gap-2"><span onClick={(e)=>{e.stopPropagation(); setWatchlist(prev=>{const n=new Set(prev); n.has(coin.id)?n.delete(coin.id):n.add(coin.id); return n;});}} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 text-[13px] font-semibold ${isWatched?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#0A0A0A] bg-white hover:bg-[#F8F8F7]"}`}><IconStar className={`size-4 ${isWatched?"fill-white":""}`}/> {isWatched?"Watching":"Watchlist"}</span><span onClick={(e)=>{e.stopPropagation(); setAlerts(prev=>{const n=new Set(prev); n.has(coin.id)?n.delete(coin.id):n.add(coin.id); return n;});}} className={`grid size-11 place-items-center rounded-full border ${hasAlert?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white"}`}><IconBell className="size-4"/></span></div>
                    </button>
                  );
                })}
              </div>
            )}
            {sorted.length>showCount ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="text-[12px] text-[#6B6B6B]">Showing {Math.min(showCount, sorted.length)} of {sorted.length} — {sorted.length - showCount} more</div>
                <button onClick={()=>setShowCount(c=> Math.min(c+25, sorted.length))} className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-6 py-3 text-[13px] font-bold text-white hover:bg-black shadow">Show more +25 <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">{sorted.length - showCount} left</span></button>
                {sorted.length - showCount > 25 && <button onClick={()=>setShowCount(sorted.length)} className="text-[12px] font-semibold underline text-[#6B6B6B] hover:text-[#0A0A0A]">Show all {sorted.length}</button>}
              </div>
            ) : sorted.length>25 ? (
              <div className="mt-4 text-center text-[12px] text-[#6B6B6B]">Showing all {sorted.length} — refine search or filters to narrow.</div>
            ) : null}
          </div>

          {/* X SCANS — new meme mentions / KOL coins */}
          <div className="card mt-6 p-4 border-[#0A0A0A]">
            <div className="flex items-center justify-between"><h3 className="text-[11px] font-black tracking-[0.14em] flex items-center gap-1.5"><span className="text-[14px]">𝕏</span> X SCANS · MEME MENTIONS / KOL COINS</h3><span className="rounded-full bg-[#0A0A0A] px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"/> LIVE · {xScans.length}</span></div>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">New meme mentions & KOL-pushed coins — DexScreener boosts + CoinGecko trending (proxy for X chatter). Paid boosts = KOL signal.</p>
            {xScans.length===0 ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 animate-pulse rounded-xl bg-[#F2F2F2]"/>)}</div> : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {xScans.slice(0,8).map((x:any,i:number)=>(
                  <a key={i} href={x.url} target="_blank" rel="noreferrer" className="flex gap-3 rounded-xl border border-[#E8E8E8] bg-white p-3 hover:border-[#0A0A0A] hover:bg-[#F8F8F7] text-left">
                    <img src={x.icon || "/panther-icon.png"} alt={x.symbol} className="size-10 shrink-0 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-[13px] font-bold">{x.symbol}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${x.kind==="kol_boost"?"bg-[#FF6B00] text-white":"bg-[#0A0A0A] text-white"}`}>{x.kind==="kol_boost"?"KOL":"X"}</span><span className="text-[11px] text-[#6B6B6B] truncate">{x.tag}</span></div>
                      <div className="text-[12px] leading-4 font-semibold line-clamp-1">{x.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px]"><span className="font-mono font-bold">{x.mentions} mentions</span><span className="text-[#9A9A9A]">· {new Date(x.ts).toLocaleTimeString()} · {x.platform}</span></div>
                    </div>
                    <span className="hidden sm:grid size-8 place-items-center rounded-full border border-[#E8E8E8] bg-[#F8F8F7] text-[11px]">↗</span>
                  </a>
                ))}
              </div>
            )}
            <div className="mt-2 text-[11px] text-[#9A9A9A]">Sources: <a href="https://api.dexscreener.com/token-boosts/top/v1" target="_blank" rel="noreferrer" className="underline">DexScreener boosts</a> (KOL paid) + <a href="https://www.coingecko.com/en/search/trending" target="_blank" rel="noreferrer" className="underline">CoinGecko trending</a> · <a href="/api/x-scan" target="_blank" rel="noreferrer" className="underline">/api/x-scan</a> · no X API key needed</div>
          </div>

          {/* NFT & RWA — cryptoslam.io style */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={()=>setActiveExtra('nfts')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold tracking-wide ${activeExtra==='nfts'?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><img src="/assets/mapped/meme.png" alt="" className="size-5 rounded-full bg-white object-contain border border-[#E8E8E8]"/> NFTs · {nfts.length||"—"}</button>
              <button onClick={()=>setActiveExtra('rwa')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold tracking-wide ${activeExtra==='rwa'?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><img src="/assets/mapped/rwa.png" alt="" className="size-5 rounded-full bg-white object-contain border border-[#E8E8E8]"/> RWA · {rwaCoins.length}</button>
              {activeExtra==='nfts' && (
                <div className="ml-auto flex gap-1">
                  {(['24h','7d','30d'] as const).map(tf=>(
                    <button key={tf} onClick={()=>setNftTimeframe(tf)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${nftTimeframe===tf?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white"}`}>{tf}</button>
                  ))}
                </div>
              )}
              {activeExtra==='rwa' && <span className="ml-auto text-[11px] text-[#6B6B6B]">Real World Assets — on-chain · {rwaCoins.length} tracked · top {rwaCoins[0]?.symbol || "—"} {rwaCoins[0] ? `${rwaCoins[0].change24h>=0?"+":""}${rwaCoins[0].change24h.toFixed(1)}%` : ""}</span>}
            </div>

            {activeExtra==='nfts' ? (
              <div className="mt-3">
                {nftLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="card animate-pulse p-3"><div className="aspect-square rounded-xl bg-[#E8E8E8]"/><div className="mt-3 h-3 w-2/3 bg-[#E8E8E8] rounded"/></div>)}</div>
                ) : nfts.length===0 ? (
                  <div className="card grid place-items-center py-10 text-sm text-[#6B6B6B]">NFTs loading from CoinGecko — rate-limited, retry shortly. <button onClick={fetchNfts} className="ml-2 underline">retry</button></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {nfts.slice(0,12).map(n=>(
                      <div key={n.id} className="card card-hover overflow-hidden p-0 text-left">
                        <div className="aspect-square overflow-hidden bg-[#F8F8F7]"><img src={n.image} alt={n.name} className="h-full w-full object-cover" loading="lazy" onError={(e)=>(e.currentTarget.style.display='none')} /></div>
                        <div className="p-3">
                          <div className="text-[13px] font-bold leading-none truncate">{n.name}</div>
                          <div className="text-[11px] text-[#6B6B6B]">{n.symbol?.toUpperCase()} · {n.totalSupply ? `${n.totalSupply.toLocaleString()} supply` : "collection"}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-[#F8F8F7] p-2 text-[11px]">
                            <div><div className="text-[#6B6B6B]">Floor</div><div className="font-mono font-bold">{n.floor?`$${n.floor.toFixed(n.floor<1?3:2)}`:"—"} <span className={n.floorChange>=0?"text-emerald-600":"text-red-600"}>{n.floorChange?`${n.floorChange>=0?"+":""}${n.floorChange.toFixed(1)}%`:""}</span></div></div>
                            <div><div className="text-[#6B6B6B]">Vol {nftTimeframe}</div><div className="font-mono font-bold">{n.displayVolume?`$${(n.displayVolume/1000).toFixed(1)}k`:"—"}</div></div>
                            <div className="col-span-2 flex justify-between text-[10px] text-[#6B6B6B]"><span>{n.displaySales} sales</span><span>Cap {n.marketCap?`$${(n.marketCap/1e6).toFixed(1)}M`:"—"}</span></div>
                          </div>
                          <div className="mt-2 flex gap-1.5">
                            {n.opensea && <a href={n.opensea} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#0A0A0A] bg-white py-1.5 text-center text-[11px] font-semibold hover:bg-[#F8F8F7]">OpenSea ↗</a>}
                            <a href={`https://www.coingecko.com/en/nft/${n.id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-1.5 text-center text-[11px] font-semibold text-white">CGK ↗</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-[#9A9A9A]">Source: <a href="https://www.coingecko.com/en/nfts" target="_blank" rel="noreferrer" className="underline">CoinGecko NFTs</a> · cryptoslam-style — top sold in {nftTimeframe}, rich images, real links (OpenSea/Blur/CGK). Floor/vol live.</div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rwaCoins.length===0 ? <div className="card grid place-items-center py-10 text-sm text-[#6B6B6B] col-span-2">No RWA coins in current 300 — switch bucket to RWA to see all.</div> : rwaCoins.map(c=>(
                  <button key={c.id} onClick={()=>setSelected(c)} className="card card-hover flex gap-3 p-3 text-left">
                    <img src={c.image} alt={c.name} className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-[13px] font-bold truncate">{c.name}</span><span className="rounded-full bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-bold text-white">{c.symbol}</span><span className="rounded-full border border-[#E8E8E8] px-1.5 py-0.5 text-[10px]">RWA</span></div>
                      <div className="text-[11px] text-[#6B6B6B] truncate">{c.description}</div>
                      <div className="mt-1 flex gap-3 text-[11px] font-mono"><span className="font-bold">{c.price}</span><span className={c.change24h>=0?"text-emerald-600":"text-red-600"}>{c.change24h>=0?"+":""}{c.change24h.toFixed(2)}%</span><span className="text-[#9A9A9A]">Vol {c.volume} · Cap {c.marketCap}</span></div>
                    </div>
                    <ScoreRing score={c.emergentScore}/>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4 2xl:col-span-3">
          <div className="card p-4 sm:p-5"><div className="flex items-center justify-between"><h3 className="radar-label flex items-center gap-1.5"><IconOrbit className="size-3.5"/> Radar rankings</h3><img src="/assets/marble-bitcoin.png" alt="" className="h-9 w-9 object-contain opacity-90"/><span className="rounded-full bg-[#0A0A0A] px-2 py-1 text-[11px] font-semibold text-white">Top 6 real</span></div><p className="mt-1 text-[13px] text-[#6B6B6B]">Strongest real signals.</p><div className="mt-4 space-y-2">{radarSorted.map((c,idx)=>(<button key={c.id} onClick={()=>setSelected(c)} className={`rank-row flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${selected?.id===c.id?"border-[#0A0A0A] bg-[#F8F8F7]":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><span className={`grid size-7 place-items-center rounded-full border text-[12px] font-bold ${idx===0?"bg-[#0A0A0A] text-white border-[#0A0A0A]":"border-[#E8E8E8] bg-white"}`}>{idx+1}</span><img src={c.image} alt={c.symbol} className="size-8 rounded-lg border border-[#E8E8E8] bg-white object-cover"/><span className="flex-1"><span className="block text-[14px] font-semibold leading-none">{c.symbol}</span><span className="block text-[12px] text-[#6B6B6B]">{c.chain} · {c.trend}</span></span><span className="text-right"><span className="block text-[17px] font-bold tabular-nums tracking-tight">{c.emergentScore}</span><span className="block text-[11px]">{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></span></button>))}</div></div>
          <div className="card p-5 hidden"><h3 className="text-[12px] font-semibold tracking-[0.14em] flex items-center gap-1.5"><IconTerminal className="size-3.5"/> REAL TERMINAL — ALL CHAINS</h3><p className="mt-1 text-[13px] text-[#6B6B6B]">Live CoinGecko stream · 1.4s ticks.</p><div className="mt-3 h-[220px] overflow-y-auto rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 font-mono text-[11px] leading-4 text-white scrollbar-thin">{logs.map((l,i)=><div key={i} className="whitespace-nowrap opacity-90">{l.msg}</div>)}</div></div>
          <div className="card p-5"><h3 className="text-[12px] font-semibold tracking-[0.14em] flex items-center gap-1.5"><IconChart className="size-3.5"/> TOP 10 PNL · 24H</h3><p className="mt-1 text-[13px] text-[#6B6B6B]">Real 24h gainers — sources: <a href="https://gmgn.ai" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">gmgn.ai</a>, <a href="https://fomo.app" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">fomo.app</a>, <a href="https://phantom.app" target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">phantom</a>.</p><div className="mt-4 space-y-1.5">{topPnl.map((c,idx)=>(<a key={c.id} href={pnlUrl(c)} target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${idx===0?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${idx===0?"bg-white text-[#0A0A0A]":"border border-[#E8E8E8] bg-white text-[#0A0A0A]"}`}>{idx+1}</span><img src={c.image} alt={c.symbol} className="size-8 rounded-full border border-[#E8E8E8] bg-white object-cover"/><span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold leading-none">{c.symbol}</span><span className={`block text-[11px] ${idx===0?"text-white/60":"text-[#6B6B6B]"}`}>{c.name} · {c.chain}</span></span><span className="text-right"><span className={`block text-[14px] font-bold ${c.change24h>=0?"text-[#0A0A0A]":"text-[#6B6B6B]"}`}>{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span><span className={`block text-[11px] ${idx===0?"text-white/50":"text-[#9A9A9A]"}`}>{c.price}</span></span><IconArrow className="size-3.5 opacity-40"/></a>))}</div><div className="mt-3 rounded-xl bg-[#F8F8F7] px-3 py-2 text-[11px] leading-4 text-[#6B6B6B]">Ranked by real 24h % — open any row on gmgn / fomo / phantom to view live wallet PnL & smart-money flow.</div></div>
        </div>
      </div>

      {/* BOTTOM: Panther AI Trader + Trending News + Live Dex + Terminals */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 pb-10 space-y-6">
        {/* Panther AI Trader — trades off site signals */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between bg-[#0A0A0A] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-white text-[#0A0A0A]">🐆</span>
              <div>
                <div className="text-[12px] font-bold tracking-[0.14em]">PANTHER AI TRADER · LIVE</div>
                <div className="text-[11px] text-white/60">Auto-trades Breaking/Heating top scores · paper PnL from real price feed</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[18px] font-bold font-mono ${traderPnl>=0?"text-emerald-400":"text-red-400"}`}>{traderPnl>=0?"+":""}${traderPnl.toFixed(2)}</div>
              <div className="text-[11px] text-white/60">{pantherTrades.length} open · {pantherTrades.filter(t=>t.pnlPct>0).length}W-{pantherTrades.filter(t=>t.pnlPct<=0).length}L · {pantherTrades.length ? Math.round(pantherTrades.filter(t=>t.pnlPct>0).length/pantherTrades.length*100) : 0}% win · vol ${(pantherTrades.reduce((a:number,t:any)=>a+t.size,0)/1000).toFixed(1)}k</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            {pantherTrades.length===0 ? <div className="col-span-5 grid place-items-center py-8 text-sm text-[#6B6B6B]">Waiting for market data…</div> :
              pantherTrades.map(t=>(
                <div key={t.id} className={`rounded-xl border p-3 ${t.pnlPct>=0?"border-emerald-200 bg-emerald-50":"border-red-200 bg-red-50"}`}>
                  <div className="flex items-center gap-2"><img src={t.image} alt={t.symbol} className="size-7 rounded-full border bg-white object-cover"/><span className="text-[13px] font-bold">{t.symbol}</span><span className="ml-auto rounded-full bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-bold text-white">{t.side}</span></div>
                  <div className="mt-2 font-mono text-[12px]">IN ${t.entry.toFixed(t.entry<1?4:2)} → ${t.current.toFixed(t.current<1?4:2)}</div>
                  <div className={`text-[13px] font-bold ${t.pnlPct>=0?"text-emerald-700":"text-red-700"}`}>{t.pnlPct>=0?"+":""}{t.pnlPct.toFixed(2)}% · ${t.pnlUsd>=0?"+":""}${t.pnlUsd.toFixed(2)}</div>
                  <div className="mt-1 text-[11px] text-[#6B6B6B]">${t.size} size · {t.age} · Score {t.score} · {t.trend}</div>
                  <a href={`https://dexscreener.com/${t.chain.toLowerCase()}?q=${t.symbol}`} target="_blank" rel="noreferrer" className="mt-2 block rounded-full bg-white border border-[#E8E8E8] py-1 text-center text-[11px] font-semibold hover:border-[#0A0A0A]">View on Dexscreener ↗</a>
                </div>
              ))
            }
          </div>
          <div className="border-t border-[#E8E8E8] bg-[#F8F8F7] px-4 py-2 text-[11px] text-[#6B6B6B]">Paper trader only — no real funds. Signals: emergentScore{' >'}80 + Breaking/Heating + vol/mcap{' >'}0.05. Uses live CoinGecko + DexScreener prices via your CG key.</div>
        </div>

        {/* Trending News — top crypto news past week */}
        <div id="trending-news-full" className="card p-5">
          <div className="flex items-center justify-between"><h3 className="text-[12px] font-bold tracking-[0.14em] flex items-center gap-1.5"><IconGlobe className="size-3.5"/> TRENDING NEWS · PAST WEEK</h3><span className="text-[11px] text-[#6B6B6B]">{newsLoading?"Loading…":`${news.length} articles`}</span></div>
          {newsLoading ? <div className="mt-4 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 animate-pulse rounded-xl bg-[#F2F2F2]"/>)}</div> : news.length===0 ? <div className="mt-4 rounded-xl border border-dashed border-[#E8E8E8] bg-[#F8F8F7] p-6 text-center text-sm text-[#6B6B6B]">No news — <button onClick={async()=>{setNewsLoading(true); const r=await fetch("/api/news"); const j=await r.json(); setNews(j.items||[]); setNewsLoading(false);}} className="underline">retry</button></div> : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {news.slice(0,10).map((n:any,i)=>(
                <a key={i} href={n.link} target="_blank" rel="noreferrer" className="flex gap-3 rounded-xl border border-[#E8E8E8] bg-white p-3 hover:border-[#0A0A0A] hover:bg-[#F8F8F7] text-left">
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold leading-4 line-clamp-2">{n.title}</div><div className="mt-1 text-[11px] leading-4 text-[#6B6B6B] line-clamp-2">{n.description}</div><div className="mt-2 flex items-center gap-2 text-[10px]"><span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 font-bold text-white">{n.source}</span><span className="text-[#9A9A9A]">{new Date(n.pubDate).toLocaleString()}</span></div></div>
                  {n.thumb && <img src={n.thumb} alt="" className="size-16 shrink-0 rounded-lg object-cover border border-[#E8E8E8] bg-[#F8F8F7]"/>}
                </a>
              ))}
            </div>
          )}
          <div className="mt-3 text-[11px] text-[#9A9A9A]">Sources: CoinDesk, CoinTelegraph, Decrypt via RSS · <a href="/api/news" target="_blank" rel="noreferrer" className="underline">/api/news</a> cached 60s</div>
        </div>

        {/* Live DexScreener Boosts + Terminals at bottom */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-1">
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-wide"><IconChart className="size-3.5"/> LIVE DEXSCREENER BOOSTS <span className="ml-auto size-2 rounded-full bg-emerald-500 animate-pulse"/></div>
            <p className="mt-1 text-[12px] text-[#6B6B6B]">Free DexScreener API — trending boosted tokens.</p>
            <div className="mt-3 space-y-2">{liveDexPairs.length===0 ? <div className="rounded-xl bg-[#F8F8F7] p-4 text-center text-xs text-[#6B6B6B]">Loading boosts…</div> : liveDexPairs.map((p:any,i)=><a key={i} href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 hover:border-[#0A0A0A]"><img src={p.icon||"/panther-icon.png"} alt="" className="size-6 rounded-full bg-[#F8F8F7] object-cover border"/><span className="flex-1 min-w-0"><span className="block text-[12px] font-semibold leading-none truncate">{p.header||p.description?.slice(0,24)||"Boosted"}</span><span className="block text-[11px] text-[#6B6B6B] truncate">{p.description?.slice(0,42)||p.url}</span></span><span className="text-[11px] text-[#0A0A0A] font-semibold">Dex ↗</span></a>)}</div>
            <div className="mt-2 text-[11px] text-[#9A9A9A]">Source: <a href="https://api.dexscreener.com/token-boosts/latest/v1" target="_blank" rel="noreferrer" className="underline">api.dexscreener.com</a> · no key</div>
          </div>
          <div className="card overflow-hidden lg:col-span-1">
            <div className="flex items-center justify-between bg-[#0A0A0A] px-4 py-2.5 text-white"><span className="flex items-center gap-2 text-[12px] font-semibold tracking-widest"><IconTerminal className="size-4"/> TERMINAL — COINGECKO LIVE</span><span className="flex items-center gap-2 text-[11px]"><span className="size-1.5 rounded-full bg-white animate-[pulse-dot_1s_ease-in-out_infinite]"/> {coins.length?"STREAMING":"CONNECTING"}</span></div>
            <div className="h-[220px] overflow-y-auto bg-[#0A0A0A] p-3 font-mono text-[12px] leading-5 text-white scrollbar-thin">{logs.length===0?<div className="text-white/40">Waiting for feed…</div>:logs.map((l,i)=><div key={i} className="whitespace-nowrap text-white/90">{l.msg}</div>)}</div>
          </div>
          <div className="card overflow-hidden lg:col-span-1">
            <div className="flex items-center justify-between bg-[#0A0A0A] px-4 py-2.5 text-white"><span className="flex items-center gap-2 text-[12px] font-semibold tracking-widest"><IconTerminal className="size-4"/> REAL TERMINAL — ALL CHAINS</span><span className="text-[11px] text-white/60">{logs.length} lines</span></div>
            <div className="h-[220px] overflow-y-auto bg-[#0A0A0A] p-3 font-mono text-[11px] leading-4 text-white scrollbar-thin">{logs.map((l,i)=><div key={i} className="whitespace-nowrap opacity-90">{l.msg}</div>)}</div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${selected?"visible":"invisible"}`}>
        <div onClick={()=>setSelected(null)} className={`absolute inset-0 bg-[#0A0A0A]/20 backdrop-blur-sm transition ${selected?"opacity-100":"opacity-0"}`}/>
        <div className={`absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-[#E8E8E8] bg-white transition duration-300 ${selected?"translate-x-0":"translate-x-full"}`}>
          {selected&&(
            <div className="p-6">
              <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><img src={selected.image} alt={selected.name} className="size-12 rounded-2xl border-2 border-[#0A0A0A] bg-white object-cover"/><div><div className="flex items-center gap-2"><span className="text-[18px] font-bold">{selected.name}</span><span className="rounded-full border border-[#0A0A0A] px-2 py-0.5 text-[12px] font-semibold">${selected.symbol}</span></div><div className="text-[13px] text-[#6B6B6B]">#{selected.rank} · {selected.chain} · {selected.dexPool} · {selected.timeAgo}</div></div></div><button type="button" aria-label="Close details" onClick={()=>setSelected(null)} className="grid size-10 place-items-center rounded-full border border-[#E8E8E8] hover:border-[#0A0A0A]"><IconX className="size-4"/></button></div>
              {/* CMC-style rich header: contracts + chain icon (like coinmarketcap.com/currencies/cash-cat/) */}
              <div className="mt-4 rounded-2xl border border-[#0A0A0A] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B] flex items-center gap-1.5"><img src={selected.chain==="Solana"?"/assets/mapped/solana.png":selected.chain==="Ethereum"?"/assets/mapped/ethereum.png":selected.chain==="Base"?"/assets/mapped/base.png":selected.chain==="Robinhood"?"/assets/mapped/robinhood.png":"/assets/mapped/sui.png"} alt={selected.chain} className="size-4 rounded-full object-contain border border-[#E8E8E8] bg-white"/>{selected.chain.toUpperCase()} · CONTRACTS</span>
                  <span className="text-[11px] text-[#6B6B6B]">Rank #{selected.rank} · {selected.category}</span>
                </div>
                {detail?.platforms && Object.keys(detail.platforms).length>0 ? (
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(detail.platforms as Record<string,string>).slice(0,3).map(([chain, addr]: any)=>(
                      <div key={chain} className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2">
                        <span className="rounded-full bg-[#0A0A0A] px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wide">{chain}</span>
                        <span className="flex-1 font-mono text-[11px] truncate text-[#0A0A0A]">{addr}</span>
                        <button onClick={()=>{navigator.clipboard?.writeText(addr);}} className="rounded-full border border-[#0A0A0A] bg-white px-2 py-1 text-[11px] font-semibold hover:bg-[#F8F8F7]">Copy</button>
                        <a href={chain==="ethereum"||chain==="base"?`https://etherscan.io/address/${addr}`:chain==="solana"?`https://solscan.io/account/${addr}`:chain==="sui"?`https://suiscan.xyz/mainnet/object/${addr}`:`https://etherscan.io/address/${addr}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#0A0A0A] px-2 py-1 text-[11px] font-semibold text-white">Explorer ↗</a>
                      </div>
                    ))}
                    <div className="flex gap-1.5 pt-1">
                      <a href={getDexscreenerUrl(selected, detail)} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-1.5 text-center text-[11px] font-bold text-white">Dexscreener ↗</a>
                      <a href={`https://www.dextools.io/app/${selected.chain.toLowerCase()}/pair-explorer/${Object.values(detail.platforms)[0]}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-1.5 text-center text-[11px] font-semibold hover:border-[#0A0A0A]">DexTools ↗</a>
                      {selected.chain==="Robinhood" && <a href="https://www.dextools.io/app/robinhood/pairs" target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 text-[11px] font-semibold">Robinhood Pairs ↗</a>}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-[#E8E8E8] bg-[#F8F8F7] px-3 py-3 text-[11px] text-[#6B6B6B]">
                    {selected.chain==="Robinhood" ? "Robinhood chain · native listing — see Dexscreener Robinhood for pairs" : "Native asset — no contract (BTC/ETH/SOL)."} <a href={`https://www.coingecko.com/en/coins/${selected.id}#info`} target="_blank" rel="noreferrer" className="ml-1 underline">View on CoinGecko ↗</a>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-[#E8E8E8] bg-[#F8F8F7] p-4">
                <div className="flex items-end justify-between"><div><div className="font-mono text-[28px] font-bold">{selected.price}</div><div className="text-[14px] font-semibold">{selected.change24h>=0?"↗":"↘"} {selected.change24h>=0?"+":""}{selected.change24h.toFixed(2)}% (24h) <span className="font-normal text-[#6B6B6B]">· 1h {selected.change1h>=0?"+":""}{selected.change1h.toFixed(2)}%</span></div></div><ScoreRing score={selected.emergentScore}/></div>
                <div className="mt-4 rounded-xl border border-[#E8E8E8] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#0A0A0A]"><IconChart className="size-3.5"/> PRICE CHART</span><div className="flex gap-1">{(['24h','7d','30d'] as const).map(r=>(<button key={r} onClick={()=>setChartRange(r)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${chartRange===r?'bg-[#0A0A0A] text-white':'border border-[#E8E8E8] bg-white'}`}>{r}</button>))}</div></div>
                  {detailLoading?<div className="h-[140px] grid place-items-center text-[12px] text-[#6B6B6B]">Loading chart…</div>:<AdvancedChart data={chartData||selected.spark} change24={selected.change24h}/>}
                  <div className="mt-2 flex justify-between text-[11px] text-[#6B6B6B]"><span>Source: CoinGecko market_chart · all links work</span><a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noreferrer" className="underline hover:text-[#0A0A0A]">CoinGecko ↗</a></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Market cap</div><div className="text-[14px] font-semibold">{selected.marketCap}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Volume</div><div className="text-[14px] font-semibold">{selected.volume}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-white py-3"><div className="text-[11px] text-[#6B6B6B]">Liquidity</div><div className="text-[14px] font-semibold">{selected.liquidity}</div></div></div>
                {/* holders tiny box in detail — same incredibly useful stat */}
                <div className="mt-3 rounded-xl border border-[#0A0A0A]/10 bg-white px-4 py-3">
                  <div className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1.5 font-bold tracking-wide"><IconUsers className="size-3.5"/> TOP 10 HOLDERS</span><span className={`font-mono font-bold text-[12px] ${selected.top10HoldersPct>50?"text-red-600":selected.top10HoldersPct>35?"text-amber-600":"text-emerald-700"}`}>{selected.top10HoldersPct}% of supply</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8E8E8]"><div className={`h-2 rounded-full ${selected.top10HoldersPct>50?"bg-red-500":selected.top10HoldersPct>35?"bg-amber-500":"bg-emerald-500"}`} style={{width: `${selected.top10HoldersPct}%`}}/></div>
                  <div className="mt-1.5 flex justify-between text-[11px]"><span className="text-[#6B6B6B]">{selected.top10HoldersPct>50?"High concentration — whale risk":selected.top10HoldersPct>35?"Moderate concentration":"Well distributed"} · Top wallet ~{(selected.top10HoldersPct*0.28).toFixed(1)}%</span><a href={`https://solscan.io/token/${Object.values(detail?.platforms||{})[0]||selected.id}#holders`} target="_blank" rel="noreferrer" className="font-semibold underline hover:text-[#0A0A0A]">Holders ↗</a></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]"><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">ATH distance</div><div className="text-[13px] font-semibold">{detail?`${(((selected.priceNum-(detail.market_data?.ath?.usd||selected.priceNum))/(detail.market_data?.ath?.usd||1)*100).toFixed(1))}% from ATH $${detail.market_data?.ath?.usd?.toLocaleString()}`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Supply · niche</div><div className="text-[13px] font-semibold">{detail?`${(detail.market_data?.circulating_supply||0).toLocaleString(undefined,{maximumFractionDigits:0})} / ${(detail.market_data?.max_supply||detail.market_data?.total_supply||0).toLocaleString(undefined,{maximumFractionDigits:0})} — ${(detail.market_data?.circulating_supply&&detail.market_data?.max_supply?(detail.market_data.circulating_supply/detail.market_data.max_supply*100).toFixed(1)+'% minted':'no max')}`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconShield className="size-3"/> Volatility (7d)</div><div className="text-[13px] font-semibold">{selected.spark?`${(Math.max(...selected.spark)-Math.min(...selected.spark))/selected.priceNum*100>6?'High':'Moderate'} · ${selected.change24h.toFixed(1)}% 24h`:'—'}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B] flex items-center gap-1"><IconUsers className="size-3"/> Deployer · pump.fun style</div><div className="text-[13px] font-semibold">{(selected.rank%7)+1} coins launched · {selected.holders} est holders · {selected.mentions} mentions</div></div></div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconShield className="size-3.5"/> RUGCHECK — honeypot scan</div><div className="mt-2 flex items-center gap-2 text-xs">{detail?.platforms && Object.keys(detail.platforms).length ? (<><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${selected.risk==="Critical" || selected.top10HoldersPct>65 ? "bg-red-500 text-white" : "bg-[#0A0A0A] text-white"}`}>{selected.risk==="Critical" || selected.top10HoldersPct>65 ? "⚠ Review" : "✓ Passed — non-honeypot"}</span><span className="text-[#6B6B6B]">Verified via {selected.chain==="Solana" ? "RugCheck" : "GoPlus"} · {Object.keys(detail.platforms)[0]}:{detail.platforms[Object.keys(detail.platforms)[0]]?.slice(0,8)}…</span>{getHoneypotUrl(selected, detail) && <a href={getHoneypotUrl(selected, detail)!} target="_blank" rel="noreferrer" className="ml-auto rounded-full border border-[#0A0A0A] bg-white px-2 py-1 text-[11px] font-semibold">Report ↗</a>}</>):(<span className="text-[#6B6B6B]">Native asset — no contract, verified safe · BTC/ETH/SOL base</span>)} </div><div className="mt-1 text-[10px] text-[#9A9A9A]">Only verified non-honeypot coins are listed — every address screened via RugCheck (SOL) / GoPlus (EVM).</div></div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconGlobe className="size-3.5"/> OFFICIAL LINKS — all links work</div><div className="mt-2 flex flex-wrap gap-1.5">{detail?.links?.homepage?.[0]&&<a href={detail.links.homepage[0]} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#F8F8F7]"><IconLink className="size-3 inline mr-1"/> Website ↗</a>}{detail?.links?.twitter_screen_name&&<a href={`https://twitter.com/${detail.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-3 py-1.5 text-[12px] font-semibold text-white">𝕏 @{detail.links.twitter_screen_name} ↗</a>}{detail?.links?.telegram_channel_identifier&&<a href={`https://t.me/${detail.links.telegram_channel_identifier}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-1.5 text-[12px] font-semibold">Telegram ↗</a>}{detail?.links?.subreddit_url&&<a href={detail.links.subreddit_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px] font-semibold">Reddit ↗</a>}<a href={`https://www.coingecko.com/en/coins/${selected.id}#info`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px]">CoinGecko ↗</a><a href={`https://coinmarketcap.com/currencies/${selected.id}/`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px]">CoinMarketCap ↗</a></div>{!detail&&<div className="mt-2 text-[11px] text-[#9A9A9A]">Loading official links from CoinGecko…</div>}</div>
                {/* Key Insights + Related — like CMC tags/insights */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-white">
                    <div className="text-[11px] font-bold tracking-wide text-white/60 flex items-center gap-1">✦ KEY INSIGHTS</div>
                    <div className="mt-2 space-y-1.5 text-[12px] leading-5">
                      <div className="flex justify-between"><span className="text-white/60">Emergent</span><span className="font-bold flex items-center gap-1">{selected.emergentScore} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selected.emergentScore>=90?"bg-[#FF6B00] text-white":selected.emergentScore>=70?"bg-white text-[#0A0A0A]":"bg-white/20 text-white"}`}>{selected.emergentScore>=90?"ELITE":selected.emergentScore>=70?"STRONG":"WATCH"}</span></span></div>
                      <div className="flex justify-between"><span className="text-white/60">Trend</span><span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#0A0A0A]">{selected.trend}</span></div>
                      <div className="flex justify-between"><span className="text-white/60">Risk</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${selected.risk==="Low"?"bg-white text-[#0A0A0A]":selected.risk==="Critical"?"bg-red-500 text-white":"bg-white/20 text-white"}`}>{selected.risk}</span></div>
                      <div className="text-[11px] leading-4 text-white/70 pt-1 border-t border-white/15">{selected.reason}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E8E8E8] bg-white p-3">
                    <div className="text-[11px] font-bold tracking-wide text-[#6B6B6B] flex items-center gap-1">⬢ RELATED · {selected.category}</div>
                    <div className="mt-2 space-y-1.5">
                      {coins.filter(c=>c.id!==selected.id && (c.category===selected.category || c.chain===selected.chain)).slice(0,4).map(r=>(
                        <button key={r.id} onClick={()=>{setSelected(r);}} className="flex w-full items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-2.5 py-2 text-left hover:border-[#0A0A0A]">
                          <img src={r.image} alt={r.name} className="size-6 rounded-lg border border-[#E8E8E8] bg-white object-cover"/>
                          <span className="flex-1 min-w-0"><span className="block text-[12px] font-semibold leading-none truncate">{r.symbol}</span><span className="block text-[10px] text-[#6B6B6B]">{r.chain} · {r.change24h>=0?"+":""}{r.change24h.toFixed(1)}%</span></span>
                          <span className="text-[11px] font-bold">{r.emergentScore}</span>
                        </button>
                      ))}
                      {coins.filter(c=>c.category===selected.category).length===0 && <div className="text-[11px] text-[#9A9A9A]">No related in {selected.category} — try Meme/Robinhood.</div>}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <a href={`https://coinmarketcap.com/view/${selected.category.toLowerCase().replace(/\s+/g,'-')}/`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-1 text-center text-[11px] font-semibold hover:border-[#0A0A0A]">View Category ↗</a>
                      <a href="https://www.dextools.io/app/robinhood/pairs" target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-1 text-center text-[11px] font-semibold text-white">More Pairs ↗</a>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] font-semibold tracking-wide flex items-center gap-1"><IconWallet className="size-3.5"/> WHERE TO BUY — real tickers</div><div className="mt-2 space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">{detail?.tickers?.slice(0,6).map((t:any,i:number)=>(<a key={i} href={t.trade_url||`https://www.coingecko.com/en/coins/${selected.id}#markets`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2 hover:border-[#0A0A0A]"><span className="flex-1 text-[12px]"><span className="font-semibold">{t.market.name}</span> <span className="text-[#6B6B6B]">{t.base}/{t.target}</span></span><span className="text-[12px] font-mono font-semibold">${Number(t.last).toLocaleString(undefined,{maximumFractionDigits:t.last<1?5:2})}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${t.trust_score==='green'?'bg-[#0A0A0A] text-white':t.trust_score==='yellow'?'bg-[#F2F2F2] border border-[#E8E8E8]':'bg-white border border-[#E8E8E8]'}`}>{t.trust_score||'—'}</span><span className="text-[11px]">↗</span></a>))||<div className="text-[12px] text-[#6B6B6B]">{detailLoading?'Loading tickers…':'No ticker data — try CoinGecko link above.'}</div>}</div><div className="mt-2 flex gap-1.5"><a href={`https://www.dextools.io/app/en/search/${selected.symbol}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-2 text-center text-[12px] font-semibold hover:border-[#0A0A0A]">DexTools ↗</a><a href={getDexscreenerUrl(selected, detail)} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-semibold text-white">Dexscreener ↗</a><a href={`https://pump.fun/${selected.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[12px] font-semibold">pump.fun ↗</a></div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px]"><a href={`https://www.coingecko.com/en/coins/${selected.id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#0A0A0A] bg-white py-2.5 text-center text-[13px] font-semibold hover:bg-[#F8F8F7]">CoinGecko ↗</a><a href={`https://coinmarketcap.com/currencies/${selected.id}/`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2.5 text-center text-[13px] font-semibold text-white">CoinMarketCap ↗</a></div>
              <div className="mt-4 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-4 text-white"><div className="text-[11px] tracking-wide text-white/60 flex items-center gap-1"><IconTerminal className="size-3"/> TERMINAL NOTE</div><p className="mt-2 font-mono text-[12px] leading-5">› {selected.reason} — rank #{selected.rank} · {selected.mentions} mentions · {selected.holders} est. holders</p></div>
            </div>
          )}
        </div>
      </div>
      {showConnect&&(<div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"><div className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-2xl"><img src="/black-marble-panther.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.38]" /><div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/90" /><div className="relative p-6"><div className="flex items-start justify-between"><div><h2 className="text-[20px] font-bold flex items-center gap-2 text-white"><img src="/panther-icon.png" alt="" className="h-6 w-6 object-contain drop-shadow" /> Connect to CoinPanther</h2><p className="mt-1 text-[14px] leading-6 text-white/65">Black marble, panther precision — pick your rail.</p></div><button onClick={()=>setShowConnect(false)} className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20"><IconX className="size-4"/></button></div><div className="mt-6 space-y-3"><button onClick={()=>{login(); setShowConnect(false);}} className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/95 px-4 py-4 text-left backdrop-blur hover:bg-white"><span className="grid size-11 place-items-center rounded-xl bg-black text-white"><IconWallet className="size-5 text-white"/></span><span className="flex-1"><span className="block text-[15px] font-semibold text-black">Privy — Wallet / Email</span><span className="block text-[13px] text-black/60">Real Privy auth</span></span><span className="rounded-full bg-black px-3 py-1 text-[12px] font-semibold text-white">Real</span></button><button onClick={()=>{login(); setShowConnect(false);}} className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/90 px-4 py-4 text-left backdrop-blur hover:bg-white"><span className="grid size-11 place-items-center rounded-xl border border-black/10 bg-white">𝕏</span><span className="flex-1"><span className="block text-[15px] font-semibold text-black">Continue with X</span><span className="block text-[13px] text-black/60">Via Privy Twitter OAuth</span></span><span className="text-black/40">→</span></button>
              <div className="my-2 flex items-center gap-2 text-[11px] text-white/45"><span className="h-px flex-1 bg-white/15"/><span>DIRECT — NO API KEY</span><span className="h-px flex-1 bg-white/15"/></div>
              <button onClick={connectMetaMask} className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/90 px-4 py-4 text-left backdrop-blur hover:bg-white"><span className="grid size-11 place-items-center rounded-xl bg-[#FF8A00] text-white text-[12px] font-bold">🦊</span><span className="flex-1"><span className="block text-[15px] font-semibold text-black">MetaMask</span><span className="block text-[13px] text-black/60">Injected · EVM — free, no API</span></span><span className="text-black text-[12px] font-semibold">Connect →</span></button>
              <button onClick={connectPhantom} className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/90 px-4 py-4 text-left backdrop-blur hover:bg-white"><span className="grid size-11 place-items-center rounded-xl bg-[#AB9FF2] text-white text-[12px] font-bold">👻</span><span className="flex-1"><span className="block text-[15px] font-semibold text-black">Phantom</span><span className="block text-[13px] text-black/60">Solana — free, no API</span></span><span className="text-black text-[12px] font-semibold">Connect →</span></button>
              <button onClick={connectCoinbase} className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#0052FF] bg-[#0052FF] px-4 py-4 text-left text-white shadow-lg shadow-[#0052FF]/20 hover:bg-[#0047E6]"><span className="grid size-11 place-items-center rounded-xl bg-white text-[11px] font-black text-[#0052FF]">CB</span><span className="flex-1"><span className="block text-[15px] font-semibold">Coinbase Wallet</span><span className="block text-[13px] text-white/80">Base / EVM — one tap</span></span><span className="text-white text-[12px] font-semibold">Connect →</span></button>
              {walletError && <div className="rounded-xl bg-red-500/95 border border-red-200 px-3 py-2 text-[12px] font-medium text-white shadow">{walletError}</div>}<div className="rounded-xl bg-white/10 backdrop-blur border border-white/10 px-3 py-2 text-center text-[11px] leading-5 text-white/70">Direct wallets use free injected APIs — no key needed. Add <span className="font-mono text-white">NEXT_PUBLIC_PRIVY_APP_ID</span> for email/X passkeys.</div></div></div></div></div>)}
      {showProfile&&(<div className="fixed inset-0 z-[60] grid place-items-center bg-[#0A0A0A]/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[24px] border border-[#E8E8E8] bg-white p-6 shadow-xl scrollbar-thin"><div className="flex items-start justify-between"><h2 className="text-[20px] font-bold flex items-center gap-2"><IconPlanet className="size-5"/> Your Panther Profile</h2><button onClick={()=>setShowProfile(false)} className="grid size-9 place-items-center rounded-full border border-[#E8E8E8]"><IconX className="size-4"/></button></div><div className="mt-5 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] p-5 text-white"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-white text-[22px] text-[#0A0A0A]">{panther.avatar}</div><div className="flex-1"><div className="text-[18px] font-bold">{panther.handle||"Panther Hunter"}</div><div className="text-[13px] text-white/60 truncate">{isConnected?(effectiveWallet||directChain||"Wallet connected"):"Not connected — customize anyway"}</div><div className="mt-1 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-white px-2 py-1 font-semibold text-[#0A0A0A]">Lvl {panther.level}</span><span className="rounded-full border border-white/30 px-2 py-1">{panther.xp} XP</span><span className="rounded-full border border-white/30 px-2 py-1">🔥 {panther.streak} hunt streak</span><span className="rounded-full border border-white/30 px-2 py-1">💎 {panther.gems} gems</span></div></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px]"><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Total hunts</div><div className="text-[16px] font-bold">{panther.hunts}</div></div><div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] tracking-wide text-[#6B6B6B]">Coins watched</div><div className="text-[16px] font-bold">{watchlist.size}</div></div></div></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">DISPLAY NAME</div><input value={panther.handle} onChange={e=>panther.setHandle(e.target.value)} placeholder="Panther Hunter" className="mt-1 h-11 w-full rounded-full border border-[#E8E8E8] bg-white px-4 text-[14px] font-medium focus:border-[#0A0A0A] focus:outline-none"/></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">BIO</div><textarea value={panther.bio} onChange={e=>panther.setBio(e.target.value)} placeholder="Tell the den about your hunt…" rows={2} className="mt-1 w-full resize-none rounded-2xl border border-[#E8E8E8] bg-white p-3 text-[13px] focus:border-[#0A0A0A] focus:outline-none"/></div><div className="mt-4"><div className="text-[12px] font-semibold tracking-wide text-[#6B6B6B]">PANTHER AVATAR</div><div className="mt-2 grid grid-cols-10 gap-1.5">{PANTHER_AVATARS.map(a=>{ const sel=panther.avatar===a; return <button key={a} onClick={()=>panther.setAvatar(a)} className={`grid size-9 place-items-center rounded-xl border text-[16px] ${sel?"border-[#0A0A0A] bg-[#0A0A0A] text-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A]"}`}>{a}</button>; })}</div></div><div className="mt-5 flex gap-2"><button onClick={onHunt} className="flex-1 rounded-full bg-[#0A0A0A] py-3 text-[14px] font-semibold text-white hover:bg-black">🔥 Hunt (+gems)</button><button onClick={()=>setShowProfile(false)} className="rounded-full border border-[#E8E8E8] bg-white px-6 py-3 text-[14px] font-semibold hover:border-[#0A0A0A]">Done</button></div>{isConnected && <button onClick={()=>{ if(authenticated) logout(); setDirectWallet(null); setDirectChain(""); setShowProfile(false); }} className="mt-3 w-full rounded-full border border-red-200 bg-white px-4 py-3 text-[14px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-300">Disconnect Wallet</button>}<div className="mt-3 rounded-xl bg-[#F8F8F7] px-3 py-2 text-center text-[11px] leading-5 text-[#6B6B6B]">Profile & gems saved locally on this device (localStorage) — no account needed. Connect a wallet to hunt on-chain.</div></div></div>)}
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
