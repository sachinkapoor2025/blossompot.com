"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { planLocationCategorySync } from "@/lib/country-switch";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import { useGboDeliveryCountries } from "@/lib/gbo-delivery-countries";

/** Keeps category/shop URLs in sync with the selected delivery country. */
export function LocationCategoryUrlSync() {
  return (
    <Suspense fallback={null}>
      <LocationCategoryUrlSyncInner />
    </Suspense>
  );
}

function LocationCategoryUrlSyncInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const delivery = useOptionalDeliveryLocation();
  const { countries, loaded } = useGboDeliveryCountries();

  useEffect(() => {
    if (!delivery || !delivery.ready || !loaded) return;
    const plan = planLocationCategorySync({
      pathname,
      search: searchParams.toString(),
      searchCountry: searchParams.get("country"),
      savedCountry: delivery.location?.countryCode,
      savedPostal: delivery.location?.postalCode,
      pendingCountry: delivery.pendingCountry,
      enabledCountryCodes: countries.map((country) => country.countryCode),
    });
    if (plan.action === "adopt") {
      void delivery
        .setLocation({
          countryCode: plan.countryCode,
          postalCode: plan.postalCode,
          postalDisplay: plan.postalCode || plan.countryCode,
        })
        .catch(() => undefined);
      return;
    }
    if (plan.clearPending && delivery.pendingCountry) {
      delivery.clearPendingIfSettled(delivery.pendingCountry);
    }
    if (plan.action === "rewrite") router.replace(plan.href);
  }, [
    countries,
    delivery?.ready,
    delivery?.location?.countryCode,
    delivery?.location?.postalCode,
    delivery?.pendingCountry,
    delivery?.setLocation,
    delivery?.clearPendingIfSettled,
    loaded,
    pathname,
    router,
    searchParams,
  ]);

  return null;
}
