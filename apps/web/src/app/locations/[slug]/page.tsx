import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import { locationPublicPath } from "@/lib/content/seo-data";
import {
  assertGeoLocationComplete,
  geoPageDescription,
  geoPageH1,
  geoPageTitle,
  getGeoLocation,
  allGeoLocations,
} from "@/lib/content/geo/locations";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata, serviceAreaJsonLd } from "@/lib/seo";
import { categoryHref } from "@/lib/category-urls";
import { site } from "@/lib/site";
import type { Product } from "@blossompot/shared";
import { getDeliveryPromise } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return allGeoLocations()
    .filter(assertGeoLocationComplete)
    .map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo)) {
    return { title: "Gift Delivery", robots: { index: false, follow: false } };
  }
  const path = locationPublicPath(slug);
  return pageMetadata({
    title: geoPageTitle(geo),
    description: geoPageDescription(geo).slice(0, 155),
    path,
    absoluteTitle: true,
  });
}

export default async function SeoLocationPage({ params }: Props) {
  const { slug } = await params;
  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo)) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const cityProducts = shuffleForCity(products, slug);
  const promise = getDeliveryPromise(null, null);
  const path = locationPublicPath(slug);
  const place = geo.state ? `${geo.city}, ${geo.state}` : geo.city;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: `Gifts to ${geo.city}` },
  ];

  const categoryLinks = [
    { label: "Flowers", href: categoryHref("flowers") },
    { label: "Bouquets", href: categoryHref("flower-bouquets") },
    { label: "Cakes", href: categoryHref("cakes") },
    { label: "Hampers", href: categoryHref("gift-hampers") },
    { label: "Birthday", href: categoryHref("birthday-gifts") },
    { label: "Same-Day", href: categoryHref("same-day-gifts") },
  ];

  const nearbyLinks = geo.nearbyAreas
    .map((name) => {
      const match = allGeoLocations().find(
        (g) => g.city.toLowerCase() === name.toLowerCase() && g.slug !== slug
      );
      return match ? { label: match.city, href: locationPublicPath(match.slug) } : null;
    })
    .filter(Boolean)
    .slice(0, 8) as { label: string; href: string }[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))
          ),
          faqJsonLd(geo.localFaqs),
          serviceAreaJsonLd({ label: geo.city, slug, state: geo.state || undefined }),
          itemListJsonLd(
            `Gifts to ${geo.city}`,
            cityProducts.slice(0, 24).map((p) => ({
              name: p.name,
              path: `/products/${p.slug}`,
            }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{geoPageH1(geo)}</h1>
      <p className="text-slate-600 mb-4 max-w-3xl leading-relaxed">{geo.introParagraph}</p>

      <div className="mb-8 rounded-xl border border-primary/15 bg-petal/80 px-4 py-3 text-sm text-slate-800">
        <p className="font-semibold text-primary">
          Order by {geo.cutoffTimeLocal} local ({geo.timezone.replace("America/", "")}) for
          same-day eligible ZIPs in {geo.city}
        </p>
        <p className="mt-1 text-slate-600">
          Delivery window: {geo.deliveryWindow}. Standard USA estimate: {promise.copy.label}.
        </p>
        {geo.nearbyAreas.length > 0 && (
          <p className="mt-1 text-slate-600">
            Nearby areas commonly served: {geo.nearbyAreas.slice(0, 5).join(", ")}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cityProducts.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
      {cityProducts.length === 0 && (
        <p className="text-slate-500 mt-4">
          <Link href="/products" className="text-nav hover:underline">
            Browse all gifts
          </Link>
        </p>
      )}

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
        <h2 className="text-xl font-bold text-primary mb-4">
          Frequently asked questions — {geo.city}
        </h2>
        <div className="space-y-4">
          {geo.localFaqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Looking for seasonal Raksha Bandhan gifts? Visit our{" "}
        <Link href="/flowers" className="text-nav hover:underline">
          flowers collection
        </Link>{" "}
        or contact {site.name} support.
      </p>
    </div>
  );
}
