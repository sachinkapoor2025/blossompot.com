import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { FaqAccordion } from "@/components/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { BackToHome } from "@/components/BackToHome";
import { faqsForCountry } from "@/lib/faqs-for-country";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { countryDisplayName } from "@/lib/location-seo-urls";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — Flowers, Cakes & Gifts Worldwide",
  description:
    "Frequently asked questions about BlossomPot: worldwide delivery windows, gift messages, payments, and returns.",
  path: "/faq",
});

export const dynamic = "force-dynamic";

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const country = await getStorefrontDeliveryCountry(params.country);
  const items = faqsForCountry(country);
  const destination = countryDisplayName(country);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={faqJsonLd(items)} />
      <h1 className="text-3xl font-bold text-primary mb-2">Frequently Asked Questions</h1>
      <p className="text-slate-600 mb-8">
        Answers for sending flowers, cakes, and gifts to {destination} with {site.name}. Change the
        country in the header to see destination-specific delivery notes.
      </p>
      <FaqAccordion items={items} />
      <p className="mt-10 text-sm text-slate-500">
        More guides:{" "}
        <Link href="/shipping" className="text-nav hover:underline">
          Shipping
        </Link>
        {" · "}
        <Link href="/blog" className="text-nav hover:underline">
          Blog
        </Link>
        {" · "}
        <Link href="/flowers" className="text-nav hover:underline">
          Shop flowers
        </Link>
        {" · "}
        <Link href="/contact" className="text-nav hover:underline">
          Contact
        </Link>
      </p>
      <BackToHome className="mt-8" />
    </div>
  );
}
