import type { Metadata } from "next";
import Link from "next/link";
import { GoogleReviews } from "@/components/GoogleReviews";
import { getGoogleReviews } from "@/lib/google-reviews";
import { ReviewForm } from "@/components/ReviewForm";
import { JsonLd } from "@/components/JsonLd";
import { trustFacts } from "@/lib/trust";
import { site } from "@/lib/site";
import { pageMetadata, canonical } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Customer Reviews — Flowers, Cakes & Gifts USA",
  description:
    "Read verified Google reviews of BlossomPot flower, cake, and gift delivery across the USA. Share your experience after delivery.",
  path: "/reviews",
});

export const revalidate = 21600;

function reviewsPageJsonLd(ratingValue: number, reviewCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Customer Reviews — ${site.name}`,
    url: canonical("/reviews"),
    description: "Customer reviews for BlossomPot USA flower, cake, and gift delivery.",
    mainEntity: {
      "@type": "Organization",
      name: site.name,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ratingValue.toFixed(1),
        reviewCount: String(reviewCount),
        bestRating: "5",
      },
    },
  };
}

export default async function ReviewsPage() {
  const googleReviews = await getGoogleReviews();
  const hasLiveGoogle =
    googleReviews.source === "google" &&
    typeof googleReviews.rating === "number" &&
    (googleReviews.totalCount ?? 0) > 0;

  return (
    <div>
      {hasLiveGoogle ? (
        <JsonLd data={reviewsPageJsonLd(googleReviews.rating!, googleReviews.totalCount!)} />
      ) : null}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-primary mb-3">Customer Reviews</h1>
        <p className="text-slate-600 leading-relaxed mb-2">
          {trustFacts.seasonLabel} — we&apos;re building trust one delivery at a time. Customers order from
          BlossomPot for {trustFacts.fulfillment.toLowerCase()}.
        </p>
        <p className="text-sm text-slate-500">
          Received your gift?{" "}
          <a href="#write-review" className="text-nav font-semibold hover:underline">
            Write a review below
          </a>
          .
          {googleReviews.mapsUrl ? (
            <>
              {" "}
              Or{" "}
              <a
                href={googleReviews.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nav font-semibold hover:underline"
              >
                leave a Google review
              </a>
              .
            </>
          ) : null}
        </p>
      </section>

      {hasLiveGoogle ? (
        <GoogleReviews data={googleReviews} />
      ) : (
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Live Google reviews will appear here once Google Places credentials are configured. We do not
            show placeholder testimonials.
          </p>
        </section>
      )}

      <section id="write-review" className="max-w-xl mx-auto px-4 py-12 scroll-mt-24">
        <h2 className="text-xl font-bold text-primary mb-2">Share your experience</h2>
        <p className="text-sm text-slate-600 mb-6">
          After delivery, tell us how it went. We verify orders before featuring reviews on the site.
        </p>
        <ReviewForm />
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12 text-center text-sm text-slate-500">
        <Link href="/products" className="text-nav font-semibold hover:underline">
          Continue shopping gifts
        </Link>
      </section>
    </div>
  );
}
