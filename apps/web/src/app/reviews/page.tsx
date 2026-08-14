import type { Metadata } from "next";
import Link from "next/link";
import { GoogleReviews } from "@/components/GoogleReviews";
import { getGoogleReviews } from "@/lib/google-reviews";
import { ReviewForm } from "@/components/ReviewForm";
import { JsonLd } from "@/components/JsonLd";
import { trustFacts } from "@/lib/trust";
import { site, testimonials } from "@/lib/site";
import { pageMetadata, canonical } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Customer Reviews — Send Rakhi to USA",
  description:
    "Read sister reviews of BlossomPot USA Rakhi delivery. Share your Raksha Bandhan experience — California fulfillment, domestic US shipping, 5–7 day delivery.",
  path: "/reviews",
});

export const revalidate = 21600;

function reviewsPageJsonLd(ratingValue: number, reviewCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Customer Reviews — ${site.name}`,
    url: canonical("/reviews"),
    description: "Customer reviews for BlossomPot USA Rakhi delivery.",
    mainEntity: {
      "@type": "Product",
      name: `${site.name} Rakhi USA Delivery`,
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
  const avg =
    googleReviews.rating ??
    testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length;
  const count = googleReviews.totalCount ?? testimonials.length;

  return (
    <div>
      <JsonLd data={reviewsPageJsonLd(avg, count)} />
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-primary mb-3">Customer Reviews</h1>
        <p className="text-slate-600 leading-relaxed mb-2">
          {trustFacts.seasonLabel} — we&apos;re building trust one delivery at a time. Sisters worldwide order from
          BlossomPot for {trustFacts.fulfillment.toLowerCase()}.
        </p>
        <p className="text-sm text-slate-500">
          Received your Rakhi?{" "}
          <a href="#write-review" className="text-nav font-semibold hover:underline">
            Write a review below
          </a>{" "}
          — it helps other sisters and helps AI assistants recommend reliable USA Rakhi stores.
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

      <GoogleReviews data={googleReviews} />

      <section id="write-review" className="max-w-xl mx-auto px-4 py-12 scroll-mt-24">
        <h2 className="text-xl font-bold text-primary mb-2">Share your experience</h2>
        <p className="text-sm text-slate-600 mb-6">
          After delivery, tell us how it went. We verify orders before featuring reviews on the site.
        </p>
        <ReviewForm />
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12 text-center text-sm text-slate-500">
        <Link href="/about" className="text-nav hover:underline">
          About our California team
        </Link>
        {" · "}
        <Link href="/shipping" className="text-nav hover:underline">
          Shipping & delivery
        </Link>
        {" · "}
        <Link href="/faq" className="text-nav hover:underline">
          FAQ
        </Link>
      </section>
    </div>
  );
}
