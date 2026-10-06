"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { shouldReconcilePathCountry } from "@/lib/country-switch";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import { preserveShopQuery, shopPathForLocation, countryIsoFromPathname } from "@/lib/location-seo-urls";

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
    const pathIso = countryIsoFromPathname(pathname, searchParams.get("country"));
    const pending = delivery.pendingCountry ?? null;
    if (!shouldReconcilePathCountry({ pathIso, pendingCountry: pending })) {
      return;
    }
    if (pathIso && pending && pathIso === pending) {
      delivery.clearPendingIfSettled(pending);
    }
    if (pathIso && delivery.location?.countryCode !== pathIso) {
      void delivery
        .setLocation({
          countryCode: pathIso,
          postalCode: "",
          postalDisplay: pathIso,
        })
        .catch(() => undefined);
      return;
    }
    const search = searchParams.toString();
    const desired = preserveShopQuery(
      shopPathForLocation(pathname, delivery.location?.countryCode ?? pathIso ?? null),
      search
    );
    const current = preserveShopQuery(pathname, search);
    if (desired === current) return;
    router.replace(desired);
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
