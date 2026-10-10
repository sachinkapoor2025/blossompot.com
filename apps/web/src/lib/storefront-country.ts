import { resolveDefaultShoppingCountry, SHOPPING_COUNTRY_ISO } from "@blossompot/shared";
import { cookies, headers } from "next/headers";
import { api } from "./api";
import { DELIVERY_LOCATION_COOKIE, parseDeliveryLocationToken } from "./delivery-location";
import { STOREFRONT_COUNTRY_HEADER } from "./location-seo-urls";

export function normalizeStorefrontCountry(raw?: string | string[] | null): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const iso = (value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return null;
  return iso;
}

function decodeCookieValue(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

type EnabledCache = { at: number; codes: string[] | null; defaultCountry: string };
let enabledCache: EnabledCache | null = null;
const ENABLED_CACHE_MS = 30_000;

type StorefrontCountryConfig = { codes: string[] | null; defaultCountry: string };

/**
 * Globally enabled shopping countries and the admin default used by indexable homepage SEO.
 * A failed read falls back to the USA default. This does not read the shopper's cookie.
 */
async function loadStorefrontCountryConfig(): Promise<StorefrontCountryConfig> {
  const now = Date.now();
  if (enabledCache && now - enabledCache.at < ENABLED_CACHE_MS) {
    return { codes: enabledCache.codes, defaultCountry: enabledCache.defaultCountry };
  }
  try {
    const data = await api<{ countries?: { countryCode?: string }[]; defaultCountry?: string }>(
      "/catalog-countries",
      { revalidate: 30 }
    );
    const codes = [
      ...new Set(
        (data.countries ?? [])
          .map((country) => (country.countryCode ?? "").trim().toUpperCase())
          .filter((code) => /^[A-Z]{2}$/.test(code))
      ),
    ];
    const defaultCountry =
      codes.length === 0
        ? ""
        : (resolveDefaultShoppingCountry(
            codes.map((countryCode) => ({ countryCode, enabled: true })),
            data.defaultCountry
          ) ?? "");
    enabledCache = { at: now, codes, defaultCountry };
    return { codes, defaultCountry };
  } catch {
    if (enabledCache) return { codes: enabledCache.codes, defaultCountry: enabledCache.defaultCountry };
    return { codes: [SHOPPING_COUNTRY_ISO], defaultCountry: SHOPPING_COUNTRY_ISO };
  }
}

/**
 * Globally enabled shopping countries.
 * `null` means the config was read and nothing is enabled.
 * A failed read falls back to the USA default.
 */
export async function loadEnabledShoppingCountryCodes(): Promise<string[] | null> {
  return (await loadStorefrontCountryConfig()).codes;
}

/** Admin default country for the indexable `/` article. Does not follow the shopper's cookie. */
export async function getIndexableHomeCountry(): Promise<string> {
  return (await loadStorefrontCountryConfig()).defaultCountry;
}

/** ISO-2 country from ?country=, middleware header, or the delivery-location cookie, validated against the global list. */
export async function getStorefrontDeliveryCountry(
  preferred?: string | string[] | null
): Promise<string> {
  let raw: string | null = normalizeStorefrontCountry(preferred);
  if (!raw) {
    try {
      raw = normalizeStorefrontCountry((await headers()).get(STOREFRONT_COUNTRY_HEADER));
    } catch {
      raw = null;
    }
  }
  if (!raw) {
    try {
      const cookie = (await cookies()).get(DELIVERY_LOCATION_COOKIE)?.value;
      raw = parseDeliveryLocationToken(cookie ? decodeCookieValue(cookie) : "")?.countryCode ?? null;
    } catch {
      raw = null;
    }
  }
  const config = await loadStorefrontCountryConfig();
  if (!config.codes || config.codes.length === 0 || !config.defaultCountry) return "";
  if (raw && config.codes.includes(raw)) return raw;
  return config.defaultCountry;
}

/** Postal/ZIP from the delivery-location cookie, when the shopper has entered one. */
export async function getStorefrontDeliveryPostal(): Promise<string> {
  try {
    const cookie = (await cookies()).get(DELIVERY_LOCATION_COOKIE)?.value;
    return parseDeliveryLocationToken(cookie ? decodeCookieValue(cookie) : "")?.postalCode?.trim() ?? "";
  } catch {
    return "";
  }
}
