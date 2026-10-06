/**
 * Static navigation skeletons. No client JavaScript.
 * Shapes follow the shop grid and the product gallery so the real page can replace them with little shift.
 */

function Bone({ className }: { className: string }) {
  return <div className={`rounded bg-slate-200/80 ${className}`} />;
}

export function ListingPageSkeleton({ width = "7xl" }: { width?: "6xl" | "7xl" }) {
  const maxWidth = width === "6xl" ? "max-w-6xl" : "max-w-7xl";
  return (
    <div className={`${maxWidth} mx-auto px-4 py-10 animate-pulse`} aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>
      <Bone className="h-4 w-40 mb-6" />
      <Bone className="h-9 w-72 max-w-full mb-4" />
      <Bone className="h-4 w-full max-w-2xl mb-8" />
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 6 }, (_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="aspect-square bg-slate-100" />
            <div className="p-3 space-y-2">
              <Bone className="h-4 w-4/5" />
              <Bone className="h-4 w-2/5" />
              <Bone className="h-9 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-16 animate-pulse" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading product</p>
      <Bone className="h-4 w-64 max-w-full mb-6" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-start">
        <div className="aspect-square rounded-xl bg-slate-100 border border-slate-100" />
        <div className="space-y-4">
          <Bone className="h-8 w-4/5" />
          <Bone className="h-6 w-28" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-2/3" />
          <Bone className="h-11 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
