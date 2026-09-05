"use client";
export function Sparkline({data, color="#0A0A0A"}:{data:number[];color?:string}) {
  if (!data || data.length < 2) return <div className="h-7 w-full" />;
  const w = 96, h = 28, pad = 3;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1)) * (w-pad*2)+pad},${h-pad - ((v-min)/range)*(h-pad*2)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <polyline fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}
