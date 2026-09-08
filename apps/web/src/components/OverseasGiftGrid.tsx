"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import type { Product } from "@blossompot/shared";

export const HOME_CATALOG_PAGE_SIZE = 50;

export function OverseasGiftGrid({
  products,
  pageSize = HOME_CATALOG_PAGE_SIZE,
  showSearch = true,
}: {
  products: Product[];
  pageSize?: number;
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.shortDescription ?? ""}`.toLowerCase().includes(q));
  }, [products, query]);

  useEffect(() => {
    setShown(pageSize);
  }, [query, products, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || shown >= filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown((n) => Math.min(n + pageSize, filtered.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, filtered.length, pageSize]);

  const visible = filtered.slice(0, shown);

  return (
    <div>
      {showSearch ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="block w-full sm:max-w-sm text-sm text-slate-600">
            Search gifts
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              placeholder="Chocolate, birthday, hamper…"
            />
          </label>
          <p className="text-sm text-slate-500">
            Showing {visible.length} of {filtered.length} gift{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          Showing {visible.length} of {filtered.length}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-600">
          No gifts match that search. Try another word.
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

      {shown < filtered.length ? (
        <div ref={sentinelRef} className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => Math.min(n + pageSize, filtered.length))}
            className="rounded-lg bg-nav px-5 py-2.5 text-sm font-semibold text-white hover:bg-nav/90"
          >
            Show more
          </button>
        </div>
      ) : null}
    </div>
  );
}
