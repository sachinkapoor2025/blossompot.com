import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Editorial Policy — How BlossomPot Content Is Produced",
  description:
    "How BlossomPot gift guides and help pages are written, reviewed, and updated by Divit Global Ventures. No fake reviews or invented claims.",
  path: "/editorial-policy",
  absoluteTitle: true,
});

export default function EditorialPolicyPage() {
  const path = "/editorial-policy";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Editorial Policy" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd
        data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path })))}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-4">Editorial policy</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          This page explains how {site.name} produces gift guides, occasion explainers, FAQs, and help
          content on {site.domain}. {site.name} is operated by {site.legalName}. Our goal is useful,
          accurate gifting guidance—not inflated marketing claims.
        </p>

        <section>
          <h2 className="text-xl font-bold text-primary mb-2">What we publish</h2>
          <p>
            Editorial pages cover occasions, recipients, delivery expectations, etiquette, and how to
            shop flowers, cakes, and gifts on {site.name}. Product prices, availability, and delivery
            windows shown in the catalog are system-driven and can change; narrative pages describe
            typical patterns and should be read alongside live product and checkout information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-2">How content is produced</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Drafts start from real catalog categories, support workflows, and shipping messaging used on the storefront.</li>
            <li>Occasion and gift-guide copy is written to be practical (what to send, how to phrase a note, what to double-check at checkout).</li>
            <li>Authors are identified on our{" "}
              <Link href="/about/team" className="text-nav hover:underline">
                team page
              </Link>
              ; we use operator-honest bylines rather than invented journalist personas.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-2">Fact-checking standards</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not invent phone numbers, star ratings, press awards, or customer review counts.</li>
            <li>Delivery claims must match current site guidance (including same-day eligibility only where products and locations support it).</li>
            <li>When policies change (shipping, returns, payments), related help pages should be updated in the same release cycle when practical.</li>
            <li>Corporate and media pages must not imply partnerships, certifications, or funding that do not exist.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-2">Corrections</h2>
          <p>
            If you spot an error in editorial content, email{" "}
            <a href={`mailto:${site.supportEmail}`} className="text-nav hover:underline">
              {site.supportEmail}
            </a>{" "}
            with the page URL and the correction. Substantive fixes are applied as soon as we can verify
            them against live operations data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-2">Commercial relationship</h2>
          <p>
            {site.name} sells flowers, cakes, and gifts. Editorial pages support shopping decisions and
            may link to product collections. That commercial context is disclosed by the nature of the
            site; we still avoid fake scarcity, fabricated testimonials, and unverifiable superlatives.
          </p>
        </section>
      </div>
    </div>
  );
}
