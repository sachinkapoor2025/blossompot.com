import { configKeys } from "../db/keys";
import { getDeliveryCountry } from "./postal-countries";
import {
  catalogCountriesConfigSchema,
  type CatalogCountriesConfig,
  type CatalogCountrySetting,
} from "../schemas/catalog-country";

export const catalogCountryKeys = configKeys.catalogCountries;

/**
 * Used when `CONFIG#CATALOG_COUNTRIES` is missing or unreadable.
 * USA-only matches today's storefront. This config is not applied to shopping yet.
 */
export function defaultCatalogCountries(): CatalogCountrySetting[] {
  return [{ countryCode: "US", enabled: true }];
}

export function catalogCountryName(countryCode: string): string | null {
  return getDeliveryCountry(countryCode)?.countryName ?? null;
}

/**
 * Uppercase codes, require a known delivery-catalog country, and reject duplicates.
 * At least one country must be enabled. Nothing is enabled automatically.
 */
export function normalizeCatalogCountries(
  rows: readonly { countryCode: string; enabled: boolean }[]
): { countries: CatalogCountrySetting[] } | { error: string } {
  const countries: CatalogCountrySetting[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const raw = String(row.countryCode ?? "");
    const code = raw.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
      return { error: `"${raw.trim()}" is not a two-letter country code.` };
    }
    if (!getDeliveryCountry(code)) {
      return { error: `"${code}" is not a known delivery country.` };
    }
    if (seen.has(code)) {
      return { error: `"${code}" is listed more than once.` };
    }
    seen.add(code);
    countries.push({ countryCode: code, enabled: row.enabled === true });
  }
  if (!countries.some((country) => country.enabled)) {
    return { error: "At least one country must be enabled." };
  }
  return { countries };
}

export function readStoredCatalogCountries(
  item: Record<string, unknown> | null | undefined
): { countries: CatalogCountrySetting[]; source: "config" | "default"; updatedAt: string | null; updatedBy?: string } {
  if (!item) {
    return { countries: defaultCatalogCountries(), source: "default", updatedAt: null };
  }
  const parsed = catalogCountriesConfigSchema.safeParse({
    countries: item.countries,
    updatedAt: item.updatedAt ?? "",
    updatedBy: item.updatedBy,
  });
  if (!parsed.success) {
    return { countries: defaultCatalogCountries(), source: "default", updatedAt: null };
  }
  const normalized = normalizeCatalogCountries(parsed.data.countries);
  if ("error" in normalized) {
    return { countries: defaultCatalogCountries(), source: "default", updatedAt: null };
  }
  return {
    countries: normalized.countries,
    source: "config",
    updatedAt: parsed.data.updatedAt || null,
    ...(parsed.data.updatedBy ? { updatedBy: parsed.data.updatedBy } : {}),
  };
}

export function isCatalogCountryEnabled(
  countries: readonly CatalogCountrySetting[],
  countryCode: string | null | undefined
): boolean {
  const code = (countryCode ?? "").trim().toUpperCase();
  return countries.some((country) => country.countryCode === code && country.enabled);
}

export function enabledCatalogCountries(
  countries: readonly CatalogCountrySetting[]
): CatalogCountrySetting[] {
  return countries.filter((country) => country.enabled);
}

export function toCatalogCountriesConfig(
  countries: readonly CatalogCountrySetting[],
  updatedAt: string,
  updatedBy?: string
): CatalogCountriesConfig {
  return {
    countries: countries.map((country) => ({ ...country })),
    updatedAt,
    ...(updatedBy ? { updatedBy } : {}),
  };
}
