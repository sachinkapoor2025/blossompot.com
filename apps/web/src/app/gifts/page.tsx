import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { giftGuidePages } from "@/lib/content/recipients";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Gift Guides — For Her, For Him & By Budget | BlossomPot",
  description:
    "Browse BlossomPot gift guides by recipient and price. Flowers, cakes, and hampers with clear USA delivery expectations.",
  path: "/gifts",
  absoluteTitle: true,
});

export default function GiftsIndexPage() {
  const path = "/gifts";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Gifts" },
  ];
  const recipients = giftGuidePages.filter((p) => p.kind === "recipient");
  const prices = giftGuidePages.filter((p) => p.kind === "price");

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path })))}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">Gift guides</h1>
      <p className="text-slate-600 max-w-3xl mb-8 leading-relaxed">
        Start with who you are shopping for or a budget band, then open a guide for curated flowers,
        cakes, and hampers with USA delivery guidance.
      </p>

      <h2 className="text-xl font-bold text-primary mb-3">By recipient</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {recipients.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/gifts/${g.slug}`}
              className="block rounded-xl border border-slate-200 px-5 py-4 hover:border-primary/40 hover:bg-petal/40 transition-colors"
            >
              <span className="font-semibold text-primary">{g.h1}</span>
              <span className="mt-1 block text-sm text-slate-600 line-clamp-2">{g.intro.slice(0, 120)}…</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold text-primary mb-3">By budget</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {prices.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/gifts/${g.slug}`}
              className="block rounded-xl border border-slate-200 px-5 py-4 hover:border-primary/40 hover:bg-petal/40 transition-colors"
            >
              <span className="font-semibold text-primary">{g.h1}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
