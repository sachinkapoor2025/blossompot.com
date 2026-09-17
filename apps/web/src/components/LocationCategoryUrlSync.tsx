"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import { preserveShopQuery, shopPathForLocation } from "@/lib/location-seo-urls";

/** Keeps category/shop URLs in sync with the selected delivery country. */
export function LocationCategoryUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const delivery = useOptionalDeliveryLocation();

  useEffect(() => {
    if (!delivery?.ready) return;
    const search = searchParams.toString();
    const desired = preserveShopQuery(
      shopPathForLocation(pathname, delivery.location?.countryCode ?? null),
      search
    );
    const current = preserveShopQuery(pathname, search);
    if (desired === current) return;
    router.replace(desired);
  }, [delivery?.ready, delivery?.location?.countryCode, pathname, router, searchParams]);

  return null;
}
