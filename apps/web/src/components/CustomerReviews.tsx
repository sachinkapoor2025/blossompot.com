import Link from "next/link";
import { testimonials } from "@/lib/site";
import type { GoogleReviewsPayload } from "@/lib/google-reviews";

type ReviewItem = {
  id: string;
  name: string;
  rating: number;
  text: string;
  dateLabel?: string;
};

function reviewsFromData(data?: GoogleReviewsPayload): ReviewItem[] {
  if (data?.reviews.length) {
    return data.reviews.map((review) => ({
      id: review.id,
      name: review.authorName,
      rating: review.rating,
      text: review.text,
      dateLabel: review.dateLabel,
    }));
  }

  return testimonials.map((review, index) => ({
    id: `site-${index}-${review.name}`,
    name: review.name,
    rating: review.rating,
    text: review.text,
    dateLabel: review.timeAgo,
  }));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 shrink-0 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

type CustomerReviewsProps = {
  data?: GoogleReviewsPayload;
};

export function CustomerReviews({ data }: CustomerReviewsProps) {
  const reviews = reviewsFromData(data);
  if (reviews.length === 0) return null;

  const isGoogle = data?.source === "google";
  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section
      className="overflow-x-clip border-y border-[#eadfd8] bg-gradient-to-b from-[#fff8f5] to-white"
      aria-labelledby="customer-reviews-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-nav">Loved by gifters</p>
          <h2 id="customer-reviews-heading" className="text-2xl font-bold text-primary md:text-3xl">
            Customer reviews
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            {isGoogle && data.rating != null && data.totalCount != null
              ? `${data.rating.toFixed(1)}★ on Google · ${data.totalCount.toLocaleString()} reviews`
              : `${average.toFixed(1)} out of 5 from recent BlossomPot customers`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex min-w-0 flex-col rounded-2xl border border-primary/10 bg-white p-5 shadow-sm"
            >
              <StarRating rating={review.rating} />
              <p className="mt-3 flex-1 break-words text-sm leading-relaxed text-slate-600">
                “{review.text}”
              </p>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="truncate font-semibold text-slate-800">{review.name}</p>
                {review.dateLabel ? (
                  <p className="mt-0.5 text-xs text-slate-400">{review.dateLabel}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link href="/reviews" className="text-sm font-semibold text-nav hover:underline">
            Read all reviews or share yours →
          </Link>
        </p>
      </div>
    </section>
  );
}
