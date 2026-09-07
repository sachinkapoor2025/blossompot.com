"use client";

import { useMemo, useState } from "react";
import { HomeProductCard } from "@/components/HomeProductCard";
import type { Product } from "@blossompot/shared";

const PAGE_SIZE = 24;

export function OverseasGiftGrid({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.shortDescription ?? ""}`.toLowerCase().includes(q));
  }, [products, query]);

  const visible = filtered.slice(0, shown);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block w-full sm:max-w-sm text-sm text-slate-600">
          Search gifts
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE_SIZE);
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            placeholder="Chocolate, birthday, hamper…"
          />
        </label>
        <p className="text-sm text-slate-500">
          {filtered.length} gift{filtered.length === 1 ? "" : "s"} for USA delivery
        </p>
      </div>

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

      {shown < filtered.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="rounded-lg bg-nav px-5 py-2.5 text-sm font-semibold text-white hover:bg-nav/90"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
