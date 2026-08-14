import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import { categoryHref } from "@/lib/category-urls";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { CorporateQuoteForm } from "./CorporateQuoteForm";

const faqs = [
  {
    q: "Does BlossomPot offer corporate gifting?",
    a: "Yes—we support business orders for client appreciation, employee milestones, and event gifting. Share quantity, cities, and timing via the quote form and our team will follow up.",
  },
  {
    q: "Can you deliver to multiple US addresses?",
    a: "Multi-address programs are handled case by case. Include destination cities and approximate headcount in your inquiry so we can advise on feasibility and timelines.",
  },
  {
    q: "Do you publish volume discounts online?",
    a: "Published storefront prices apply to standard checkout orders. Custom corporate pricing depends on product mix, quantity, and delivery complexity—request a quote for details.",
  },
];

export const metadata: Metadata = pageMetadata({
  title: "Corporate Gifting — Flowers & Client Gifts USA | BlossomPot",
  description:
    "Corporate flower and gift programs for client appreciation, employee milestones, and events. Request a quote from BlossomPot — operated by Divit Global Ventures.",
  path: "/corporate-gifting",
  absoluteTitle: true,
});

export default function CorporateGiftingPage() {
  const path = "/corporate-gifting";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Corporate Gifting" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-4">Corporate Gifting with {site.name}</h1>
      <div className="space-y-4 text-slate-700 leading-relaxed mb-10">
        <p>
          {site.name} helps teams send flowers, bouquets, cakes, and curated gift hampers for client
          thank-yous, employee recognition, and celebration moments across the United States. Orders can
          start from our public catalog for smaller sends, or begin with a quote request when you need
          coordinated quantities, multiple addresses, or a defined delivery window.
        </p>
        <p>
          We do not invent inventory guarantees or unpublished “enterprise SLAs” on this page. What we can
          commit to is clear communication: tell us the occasion, approximate quantity, destination cities,
          and timing, and our support team will respond with realistic options based on current catalog and
          fulfillment capacity. {site.name} is operated by {site.legalName}.
        </p>
        <p>
          Popular corporate starting points include{" "}
          <Link href={categoryHref("flowers")} className="text-nav hover:underline">
            flowers
          </Link>
          ,{" "}
          <Link href={categoryHref("gift-hampers")} className="text-nav hover:underline">
            gift hampers
          </Link>
          , and{" "}
          <Link href={categoryHref("celebration-gifts")} className="text-nav hover:underline">
            celebration gifts
          </Link>
          . For branding or press questions, see our{" "}
          <Link href="/press" className="text-nav hover:underline">
            press kit
          </Link>
          .
        </p>
      </div>

      <h2 className="text-xl font-bold text-primary mb-3">Request a quote</h2>
      <p className="text-slate-600 text-sm mb-4">
        Submissions go to our support workflow. You can also email{" "}
        <a href={`mailto:${site.supportEmail}`} className="text-nav hover:underline">
          {site.supportEmail}
        </a>{" "}
        directly.
      </p>
      <CorporateQuoteForm />

      <section className="mt-12">
        <h2 className="text-xl font-bold text-primary mb-4">Corporate gifting FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
