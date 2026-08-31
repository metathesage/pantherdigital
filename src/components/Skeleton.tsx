export function TileSkeleton() {
  return (
    <div className="rounded-2xl ring-1 ring-black/5" aria-hidden>
      <div className="skeleton aspect-[300/420] w-full rounded-t-2xl" />
      <div className="space-y-2 border-t border-black/5 px-3 py-3">
        <div className="skeleton h-3.5 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {[...Array(count)].map((_, i) => (
        <li key={i}>
          <TileSkeleton />
        </li>
      ))}
    </ul>
  );
}
