import { testimonials } from "@/lib/site";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-gold" : "text-line"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/** Compact social proof from existing site testimonials and units-sold data. */
export function ProductProofLine({
  unitsSold,
  fastSelling,
}: {
  unitsSold: number;
  fastSelling: boolean;
}) {
  const avg = testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length;
  const rounded = Math.round(avg);
  const parts: string[] = [];
  if (fastSelling && unitsSold > 0) {
    parts.push(`${unitsSold}+ purchased`);
  } else if (unitsSold > 0) {
    parts.push(`${unitsSold} purchased`);
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted mb-3">
      <StarRating rating={rounded} />
      <span className="font-semibold text-ink">{avg.toFixed(1)}</span>
      <a href="#customer-reviews" className="text-nav hover:underline">
        {testimonials.length} customer stories
      </a>
      {parts.length > 0 ? (
        <>
          <span className="text-line" aria-hidden>
            ·
          </span>
          <span>{parts.join(" · ")}</span>
        </>
      ) : null}
    </p>
  );
}
