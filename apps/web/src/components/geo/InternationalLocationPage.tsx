import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import { LocationSelector } from "@/components/geo/LocationSelector";
import {
  childLocations,
  internationalJsonLd,
  internationalPath,
  relatedLocationLinks,
  type ResolvedLocation,
} from "@/lib/content/geo/international";
import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";

const serviceLinks = [
  { label: "Flowers", href: categoryHref("flowers") },
  { label: "Bouquets", href: categoryHref("flower-bouquets") },
  { label: "Cakes", href: categoryHref("cakes") },
  { label: "Gift hampers", href: categoryHref("gift-hampers") },
  { label: "Same-day gifts", href: categoryHref("same-day-gifts") },
  { label: "Shipping", href: "/shipping" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const usaHubs = [
  { label: "California", slug: "california" },
  { label: "Texas", slug: "texas" },
  { label: "Florida", slug: "florida" },
  { label: "New York", slug: "new-york" },
  { label: "Illinois", slug: "illinois" },
];

export function InternationalLocationPage({ loc }: { loc: ResolvedLocation }) {
  const children = childLocations(loc);
  const related = relatedLocationLinks(loc);
  const crumbs = loc.crumbs.map((c, i) =>
    i === loc.crumbs.length - 1 ? { label: c.label } : { label: c.label, href: c.path }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd data={internationalJsonLd(loc)} />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{loc.h1}</h1>
      <p className="text-slate-600 mb-6 max-w-3xl leading-relaxed">{loc.intro}</p>

      <div className="mb-8 rounded-xl border border-primary/15 bg-petal/80 px-4 py-3 text-sm text-slate-800">
        <p className="font-medium">{loc.availability}</p>
        <p className="mt-1 text-slate-600">
          Currency shown at checkout is typically USD (Stripe) or INR (Razorpay). Local card currency:{" "}
          {loc.currency}. Language of this page: English ({loc.locale}). Clock guidance uses {loc.timezoneLabel}.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">How ordering works from {loc.label}</h2>
        <p className="text-slate-700 leading-relaxed max-w-3xl">{loc.howItWorks}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">What you can send</h2>
        <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">
          The live catalog is flowers, bouquets, cakes, and gift hampers for delivery to a United States
          address. Open a product page for inventory and timing — we do not invent local stock lists for
          cities where we are only an origin market.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {serviceLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-nav hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {loc.serviceMode !== "destination" ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-3">Popular US destinations</h2>
          <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">
            After you order from {loc.label}, timing depends on the recipient ZIP. These US hubs are
            canonical destination pages (existing URLs, not duplicates).
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {usaHubs.map((hub) => (
              <li key={hub.slug}>
                <Link href={locationPublicPath(hub.slug)} className="text-nav hover:underline">
                  Gifts to {hub.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/delivery-locations" className="text-nav hover:underline font-medium">
                All USA locations
              </Link>
            </li>
          </ul>
        </section>
      ) : (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-3">USA state and city pages</h2>
          <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">
            Canonical destination URLs remain <code className="text-xs">/gifts-to-{"{slug}"}</code>. Hierarchical
            paths under this hub redirect there so Google does not see two copies of California or Los Angeles.
          </p>
          <p>
            <Link href="/delivery-locations" className="text-nav hover:underline font-medium">
              Open the nationwide USA index
            </Link>
          </p>
        </section>
      )}

      {children.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-3">Places in {loc.label}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
            {children.map((child) => (
              <li key={child.slug}>
                <Link href={internationalPath(child)} className="text-nav hover:underline">
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Local notes</h2>
        <p className="text-slate-700 leading-relaxed max-w-3xl">{loc.localNotes}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Why BlossomPot</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 max-w-3xl">
          <li>Real US destination coverage with state and city pages that already exist.</li>
          <li>Honest origin-market guides — we do not invent foreign storefronts or fake reviews.</li>
          <li>Secure checkout (Stripe USD / Razorpay INR) and a personal gift message.</li>
          <li>
            Human support via{" "}
            <Link href="/contact" className="text-nav hover:underline">
              contact
            </Link>{" "}
            and WhatsApp.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Frequently asked questions</h2>
        <div className="grid gap-3 md:grid-cols-1 max-w-3xl">
          {loc.faqs.map((faq) => (
            <AnswerBlock key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-3">Related locations</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-nav hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <LocationSelector currentSlug={loc.slug} />
    </div>
  );
}
