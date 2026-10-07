import { configKeys } from "../db/keys";
import { enabledDeliveryCountries, getDeliveryCountry } from "./postal-countries";
import {
  catalogCountriesConfigSchema,
  type CatalogCountriesConfig,
  type CatalogCountrySetting,
} from "../schemas/catalog-country";

export const catalogCountryKeys = configKeys.catalogCountries;

/**
 * Used when `CONFIG#CATALOG_COUNTRIES` is missing or unreadable.
 * USA-only matches the storefront until an admin enables more countries.
 */
export function defaultCatalogCountries(): CatalogCountrySetting[] {
  return [{ countryCode: "US", enabled: true }];
}

/**
 * Customer Countries / Cities menus and shopping gates.
 * Always includes the full curated delivery catalog (`DELIVERY_COUNTRIES`)
 * so a truncated admin save cannot hide previously published markets.
 */
export function catalogCountriesForStorefront(
  stored: readonly CatalogCountrySetting[] = []
): CatalogCountrySetting[] {
  const rows: CatalogCountrySetting[] = enabledDeliveryCountries().map((country) => ({
    countryCode: country.countryCode,
    enabled: true,
  }));
  const seen = new Set(rows.map((row) => row.countryCode));
  for (const row of stored) {
    const code = row.countryCode.trim().toUpperCase();
    if (!row.enabled || seen.has(code) || !getDeliveryCountry(code)) continue;
    seen.add(code);
    rows.push({ countryCode: code, enabled: true });
  }
  return rows;
}

export function storefrontShoppingCountryCodes(
  stored: readonly CatalogCountrySetting[] = []
): string[] {
  return catalogCountriesForStorefront(stored).map((row) => row.countryCode);
}

export const NO_ENABLED_SHOPPING_COUNTRIES_MESSAGE =
  "Delivery is not available right now. No countries are enabled for shopping.";

export const SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE = "Delivery is not available in that country.";

/** Listing empty state when no enabled vendor delivers to the selected country. */
export function noProductsForDeliveryCountryMessage(countryCode: string): string {
  const iso = countryCode.trim().toUpperCase();
  const name = getDeliveryCountry(iso)?.countryName || iso || "this country";
  return `No products are currently available for delivery to ${name}.`;
}

/**
 * Customer country for shopping.
 * A globally enabled code is kept. Otherwise USA when it is enabled, otherwise the first enabled country.
 * Returns null only when nothing is enabled.
 */
export function resolveEnabledShoppingCountry(
  raw: string | null | undefined,
  countries: readonly { countryCode: string; enabled: boolean }[]
): string | null {
  const enabled = enabledCatalogCountries(countries as CatalogCountrySetting[]).map((country) => country.countryCode);
  if (enabled.length === 0) return null;
  const code = (raw ?? "").trim().toUpperCase();
  if (code && enabled.includes(code)) return code;
  if (enabled.includes("US")) return "US";
  return enabled[0] ?? null;
}

/** Reject a country that was sent and is not globally enabled. An empty value is left alone. */
export function shoppingCountryRejection(
  country: string | null | undefined,
  enabledCodes: readonly string[]
): string | null {
  const value = (country ?? "").trim();
  if (!value) return null;
  const code = value.toUpperCase();
  if (enabledCodes.includes(code)) return null;
  return SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE;
}

/**
 * Apply the resolved shopping country to a requested location.
 * A fallback country drops the postal code that belonged to the rejected country.
 */
export function applyEnabledShoppingCountry<T extends { countryCode: string; postalCode: string }>(
  requested: T | null,
  countries: readonly { countryCode: string; enabled: boolean }[]
): T | null {
  const countryCode = resolveEnabledShoppingCountry(requested?.countryCode, countries);
  if (!countryCode) return null;
  if (!requested || requested.countryCode !== countryCode) {
    const next = { ...(requested ?? ({} as T)), countryCode, postalCode: "" };
    if ("stateCode" in next) (next as { stateCode?: string }).stateCode = undefined;
    if ("city" in next) (next as { city?: string }).city = undefined;
    return next;
  }
  return { ...requested, countryCode };
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
