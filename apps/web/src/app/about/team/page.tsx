import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Team & Authors — BlossomPot Editorial | Divit Global Ventures",
  description:
    "Meet the BlossomPot editorial and operations contributors at Divit Global Ventures. Honest bios for gift guides, delivery explainers, and storefront content.",
  path: "/about/team",
  absoluteTitle: true,
});

const authors = [
  {
    name: "BlossomPot Editorial",
    role: "Editorial & content operations",
    bio: `BlossomPot Editorial is the byline used for gift guides, occasion explainers, and delivery help content published on ${site.domain}. The desk is part of ${site.legalName}’s storefront operations—not a separate newsroom or magazine. Writers focus on practical gifting guidance (occasions, etiquette, and how ordering works) and revise pages when catalog categories, shipping messaging, or policies change. Content is reviewed against live product and support information before major updates go public.`,
  },
  {
    name: "Divit Global Ventures Operations",
    role: "Operator & fulfillment coordination",
    bio: `${site.legalName} (DGV) operates ${site.name}. The operations team coordinates catalog presentation, customer support workflows, and USA delivery messaging you see across the site. This is an operator entity bio—not a claim of venture-capital funding, celebrity founders, or third-party awards. For media requests, use ${site.supportEmail} or the press page. For order help, contact support through WhatsApp or email listed on the contact page.`,
  },
];

export default function AboutTeamPage() {
  const path = "/about/team";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Team" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd
        data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path })))}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-4">Team &amp; authors</h1>
      <p className="text-slate-700 leading-relaxed mb-8">
        {site.name} is operated by <strong>{site.legalName}</strong>. The profiles below describe who
        stands behind storefront and editorial content. We do not invent press awards, fake employee
        headcounts, or celebrity endorsements.
      </p>

      <div className="space-y-8">
        {authors.map((a) => (
          <article key={a.name} className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-primary">{a.name}</h2>
            <p className="text-sm text-slate-500 mb-3">{a.role}</p>
            <p className="text-slate-700 leading-relaxed">{a.bio}</p>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-600">
        How we write and fact-check:{" "}
        <Link href="/editorial-policy" className="text-nav hover:underline">
          Editorial policy
        </Link>
        . Company overview:{" "}
        <Link href="/about" className="text-nav hover:underline">
          About {site.name}
        </Link>
        .
      </p>
    </div>
  );
}
