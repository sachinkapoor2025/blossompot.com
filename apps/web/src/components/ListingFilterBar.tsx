"use client";

import { Suspense } from "react";
import { ProductSortBar } from "@/components/ProductSortBar";

export function ListingFilterBar({ count, total }: { count: number; total: number }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-semibold text-primary">{count}</span> of {total} gifts
      </p>
      <Suspense fallback={<div className="h-9 w-40" aria-hidden />}>
        <ProductSortBar />
      </Suspense>
    </div>
  );
}
