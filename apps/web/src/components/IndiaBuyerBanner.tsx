import Link from "next/link";

/**
 * Soft India-buyer cue on the homepage.
 * Additive — does not replace USA-ranking hero/H1 messaging.
 */
export function IndiaBuyerBanner() {
  return (
    <aside
      className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50"
      aria-label="Ordering from India"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <p className="text-slate-800">
          <span className="font-semibold text-primary">Ordering from India?</span>{" "}
          Pay with <strong>UPI / INR</strong> — we deliver to your brother in the USA.
        </p>
        <Link
          href="/send-rakhi-from-india"
          className="shrink-0 font-semibold text-nav hover:underline"
        >
          Send Rakhi from India →
        </Link>
      </div>
    </aside>
  );
}
