"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";
import { ProductSortBar, sortProducts, type ProductSort } from "@/components/ProductSortBar";
import type { Product } from "@blossompot/shared";
import { HOME_CATALOG_PAGE_SIZE } from "@/components/OverseasGiftGrid";

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
  const [shown, setShown] = useState(HOME_CATALOG_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShown(HOME_CATALOG_PAGE_SIZE);
  }, [products, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || shown >= sorted.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown((n) => Math.min(n + HOME_CATALOG_PAGE_SIZE, sorted.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, sorted.length]);

  const page = sorted.slice(0, shown);

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
        {page.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
      {shown < sorted.length ? (
        <div ref={sentinelRef} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => Math.min(n + HOME_CATALOG_PAGE_SIZE, sorted.length))}
            className="rounded-lg bg-nav px-5 py-2.5 text-sm font-semibold text-white hover:bg-nav/90"
          >
            Show more
          </button>
        </div>
      ) : null}
    </>
  );
}
