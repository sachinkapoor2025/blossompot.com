import type { Metadata } from "next";
import { OverseasGiftGrid } from "@/components/OverseasGiftGrid";
import { loadGboStorefrontProducts } from "@/lib/product-loader";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { pageMetadata } from "@/lib/seo";
import { resolveDeliveryCountry, type Product } from "@blossompot/shared";

export const metadata: Metadata = pageMetadata({
  title: "Gift Catalog — Flowers, Cakes & Gifts Worldwide | BlossomPot",
  description:
    "Browse the BlossomPot gift catalog: fresh flowers, cakes, bouquets, and hampers with worldwide delivery. Shop international gifts online.",
  path: "/gift-catalog",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GiftCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  let products: Product[] = [];
  let catalogError = "";
  const deliveryCountry = await getStorefrontDeliveryCountry(params.country);
  const destinationName = resolveDeliveryCountry(deliveryCountry).countryName;

  try {
    products = await loadGboStorefrontProducts(deliveryCountry);
  } catch (err) {
    catalogError = err instanceof Error ? err.message : "Gift catalog is temporarily unavailable.";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-primary mb-2">Gift catalog</h1>
      <p className="text-sm text-slate-600 mb-8">
        {products.length
          ? `${products.length} international gifts for ${destinationName}. Scroll for more.`
          : `International gifts for ${destinationName}.`}
      </p>
      {catalogError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {catalogError}
        </p>
      ) : (
        <OverseasGiftGrid products={products} />
      )}
    </div>
  );
}
