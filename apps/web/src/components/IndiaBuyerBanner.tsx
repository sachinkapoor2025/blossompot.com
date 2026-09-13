import Link from "next/link";

/**
 * Soft international-buyer cue (hidden unless mounted on a page).
 */
export function IndiaBuyerBanner() {
  return (
    <aside
      className="border-b border-line bg-ivory"
      aria-label="Ordering from abroad"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <p className="text-ink">
          <span className="font-semibold text-promo">Ordering from abroad?</span>{" "}
          Pay with <strong>UPI / INR</strong> or card — we deliver gifts to US addresses.
        </p>
        <Link href="/flowers" className="shrink-0 font-semibold text-nav hover:underline">
          Shop flowers & gifts →
        </Link>
      </div>
    </aside>
  );
}
