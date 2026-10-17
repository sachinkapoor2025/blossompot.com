"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ListingFilterBar } from "@/components/ListingFilterBar";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";
import { sortProducts, type ProductSort } from "@/components/ProductSortBar";
import type { Product } from "@blossompot/shared";
import { dedupeStorefrontProducts } from "@blossompot/shared";

export const PRODUCT_PAGE_SIZE = 24;

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
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const sorted = sortProducts(visible.products, sort);
  const pages = Math.max(1, Math.ceil(sorted.length / PRODUCT_PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PRODUCT_PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PRODUCT_PAGE_SIZE);

  return (
    <>
      {showSort && visible.products.length > 0 ? (
        <Suspense fallback={<div className="mb-4 h-9" aria-hidden />}>
          <ListingFilterBar count={pageItems.length} total={sorted.length} />
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
