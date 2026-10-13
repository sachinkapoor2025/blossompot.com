import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ProductSortBar, type ProductSort } from "@/components/ProductSortBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogLoadError } from "@/components/CatalogLoadError";
import { JsonLd } from "@/components/JsonLd";
import { ListingPageSkeleton } from "@/components/route-skeletons";
import { COMBOS_HEADING, COMBOS_PATH, loadCombosPage, sortStorefrontCombos } from "@/lib/combos-page";
import { countryDisplayName } from "@/lib/location-seo-urls";
import { requestSeoPath } from "@/lib/request-seo-path";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";

interface Props {
  searchParams: Promise<{ sort?: string; country?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const path = await requestSeoPath(COMBOS_PATH);
  await notFoundIfShoppingCountryDisabled(path);
  return pageMetadata({
    title: `${COMBOS_HEADING} | BlossomPot`,
    description:
      "Shop combos on BlossomPot. Choose a product and check delivery availability for the recipient’s address at checkout.",
    path,
    absoluteTitle: true,
  });
}

export default function CombosPage(props: Props) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <CombosPageContent {...props} />
    </Suspense>
  );
}

async function CombosPageContent({ searchParams }: Props) {
  const query = await searchParams;
  const sort = resolveSort(query.sort);
  const seoPath = await requestSeoPath(COMBOS_PATH);
  await notFoundIfShoppingCountryDisabled(seoPath);
  const deliveryCountry = await getStorefrontDeliveryCountry(query.country);
  const categoryLoad = await loadCombosPage(deliveryCountry);
  const combos = sortStorefrontCombos(categoryLoad.combos, sort);
  const deliveryCountryName = countryDisplayName(deliveryCountry);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: COMBOS_HEADING },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href ?? COMBOS_PATH }))),
          itemListJsonLd(
            `${COMBOS_HEADING} — BlossomPot`,
            combos.map((combo) => ({ name: combo.name, path: COMBOS_PATH }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-8">{COMBOS_HEADING}</h1>

      {categoryLoad.state === "error" ? (
        <CatalogLoadError />
      ) : combos.length > 0 ? (
        <>
          <Suspense fallback={<div className="mb-4 h-9" aria-hidden />}>
            <ProductSortBar />
          </Suspense>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            {combos.map((combo) => (
              <HomeProductCard key={combo.slug} combo={combo} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-slate-500">
          No combos are currently available for {deliveryCountryName}.{" "}
          <Link href="/products" className="text-nav hover:underline">
            Browse all gifts
          </Link>
        </p>
      )}
    </div>
  );
}
