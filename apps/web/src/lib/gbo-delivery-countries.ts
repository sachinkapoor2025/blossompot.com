"use client";

import { useEffect, useMemo, useState } from "react";
import {
  enabledDeliveryCountries,
  mergeGboDeliveryCountries,
  type DeliveryCountryConfig,
  type GboCountry,
} from "@blossompot/shared";
import { api } from "@/lib/api";

export function useGboDeliveryCountries() {
  const [countries, setCountries] = useState<DeliveryCountryConfig[]>(() => enabledDeliveryCountries());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api<{ countries: GboCountry[] }>("/gbo/countries", { revalidate: 300 })
      .then((data) => {
        if (cancelled) return;
        setCountries(mergeGboDeliveryCountries(data.countries ?? []));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, loaded };
}

export function filterDeliveryCountries(countries: DeliveryCountryConfig[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return countries;
  return countries.filter(
    (c) => c.countryName.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q)
  );
}

export const COUNTRY_GUIDE_HREF: Record<string, string> = {
  US: "/flower-delivery-usa",
  GB: "/flower-delivery-uk",
  CA: "/flower-delivery-canada",
  AU: "/flower-delivery-australia",
  AE: "/flower-delivery-uae",
};

export const FEATURED_COUNTRY_CODES = ["US", "GB", "CA", "AU", "AE"] as const;

export function orderCountriesForMenu(countries: DeliveryCountryConfig[], query: string) {
  const filtered = filterDeliveryCountries(countries, query);
  if (query.trim()) return filtered;
  const featured = FEATURED_COUNTRY_CODES.map((code) =>
    filtered.find((c) => c.countryCode === code)
  ).filter((c): c is DeliveryCountryConfig => Boolean(c));
  const featuredSet = new Set(featured.map((c) => c.countryCode));
  const rest = filtered.filter((c) => !featuredSet.has(c.countryCode));
  return [...featured, ...rest];
}

export function useCountrySearch(countries: DeliveryCountryConfig[]) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => orderCountriesForMenu(countries, query), [countries, query]);
  return { query, setQuery, filtered };
}
