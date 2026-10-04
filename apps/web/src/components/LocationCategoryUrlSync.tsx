"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { planLocationCategorySync } from "@/lib/country-switch";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";

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

  useEffect(() => {
    if (!delivery?.ready) return;
    const plan = planLocationCategorySync({
      pathname,
      search: searchParams.toString(),
      searchCountry: searchParams.get("country"),
      savedCountry: delivery.location?.countryCode ?? null,
      savedPostal: delivery.location?.postalCode ?? "",
      pendingCountry: delivery.pendingCountry,
    });
    if (plan.action === "leave") {
      if (plan.clearPending) delivery.clearPendingIfSettled(delivery.pendingCountry);
      return;
    }
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
    if (plan.clearPending) delivery.clearPendingIfSettled(delivery.pendingCountry);
    router.replace(plan.href);
  }, [
    delivery?.ready,
    delivery?.location?.countryCode,
    delivery?.pendingCountry,
    delivery?.setLocation,
    delivery?.clearPendingIfSettled,
    pathname,
    router,
    searchParams,
  ]);

  return null;
}
