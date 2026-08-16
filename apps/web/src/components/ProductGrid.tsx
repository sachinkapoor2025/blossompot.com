"use client";

import { Suspense } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";
import { ProductSortBar, sortProducts, type ProductSort } from "@/components/ProductSortBar";
import type { Product } from "@blossompot/shared";

/**
 * Product cards render in the initial HTML (no "Loading products…" Suspense).
 * Only the sort control uses useSearchParams and stays behind a tiny Suspense boundary.
 */
export function ProductGrid({
  products,
  showSort = true,
  sort = "featured",
}: {
  products: Product[];
  showSort?: boolean;
  /** Server-resolved sort so the grid HTML matches ?sort= without waiting on hydration. */
  sort?: ProductSort;
}) {
  const visible = useLocationFilteredProducts(products);
  const sorted = sortProducts(visible.products, sort);

  return (
    <>
      {showSort && visible.products.length > 1 && (
        <div className="flex justify-end mb-4">
          <Suspense fallback={<div className="h-9 w-40" aria-hidden />}>
            <ProductSortBar />
          </Suspense>
        </div>
      )}
      {visible.emptyBecauseLocation ? <LocationEmptyHint /> : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
        {sorted.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
    </>
  );
}
