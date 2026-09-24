"use client";

import { usePathname } from "next/navigation";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import { resolveStorefrontCountryIso } from "@/lib/location-seo-urls";

/** Selected delivery country from the country/shop URL, optional query, or cookie. */
export function useStorefrontCountryIso(searchCountry?: string | null): string | null {
  const pathname = usePathname();
  const delivery = useOptionalDeliveryLocation();
  return resolveStorefrontCountryIso({
    pathname,
    searchCountry: searchCountry ?? null,
    cookieCountry: delivery?.location?.countryCode ?? null,
  });
}
