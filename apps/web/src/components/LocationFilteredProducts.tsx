"use client";

import type { ReactNode } from "react";
import {
  fulfillmentVendorSlug,
  isGboCatalogProduct,
  productVisibleForDeliveryCountry,
  type Product,
} from "@blossompot/shared";
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
  const allowed = new Set(vendorSlugs);
  const next = products.filter((p) => {
    if (!productVisibleForDeliveryCountry(p, countryIso)) return false;
    if (!applyVendorFilter) return true;
    if (isGboCatalogProduct(p)) return true;
    if (allowed.size === 0) return true;
    return allowed.has(fulfillmentVendorSlug(p));
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

export function LocationEmptyHint() {
  const { location, openSelector, message } = useDeliveryLocation();
  if (!location) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>
        {message ??
          `No products are available for delivery to ${location.postalDisplay} yet.`}
      </p>
      <button type="button" onClick={() => openSelector()} className="mt-2 font-semibold text-nav underline">
        Change location
      </button>
    </div>
  );
}
