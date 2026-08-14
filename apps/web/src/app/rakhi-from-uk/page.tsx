import type { Metadata } from "next";
import { CountryRakhiLanding } from "@/components/CountryRakhiLanding";
import type { ProductSort } from "@/components/ProductSortBar";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { getCountryRakhiPage } from "@/lib/content/country-rakhi-pages";
import { loadProducts } from "@/lib/product-loader";
import { canonical, pageMetadata } from "@/lib/seo";

const page = getCountryRakhiPage("uk");

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  ...pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: page.path,
    keywords: page.keywords,
    absoluteTitle: true,
  }),
  alternates: {
    canonical: canonical(page.path),
    languages: Object.fromEntries(
      Object.entries(page.localeHints).map(([lang, path]) => [lang, canonical(path)])
    ),
  },
};

interface Props {
  searchParams: Promise<{ sort?: string }>;
}

export default async function RakhiFromUkPage({ searchParams }: Props) {
  const sort = resolveSort((await searchParams).sort);
  const apiProducts = await loadProducts();
  const products = shuffleForCity(
    mergeProductsPreferExisting(apiProducts, getCatalogProducts()),
    "rakhi-from-uk"
  );

  return <CountryRakhiLanding page={page} products={products} sort={sort} />;
}
