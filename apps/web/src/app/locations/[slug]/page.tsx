import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Product } from "@blossompot/shared";
import { CityGeoTemplate, StateGeoTemplate } from "@/components/geo/GeoLocationTemplates";
import { locationPublicPath } from "@/lib/content/seo-data";
import {
  assertGeoLocationComplete,
  geoPageDescription,
  geoPageTitle,
  getGeoLocation,
  isGeoPublished,
  publishedGeoLocations,
} from "@/lib/content/geo/locations";
import { mergeProductsForCountry } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { ListingPageSkeleton } from "@/components/route-skeletons";
import { loadProducts, toListingCardProducts } from "@/lib/product-loader";
import { giftsCatalogCountryIso } from "@/lib/location-seo-urls";
import { pageMetadata } from "@/lib/seo";
import ProductsPage, { generateMetadata as generateProductsMetadata } from "../../products/page";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return publishedGeoLocations().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catalogIso = giftsCatalogCountryIso(slug);
  if (catalogIso && !getGeoLocation(slug)) {
    return generateProductsMetadata({
      searchParams: Promise.resolve({ country: catalogIso }),
    });
  }
  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo) || !isGeoPublished(geo)) {
    return { title: "Gift Delivery", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: geoPageTitle(geo),
    description: geoPageDescription(geo),
    path: locationPublicPath(slug),
    absoluteTitle: true,
  });
}

export default function SeoLocationPage(props: Props) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <SeoLocationContent {...props} />
    </Suspense>
  );
}

async function SeoLocationContent({ params }: Props) {
  const { slug } = await params;
  const catalogIso = giftsCatalogCountryIso(slug);
  if (catalogIso && !getGeoLocation(slug)) {
    return <ProductsPage searchParams={Promise.resolve({ country: catalogIso })} />;
  }

  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo) || !isGeoPublished(geo)) notFound();

  let products: Product[] = [];
  try {
    // City pages show 24 products chosen by a stable shuffle of the US catalog.
    // The products API has no seed/limit that preserves that shuffle, so the
    // full country catalog is still requested and then sliced. Repeat views use
    // the 45s catalog cache instead of another uncached download.
    products = await loadProducts({ country: "US" });
  } catch {
    products = [];
  }
  products = mergeProductsForCountry(products, "US");
  const cityProducts = toListingCardProducts(shuffleForCity(products, slug).slice(0, 24));
  const path = locationPublicPath(slug);

  if (geo.type === "state") {
    return <StateGeoTemplate geo={geo} products={cityProducts} path={path} />;
  }
  return <CityGeoTemplate geo={geo} products={cityProducts} path={path} />;
}
