"use client";

import { useEffect, useState } from "react";
import type { Product } from "@blossompot/shared";
import { HomeProductCard } from "@/components/HomeProductCard";

/** Same "You might also like" grid, fetched after the product document is ready. */
export function RelatedProducts({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string;
  excludeSlug: string;
}) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ category: categorySlug, exclude: excludeSlug });
    const controller = new AbortController();
    fetch(`/api/related-products?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data: { products?: Product[] }) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProducts([]);
      });
    return () => controller.abort();
  }, [categorySlug, excludeSlug]);

  if (!products || products.length === 0) return null;
  return (
    <section className="mt-10 pt-8 border-t border-slate-200">
      <h2 className="text-lg font-bold text-primary mb-4">You might also like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
        {products.map((product) => (
          <HomeProductCard key={product.slug} product={product} loadGalleryWhenVisible />
        ))}
      </div>
    </section>
  );
}
