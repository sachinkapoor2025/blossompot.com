"use client";

import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { useGboDeliveryCountries } from "@/lib/gbo-delivery-countries";
import { deliveryDestinationName } from "@/lib/location-seo-urls";

/** Help copy that follows the same delivery country as the header selector. */
export function CategoryDeliveryHelpNote({
  categoryName,
  fallbackCountryIso,
}: {
  categoryName: string;
  fallbackCountryIso: string;
}) {
  const { location } = useDeliveryLocation();
  const { countries } = useGboDeliveryCountries();
  const iso = location?.countryCode || fallbackCountryIso;
  const catalogName = countries.find((country) => country.countryCode === iso)?.countryName;
  const destination = deliveryDestinationName(iso, catalogName);

  return (
    <p className="text-sm text-white/90 mb-4">
      Our team helps you pick the perfect {categoryName.toLowerCase()} and confirm {destination} delivery addresses.
    </p>
  );
}
