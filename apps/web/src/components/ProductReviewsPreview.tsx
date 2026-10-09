"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductRatingAggregate, ProductReview } from "@blossompot/shared";
import { api } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
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

/** Product reviews from the catalog API only — never reused marketing quotes. */
export function ProductReviewsPreview({
  productSlug,
  aggregate,
}: {
  productSlug: string;
  aggregate?: ProductRatingAggregate | null;
}) {
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api<{ reviews?: ProductReview[] }>(`/products/${encodeURIComponent(productSlug)}/reviews`, {
      revalidate: false,
    })
      .then((data) => {
        if (!cancelled) setReviews(data.reviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  if (reviews === null) {
    return <p className="text-sm text-slate-500">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">No customer reviews for this product yet.</p>
        <p className="text-xs text-slate-500">
          After delivery you can{" "}
          <Link href="/reviews" className="text-nav font-semibold hover:underline">
            share a review
          </Link>
          . We do not show placeholder quotes on product pages.
        </p>
      </div>
    );
  }

  const avg =
    aggregate?.ratingValue ??
    reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating rating={Math.round(avg)} />
        <span className="text-sm font-semibold text-slate-800">{avg.toFixed(1)} / 5</span>
        <span className="text-xs text-slate-500">
          from {aggregate?.reviewCount ?? reviews.length} verified reviews
        </span>
      </div>
      <ul className="space-y-3">
        {reviews.slice(0, 8).map((review) => (
          <li key={review.reviewId} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-slate-800">{review.authorName}</span>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{review.body}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        <Link href="/reviews" className="text-nav font-semibold hover:underline">
          Write a review after delivery →
        </Link>
      </p>
    </div>
  );
}
