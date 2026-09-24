"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
    if (pathIso && delivery.location?.countryCode !== pathIso) {
      void delivery.setLocation({
        countryCode: pathIso,
        postalCode: "",
        postalDisplay: pathIso,
      });
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
    delivery?.setLocation,
    pathname,
    router,
    searchParams,
  ]);

  return null;
}
