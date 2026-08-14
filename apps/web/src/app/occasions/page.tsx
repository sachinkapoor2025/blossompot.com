import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { occasionPages } from "@/lib/content/occasions";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Occasion Gifts — Birthday, Anniversary & More | BlossomPot",
  description:
    "Browse BlossomPot occasion hubs for birthday, anniversary, sympathy, congratulations, and more. Flowers, cakes, and gifts with clear USA delivery guidance.",
  path: "/occasions",
  absoluteTitle: true,
});

export default function OccasionsIndexPage() {
  const path = "/occasions";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Occasions" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path })))}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">Shop by occasion</h1>
      <p className="text-slate-600 max-w-3xl mb-8 leading-relaxed">
        Choose an occasion hub for gift ideas, etiquette notes, and curated flowers, cakes, and
        hampers with USA delivery guidance on every product.
      </p>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {occasionPages.map((o) => (
          <li key={o.slug}>
            <Link
              href={`/occasions/${o.slug}`}
              className="block rounded-xl border border-slate-200 px-5 py-4 hover:border-primary/40 hover:bg-petal/40 transition-colors"
            >
              <span className="font-semibold text-primary">{o.h1}</span>
              <span className="mt-1 block text-sm text-slate-600 line-clamp-2">{o.intro.slice(0, 120)}…</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
