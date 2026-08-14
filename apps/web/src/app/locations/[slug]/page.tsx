import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Product } from "@blossompot/shared";
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
  locationLabel,
} from "@/lib/content/geo/locations";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata, serviceAreaJsonLd } from "@/lib/seo";
import { categoryHref } from "@/lib/category-urls";

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
    description: geoPageDescription(geo),
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
  const path = locationPublicPath(slug);
  const place = locationLabel(geo);
  const tzShort = geo.timezone.replace(/^America\//, "").replace(/_/g, " ");

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: `Gifts to ${place}` },
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
        (g) => g.name.toLowerCase() === name.toLowerCase() && g.slug !== slug
      );
      return match ? { label: locationLabel(match), href: locationPublicPath(match.slug) } : null;
    })
    .filter(Boolean)
    .slice(0, 8) as { label: string; href: string }[];

  // #region agent log
  fetch("http://127.0.0.1:7653/ingest/6a11505c-4ea4-4815-8ca6-62fe058b4e02", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "388539" },
    body: JSON.stringify({
      sessionId: "388539",
      runId: "geo-hotfix",
      hypothesisId: "H2",
      location: "locations/[slug]/page.tsx",
      message: "page render labels",
      data: {
        slug,
        type: geo.type,
        place,
        title: geoPageTitle(geo),
        h1: geoPageH1(geo),
        description: geoPageDescription(geo),
        hasCaliforniaCalifornia: /California,\s*California/i.test(
          `${place} ${geoPageTitle(geo)} ${geoPageH1(geo)} ${geoPageDescription(geo)}`
        ),
        hasEstDate: /Est\.\s*[A-Z][a-z]{2}\s+\d/.test(geoPageDescription(geo)),
        rakhiFooterRemoved: true,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))
          ),
          faqJsonLd(geo.localFaqs),
          serviceAreaJsonLd({ label: place, slug, state: geo.type === "city" ? geo.state : undefined }),
          itemListJsonLd(
            `Gifts to ${place}`,
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
          Order by {geo.cutoffTimeLocal} local ({tzShort}) for same-day eligible ZIPs in {place}
        </p>
        <p className="mt-1 text-slate-600">
          Delivery window: {geo.deliveryWindow}. Standard USA shipping typically 5–7 business days.
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
          Frequently asked questions — {place}
        </h2>
        <div className="space-y-4">
          {geo.localFaqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
