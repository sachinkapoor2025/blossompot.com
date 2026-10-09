"use client";

import { useEffect, useMemo, useState } from "react";
import {
  catalogCountriesForStorefront,
  getDeliveryCountry,
  SHOPPING_COUNTRY_ISO,
  type DeliveryCountryConfig,
} from "@blossompot/shared";

/** Sync fallback before the global country list loads. USA only. */
export function shoppingCountryOptions(): DeliveryCountryConfig[] {
  const unitedStates = getDeliveryCountry(SHOPPING_COUNTRY_ISO);
  return unitedStates ? [unitedStates] : [];
}

/**
 * Customer selector: only globally enabled countries.
 * A public row without `enabled` is already an enabled country.
 * An explicit `enabled: false` stays off. Static catalog metadata supplies the name.
 */
export function shoppingCountriesFromGlobal(
  rows: readonly { countryCode?: string | null; enabled?: boolean }[]
): DeliveryCountryConfig[] {
  const stored = rows.flatMap((row) => {
    const countryCode = (row.countryCode ?? "").trim().toUpperCase();
    if (!countryCode) return [];
    return [{ countryCode, enabled: row.enabled !== false }];
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

/**
 * Country to write into `bp_dl` when the saved country is no longer globally enabled.
 * USA when it is enabled, otherwise the first enabled country. Null when no rewrite is needed.
 */
export function disabledCountryFallback(
  savedCode: string | null | undefined,
  countries: readonly { countryCode: string }[]
): string | null {
  const code = (savedCode ?? "").trim().toUpperCase();
  if (!code) return null;
  if (countries.some((country) => country.countryCode === code)) return null;
  const fallback =
    countries.find((country) => country.countryCode === "US")?.countryCode ??
    countries[0]?.countryCode ??
    null;
  if (!fallback || fallback === code) return null;
  return fallback;
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
