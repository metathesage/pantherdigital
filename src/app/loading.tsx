export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="size-12 rounded-full border-2 border-[#E8E8E8]" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#0A0A0A]" />
        </div>
        <span className="text-[11px] font-semibold tracking-[0.3em] text-[#6B6B6B]">LOCKING TARGET</span>
      </div>
    </div>
  );
}
