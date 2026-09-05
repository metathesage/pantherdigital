import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center">
      <div className="animate-fade-up">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center">
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#E8E8E8]" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#0A0A0A]" />
            <div className="absolute inset-2 rounded-full border border-[#E8E8E8]" />
            <div className="absolute inset-0 grid place-items-center text-[10px] font-bold tracking-widest text-[#6B6B6B]">
              404
           </div>
         </div>
       </div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-[#6B6B6B]">
          SIGNAL LOST
       </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0A0A0A]">
          This card slipped out of the binder.
       </h1>
        <p className="mt-3 text-sm leading-5 text-[#6B6B6B]">
          The page you were hunting for doesn't exist — it may have been
          reprinted under a different number, or it never made it past the radar.
       </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            ← Home
         </Link>
          <Link
            href="/app"
            className="rounded-full border border-[#E8E8E8] px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:border-[#0A0A0A]"
          >
            Open Radar
         </Link>
       </div>
     </div>
   </div>
  );
}
