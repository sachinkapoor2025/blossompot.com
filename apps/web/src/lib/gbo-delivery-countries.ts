"use client";

import { useEffect, useMemo, useState } from "react";
import {
  catalogCountriesForStorefront,
  enabledDeliveryCountries,
  getDeliveryCountry,
  type DeliveryCountryConfig,
} from "@blossompot/shared";

/** Full curated delivery catalog — the previous Countries / Cities source list. */
export function shoppingCountryOptions(): DeliveryCountryConfig[] {
  return enabledDeliveryCountries();
}

/** Customer selector: full catalog, plus any extra known countries from the API. */
export function shoppingCountriesFromGlobal(
  rows: readonly { countryCode?: string | null }[]
): DeliveryCountryConfig[] {
  const stored = rows.flatMap((row) => {
    const countryCode = (row.countryCode ?? "").trim().toUpperCase();
    return countryCode ? [{ countryCode, enabled: true }] : [];
  });
  const countries: DeliveryCountryConfig[] = [];
  const seen = new Set<string>();
  for (const row of catalogCountriesForStorefront(stored)) {
    const country = getDeliveryCountry(row.countryCode);
    if (!country || seen.has(country.countryCode)) continue;
    seen.add(country.countryCode);
    countries.push(country);
  }
  return countries;
}

export function isListedShoppingCountry(
  countryCode: string | null | undefined,
  countries: readonly { countryCode: string }[]
): boolean {
  const code = (countryCode ?? "").trim().toUpperCase();
  return countries.some((country) => country.countryCode === code);
}

export function useGboDeliveryCountries() {
  const [countries, setCountries] = useState<DeliveryCountryConfig[]>(() => shoppingCountryOptions());
  const [loaded, setLoaded] = useState(false);
  const [fromConfig, setFromConfig] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("./api")
      .then(({ api }) =>
        api<{ countries?: { countryCode?: string }[] }>("/catalog-countries", { revalidate: false })
      )
      .then((data) => {
        if (cancelled) return;
        setCountries(shoppingCountriesFromGlobal(data.countries ?? []));
        setFromConfig(true);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ countries, loaded, fromConfig }), [countries, loaded, fromConfig]);
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
