import type { Metadata } from "next";
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
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { pageMetadata } from "@/lib/seo";

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

export default async function SeoLocationPage({ params }: Props) {
  const { slug } = await params;
  const geo = getGeoLocation(slug);
  if (!geo || !assertGeoLocationComplete(geo) || !isGeoPublished(geo)) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const cityProducts = shuffleForCity(products, slug).slice(0, 24);
  const path = locationPublicPath(slug);

  if (geo.type === "state") {
    return <StateGeoTemplate geo={geo} products={cityProducts} path={path} />;
  }
  return <CityGeoTemplate geo={geo} products={cityProducts} path={path} />;
}
