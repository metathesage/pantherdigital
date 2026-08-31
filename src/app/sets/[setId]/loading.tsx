import { GridSkeleton } from "@/components/Skeleton";

export default function LoadingSet() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="skeleton h-10 w-72 rounded-xl" aria-hidden />
      <div className="skeleton mt-4 h-5 w-full max-w-md rounded-full" aria-hidden />
      <div className="mt-8 flex flex-wrap gap-2" aria-hidden>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="mt-6">
        <GridSkeleton count={12} />
      </div>
    </div>
  );
}
