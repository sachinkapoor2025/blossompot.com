"use client";

import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";
import type { Product } from "@blossompot/shared";
import { dedupeStorefrontProducts } from "@blossompot/shared";

export function HomeProductList({
  products,
  limit,
  showPurchaseControls = true,
  className = "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 list-none p-0 m-0",
}: {
  products: Product[];
  limit?: number;
  /** Unavailable product pages hide add-to-cart until a product page verifies delivery. */
  showPurchaseControls?: boolean;
  className?: string;
}) {
  const visible = useLocationFilteredProducts(dedupeStorefrontProducts(products));
  const items = typeof limit === "number" ? visible.products.slice(0, limit) : visible.products;
  if (visible.emptyBecauseLocation) return <LocationEmptyHint />;
  return (
    <ul className={className}>
      {items.map((product) => (
        <li key={product.slug}>
          <HomeProductCard product={product} showPurchaseControls={showPurchaseControls} />
        </li>
      ))}
    </ul>
  );
}
