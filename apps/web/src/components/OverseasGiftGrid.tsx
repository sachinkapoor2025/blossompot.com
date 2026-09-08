"use client";

import { useEffect, useRef, useState } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import type { Product } from "@blossompot/shared";

export const HOME_CATALOG_PAGE_SIZE = 50;

export function OverseasGiftGrid({
  products,
  pageSize = HOME_CATALOG_PAGE_SIZE,
}: {
  products: Product[];
  pageSize?: number;
}) {
  const [shown, setShown] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShown(pageSize);
  }, [products, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || shown >= products.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown((n) => Math.min(n + pageSize, products.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, products.length, pageSize]);

  const visible = products.slice(0, shown);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Showing {visible.length} of {products.length} gift{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
          No gifts are available right now. Try again shortly.
        </p>
      ) : (
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 list-none p-0 m-0">
          {visible.map((product) => (
            <li key={product.slug}>
              <HomeProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      {shown < products.length ? (
        <div ref={sentinelRef} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => Math.min(n + pageSize, products.length))}
            className="rounded-lg bg-nav px-5 py-2.5 text-sm font-semibold text-white hover:bg-nav/90"
          >
            Show more
          </button>
        </div>
      ) : null}
    </div>
  );
}
