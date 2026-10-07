"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";
import { ProductSortBar, sortProducts, type ProductSort } from "@/components/ProductSortBar";
import type { Product } from "@blossompot/shared";
import { dedupeStorefrontProducts } from "@blossompot/shared";

export const PRODUCT_PAGE_SIZE = 24;

function FilterBar({
  minPrice,
  maxPrice,
  priceCeiling,
  count,
  total,
}: {
  minPrice: number | null;
  maxPrice: number | null;
  priceCeiling: number;
  count: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-semibold text-primary">{count}</span> of {total} gifts
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600" htmlFor="min-price">
          Min $
        </label>
        <input
          id="min-price"
          type="number"
          min={0}
          max={priceCeiling}
          defaultValue={minPrice ?? ""}
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          onBlur={(e) => apply({ min: e.target.value.trim() || null })}
        />
        <label className="text-sm text-slate-600" htmlFor="max-price">
          Max $
        </label>
        <input
          id="max-price"
          type="number"
          min={0}
          max={priceCeiling}
          defaultValue={maxPrice ?? ""}
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          onBlur={(e) => apply({ max: e.target.value.trim() || null })}
        />
        <Suspense fallback={<div className="h-9 w-40" aria-hidden />}>
          <ProductSortBar />
        </Suspense>
      </div>
    </div>
  );
}

function Pagination({ page, pages }: { page: number; pages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pages <= 1) return null;

  const go = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Product pages">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => go(page + 1)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

export function ProductGrid({
  products,
  showSort = true,
  sort = "featured",
}: {
  products: Product[];
  showSort?: boolean;
  sort?: ProductSort;
}) {
  const searchParams = useSearchParams();
  const unique = dedupeStorefrontProducts(products);
  const visible = useLocationFilteredProducts(unique);
  const minPrice = Number(searchParams.get("min") ?? "");
  const maxPrice = Number(searchParams.get("max") ?? "");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const priceCeiling = useMemo(() => {
    const prices = visible.products.map((p) => p.price);
    return prices.length ? Math.ceil(Math.max(...prices)) : 0;
  }, [visible.products]);

  const filtered = useMemo(() => {
    return visible.products.filter((product) => {
      if (Number.isFinite(minPrice) && minPrice > 0 && product.price < minPrice) return false;
      if (Number.isFinite(maxPrice) && maxPrice > 0 && product.price > maxPrice) return false;
      return true;
    });
  }, [visible.products, minPrice, maxPrice]);

  const sorted = sortProducts(filtered, sort);
  const pages = Math.max(1, Math.ceil(sorted.length / PRODUCT_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PRODUCT_PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PRODUCT_PAGE_SIZE);

  return (
    <>
      {showSort && visible.products.length > 0 ? (
        <Suspense fallback={<div className="mb-4 h-9" aria-hidden />}>
          <FilterBar
            minPrice={Number.isFinite(minPrice) && minPrice > 0 ? minPrice : null}
            maxPrice={Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null}
            priceCeiling={priceCeiling}
            count={pageItems.length}
            total={sorted.length}
          />
        </Suspense>
      ) : null}
      {visible.emptyBecauseLocation ? <LocationEmptyHint /> : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
        {pageItems.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
      <Pagination page={safePage} pages={pages} />
    </>
  );
}
