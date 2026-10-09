"use client";

import type { ReactNode } from "react";
import {
  noProductsForDeliveryCountryMessage,
  productKeptForServiceableVendors,
  productVisibleForDeliveryCountry,
  type Product,
} from "@blossompot/shared";
import { HomeProductCard } from "@/components/HomeProductCard";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { useStorefrontCountryIso } from "@/lib/use-storefront-country";

export function useLocationFilteredProducts(products: Product[]) {
  const { location, vendorSlugs, ready, checking } = useDeliveryLocation();
  const countryIso = useStorefrontCountryIso();
  if (!countryIso) {
    return { products, filtered: false, emptyBecauseLocation: false };
  }
  const applyVendorFilter =
    ready && !checking && Boolean(location) && location?.countryCode === countryIso;
  const next = products.filter((p) => {
    if (!productVisibleForDeliveryCountry(p, countryIso)) return false;
    return productKeptForServiceableVendors(p, vendorSlugs, applyVendorFilter, countryIso);
  });
  return {
    products: next,
    filtered: true,
    emptyBecauseLocation: products.length > 0 && next.length === 0,
  };
}

export function LocationFilteredProducts({
  products,
  children,
}: {
  products: Product[];
  children: (result: {
    products: Product[];
    filtered: boolean;
    emptyBecauseLocation: boolean;
  }) => ReactNode;
}) {
  return <>{children(useLocationFilteredProducts(products))}</>;
}

export function GroupedProductCards({ products }: { products: Product[] }) {
  const { products: visible, emptyBecauseLocation } = useLocationFilteredProducts(products);
  if (emptyBecauseLocation) return <LocationEmptyHint />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
      {visible.map((p) => (
        <HomeProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

export function LocationEmptyHint() {
  const { location, openSelector, message } = useDeliveryLocation();
  if (!location) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>
        {location.postalCode
          ? (message ?? `No products are available for delivery to ${location.postalDisplay} yet.`)
          : noProductsForDeliveryCountryMessage(location.countryCode)}
      </p>
      <button type="button" onClick={() => openSelector()} className="mt-2 font-semibold text-nav underline">
        Change location
      </button>
    </div>
  );
}
