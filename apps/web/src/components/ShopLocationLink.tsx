"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";
import { categoryLocationHref, giftsCatalogLocationHref, shopPathForLocation } from "@/lib/location-seo-urls";

export function ShopLocationLink({
  href,
  category,
  catalog,
  className,
  children,
}: {
  href: string;
  category?: string;
  catalog?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const delivery = useOptionalDeliveryLocation();
  const country = delivery?.location?.countryCode ?? null;
  let dest = href;
  if (country && category) dest = categoryLocationHref(category, country);
  else if (country && catalog) dest = giftsCatalogLocationHref(country);
  else if (country) dest = shopPathForLocation(href, country);

  return (
    <Link href={dest} className={className}>
      {children}
    </Link>
  );
}
