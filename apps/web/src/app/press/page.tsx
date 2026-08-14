import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = pageMetadata({
  title: "Press — BlossomPot Media Kit",
  description: `Media resources, brand story, and contact information for journalists covering ${site.name} — flowers, cakes, and gifts with USA delivery.`,
  path: "/press",
});

export default function PressPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Press & media</h1>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-primary">About BlossomPot</h2>
          <p>
            {site.name} ({siteUrl}) is an online florist and gifting store operated by Divit Global
            Ventures, helping shoppers send premium flowers, cakes, and curated gifts across the
            United States. Orders fulfill domestically with clear delivery expectations on every
            product page.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Flowers, bouquets, cakes, and gift hampers for USA delivery</li>
            <li>Occasion collections for birthdays, anniversaries, and celebrations</li>
            <li>Secure checkout in USD (Stripe) and INR (Razorpay)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-primary">Story angles</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>How long-distance families send celebration gifts across the USA</li>
            <li>Modern flower and cake gifting with transparent shipping windows</li>
            <li>California-based fulfillment for domestic US delivery</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-primary">Media contact</h2>
          <p>
            Email{" "}
            <a className="text-nav hover:underline" href={`mailto:${site.supportEmail}`}>
              {site.supportEmail}
            </a>{" "}
            or visit{" "}
            <Link href="/contact" className="text-nav hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
