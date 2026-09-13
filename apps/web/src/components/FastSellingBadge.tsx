import { FAST_SELLING_THRESHOLD } from "@blossompot/shared";

/** Badge for product cards and detail pages. */
export function FastSellingBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border border-promo/35 bg-surface/95 text-promo text-[10px] sm:text-xs font-bold px-2 py-1 rounded ${className}`}
    >
      <span aria-hidden>🔥</span>
      Fast Selling
    </span>
  );
}

export function FastSellingBanner({ unitsSold }: { unitsSold: number }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-promo/20 bg-ivory px-4 py-3 mb-3">
      <span className="text-2xl shrink-0" aria-hidden>
        🔥
      </span>
      <div>
        <p className="font-bold text-promo text-sm">Fast Selling — {unitsSold}+ sisters chose this!</p>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">
          This gift is trending on BlossomPot. {FAST_SELLING_THRESHOLD}+ sold — order soon while stock lasts.
        </p>
      </div>
    </div>
  );
}
