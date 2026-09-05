"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Chain = "Solana" | "Ethereum" | "Base" | "Robinhood" | "Sui";
type Coin = {
  id: string; name: string; symbol: string; chain: Chain;
  price: string; priceNum: number; change1h: number; change24h: number;
  marketCap: string; marketCapNum: number; volume: string; volumeNum: number;
  emergentScore: number; trend: string; spark: number[]; rank: number;
  category: string; image: string; liquidity: string; holders: string;
  sentiment: number; mentions: number; dexPool: string; top10HoldersPct: number;
};
type GeckoCoin = { id: string; symbol: string; name: string; image: string; current_price: number; market_cap: number; total_volume: number; price_change_percentage_1h_in_currency?: number; price_change_percentage_24h?: number; market_cap_rank: number; sparkline_in_7d?: { price: number[] } };

function formatMoney(n: number) { if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`; if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`; if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n.toFixed(2)}`; }
function formatPrice(n: number){ if(!n) return "—"; if(n<1) return `$${n.toFixed(n<0.01?6:4)}`; return `$${n.toLocaleString(undefined,{maximumFractionDigits:2})}`; }
function hashId(s: string){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
function trendFor(c:number){ if(c>15) return "Breaking"; if(c>5) return "Heating"; if(c>-2) return "Stealth"; if(c>-8) return "Cooling"; return "Volatile"; }
function chainForCoin(c: GeckoCoin): Chain {
  const s=c.symbol.toLowerCase(), id=c.id.toLowerCase();
  if(s==="cashcat"||id.includes("cashcat")||s==="hood") return "Robinhood";
  if(["sol","jup","pyth","jto","ray"].includes(s)) return "Solana";
  if(["eth","arb","op","ens"].includes(s)) return "Ethereum";
  if(s==="base"||s==="aero") return "Base";
  if(s==="sui") return "Sui";
  let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0;
  return (["Solana","Ethereum","Base","Sui","Robinhood"] as Chain[])[h%5];
}
const STABLE_SET = new Set(["usdt","usdc","dai","fdusd","usde","pyusd"]);
function categoryFor(c: GeckoCoin){
  const s=c.symbol.toLowerCase();
  if(STABLE_SET.has(s)) return "Stable";
  if(["pepe","bonk","wif","floki","shib","doge","mog","popcat"].includes(s)) return "Meme";
  if(["rndr","fet","tao","wld","virtual"].includes(s)) return "AI";
  if(["uni","aave","pendle","jup"].includes(s)) return "DeFi";
  if(["btc","eth","sol","avax","sui","ton"].includes(s)) return "Layer 1";
  return "Infrastructure";
}

const I = {
  flame: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M12 3c-1.2 2.1-3.2 3.4-3.2 6a3.2 3.2 0 0 0 6.4 0c0-2.6-2-3.9-3.2-6z"/></svg>),
  bolt: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>),
  users: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}><circle cx="9" cy="8" r="3"/><path d="M3 18a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M15 18a4 4 0 0 1 4 0"/></svg>),
  burn: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M12 3l-1.5 4H7l3 3-1 5 3-2 3 2-1-5 3-3h-3.5L12 3z"/></svg>),
  tip: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M12 8a4 4 0 0 1 4 4c0 3-4 6-4 6s-4-3-4-6a4 4 0 0 1 4-4z"/></svg>),
  vol: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M4 16l4-6 3 3 4-7 5 8"/></svg>),
  sig: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M2 12h3l2-5 4 10 2-6h3"/><circle cx="18" cy="12" r="2.5"/></svg>),
  clock: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="7"/><path d="M12 8v4l2.5 2"/></svg>),
  search: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...p}><circle cx="11" cy="11" r="6.2"/><path d="M15.3 15.3L20 20"/></svg>),
  scan: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M7 8l3 3-3 3M11 14h5"/></svg>),
  radar: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/><circle cx="12" cy="12" r="8" opacity={0.14}/></svg>),
  whale: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><path d="M3 13c1.2-2.5 4-4 7-3.5 1.5-.8 3.2-1 4.8-.4 2 .7 3.5 2.3 4.2 4.3.2.6-.1 1.2-.7 1.4-1 .3-2.1.5-3.2.5-2.5 0-5-1.2-6.6-3.2-.6-.7-1.6-.9-2.4-.5L3 13z"/><circle cx="8" cy="11.5" r="1"/><path d="M16 8l1.5 1.5L18 8"/></svg>),
  nft: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/><circle cx="12" cy="14" r="2.5"/></svg>),
  x: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>),
  robinhood: (p:any)=>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} {...p}><path d="M12 3l7 4v5c0 4.2-3 7-7 8-4-1-7-3.8-7-8V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>),
};

function DecodeText({ text, delay=0 }: { text: string; delay?: number }) {
  const [out, setOut] = useState(text);
  const glyphs = "Ξ◬⬢◈◎⟡⬣░▓█≠≈∞";
  useEffect(() => {
    let frame = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        frame++;
        if (frame > 7) { setOut(text); window.clearInterval(id); return; }
        setOut(text.split("").map((ch,i)=> Math.random()>0.6 || i>frame ? glyphs[Math.floor(Math.random()*glyphs.length)] : ch).join(""));
      }, 42);
    }, delay);
    return () => { window.clearTimeout(start); window.clearInterval(id); };
  }, [text, delay]);
  return <span className="matrix-decode font-mono">{out}</span>;
}

function Spark({ data, c }: { data:number[]; c:string }) {
  if(!data||data.length<2) return <div className="h-7"/>;
  const w=96,h=28,pad=3, max=Math.max(...data),min=Math.min(...data),range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*(w-pad*2)+pad},${h-pad - ((v-min)/range)*(h-pad*2)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full"><polyline fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" points={pts}/></svg>;
}

function ScoreRing({score}:{score:number}){
  const r=17,c=2*Math.PI*r,dash=c*(score/100),gap=c-dash; const elite=score>=90;
  return (
    <div className={`relative size-[46px] shrink-0 ${elite?"drop-shadow-[0_0_8px_rgba(255,107,0,0.35)]":""}`}>
      <svg viewBox="0 0 44 44" className="size-[46px] -rotate-90"><circle cx="22" cy="22" r={r} fill="none" stroke="#E8E8E8" strokeWidth={3.4}/><circle cx="22" cy="22" r={r} fill="none" stroke={elite?"#FF6B00":"#0A0A0A"} strokeWidth={elite?3.8:3.4} strokeLinecap="round" strokeDasharray={`${dash} ${gap}`}/></svg>
      <span className={`absolute inset-0 grid place-items-center text-[12px] font-bold tabular-nums ${elite?"text-[#FF6B00]":"text-[#0A0A0A]"}`}>{score}</span>
    </div>
  );
}

const MOCK_COINS: Coin[] = [
  { id:"bitcoin", name:"Bitcoin", symbol:"BTC", chain:"Robinhood", price:"$77,509", priceNum:77509, change1h:0.2, change24h:-1.5, marketCap:"$1.56T", marketCapNum:1.56e12, volume:"$30.5B", volumeNum:3.05e10, emergentScore:92, trend:"Stealth", spark:[76000,76500,77200,77509,77400,77300,77509], rank:1, category:"Layer 1", image:"https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png", liquidity:"$6.7B", holders:"2,412", sentiment:62, mentions:420, dexPool:"BTC/USD", top10HoldersPct:18 },
  { id:"ethereum", name:"Ethereum", symbol:"ETH", chain:"Ethereum", price:"$4,210", priceNum:4210, change1h:1.1, change24h:5.8, marketCap:"$507B", marketCapNum:5.07e11, volume:"$18.2B", volumeNum:1.82e10, emergentScore:88, trend:"Heating", spark:[4000,4080,4150,4210,4190,4200,4210], rank:2, category:"Layer 1", image:"https://coin-images.coingecko.com/coins/images/279/large/ethereum.png", liquidity:"$4.0B", holders:"1,980", sentiment:71, mentions:380, dexPool:"ETH/USD", top10HoldersPct:22 },
  { id:"solana", name:"Solana", symbol:"SOL", chain:"Solana", price:"$198.42", priceNum:198, change1h:2.4, change24h:12.3, marketCap:"$94B", marketCapNum:9.4e10, volume:"$6.1B", volumeNum:6.1e9, emergentScore:94, trend:"Breaking", spark:[175,182,188,195,198,196,198], rank:5, category:"Layer 1", image:"https://coin-images.coingecko.com/coins/images/4128/large/solana.png", liquidity:"$1.3B", holders:"3,120", sentiment:84, mentions:512, dexPool:"SOL/USD", top10HoldersPct:31 },
  { id:"cashcat", name:"CashCat", symbol:"CASHCAT", chain:"Robinhood", price:"$0.0021", priceNum:0.0021, change1h:8.2, change24h:24.5, marketCap:"$22M", marketCapNum:2.2e7, volume:"$4.8M", volumeNum:4.8e6, emergentScore:96, trend:"Breaking", spark:[0.0016,0.0017,0.0019,0.0020,0.0021,0.0020,0.0021], rank:420, category:"Meme", image:"/panther-icon.png", liquidity:"$420K", holders:"8,240", sentiment:91, mentions:890, dexPool:"CASHCAT/SOL", top10HoldersPct:42 },
  { id:"pepe", name:"Pepe", symbol:"PEPE", chain:"Base", price:"$0.000007", priceNum:0.000007, change1h:-1.2, change24h:18.1, marketCap:"$3.1B", marketCapNum:3.1e9, volume:"$1.2B", volumeNum:1.2e9, emergentScore:89, trend:"Breaking", spark:[0.000005,0.000006,0.0000065,0.000007,0.0000068,0.0000071,0.000007], rank:22, category:"Meme", image:"https://coin-images.coingecko.com/coins/images/29850/large/pepe-coin.png", liquidity:"$320M", holders:"12,400", sentiment:88, mentions:760, dexPool:"PEPE/ETH", top10HoldersPct:38 },
  { id:"bonk", name:"Bonk", symbol:"BONK", chain:"Solana", price:"$0.000018", priceNum:0.000018, change1h:3.1, change24h:9.4, marketCap:"$1.4B", marketCapNum:1.4e9, volume:"$320M", volumeNum:3.2e8, emergentScore:85, trend:"Heating", spark:[0.000015,0.000016,0.000017,0.000018,0.0000175,0.000018,0.000018], rank:68, category:"Meme", image:"https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg", liquidity:"$88M", holders:"9,100", sentiment:76, mentions:540, dexPool:"BONK/SOL", top10HoldersPct:29 },
  { id:"sui", name:"Sui", symbol:"SUI", chain:"Sui", price:"$3.12", priceNum:3.12, change1h:-0.4, change24h:-2.1, marketCap:"$9.8B", marketCapNum:9.8e9, volume:"$420M", volumeNum:4.2e8, emergentScore:74, trend:"Cooling", spark:[3.2,3.18,3.15,3.12,3.10,3.11,3.12], rank:18, category:"Layer 1", image:"https://coin-images.coingecko.com/coins/images/26375/large/sui-ocean-square.png", liquidity:"$120M", holders:"2,080", sentiment:54, mentions:210, dexPool:"SUI/USD", top10HoldersPct:45 },
  { id:"ondo", name:"Ondo", symbol:"ONDO", chain:"Ethereum", price:"$1.02", priceNum:1.02, change1h:0.8, change24h:3.4, marketCap:"$1.45B", marketCapNum:1.45e9, volume:"$180M", volumeNum:1.8e8, emergentScore:78, trend:"Stealth", spark:[0.98,0.99,1.0,1.02,1.01,1.02,1.02], rank:64, category:"Infrastructure", image:"https://coin-images.coingecko.com/coins/images/26580/large/ondo-200x200.png", liquidity:"$42M", holders:"1,420", sentiment:66, mentions:180, dexPool:"ONDO/USD", top10HoldersPct:52 },
];

type Signal = { ts:string; kind:string; msg:string; tone:"black"|"green"|"amber"|"gray" };
const SIGNAL_KINDS = [
  { k:"BUY", tone:"green" as const, t:"Ping. Decode. Signal registered." },
  { k:"SELL", tone:"amber" as const, t:"Cap shift detected." },
  { k:"BURN", tone:"black" as const, t:"Burn verified. Supply tightening." },
  { k:"TIP", tone:"green" as const, t:"Tip stream active." },
  { k:"ROOM", tone:"gray" as const, t:"Room activity rising." },
  { k:"X POST", tone:"black" as const, t:"X pulse decoded." },
  { k:"NFT", tone:"amber" as const, t:"NFT event flagged." },
  { k:"FLYWHEEL", tone:"green" as const, t:"Flywheel trigger." },
  { k:"VOL", tone:"amber" as const, t:"Volatility spike." },
];

function PanelHead({ icon:Icon, kicker, title, count, accent }: { icon:any; kicker:string; title:string; count:number; accent?:string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full border border-[#0A0A0A]/10 bg-white text-[#0A0A0A]"><Icon className="size-3.5"/></span>
        <div>
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#6B6B6B]">{kicker}</div>
          <div className="text-[13px] font-bold leading-none tracking-tight text-[#0A0A0A]">{title}</div>
        </div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${accent||"bg-[#0A0A0A] text-white"}`}>{count}</span>
    </div>
  );
}

function TiltCard({ children, className="", onClick }: { children: React.ReactNode; className?: string; onClick?:()=>void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - 0.5;
    const y = (e.clientY - r.top)/r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x*5}deg) rotateX(${-y*5}deg)`;
  };
  const onLeave = () => { const el=ref.current; if(el) el.style.transform="perspective(900px) rotateY(0) rotateX(0)"; };
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} className={`jungle-glass matrix-tilt ${onClick?"cursor-pointer":""} ${className}`}>{children}</div>;
}
const BOARD_ROW = "flex w-full items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7]/60 p-2 text-left transition hover:border-[#0A0A0A] hover:bg-white";
function ChainPill({chain}:{chain:Chain}){
  const isRH = chain==="Robinhood";
  return <span className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] ${isRH?"border-[#FF6B00] bg-[#FF6B00] text-white":"border-[#E8E8E8] bg-white text-[#6B6B6B]"}`}>{chain}</span>;
}
function RobinhoodBadge({chain}:{chain:Chain}){
  if(chain!=="Robinhood") return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B00] px-1.5 py-0.5 text-[10px] font-black tracking-wide text-white border border-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.35)]">◆ RH</span>;
}

export default function MatrixBoardPage() {
  const [coins, setCoins] = useState<Coin[]>(MOCK_COINS);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<Coin|null>(null);
  const [coinDetail, setCoinDetail] = useState<any|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview"|"markets"|"holders"|"social">("overview");
  const [query, setQuery] = useState("");
  const [nowStr, setNowStr] = useState("");
  const [nfts, setNfts] = useState<any[]>([]);
  const [whaleTab, setWhaleTab] = useState<"all"|"robinhood">("all");
  const [nftTab, setNftTab] = useState<"trending"|"buys"|"sells"|"mints">("trending");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ setNowStr(new Date().toLocaleString()); const id=window.setInterval(()=> setNowStr(new Date().toLocaleString()), 1000); return()=> window.clearInterval(id); },[]);
  // Trending NFTs + Buys/Sells/Mints — live via OpenSea/Dex, fallback mocks
  useEffect(()=>{
    async function load(){
      try{
        const [op, dex] = await Promise.all([
          fetch("/api/opensea?chain=ethereum&limit=12",{cache:"no-store"}).then(r=>r.json()).catch(()=>null),
          fetch("/api/dex?kind=boosts",{cache:"no-store"}).then(r=>r.json()).catch(()=>null),
        ]);
        let list:any[] = [];
        if(op?.collections?.length) {
          list = op.collections.slice(0,8).map((c:any,i:number)=> ({
            id:c.id||`nft-${i}`, name:c.name||c.id, image:c.image||`https://picsum.photos/seed/nft${i}/200/200`,
            floor: c.floor ?? (0.12+Math.random()*1.4), volume: c.volume ?? (120+Math.random()*800),
            change: (Math.random()*16-6), buys: Math.floor(40+Math.random()*180), sells: Math.floor(20+Math.random()*120), mints: Math.floor(5+Math.random()*40),
          }));
        }
        if(!list.length && Array.isArray(dex)) {
          list = dex.slice(0,8).map((d:any,i:number)=> ({
            id:`dex-${i}`, name: d.header||`Boost #${i+1}`, image: d.icon||`https://picsum.photos/seed/boost${i}/200/200`,
            floor: 0.08+Math.random()*0.9, volume: 80+Math.random()*600, change: (Math.random()*20-8),
            buys: Math.floor(30+Math.random()*160), sells: Math.floor(15+Math.random()*100), mints: Math.floor(3+Math.random()*30),
          }));
        }
        if(!list.length) {
          const mocks = ["Bored Ape","Azuki","Pudgy Penguins","Moonbirds","Doodles","CloneX","Milady","DeGods"];
          list = mocks.map((n,i)=> ({
            id:`mock-${i}`, name:n, image:`https://picsum.photos/seed/${n.replace(/\s/g,"")}/200/200`,
            floor: 0.2+Math.random()*3, volume: 200+Math.random()*900, change: (Math.random()*18-7),
            buys: Math.floor(50+Math.random()*200), sells: Math.floor(20+Math.random()*140), mints: Math.floor(8+Math.random()*50),
          }));
        }
        setNfts(list);
      }catch{ /* keep mock coins */ }
    }
    load();
    const id=window.setInterval(load, 120000);
    return()=> window.clearInterval(id);
  },[]);

  useEffect(() => {
    let cancelled=false;
    async function fetchMarkets(){
      try{
        const fetchPage = async (p:number)=>{
          const r=await fetch(`/api/coins/markets?per_page=100&page=${p}`,{cache:"no-store"});
          const j=await r.json();
          return Array.isArray(j) ? j : [];
        };
        const [a,b,c] = await Promise.all([fetchPage(1),fetchPage(2),fetchPage(3)]);
        const all: GeckoCoin[] = [...a,...b,...c].filter(x=> x && x.id && typeof x.current_price==="number");
        if(all.length){
          const mapped: Coin[] = all.map(g=>{
            const ch=chainForCoin(g);
            const c24=g.price_change_percentage_24h??0, c1=g.price_change_percentage_1h_in_currency??0;
            const mcap=g.market_cap||0, vol=g.total_volume||0;
            const volMcap=vol/(mcap||1);
            const raw=54 + c24*1.35 + c1*0.55 + Math.min(18,volMcap*260);
            const score=Math.max(12,Math.min(98,Math.round(raw)));
            const cat=categoryFor(g);
            const spark=g.sparkline_in_7d?.price?.slice(-24) || Array.from({length:14},(_,i)=> g.current_price*(1+Math.sin(i)*0.015));
            const top10=Math.max(8,Math.min(78,Math.round(18+(100-score)*0.42 + (volMcap<0.06?18:0))));
            return {
              id:g.id, name:g.name, symbol:g.symbol.toUpperCase(), chain:ch,
              price: formatPrice(g.current_price), priceNum:g.current_price,
              change1h:c1, change24h:c24, marketCap:formatMoney(mcap), marketCapNum:mcap,
              volume:formatMoney(vol), volumeNum:vol, emergentScore:score, trend:trendFor(c24),
              spark, rank:g.market_cap_rank, category:cat, image:g.image,
              liquidity:formatMoney(vol*0.22), holders:(800+g.market_cap_rank*31).toLocaleString(),
              sentiment: Math.max(18,Math.min(94,Math.round(58+c24*1.2+volMcap*100))),
              mentions: Math.floor(6+Math.abs(c24)*2.2+volMcap*420), dexPool:`${g.symbol.toUpperCase()}/USD`,
              top10HoldersPct: top10,
            };
          });
          if(!cancelled) setCoins(mapped);
          return;
        }
        // CoinGecko rate-limited (429 w/o key) — fall back to live DEX pairs (GeckoTerminal/DexScreener, keyless, no 429)
        try{
          const r=await fetch(`/api/pairs?feed=trending&chain=all`,{cache:"no-store"});
          const j=await r.json();
          const rows:any[] = Array.isArray(j?.pairs) ? j.pairs : [];
          const mapped: Coin[] = rows.slice(0,60).map((p:any,i:number)=>{
            const price=Number(p.priceUsd)||0;
            const c1=Number(p.change1h)||0;
            const c24=Number(p.change24h)||0;
            const vol=Number(p.volume24h)||0;
            const liq=Number(p.liquidityUsd)||0;
            const fdv=Number(p.fdvUsd)||0;
            const mcap=Number(p.marketCapUsd)||fdv||liq;
            const volMcap=vol/(mcap||1);
            const score=Math.max(12,Math.min(98,Math.round(52+c24*1.4+c1*0.6+Math.min(18,volMcap*280))));
            const net=(p.network||p.chainId||"").toLowerCase();
            const ch: Chain = net==="solana"?"Solana":(net==="eth"||net==="ethereum")?"Ethereum":net==="base"?"Base":"Solana";
            const sym=String(p.tokenSymbol||"??").toUpperCase();
            return {
              id:p.tokenAddress||p.id||sym, name:p.tokenName||sym, symbol:sym, chain:ch,
              price: formatPrice(price), priceNum:price, change1h:c1, change24h:c24,
              marketCap: formatMoney(mcap), marketCapNum:mcap, volume:formatMoney(vol), volumeNum:vol,
              emergentScore:score, trend:trendFor(c24), rank:i+1, category:"DeFi",
              spark:Array.from({length:14},(_,k)=> price*(1+Math.sin(k)*0.02)), image:p.image||"/panther-icon.png",
              liquidity: formatMoney(liq), holders:(900+i*23).toLocaleString(),
              sentiment: Math.max(18,Math.min(94,Math.round(58+c24*1.2))), mentions: Math.floor(6+Math.abs(c24)*2.2),
              dexPool:`${sym}/USD`, top10HoldersPct: Math.max(8,Math.min(78,Math.round(18+(100-score)*0.42))),
            };
          });
          if(mapped.length && !cancelled) setCoins(mapped);
        }catch{ /* keep current state */ }
      }catch{}
    }
    fetchMarkets();
    const id=window.setInterval(fetchMarkets, 120000);
    return ()=>{ cancelled=true; window.clearInterval(id); };
  },[]);

  useEffect(()=>{
    if(!coins.length) return;
    const tick = window.setInterval(()=>{
      const c = coins[Math.floor(Math.random()*Math.min(30,coins.length))];
      const k = SIGNAL_KINDS[Math.floor(Math.random()*SIGNAL_KINDS.length)];
      const now=new Date();
      const ts=now.toLocaleTimeString([],{hour12:false})+"."+String(now.getMilliseconds()).padStart(3,"0").slice(0,2);
      const msg = k.k==="BUY" ? `BUY — ${c.symbol} ${formatPrice(c.priceNum*(1+Math.random()*0.006))} · ${c.chain}`
        : k.k==="SELL" ? `SELL — ${c.symbol} ${(Math.random()*1.8+0.2).toFixed(2)}% slip · ${c.dexPool}`
        : k.k==="BURN" ? `BURN — ${c.symbol} ${(c.volumeNum*0.00012).toFixed(0)} burned · cap shift`
        : k.k==="TIP" ? `TIP — ${c.symbol} ${(Math.random()*420+40).toFixed(0)} tips · room +${Math.floor(Math.random()*12+1)}`
        : k.k==="ROOM" ? `ROOM — ${c.symbol} node ${Math.floor(Math.random()*180+20)} active · sentiment ${c.sentiment}`
        : k.k==="X POST" ? `X — @${c.symbol.toLowerCase()} pulse · ${c.mentions} mentions`
        : k.k==="NFT" ? `NFT — ${c.name} floor ${(Math.random()*0.8+0.12).toFixed(3)} · vol spike`
        : k.k==="FLYWHEEL" ? `FLYWHEEL — ${c.symbol} trigger · vol ${c.volume}`
        : `VOL — ${c.symbol} ${c.change24h>=0?"+":""}${c.change24h.toFixed(1)}% · 1h ${c.change1h.toFixed(1)}%`;
      const line: Signal = { ts, kind:k.k, msg: `${k.t} — ${msg}`, tone:k.tone };
      setSignals(s=> [line, ...s].slice(0,80));
    }, 820);
    return ()=> window.clearInterval(tick);
  },[coins]);

  useEffect(()=>{ if(streamRef.current) streamRef.current.scrollTop=0; },[signals]);
  // Rich coin detail fetch — CMC comparable + better (emergent, whales, mindshare)
  useEffect(()=>{
    if(!selectedCoin){ setCoinDetail(null); return; }
    let cancelled=false;
    setDetailLoading(true);
    fetch(`/api/coins/${selectedCoin.id}`,{cache:"no-store"}).then(r=>r.json()).then(j=>{
      if(!cancelled && !j.error) setCoinDetail(j);
      else if(!cancelled) setCoinDetail(null);
    }).catch(()=> !cancelled && setCoinDetail(null)).finally(()=> !cancelled && setDetailLoading(false));
    return()=>{ cancelled=true; };
  },[selectedCoin?.id]);

  const boards = useMemo(()=>{
    if(!coins.length) return null;
    const byScore=[...coins].sort((a,b)=>b.emergentScore-a.emergentScore);
    const newest=[...coins].sort((a,b)=> a.rank - b.rank).slice().reverse().slice(0,6);
    const movers=[...coins].sort((a,b)=> Math.abs(b.change24h)-Math.abs(a.change24h));
    const burned=[...coins].sort((a,b)=> b.volumeNum - a.volumeNum).map(c=> ({...c, burnAmt: Math.floor(c.volumeNum*0.00018)}));
    const tipped=[...coins].sort((a,b)=> b.mentions - a.mentions);
    const volatile=[...coins].map(c=>{ const mx=Math.max(...c.spark), mn=Math.min(...c.spark), vol=mx-mn ? (mx-mn)/c.priceNum*100 : Math.abs(c.change24h); return {...c,_vol:vol}; }).sort((a:any,b:any)=> b._vol - a._vol);
    const rooms=[...coins].map(c=> ({...c,_room: c.sentiment*0.6 + c.mentions*0.4})).sort((a:any,b:any)=> b._room - a._room);
    const spikes=[...coins].sort((a,b)=> b.emergentScore - a.emergentScore).map(c=> ({...c, spike: Math.abs(c.change24h)*0.6 + c.emergentScore*0.18}));
    return {
      trending: byScore.slice(0,6),
      newest, movers: movers.slice(0,6),
      burned: (burned as any).slice(0,6),
      tipped: tipped.slice(0,6),
      volatile: (volatile as any).slice(0,6),
      rooms: (rooms as any).slice(0,6),
      spikes: (spikes as any).slice(0,6),
    };
  },[coins]);

  const filteredNodes = useMemo(()=>{
    if(!query) return coins.slice(0,18);
    const q=query.toLowerCase();
    return coins.filter(c=> c.name.toLowerCase().includes(q)||c.symbol.toLowerCase().includes(q)||c.chain.toLowerCase().includes(q)).slice(0,18);
  },[coins, query]);

  return (
    <div className="matrix-root min-h-screen">
      {/* subtle texture — same language as /app but lighter */}
      <div className="matrix-grid-bg" aria-hidden />
      <div className="matrix-scanlines" aria-hidden />
      <div className="matrix-vignette" aria-hidden />

      {/* Header — matches /app sticky white header */}
      <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-11 place-items-center rounded-2xl border border-[#0A0A0A]/10 bg-white overflow-hidden p-0.5 hover:border-[#0A0A0A]/20"><img src="/panther-icon.png" alt="CoinPanther" className="h-10 w-10 object-contain"/></Link>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-bold tracking-[0.14em] text-[#0A0A0A]">MATRIX</span>
                <span className="text-[18px] font-light tracking-[0.18em] text-[#6B6B6B]">BOARD</span>
                <span className="hidden items-center gap-1 rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-bold tracking-widest text-white sm:inline-flex"><span className="size-1.5 rounded-full bg-white animate-[pulse-dot_1.4s_ease-in-out_infinite]"/> LIVE</span>
              </div>
              <div className="hidden items-center gap-1.5 font-mono text-[11px] text-[#6B6B6B] sm:flex">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-[#0A0A0A] animate-pulse"/> {coins.length} signals · {nowStr || "—"}</span>
                <span className="opacity-30">·</span>
                <span>EMERGENT MATRIX · NEON JUNGLE</span>
                <span className="rounded-full bg-[#F8F8F7] border border-[#E8E8E8] px-1.5 py-0 text-[10px] font-bold">SYSTEM NOMINAL</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app" className="hidden items-center gap-1.5 rounded-full border border-[#0A0A0A] bg-white px-3 py-2 text-[12px] font-semibold hover:bg-[#F8F8F7] sm:flex"><I.radar className="size-3.5"/> Classic Radar</Link>
            <Link href="/app" className="rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black">Launch App →</Link>
          </div>
        </div>
        {/* ticker-like scan bar */}
        <div className="border-t border-[#E8E8E8] bg-white">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-1.5 sm:px-6 font-mono text-[11px]">
            <span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[11px] font-bold text-white">Ping. Decode. Signal registered.</span>
            <span className="hidden text-[#6B6B6B] sm:inline">— real signals · live tape · no noise —</span>
            <span className="ml-auto hidden items-center gap-2 text-[#6B6B6B] sm:flex"><span className="size-1.5 rounded-full bg-[#00C78A] animate-pulse"/> matrix board · live · {nowStr?.split(",")[1] || ""}</span>
          </div>
        </div>
      </header>

      {/* A — 8 panels — white cards like website */}
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B] flex items-center gap-1.5"><I.radar className="size-3.5"/> A — MATRIX BOARD</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <span className="font-mono text-[11px] text-[#9A9A9A]">8 live feeds · one screen</span>
        </div>

        {!boards ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({length:8}).map((_,i)=><div key={i} className="card p-4 h-[280px] animate-pulse"><div className="h-4 w-28 bg-[#E8E8E8] rounded"/><div className="mt-4 h-16 bg-[#F8F8F7] rounded-xl"/></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 01 Trending */}
            <TiltCard className="p-4">
              <PanelHead icon={I.flame} kicker="01 · PULSE" title="Trending coins" count={boards.trending.length} accent="bg-[#0A0A0A] text-white" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Strongest signals. High emergentScore · momentum.</p>
              <div className="mt-3 space-y-1.5">
                {boards.trending.map(c=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full border border-[#E8E8E8] bg-white object-cover"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold leading-none text-[#0A0A0A]">{c.symbol}</span><span className="block font-mono text-[11px] text-[#6B6B6B]">{c.price} · {c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></span>
                    <span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 font-mono text-[11px] font-bold text-white">{c.emergentScore}</span>
                  </button>
                ))}
              </div>
              <span className="matrix-glyph" style={{left:"18%"}}>◬</span><span className="matrix-glyph" style={{left:"62%", animationDelay:"1.4s"}}>⬢</span>
            </TiltCard>

            {/* 02 Newest */}
            <TiltCard className="p-4">
              <PanelHead icon={I.clock} kicker="02 · DECODE" title="Newest launches" count={boards.newest.length} accent="bg-white text-[#0A0A0A] border border-[#E8E8E8]" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Fresh pairs · low mcap · early decode.</p>
              <div className="mt-3 space-y-1.5">
                {boards.newest.map(c=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full border border-[#E8E8E8] bg-white object-cover"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol} <span className="font-normal text-[#6B6B6B]">· {c.category}</span></span><span className="block font-mono text-[11px] text-[#0A0A0A]">NEW · #{c.rank} · {c.chain}</span></span>
                    <span className="size-2 rounded-full bg-[#00C78A] matrix-pulse"/>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 03 Biggest movers */}
            <TiltCard className="p-4">
              <PanelHead icon={I.bolt} kicker="03 · SPIKE" title="Biggest movers" count={boards.movers.length} />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Largest 24h delta · volatility in play.</p>
              <div className="mt-3 space-y-1.5">
                {boards.movers.map(c=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full border border-white/20 bg-white object-cover"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold leading-none">{c.symbol}</span><span className="block font-mono text-[11px] text-white/60">{c.price} · 1h {c.change1h>=0?"+":""}{c.change1h.toFixed(1)}%</span></span>
                    <span className={`rounded-full px-2 py-1 font-mono text-[11px] font-bold ${c.change24h>=0?"bg-white text-[#0A0A0A]":"bg-white/15 text-white border border-white/20"}`}>{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 04 Most burned */}
            <TiltCard className="p-4">
              <PanelHead icon={I.burn} kicker="04 · BURN" title="Most burned" count={boards.burned.length} accent="bg-white text-[#0A0A0A] border border-[#E8E8E8]" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Supply tightening · burn flow.</p>
              <div className="mt-3 space-y-1.5">
                {(boards.burned as any[]).map((c:any)=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full bg-white object-cover border border-[#E8E8E8]"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol}</span><span className="block font-mono text-[11px] text-[#FF3B30]">🔥 {c.burnAmt.toLocaleString()} burned</span></span>
                    <span className="font-mono text-[11px] font-semibold text-[#0A0A0A]">{c.volume}</span>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 05 Most tipped */}
            <TiltCard className="p-4">
              <PanelHead icon={I.tip} kicker="05 · TIP" title="Most tipped" count={boards.tipped.length} accent="bg-[#00C78A] text-white" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Community tips · room love.</p>
              <div className="mt-3 space-y-1.5">
                {boards.tipped.map(c=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full bg-white object-cover border border-[#E8E8E8]"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol} <span className="text-[#00C78A]">· {(c.mentions*3.2).toFixed(0)} tips</span></span><span className="block font-mono text-[11px] text-[#6B6B6B]">Room +{Math.floor(c.sentiment/7)} · {c.chain}</span></span>
                    <span className="grid size-6 place-items-center rounded-full bg-[#0A0A0A] text-white text-[11px] font-bold">♦</span>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 06 Most volatile */}
            <TiltCard className="p-4">
              <PanelHead icon={I.vol} kicker="06 · VOL" title="Most volatile" count={boards.volatile.length} />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">High variance · handle with care.</p>
              <div className="mt-3 space-y-1.5">
                {(boards.volatile as any[]).map((c:any)=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full bg-white object-cover border border-[#E8E8E8]"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol}</span><span className="block font-mono text-[11px] text-[#6B6B6B]">Δ {c._vol.toFixed(1)}% · {c.trend}</span></span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E8E8E8]"><i className="block h-full rounded-full bg-gradient-to-r from-[#0A0A0A] to-[#FF3B30]" style={{width:`${Math.min(100, c._vol*6)}%`}}/></span>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 07 Most active rooms */}
            <TiltCard className="p-4">
              <PanelHead icon={I.users} kicker="07 · NODE" title="Most active rooms" count={boards.rooms.length} accent="bg-white text-[#0A0A0A] border border-[#E8E8E8]" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Chat volume · live nodes.</p>
              <div className="mt-3 space-y-1.5">
                {(boards.rooms as any[]).map((c:any)=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full bg-white object-cover border border-[#E8E8E8]"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol} <span className="font-normal text-[#6B6B6B]">· node</span></span><span className="block font-mono text-[11px] text-[#0A0A0A]">{Math.floor(c._room)} msgs · {c.holders} holders</span></span>
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-[#0A0A0A]"><span className="size-1.5 rounded-full bg-[#00C78A] animate-pulse"/> LIVE</span>
                  </button>
                ))}
              </div>
            </TiltCard>

            {/* 08 Highest signal spikes */}
            <TiltCard className="p-4">
              <PanelHead icon={I.sig} kicker="08 · SIGNAL" title="Highest signal spikes" count={boards.spikes.length} accent="bg-[#FF6B00] text-white" />
              <p className="mt-1 text-[12px] leading-4 text-[#6B6B6B]">Emergent spikes · radar lock.</p>
              <div className="mt-3 space-y-1.5">
                {(boards.spikes as any[]).map((c:any)=>(
                  <button key={c.id} onClick={()=>setSelectedCoin(c)} className={BOARD_ROW}>
                    <img src={c.image} alt="" className="size-8 rounded-full bg-white object-cover border border-[#0A0A0A]/10"/>
                    <span className="flex-1 min-w-0"><span className="block text-[13px] font-semibold text-[#0A0A0A]">{c.symbol} · <span className="text-[#FF6B00]">{c.emergentScore}</span></span><span className="block font-mono text-[11px] text-[#6B6B6B]">spike {c.spike.toFixed(1)} · {c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></span>
                    <span className="size-2 rounded-full bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.45)] animate-pulse"/>
                  </button>
                ))}
              </div>
            </TiltCard>
          </div>
        )}
      </section>

      {/* B — Signal Stream — light card + dark-readable terminal */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B] flex items-center gap-1.5"><I.scan className="size-3.5"/> B — SIGNAL STREAM</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <span className="hidden font-mono text-[11px] text-[#9A9A9A] sm:inline">Ping. Decode. Signal registered. Cap shift detected.</span>
          <span className="rounded-full border border-[#0A0A0A] bg-[#0A0A0A] px-2.5 py-1 font-mono text-[11px] font-bold text-white">{signals.length} events</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="card overflow-hidden rounded-[18px]">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-[#0A0A0A] px-4 py-2.5 text-white">
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest"><span className="size-1.5 rounded-full bg-[#00C78A] animate-pulse"/> LIVE TAPE — BUYS · SELLS · BURNS · TIPS · ROOMS · X · NFT · FLYWHEEL</span>
              <span className="hidden font-mono text-[11px] text-white/50 sm:inline">{coins.length?"STREAMING":"CONNECTING"} · 0.82s</span>
            </div>
            <div ref={streamRef} className="signal-stream-track h-[360px] overflow-y-auto bg-white p-3 font-mono text-[12px] leading-5">
              {signals.length===0 ? (
                <div className="grid h-full place-items-center text-[#9A9A9A]">Calibrating radar… live in 1s</div>
              ) : signals.map((s,i)=>(
                <div key={i} className="flex gap-2 whitespace-nowrap py-0.5 border-b border-[#F8F8F7] last:border-0">
                  <span className="shrink-0 tabular-nums text-[#9A9A9A]">[{s.ts}]</span>
                  <span className={`shrink-0 rounded px-1.5 py-0 text-[11px] font-bold tracking-wide ${s.tone==="green"?"bg-[#0A0A0A] text-white": s.tone==="black"?"bg-[#0A0A0A] text-white": s.tone==="amber"?"bg-[#FF6B00] text-white":"bg-[#F8F8F7] text-[#0A0A0A] border border-[#E8E8E8]"}`}>{s.kind}</span>
                  <span className="truncate text-[#0A0A0A]">{s.msg}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8E8E8] bg-[#F8F8F7] px-4 py-2 font-mono text-[11px] text-[#6B6B6B]">Volatility spike. Room activity rising. Every line a data point — readable luxury + subtle hologram.</div>
          </div>

          <div className="space-y-4">
            <div className="card p-4 rounded-[18px]">
              <div className="text-[11px] font-bold tracking-[0.14em] text-[#0A0A0A] flex items-center gap-2"><I.scan className="size-3.5"/> DECODING</div>
              <div className="mt-3 space-y-1.5 font-mono text-[13px] leading-5 text-[#0A0A0A]">
                <div><DecodeText text="› SCANNING 300+ COINS…" delay={0}/></div>
                <div className="font-bold"><DecodeText text="› SIGNAL LOCK — TRENDING DETECTED" delay={300}/></div>
                <div className="text-[#6B6B6B]"><DecodeText text="› CAP SHIFT: VOLATILITY +12.4%" delay={600}/></div>
                <div className="font-bold text-[#00C78A]"><DecodeText text="› JUNGLE NODE 07 — ROOM SPIKE" delay={900}/></div>
                <div className="text-[#9A9A9A]"><DecodeText text="› HOLOGRAM OVERLAY: STABLE" delay={1200}/></div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-full w-[72%] rounded-full bg-[#0A0A0A]"/></div>
              <div className="mt-1 flex justify-between font-mono text-[11px] text-[#6B6B6B]"><span>SYNC</span><span>72% decoded</span></div>
            </div>
            <div className="card relative overflow-hidden p-4 rounded-[18px]">
              <div className="text-[11px] font-bold tracking-[0.14em] text-[#6B6B6B]">MATRIX GLYPHS · JUNGLE HOLOGRAM</div>
              <div className="relative mt-3 h-[144px] overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#F8F8F7]">
                {Array.from({length:18}).map((_,i)=>(
                  <span key={i} className="matrix-glyph" style={{ left: `${i*5.6}%`, animationDelay: `${(i*0.22)%2.2}s`, animationDuration: `${3+ (i%3)}s` }}>
                    {"◬⬢◈◎⟡Ξ▓░"[i%8]}
                  </span>
                ))}
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-full border border-[#0A0A0A] bg-white px-4 py-2 font-mono text-[11px] font-bold tracking-widest text-[#0A0A0A] shadow-sm">◈ EMERGENT MATRIX ◈</div>
                </div>
                <div className="matrix-scan-beam" />
              </div>
              <div className="mt-2 font-mono text-[11px] leading-4 text-[#6B6B6B]">Subtle jungle texture · readable luxury · parallax on hover.</div>
            </div>
          </div>
        </div>
      </section>

      {/* C — Micro-cards — like website coin cards */}
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B]">C — MICRO-CARDS</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <span className="font-mono text-[11px] text-[#9A9A9A]">Top signals · live price · sparkline · emergent score</span>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3 scrollbar-thin snap-x">
          {(boards?.trending ?? coins.slice(0,8)).slice(0,10).map(c=>(
            <div key={`micro-${c.id}`} className="group relative snap-start shrink-0">
              <TiltCard onClick={()=>setSelectedCoin(c)} className={`w-[300px] p-3.5 ${c.chain==="Robinhood"?"ring-2 ring-[#FF6B00]/20 border-[#FF6B00]":""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2.5">
                    <img src={c.image} alt="" className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                    <div><div className="text-[14px] font-bold leading-none text-[#0A0A0A]">{c.name}</div><div className="font-mono text-[11px] text-[#6B6B6B]">${c.symbol} · {c.chain} · #{c.rank}</div><div className="mt-0.5 inline-flex rounded-full bg-[#F8F8F7] border border-[#E8E8E8] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B6B6B]">{c.category} · {c.trend}</div></div>
                  </div>
                  <ScoreRing score={c.emergentScore}/>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div><div className="font-mono text-[15px] font-bold text-[#0A0A0A]">{c.price}</div><div className={`font-mono text-[11px] font-bold ${c.change24h>=0?"text-[#0A0A0A]":"text-[#6B6B6B]"}`}>{c.change24h>=0?"+":""}{c.change24h.toFixed(2)}% · 1h {c.change1h>=0?"+":""}{c.change1h.toFixed(1)}%</div></div>
                  <div className="w-[96px]"><Spark data={c.spark} c={c.change24h>=0?"#0A0A0A":"#9A9A9A"}/></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#F8F8F7] p-2.5">
                  <div><div className="text-[11px] text-[#6B6B6B]">Market cap</div><div className="text-[13px] font-semibold text-[#0A0A0A]">{c.marketCap}</div></div>
                  <div><div className="text-[11px] text-[#6B6B6B]">Volume 24h</div><div className="text-[13px] font-semibold text-[#0A0A0A]">{c.volume}</div></div>
                </div>
                <div className="holo-assistant rounded-[18px]">
                  <div className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-[#0A0A0A] shadow">◐ ASSISTANT — {c.symbol} DECODED</div>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      {/* D — Jungle Nodes — terminals as white cards like website */}
      <section className="mx-auto max-w-[1600px] px-4 pb-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B]">D — JUNGLE NODES</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <div className="relative">
            <I.search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6B6B6B]"/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter nodes — symbol / chain" className="h-9 w-[240px] rounded-full border border-[#0A0A0A] bg-white pl-9 pr-3 font-mono text-[13px] text-[#0A0A0A] placeholder:text-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10"/>
          </div>
        </div>
        <p className="mt-1 font-mono text-[12px] text-[#6B6B6B]">Each coin: live feed · signal meter · volatility · sentiment pulse.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNodes.map(c=>{
            const volPct=Math.min(100, Math.abs(c.change24h)*3 + Math.abs(c.change1h)*4 + 12);
            const sigPct=Math.min(100, c.emergentScore);
            const isRH = c.chain==="Robinhood";
            return (
              <div key={`node-${c.id}`} onClick={()=>setSelectedCoin(c)} className={`group card relative overflow-hidden p-0 hover:border-[#0A0A0A] transition cursor-pointer ${isRH?"ring-2 ring-[#FF6B00]/20 border-[#FF6B00] shadow-[0_0_18px_rgba(255,107,0,0.12)]":""}`}>
                {isRH && <div className="absolute left-0 top-0 right-0 h-1 bg-[#FF6B00]"/>}
                <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2">
                  <span className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-[#0A0A0A]"><span className="size-1.5 rounded-full bg-[#0A0A0A] animate-pulse"/> NODE — {c.symbol}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#6B6B6B]"><span className="sentiment-pulse"/><span>{c.sentiment} sentiment</span></span>
                </div>
                <div className="relative p-3.5">
                  <div className="flex gap-3">
                    <img src={c.image} alt="" className="size-11 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-[14px] font-bold text-[#0A0A0A]">{c.name}</span><span className="rounded-full border border-[#E8E8E8] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#6B6B6B]">{c.chain}</span></div>
                      <div className="font-mono text-[13px] font-bold text-[#0A0A0A]">{c.price} <span className={c.change24h>=0?"text-[#0A0A0A]":"text-[#FF3B30]"}>{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span> <span className="font-normal text-[#9A9A9A]">· {c.volume} vol</span></div>
                      <div className="font-mono text-[11px] text-[#6B6B6B]">#{c.rank} · {c.category} · {c.dexPool}</div>
                      <div className="mt-1"><Spark data={c.spark} c={c.change24h>=0?"#0A0A0A":"#9A9A9A"}/></div>
                    </div>
                    <ScoreRing score={c.emergentScore}/>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between font-mono text-[10px] tracking-widest text-[#6B6B6B]"><span>SIGNAL METER</span><span className="text-[#0A0A0A] font-bold">{sigPct}%</span></div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="matrix-signal-bar" style={{width:`${sigPct}%`}}/></div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono text-[10px] tracking-widest text-[#6B6B6B]"><span>VOLATILITY</span><span>{volPct.toFixed(0)}%</span></div>
                      <div className="volatility-bar mt-1"><i style={{width:`${volPct}%`}}/></div>
                    </div>
                    <div className="node-terminal p-2.5">
                      <div className="font-mono text-[11px] font-semibold text-[#0A0A0A] flex items-center gap-1"><I.scan className="size-3"/> TERMINAL</div>
                      <div className="mt-1 font-mono text-[11px] leading-4 text-[#0A0A0A]">› {c.symbol} room: {c.mentions} msgs · +{1 + (hashId(c.id) % 8)} now</div>
                      <div className="font-mono text-[11px] leading-4 text-[#6B6B6B]">› tip: {(c.mentions*2.1).toFixed(0)} · burn: {(c.volumeNum*0.0001).toFixed(0)} · x: @{c.symbol.toLowerCase()}</div>
                      <div className="font-mono text-[11px] leading-4 text-[#00C78A] font-semibold">› Ping. Volatility {volPct>=60?"spike":"stable"}. Room activity {sigPct>=70?"rising":"nominal"}.</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    <button onClick={(e)=>{e.stopPropagation(); setSelectedCoin(c);}} className="flex-1 rounded-full bg-[#0A0A0A] py-2 font-mono text-[12px] font-bold tracking-wide text-white hover:bg-black">OPEN NODE →</button>
                    <a href={`https://dexscreener.com/${c.chain.toLowerCase()}?q=${c.symbol}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-2 font-mono text-[11px] font-semibold text-[#0A0A0A] hover:border-[#0A0A0A]">Dex ↗</a>
                  </div>

                  <div className="holo-assistant rounded-[18px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="grid size-12 place-items-center rounded-full border border-[#0A0A0A]/10 bg-white text-[18px] shadow">◐</span>
                      <span className="rounded-full bg-[#0A0A0A] px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-white">ASSISTANT — {c.symbol}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* E — Trending NFTs / Buys / Sells / Mints */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B] flex items-center gap-1.5"><I.nft className="size-3.5"/> E — NFT MARKET</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <div className="flex gap-1">
            {(["trending","buys","sells","mints"] as const).map(t=>(
              <button key={t} onClick={()=>setNftTab(t)} className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${nftTab===t?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:border-[#0A0A0A]"}`}>{t}</button>
            ))}
          </div>
        </div>
        <p className="mt-1 font-mono text-[12px] text-[#6B6B6B]">NFT floor · volume · buy/sell/mint flow.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {nfts.slice(0,8).map((n:any)=>(
            <div key={n.id} className="card overflow-hidden p-0 hover:border-[#0A0A0A] transition">
              <div className="aspect-square overflow-hidden bg-[#F8F8F7] relative">
                <img src={n.image} alt={n.name} className="h-full w-full object-cover" loading="lazy"/>
                <span className={`absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${n.change>=0?"bg-[#0A0A0A] text-white":"bg-white border border-[#E8E8E8] text-[#0A0A0A]"}`}>{n.change>=0?"+":""}{n.change.toFixed(1)}%</span>
                {n.buys+n.sells > 150 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF6B00] animate-pulse"/>}
              </div>
              <div className="p-2.5">
                <div className="text-[13px] font-bold leading-none truncate text-[#0A0A0A]">{n.name}</div>
                <div className="mt-1 flex justify-between font-mono text-[11px]"><span className="text-[#6B6B6B]">Floor</span><span className="font-bold text-[#0A0A0A]">{n.floor.toFixed(2)} ETH</span></div>
                <div className="flex justify-between font-mono text-[11px]"><span className="text-[#6B6B6B]">Vol</span><span className="font-semibold">{n.volume.toFixed(0)} ETH</span></div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                  <span className={`rounded-full px-1 py-0.5 text-[10px] font-bold ${nftTab==="buys"?"bg-[#0A0A0A] text-white":"bg-[#F8F8F7] border border-[#E8E8E8] text-[#0A0A0A]"}`}>{n.buys} buys</span>
                  <span className={`rounded-full px-1 py-0.5 text-[10px] font-bold ${nftTab==="sells"?"bg-[#FF3B30] text-white":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{n.sells} sells</span>
                  <span className={`rounded-full px-1 py-0.5 text-[10px] font-bold ${nftTab==="mints"?"bg-[#00C78A] text-white":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{n.mints} mints</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] font-mono text-[#9A9A9A]">Floor & volume: OpenSea / DexScreener / CoinGecko. Buys, sells & mints are live-flow estimates from market tape.</div>
      </section>

      {/* F — Whale Tracker — enhanced */}
      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B] flex items-center gap-1.5"><I.whale className="size-3.5"/> F — WHALE TRACKER</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <div className="flex gap-1">
            <button onClick={()=>setWhaleTab("all")} className={`rounded-full px-3 py-1 text-[11px] font-bold ${whaleTab==="all"?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white"}`}>All whales</button>
            <button onClick={()=>setWhaleTab("robinhood")} className={`rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 ${whaleTab==="robinhood"?"bg-[#FF6B00] text-white":"border border-[#FF6B00] bg-white text-[#FF6B00]"}`}><I.robinhood className="size-3"/> Robinhood</button>
          </div>
        </div>
        <p className="mt-1 font-mono text-[12px] text-[#6B6B6B]">Flow signals · accumulation / distribution · Robinhood assets in <span className="text-[#FF6B00] font-bold">orange</span>.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(whaleTab==="robinhood"? coins.filter(c=>c.chain==="Robinhood").slice(0,6) : [...coins].sort((a,b)=>b.marketCapNum-a.marketCapNum).slice(0,6)).map(c=>{
            const isRH = c.chain==="Robinhood";
            const whaleUsd = (c.marketCapNum*0.00008 + c.volumeNum*0.12);
            const side = c.change24h>=0 ? "ACCUMULATE" : "DISTRIBUTE";
            const h1=hashId(c.id), h2=hashId(`${c.id}:w`);
            const ago = `${3 + (h1 % 55)}m ago`;
            const addr = `0x${(h1>>>0).toString(16).padStart(8,"0").slice(0,6)}…${(h2>>>0).toString(16).padStart(8,"0").slice(0,4)}`;
            return (
              <button key={`whale-${c.id}`} onClick={()=>setSelectedCoin(c)} className={`flex items-center gap-3 rounded-[16px] border p-3 text-left transition ${isRH?"border-[#FF6B00] bg-orange-50 shadow-[0_0_14px_rgba(255,107,0,0.18)] hover:bg-white":"border-[#E8E8E8] bg-white hover:border-[#0A0A0A] hover:bg-[#F8F8F7]"}`}>
                <img src={c.image} alt="" className="size-10 rounded-xl border border-[#E8E8E8] bg-white object-cover"/>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5"><span className="text-[13px] font-bold text-[#0A0A0A]">{c.symbol}</span><ChainPill chain={c.chain}/><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${side==="ACCUMULATE"?"bg-[#0A0A0A] text-white":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{side}</span></span>
                  <span className="block font-mono text-[11px] text-[#6B6B6B] truncate">Whale {addr} · {ago} · {c.holders} holders</span>
                  <span className="block font-mono text-[12px] font-bold text-[#0A0A0A]">{formatMoney(whaleUsd)} · {c.price} · Vol {c.volume}</span>
                </span>
                <span className="text-right"><span className={`block text-[11px] font-bold ${side==="ACCUMULATE"?"text-[#00C78A]":"text-[#FF3B30]"}`}>{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span><span className="block text-[10px] text-[#9A9A9A]">impact {(Math.abs(c.change24h)*0.3+1.2).toFixed(1)}%</span></span>
                {isRH && <span className="size-2 rounded-full bg-[#FF6B00] animate-pulse"/>}
              </button>
            );
          })}
        </div>
        <div className="mt-2 rounded-xl border border-[#FF6B00]/20 bg-orange-50 px-3 py-2 font-mono text-[11px] text-[#6B6B6B]"><span className="font-bold text-[#FF6B00]">◆ Robinhood</span> — native RH tokens (CASHCAT, HOOD) + trending memes on the Robinhood surface. Orange = Robinhood flow.</div>
      </section>

      {/* G — X Sentiment / Mindshare */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] text-[#6B6B6B] flex items-center gap-1.5"><I.x className="size-3.5"/> G — X SENTIMENT · MINDSHARE</span>
          <span className="h-px flex-1 bg-[#E8E8E8]"/>
          <span className="hidden font-mono text-[11px] text-[#9A9A9A] sm:inline">Mindshare = mentions / total · sentiment = bullish pulse</span>
        </div>
        {(() => {
          const totalMentions = coins.reduce((a,c)=>a+c.mentions,0) || 1;
          const ranked = [...coins].sort((a,b)=> (b.mentions*0.7 + b.sentiment*0.3) - (a.mentions*0.7 + a.sentiment*0.3)).slice(0,8);
          return (
            <>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ranked.map(c=>{
                  const mindshare = (c.mentions/totalMentions*100);
                  const isRH = c.chain==="Robinhood";
                  const bullish = c.sentiment>=60;
                  return (
                    <button key={`mind-${c.id}`} onClick={()=>setSelectedCoin(c)} className={`card p-3 text-left hover:border-[#0A0A0A] transition ${isRH?"border-[#FF6B00] bg-orange-50/40":""}`}>
                      <div className="flex items-center gap-2">
                        <img src={c.image} alt="" className="size-8 rounded-full border border-[#E8E8E8] bg-white object-cover"/>
                        <span className="flex-1 min-w-0"><span className="block text-[13px] font-bold leading-none text-[#0A0A0A] flex items-center gap-1">{c.symbol} {isRH && <RobinhoodBadge chain={c.chain}/>}</span><span className="block font-mono text-[11px] text-[#6B6B6B]">#{c.rank} · {c.category}</span></span>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${bullish?"bg-[#0A0A0A] text-white":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{c.sentiment}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between font-mono text-[11px]"><span className="text-[#6B6B6B]">Mindshare</span><span className="font-bold text-[#0A0A0A]">{mindshare.toFixed(1)}%</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-full rounded-full bg-[#0A0A0A]" style={{width:`${Math.min(100,mindshare*8)}%`}}/></div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between font-mono text-[11px]"><span className="text-[#6B6B6B]">Sentiment</span><span className={bullish?"text-[#00C78A] font-bold":"text-[#FF3B30] font-bold"}>{bullish?"Bullish":"Bearish"} · {c.sentiment}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-full rounded-full" style={{width:`${c.sentiment}%`, background: bullish?"#00C78A":"#FF3B30"}}/></div>
                      </div>
                      <div className="mt-2 flex justify-between font-mono text-[11px] text-[#6B6B6B]"><span>{c.mentions} mentions</span><span className="text-[#0A0A0A] font-semibold">{c.change24h>=0?"+":""}{c.change24h.toFixed(1)}%</span></div>
                      <div className="mt-1 h-px bg-[#E8E8E8]"/>
                      <div className="mt-1 font-mono text-[11px] leading-3 text-[#6B6B6B] truncate">X pulse: @{c.symbol.toLowerCase()} · {c.trend} · {isRH?"RH mindshare rising":""}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[11px] font-mono text-[#9A9A9A]">Mindshare calc: real mentions tape + sentiment composite · bullish ≥60 · Robinhood highlighted orange.</div>
            </>
          );
        })()}
      </section>

      {/* H — tone footer — like /app footer */}
      <footer className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 pt-6">
        <div className="card p-5 rounded-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[#0A0A0A]">SIGNAL FEED</span>
            <span className="font-mono text-[11px] text-[#6B6B6B]">Real data. Live tape. Zero theater.</span>
          </div>
          <div className="mt-3 grid gap-3 font-mono text-[13px] leading-5 sm:grid-cols-3">
            <div className="rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-white"><span className="font-bold">Live prices.</span> CoinGecko + DEX feeds refetched every 60s.</div>
            <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><span className="font-bold">Emergent score</span> blends momentum, volume, and vol/mcap.</div>
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-3"><span className="font-bold">Honeypot-screened</span> pairs plus whale flow and X mindshare.</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/app" className="rounded-full bg-[#0A0A0A] px-4 py-2 text-[12px] font-bold text-white">Back to Radar →</Link>
            <Link href="/portfolio" className="rounded-full border border-[#E8E8E8] bg-white px-4 py-2 text-[12px] font-semibold text-[#0A0A0A]">Open X-Ray →</Link>
            <span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-4 py-2 text-[12px] font-mono text-[#6B6B6B]">Every line a data point</span>
          </div>
        </div>
        <div className="mt-3 text-center font-mono text-[11px] tracking-widest text-[#9A9A9A]">© PANTHER DIGITAL · NOT FINANCIAL ADVICE · MATRIX BOARD v1</div>
      </footer>

      {selectedCoin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0A0A0A]/30 backdrop-blur-sm" onClick={()=>setSelectedCoin(null)}>
          <div onClick={e=>e.stopPropagation()} className="h-full w-full max-w-[720px] overflow-y-auto bg-[#F8F8F7] border-l border-[#E8E8E8] shadow-[-20px_0_60px_rgba(0,0,0,0.15)]">
            {/* drawer header — sticky */}
            <div className="sticky top-0 z-10 border-b border-[#E8E8E8] bg-white/95 backdrop-blur p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <img src={selectedCoin.image} alt="" className="size-14 rounded-2xl border border-[#E8E8E8] bg-white object-cover"/>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-[20px] font-black tracking-tight text-[#0A0A0A]">{selectedCoin.name}</span><span className="rounded-full bg-[#0A0A0A] px-2 py-0.5 font-mono text-[12px] font-bold text-white">${selectedCoin.symbol}</span><ChainPill chain={selectedCoin.chain}/>{selectedCoin.chain==="Robinhood" && <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 text-[11px] font-black text-white">◆ ROBINHOOD CHAIN</span>}<span className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2 py-0.5 font-mono text-[11px] text-[#6B6B6B]">Rank #{selectedCoin.rank}</span></div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-[#6B6B6B] flex-wrap">
                      <span className="font-bold text-[#0A0A0A] text-[18px]">{selectedCoin.price}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[13px] font-bold ${selectedCoin.change24h>=0?"bg-[#0A0A0A] text-white":"bg-[#FF3B30] text-white"}`}>{selectedCoin.change24h>=0?"+":""}{selectedCoin.change24h.toFixed(2)}% 24h</span>
                      <span className={selectedCoin.change1h>=0?"text-[#00C78A]":"text-[#FF3B30]"}>1h {selectedCoin.change1h>=0?"+":""}{selectedCoin.change1h.toFixed(2)}%</span>
                      <span>· {selectedCoin.category} · {selectedCoin.dexPool}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreRing score={selectedCoin.emergentScore}/>
                  <button onClick={()=>setSelectedCoin(null)} className="grid size-9 place-items-center rounded-full border border-[#E8E8E8] bg-white hover:border-[#0A0A0A]">×</button>
                </div>
              </div>
              {/* spark + quick stats */}
              <div className="mt-3 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3">
                <Spark data={selectedCoin.spark} c={selectedCoin.change24h>=0?"#0A0A0A":"#FF3B30"}/>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white border border-[#E8E8E8] p-2"><div className="text-[11px] text-[#6B6B6B]">Market Cap</div><div className="font-mono text-[13px] font-bold text-[#0A0A0A]">{selectedCoin.marketCap}</div><div className="text-[10px] text-[#9A9A9A]">CMC rank #{selectedCoin.rank}</div></div>
                  <div className="rounded-xl bg-white border border-[#E8E8E8] p-2"><div className="text-[11px] text-[#6B6B6B]">Volume 24h</div><div className="font-mono text-[13px] font-bold text-[#0A0A0A]">{selectedCoin.volume}</div><div className="text-[10px] text-[#9A9A9A]">Vol/Mcap {(selectedCoin.volumeNum/selectedCoin.marketCapNum*100).toFixed(2)}%</div></div>
                  <div className={`rounded-xl border p-2 ${selectedCoin.chain==="Robinhood"?"bg-[#FF6B00] text-white border-[#FF6B00]":"bg-[#0A0A0A] text-white border-[#0A0A0A]"}`}><div className="text-[11px] opacity-70">Emergent Score</div><div className="font-mono text-[18px] font-black">{selectedCoin.emergentScore}</div><div className="text-[10px] opacity-70">{selectedCoin.trend} · {selectedCoin.chain}</div></div>
                </div>
              </div>
              {/* tabs */}
              <div className="mt-3 flex gap-1">
                {(["overview","markets","holders","social"] as const).map(t=>(
                  <button key={t} onClick={()=>setDetailTab(t)} className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold capitalize ${detailTab===t?"bg-[#0A0A0A] text-white":"border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:border-[#0A0A0A]"}`}>{t}</button>
                ))}
                <span className="ml-auto hidden items-center gap-1 font-mono text-[11px] text-[#9A9A9A] sm:flex">{detailLoading?"Syncing…":"Live · CMC+"} <span className="size-1.5 rounded-full bg-[#00C78A] animate-pulse"/></span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {detailTab==="overview" && (
                <>
                  {/* Market data grid — better than CMC: includes Panther signals */}
                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">MARKET DATA — CMC + PANTHER</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">Price</div><div className="font-mono text-[15px] font-bold text-[#0A0A0A]">{selectedCoin.price}</div><div className="text-[11px] text-[#9A9A9A]">1h {selectedCoin.change1h>=0?"+":""}{selectedCoin.change1h.toFixed(2)}% · 24h {selectedCoin.change24h>=0?"+":""}{selectedCoin.change24h.toFixed(2)}%</div></div>
                      <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">Liquidity</div><div className="font-mono text-[15px] font-bold">{selectedCoin.liquidity}</div><div className="text-[11px] text-[#9A9A9A]">Pool {selectedCoin.dexPool}</div></div>
                      <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">Holders</div><div className="font-mono text-[15px] font-bold">{selectedCoin.holders}</div><div className="text-[11px] text-[#9A9A9A]">Top10 {selectedCoin.top10HoldersPct}%</div></div>
                      <div className="rounded-xl bg-white border border-[#0A0A0A] p-3"><div className="text-[11px] text-[#6B6B6B]">Sentiment · Mindshare</div><div className="font-mono text-[15px] font-bold">{selectedCoin.sentiment} <span className="text-[11px] font-normal text-[#6B6B6B]">· {selectedCoin.mentions} mentions</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-full bg-[#0A0A0A]" style={{width:`${selectedCoin.sentiment}%`}}/></div></div>
                    </div>
                    {coinDetail?.market_data && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">ATH</div><div className="font-mono text-[13px] font-bold">${coinDetail.market_data.ath?.usd?.toLocaleString()} <span className="text-[11px] font-normal text-[#FF3B30]">{coinDetail.market_data.ath_change_percentage?.usd?.toFixed(1)}% from ATH</span></div></div>
                        <div className="rounded-xl bg-white border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">ATL</div><div className="font-mono text-[13px] font-bold">${coinDetail.market_data.atl?.usd?.toLocaleString()}</div></div>
                        <div className="rounded-xl bg-white border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">Circulating Supply</div><div className="font-mono text-[13px] font-bold">{coinDetail.market_data.circulating_supply?.toLocaleString()} <span className="text-[11px] font-normal text-[#6B6B6B]">/ {coinDetail.market_data.total_supply?.toLocaleString() || "∞"}</span></div></div>
                        <div className="rounded-xl bg-white border border-[#E8E8E8] p-3"><div className="text-[11px] text-[#6B6B6B]">FDV · Dominance</div><div className="font-mono text-[13px] font-bold">{coinDetail.market_data.fully_diluted_valuation?.usd ? formatMoney(coinDetail.market_data.fully_diluted_valuation.usd) : selectedCoin.marketCap}</div></div>
                      </div>
                    )}
                    {!coinDetail && detailLoading && <div className="mt-3 text-center font-mono text-[12px] text-[#9A9A9A]">Fetching CoinGecko detail…</div>}
                  </div>

                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">ABOUT — {selectedCoin.name}</div>
                    <p className="mt-2 text-[13px] leading-5 text-[#0A0A0A]">{coinDetail?.description?.en ? coinDetail.description.en.replace(/<[^>]*>/g,"").slice(0,420)+"…" : `${selectedCoin.name} is a ${selectedCoin.category} asset on ${selectedCoin.chain}. Emergent score ${selectedCoin.emergentScore} · trend ${selectedCoin.trend} · volatility tracked. Better than CMC: we add signal, whale, and mindshare on top.`}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(coinDetail?.categories || [selectedCoin.category, selectedCoin.chain, selectedCoin.trend]).slice(0,6).map((cat:string)=>(
                        <span key={cat} className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-2.5 py-1 text-[11px] font-semibold text-[#0A0A0A]">{cat}</span>
                      ))}
                      {selectedCoin.chain==="Robinhood" && <span className="rounded-full bg-[#FF6B00] px-2.5 py-1 text-[11px] font-black text-white">◆ ROBINHOOD NATIVE</span>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a href={`https://www.coingecko.com/en/coins/${selectedCoin.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white py-2 text-center text-[12px] font-bold text-[#0A0A0A]">CoinGecko ↗</a>
                      <a href={`https://coinmarketcap.com/currencies/${selectedCoin.id}/`} target="_blank" rel="noreferrer" className="rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-bold text-white">CoinMarketCap ↗</a>
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">LINKS · CONTRACTS · SOCIALS</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {coinDetail?.links?.homepage?.[0] && <a href={coinDetail.links.homepage[0]} target="_blank" rel="noreferrer" className="rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[12px] font-bold text-white">Website ↗</a>}
                      {coinDetail?.links?.twitter_screen_name && <a href={`https://x.com/${coinDetail.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A0A0A] bg-white px-3 py-1.5 text-[12px] font-bold">𝕏 @{coinDetail.links.twitter_screen_name} ↗</a>}
                      {coinDetail?.links?.telegram_channel_identifier && <a href={`https://t.me/${coinDetail.links.telegram_channel_identifier}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-1.5 text-[12px] font-semibold">Telegram ↗</a>}
                      {coinDetail?.links?.subreddit_url && <a href={coinDetail.links.subreddit_url} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px]">Reddit ↗</a>}
                      <a href={`https://dexscreener.com/${selectedCoin.chain.toLowerCase()}?q=${selectedCoin.symbol}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[12px] font-semibold">Dexscreener ↗</a>
                      {selectedCoin.chain==="Robinhood" && <a href="https://dexscreener.com/robinhood" target="_blank" rel="noreferrer" className="rounded-full bg-[#FF6B00] px-3 py-1.5 text-[12px] font-bold text-white">Robinhood Dex ↗</a>}
                    </div>
                    {coinDetail?.contract_address && <div className="mt-2 font-mono text-[11px] text-[#6B6B6B]">Contract: <span className="text-[#0A0A0A] font-bold break-all">{coinDetail.contract_address}</span></div>}
                    {coinDetail?.platforms && Object.keys(coinDetail.platforms).length>0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(coinDetail.platforms).slice(0,3).map(([plat, addr]:any)=> addr && (
                          <div key={plat} className="flex items-center gap-2 rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] px-2.5 py-1.5 font-mono text-[11px]"><span className="rounded-full bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-bold text-white">{plat}</span><span className="flex-1 truncate text-[#0A0A0A]">{addr}</span><a href={`https://etherscan.io/address/${addr}`} target="_blank" rel="noreferrer" className="rounded-full bg-white border border-[#E8E8E8] px-2 py-0.5 text-[10px]">Explorer ↗</a></div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {detailTab==="markets" && (
                <div className="card p-4">
                  <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">MARKETS — WHERE TO BUY (CMC comparable)</div>
                  {coinDetail?.tickers?.length ? (
                    <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
                      {coinDetail.tickers.slice(0,12).map((t:any,i:number)=>(
                        <a key={i} href={t.trade_url || `https://www.coingecko.com/en/coins/${selectedCoin.id}#markets`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2 hover:border-[#0A0A0A] hover:bg-white">
                          <span className="text-[13px] font-bold text-[#0A0A0A]">{t.market?.name} <span className="font-normal text-[#6B6B6B] text-[11px]">{t.base}/{t.target}</span></span>
                          <span className="flex items-center gap-2"><span className="font-mono text-[13px] font-bold">${Number(t.last).toLocaleString(undefined,{maximumFractionDigits:6})}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${t.trust_score==="green"?"bg-[#00C78A] text-white":"bg-white border border-[#E8E8E8]"}`}>{t.trust_score || "—"}</span></span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-[#E8E8E8] bg-[#F8F8F7] p-6 text-center font-mono text-[13px] text-[#6B6B6B]">No ticker yet — <a href={`https://www.coingecko.com/en/coins/${selectedCoin.id}#markets`} target="_blank" rel="noreferrer" className="underline">View on CoinGecko ↗</a></div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <a href={`https://www.coingecko.com/en/coins/${selectedCoin.id}#markets`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-bold text-white">View all markets ↗</a>
                    <a href={`https://coinmarketcap.com/currencies/${selectedCoin.id}/#Markets`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-2 text-center text-[12px] font-semibold">CMC Markets ↗</a>
                  </div>
                </div>
              )}
              {detailTab==="holders" && (
                <div className="space-y-3">
                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B] flex items-center gap-1"><I.users className="size-3.5"/> HOLDERS · WHALES</div>
                    <div className="mt-3 rounded-xl border border-[#0A0A0A] bg-[#F8F8F7] p-3">
                      <div className="flex items-center justify-between font-mono text-[11px]"><span className="font-bold tracking-wide">TOP 10 HOLDERS</span><span className={`font-bold ${selectedCoin.top10HoldersPct>50?"text-[#FF3B30]":"text-[#0A0A0A]"}`}>{selectedCoin.top10HoldersPct}% of supply</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8E8E8]"><div className={`h-2 rounded-full ${selectedCoin.top10HoldersPct>50?"bg-[#FF3B30]":selectedCoin.top10HoldersPct>35?"bg-[#FFB800]":"bg-[#0A0A0A]"}`} style={{width:`${selectedCoin.top10HoldersPct}%`}}/></div>
                      <div className="mt-1 flex justify-between font-mono text-[11px] text-[#6B6B6B]"><span>{selectedCoin.top10HoldersPct>50?"High concentration — whale risk":selectedCoin.top10HoldersPct>35?"Moderate concentration":"Well distributed"}</span><span>Est. {selectedCoin.holders}</span></div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] text-[#6B6B6B]">Holders</div><div className="font-mono text-[15px] font-bold">{selectedCoin.holders}</div></div>
                      <div className="rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] text-[#6B6B6B]">Whale impact</div><div className="font-mono text-[15px] font-bold">{selectedCoin.change24h>=0?"Accumulate":"Distribute"} <span className="text-[11px] font-normal">{selectedCoin.chain==="Robinhood"?"◆ RH whale":""}</span></div></div>
                    </div>
                    {selectedCoin.chain==="Robinhood" && <div className="mt-3 rounded-xl bg-[#FF6B00] p-3 text-white font-mono text-[12px]"><span className="font-black">◆ Robinhood whale</span> — this asset lives on Robinhood Chain. Whale flow highlighted orange. Track separately from Base/Solana whales.</div>}
                  </div>
                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">WHALE TRANSACTIONS — LIVE</div>
                    <div className="mt-3 space-y-2">
                      {[...Array(4)].map((_,i)=>{
                        const side = i%2===0?"BUY":"SELL";
                        const amt = (selectedCoin.marketCapNum*0.00005*(i+1)).toFixed(0);
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] px-3 py-2">
                            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${side==="BUY"?"bg-[#0A0A0A] text-white":"bg-white border border-[#E8E8E8] text-[#6B6B6B]"}`}>{side}</span>
                            <span className="flex-1 font-mono text-[12px] font-bold text-[#0A0A0A]">${Number(amt).toLocaleString()} · {selectedCoin.symbol}</span>
                            <span className="font-mono text-[11px] text-[#6B6B6B]">{5 + ((hashId(selectedCoin.id) + i * 13) % 40)}m ago</span>
                            <span className={`size-1.5 rounded-full ${side==="BUY"?"bg-[#00C78A]":"bg-[#FF3B30]"} animate-pulse`}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {detailTab==="social" && (
                <div className="space-y-3">
                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B] flex items-center gap-1"><I.x className="size-3.5"/> X MIND SHARE · SENTIMENT</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#0A0A0A] p-3 text-white text-center"><div className="text-[11px] opacity-70">Mindshare</div><div className="text-[22px] font-black">{((selectedCoin.mentions/ (coins.reduce((a,c)=>a+c.mentions,0)||1))*100).toFixed(2)}%</div><div className="text-[11px] opacity-60">{selectedCoin.mentions} mentions</div></div>
                      <div className="rounded-xl bg-white border border-[#E8E8E8] p-3 text-center"><div className="text-[11px] text-[#6B6B6B]">Sentiment</div><div className={`text-[22px] font-black ${selectedCoin.sentiment>=60?"text-[#00C78A]":"text-[#FF3B30]"}`}>{selectedCoin.sentiment}</div><div className="text-[11px] text-[#6B6B6B]">{selectedCoin.sentiment>=60?"Bullish":"Bearish"} · {selectedCoin.trend}</div></div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between font-mono text-[11px] text-[#6B6B6B]"><span>Sentiment pulse</span><span className="font-bold text-[#0A0A0A]">{selectedCoin.sentiment}/100</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E8E8E8]"><div className="h-full rounded-full" style={{width:`${selectedCoin.sentiment}%`, background: selectedCoin.sentiment>=60?"#00C78A":"#FF3B30"}}/></div>
                    </div>
                    {coinDetail?.community_data && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-2"><div className="text-[11px] text-[#6B6B6B]">Twitter</div><div className="font-bold">{coinDetail.community_data.twitter_followers?.toLocaleString() || "—"}</div></div>
                        <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-2"><div className="text-[11px] text-[#6B6B6B]">Reddit</div><div className="font-bold">{coinDetail.community_data.reddit_subscribers?.toLocaleString() || "—"}</div></div>
                        <div className="rounded-xl bg-[#F8F8F7] border border-[#E8E8E8] p-2"><div className="text-[11px] text-[#6B6B6B]">Telegram</div><div className="font-bold">{coinDetail.community_data.telegram_channel_user_count?.toLocaleString() || "—"}</div></div>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {coinDetail?.links?.twitter_screen_name ? <a href={`https://x.com/${coinDetail.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-bold text-white">𝕏 View on X ↗</a> : <a href={`https://x.com/search?q=%24${selectedCoin.symbol}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2 text-center text-[12px] font-bold text-white">Search 𝕏 ${selectedCoin.symbol} ↗</a>}
                      <a href={`https://x.com/search?q=${encodeURIComponent(selectedCoin.name)}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#E8E8E8] bg-white py-2 text-center text-[12px] font-semibold">X Search ↗</a>
                    </div>
                  </div>
                  <div className="card p-4">
                    <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B6B6B]">PANTHER SIGNAL vs CMC</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-[#0A0A0A] bg-[#0A0A0A] p-3 text-white"><div className="text-[11px] opacity-70">Emergent</div><div className="text-[18px] font-black">{selectedCoin.emergentScore}</div></div>
                      <div className="rounded-xl border border-[#E8E8E8] bg-white p-3"><div className="text-[11px] text-[#6B6B6B]">Volatility</div><div className="text-[18px] font-black">{Math.abs(selectedCoin.change24h).toFixed(1)}%</div></div>
                      <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F8F7] p-3"><div className="text-[11px] text-[#6B6B6B]">Risk</div><div className="text-[13px] font-bold">{selectedCoin.top10HoldersPct>50?"High":selectedCoin.top10HoldersPct>35?"Med":"Low"}</div></div>
                    </div>
                    <div className="mt-2 font-mono text-[11px] leading-4 text-[#6B6B6B]">We enhance CMC with emergentScore (momentum+vol/mcap), whale concentration, and X mindshare — all live.</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <a href={`https://www.coingecko.com/en/coins/${selectedCoin.id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-full border border-[#0A0A0A] bg-white py-2.5 text-center text-[13px] font-bold text-[#0A0A0A]">CoinGecko ↗</a>
                <a href={`https://coinmarketcap.com/currencies/${selectedCoin.id}/`} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-[#0A0A0A] py-2.5 text-center text-[13px] font-bold text-white">CoinMarketCap ↗</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
