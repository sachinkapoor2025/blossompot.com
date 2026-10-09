"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { categoryLocationHref, giftsCatalogLocationHref, shopPathForLocation } from "@/lib/location-seo-urls";
import { useStorefrontCountryIso } from "@/lib/use-storefront-country";

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
  const country = useStorefrontCountryIso() ?? "US";
  let dest = href;
  if (category) dest = categoryLocationHref(category, country);
  else if (catalog) dest = giftsCatalogLocationHref(country);
  else dest = shopPathForLocation(href, country);

  return (
    <Link href={dest} prefetch className={className}>
      {children}
    </Link>
  );
}
