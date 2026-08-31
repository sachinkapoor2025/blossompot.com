import Link from "next/link";
import type { ReactNode } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import { SameDayCountdown } from "@/components/geo/SameDayCountdown";
import { locationPublicPath } from "@/lib/content/seo-data";
import {
  type GeoLocation,
  geoCitiesInState,
  geoPageH1,
  getGeoLocation,
  locationLabel,
  neighboringStates,
  stateForCity,
  tzDisplayName,
} from "@/lib/content/geo/locations";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, serviceAreaJsonLd } from "@/lib/seo";
import { categoryHref } from "@/lib/category-urls";
import type { Product } from "@blossompot/shared";

const categoryLinks = [
  { label: "Flowers", href: categoryHref("flowers") },
  { label: "Bouquets", href: categoryHref("flower-bouquets") },
  { label: "Cakes", href: categoryHref("cakes") },
  { label: "Hampers", href: categoryHref("gift-hampers") },
  { label: "Birthday", href: categoryHref("birthday-gifts") },
  { label: "Same-Day", href: categoryHref("same-day-gifts") },
];

function VisualHeading({
  as,
  className,
  children,
}: {
  as: "h2" | "h3" | "p";
  className: string;
  children: ReactNode;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

function resolveNearbyLinks(geo: GeoLocation, slug: string) {
  const fromSlugs = (geo.nearbySlugs ?? [])
    .map((s) => getGeoLocation(s))
    .filter((g): g is GeoLocation => g != null && g.slug !== slug)
    .map((hit) => ({ label: locationLabel(hit), href: locationPublicPath(hit.slug) }));

  if (fromSlugs.length >= 3) return fromSlugs.slice(0, 6);

  const fromNames = geo.nearbyAreas
    .map((name) => {
      const inState = geoCitiesInState(geo.type === "city" ? geo.state : geo.name).find(
        (g) => g.name.toLowerCase() === name.toLowerCase() && g.slug !== slug
      );
      const match = getGeoLocation(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
      const hit = inState ?? (match && match.slug !== slug ? match : undefined);
      return hit ? { label: locationLabel(hit), href: locationPublicPath(hit.slug) } : null;
    })
    .filter((x): x is { label: string; href: string } => Boolean(x));

  return fromNames.slice(0, 6);
}

export function StateGeoTemplate({
  geo,
  products,
  path,
}: {
  geo: GeoLocation;
  products: Product[];
  path: string;
}) {
  const place = locationLabel(geo);
  const tzLabel = tzDisplayName(geo.timezone);
  const childCities = (geo.cityPageSlugs ?? [])
    .map((s) => getGeoLocation(s))
    .filter(Boolean) as GeoLocation[];
  const neighbors = neighboringStates(geo, 4);
  const compactSeo = geo.slug === "texas";
  const nearbyHeading = compactSeo ? "Nearby gift delivery pages" : "Neighbouring states";
  const nearbyLinks = compactSeo
    ? neighbors.length > 0
      ? neighbors
      : childCities.slice(0, 6)
    : neighbors;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: "Delivery locations", href: "/delivery-locations" },
    { label: place },
  ];
  const fallback = `Order by ${geo.cutoffTimeLocal} ${tzLabel} for same-day eligible ZIPs in ${place}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(geo.localFaqs),
          serviceAreaJsonLd({ label: place, slug: geo.slug }),
          itemListJsonLd(
            `Gifts to ${place}`,
            products.slice(0, 24).map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{geoPageH1(geo)}</h1>
      <p className="text-slate-600 mb-4 max-w-3xl leading-relaxed">{geo.introParagraph}</p>

      <div className="mb-8 rounded-xl border border-primary/15 bg-petal/80 px-4 py-3 text-sm text-slate-800">
        <SameDayCountdown
          timezone={geo.timezone}
          cutoffTimeLocal={geo.cutoffTimeLocal}
          placeLabel={place}
          fallbackText={fallback}
        />
        <p className="mt-1 text-slate-600">{geo.deliveryWindow}.</p>
      </div>

      <section className="mb-10">
        <VisualHeading as={compactSeo ? "p" : "h2"} className="text-xl font-bold text-primary mb-3">
          Cities we deliver to in {place}
        </VisualHeading>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
          {childCities.map((c) => (
            <li key={c.slug}>
              <Link href={locationPublicPath(c.slug)} className="text-nav hover:underline">
                Send gifts to {locationLabel(c)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <VisualHeading as={compactSeo ? "p" : "h2"} className="text-xl font-bold text-primary mb-3">
        Flower delivery {place} — featured gifts
      </VisualHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>

      <section className="mt-12 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-primary mb-3">Shop categories for {place}</h2>
          <ul className="flex flex-wrap gap-2">
            {categoryLinks.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="btn-nav text-xs">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {nearbyLinks.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-primary mb-3">{nearbyHeading}</h2>
            <ul className="space-y-2 text-sm">
              {nearbyLinks.map((n) => (
                <li key={n.slug}>
                  <Link href={locationPublicPath(n.slug)} className="text-nav hover:underline">
                    Send gifts to {locationLabel(n)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-12">
        <VisualHeading as={compactSeo ? "p" : "h2"} className="text-xl font-bold text-primary mb-2">
          Cake delivery {place} &amp; same day gift delivery {place}
        </VisualHeading>
        <VisualHeading
          as={compactSeo ? "h2" : "h3"}
          className="text-lg font-semibold text-primary mb-4"
        >
          Frequently asked questions — {place}
        </VisualHeading>
        <div className="space-y-4">
          {geo.localFaqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function CityGeoTemplate({
  geo,
  products,
  path,
}: {
  geo: GeoLocation;
  products: Product[];
  path: string;
}) {
  const place = locationLabel(geo);
  const tzLabel = tzDisplayName(geo.timezone);
  const parent = stateForCity(geo);
  const nearbyLinks = resolveNearbyLinks(geo, geo.slug);
  const showNearby = nearbyLinks.length >= 3;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    ...(parent
      ? [{ label: locationLabel(parent), href: locationPublicPath(parent.slug) }]
      : [{ label: "Delivery locations", href: "/delivery-locations" }]),
    { label: place },
  ];
  const fallback = `Order by ${geo.cutoffTimeLocal} ${tzLabel} for same-day eligible ZIPs in ${place}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(geo.localFaqs),
          serviceAreaJsonLd({ label: geo.name, slug: geo.slug, state: geo.state }),
          itemListJsonLd(
            `Gifts to ${place}`,
            products.slice(0, 24).map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{geoPageH1(geo)}</h1>
      <p className="text-slate-600 mb-4 max-w-3xl leading-relaxed">{geo.introParagraph}</p>

      <div className="mb-8 rounded-xl border border-primary/15 bg-petal/80 px-4 py-3 text-sm text-slate-800">
        <SameDayCountdown
          timezone={geo.timezone}
          cutoffTimeLocal={geo.cutoffTimeLocal}
          placeLabel={place}
          fallbackText={fallback}
        />
        <p className="mt-1 text-slate-600">{geo.deliveryWindow}.</p>
        {showNearby && (
          <p className="mt-1 text-slate-600">
            Nearby areas commonly served:{" "}
            {nearbyLinks.map((n) => n.label).join(", ")}.
          </p>
        )}
        {geo.zipPrefixes.length > 0 && (
          <p className="mt-1 text-slate-600">
            ZIP prefixes with documented coverage: {geo.zipPrefixes.join(", ")}.
          </p>
        )}
      </div>

      <h2 className="text-xl font-bold text-primary mb-3">
        Flower delivery {geo.name} — featured gifts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>

      <section className="mt-12 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-primary mb-3">Shop categories for {place}</h2>
          <ul className="flex flex-wrap gap-2">
            {categoryLinks.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="btn-nav text-xs">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          {parent && (
            <p className="mt-4 text-sm">
              <Link href={locationPublicPath(parent.slug)} className="text-nav hover:underline">
                All gift delivery cities in {locationLabel(parent)}
              </Link>
            </p>
          )}
        </div>
        {showNearby && (
          <div>
            <h2 className="text-xl font-bold text-primary mb-3">Nearby gift delivery pages</h2>
            <ul className="space-y-2 text-sm">
              {nearbyLinks.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-nav hover:underline">
                    Send gifts to {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-primary mb-2">
          Cake delivery {geo.name} &amp; same day gift delivery {geo.name}
        </h2>
        <h3 className="text-lg font-semibold text-primary mb-4">
          Frequently asked questions — {place}
        </h3>
        <div className="space-y-4">
          {geo.localFaqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
