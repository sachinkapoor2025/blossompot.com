import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LocationSelector } from "@/components/geo/LocationSelector";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import {
  getInternationalLocation,
  internationalPath,
  isInternationalIndexable,
  MARKET_SLUGS,
} from "@/lib/content/geo/international";
import { locationPublicPath } from "@/lib/content/seo-data";

export const metadata: Metadata = pageMetadata({
  title: "Where BlossomPot Operates — USA Delivery & International Ordering",
  description:
    "BlossomPot delivers gifts across the United States. Shoppers in Canada, Australia, the UK, and Europe can order for a US address. Browse country hubs.",
  path: "/locations",
});

const usaExamples = [
  { label: "California", slug: "california" },
  { label: "Texas", slug: "texas" },
  { label: "Florida", slug: "florida" },
  { label: "New York", slug: "new-york" },
  { label: "Los Angeles", slug: "los-angeles" },
];

export default function LocationsHubPage() {
  const markets = MARKET_SLUGS.map((slug) => getInternationalLocation(slug)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m && isInternationalIndexable(m))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Locations", path: "/locations" },
          ]),
          itemListJsonLd(
            "BlossomPot location hubs",
            markets.map((m) => ({ name: m.label, path: internationalPath(m) }))
          ),
        ]}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Locations" }]} />
      <h1 className="text-3xl font-bold text-primary mb-3">Where we operate</h1>
      <p className="text-slate-600 max-w-3xl mb-6 leading-relaxed">
        BlossomPot’s live delivery destination is the United States — all 50 states, DC, and Puerto Rico.
        Shoppers in Canada, Australia, the United Kingdom, and other European countries can order on this
        site and send flowers, cakes, and hampers to a US address. We do not invent local florist shops
        abroad. Country and city guides below explain how ordering works from those places, with unique
        time-zone and checkout notes. Thin or unfinished markets stay unpublished.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Markets</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {markets.map((market) => (
            <li key={market.slug} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-primary mb-1">
                <Link href={internationalPath(market)} className="hover:underline">
                  {market.label}
                </Link>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{market.availability}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">USA destination examples</h2>
        <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">
          Existing indexed URLs stay on <code className="text-xs">/gifts-to-{"{slug}"}</code>. This hub does
          not replace them.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {usaExamples.map((ex) => (
            <li key={ex.slug}>
              <Link href={locationPublicPath(ex.slug)} className="text-nav hover:underline">
                Gifts to {ex.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/delivery-locations" className="text-nav hover:underline font-medium">
              Full USA index
            </Link>
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Products and help</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li>
            <Link href="/flowers" className="text-nav hover:underline">
              Flowers
            </Link>
          </li>
          <li>
            <Link href="/cakes" className="text-nav hover:underline">
              Cakes
            </Link>
          </li>
          <li>
            <Link href="/gift-hampers" className="text-nav hover:underline">
              Hampers
            </Link>
          </li>
          <li>
            <Link href="/shipping" className="text-nav hover:underline">
              Shipping
            </Link>
          </li>
          <li>
            <Link href="/faq" className="text-nav hover:underline">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-nav hover:underline">
              Contact
            </Link>
          </li>
        </ul>
      </section>

      <LocationSelector />
    </div>
  );
}
