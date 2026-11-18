import { resolveDefaultShoppingCountry, SHOPPING_COUNTRY_ISO } from "@blossompot/shared";
import { cookies, headers } from "next/headers";
import { api } from "./api";
import { DELIVERY_LOCATION_COOKIE, parseDeliveryLocationToken } from "./delivery-location";
import { ENABLED_SHOPPING_COUNTRIES_HEADER, STOREFRONT_COUNTRY_HEADER } from "./location-seo-urls";

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

let configInFlight: Promise<StorefrontCountryConfig> | null = null;

function configFromCodes(codes: string[], defaultCountry?: string): StorefrontCountryConfig {
  const defaultCode =
    codes.length === 0
      ? ""
      : (resolveDefaultShoppingCountry(
          codes.map((countryCode) => ({ countryCode, enabled: true })),
          defaultCountry
        ) ?? "");
  return { codes, defaultCountry: defaultCode };
}

/** Country list already resolved by middleware for this request, when it sent one. */
async function enabledCodesFromRequest(): Promise<string[] | null> {
  try {
    const header = (await headers()).get(ENABLED_SHOPPING_COUNTRIES_HEADER);
    if (header === null) return null;
    return [
      ...new Set(
        header
          .split(",")
          .map((code) => code.trim().toUpperCase())
          .filter((code) => /^[A-Z]{2}$/.test(code))
      ),
    ];
  } catch {
    return null;
  }
}

/**
 * Globally enabled shopping countries and the admin default used by indexable homepage SEO.
 * A failed read falls back to the USA default. This does not read the shopper's cookie.
 * Concurrent callers in one process share one catalog-countries request.
 */
async function loadStorefrontCountryConfig(): Promise<StorefrontCountryConfig> {
  const now = Date.now();
  if (enabledCache && now - enabledCache.at < ENABLED_CACHE_MS) {
    return { codes: enabledCache.codes, defaultCountry: enabledCache.defaultCountry };
  }
  const fromRequest = await enabledCodesFromRequest();
  if (fromRequest) {
    const config = configFromCodes(fromRequest);
    enabledCache = { at: now, codes: config.codes, defaultCountry: config.defaultCountry };
    return config;
  }
  if (configInFlight) return configInFlight;
  configInFlight = readStorefrontCountryConfig().finally(() => {
    configInFlight = null;
  });
  return configInFlight;
}

async function readStorefrontCountryConfig(): Promise<StorefrontCountryConfig> {
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
    const config = configFromCodes(codes, data.defaultCountry);
    enabledCache = { at: Date.now(), codes: config.codes, defaultCountry: config.defaultCountry };
    return config;
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

/**
 * Country named by the URL, middleware, or cookie before the enabled-country list returns.
 * Callers can start a catalog read with this hint while `getStorefrontDeliveryCountry` validates it.
 */
export async function peekStorefrontCountryHint(preferred?: string | string[] | null): Promise<string> {
  const preferredIso = normalizeStorefrontCountry(preferred);
  if (preferredIso) return preferredIso;
  try {
    const headerIso = normalizeStorefrontCountry((await headers()).get(STOREFRONT_COUNTRY_HEADER));
    if (headerIso) return headerIso;
  } catch {
    /* headers() unavailable outside a request */
  }
  try {
    const cookie = (await cookies()).get(DELIVERY_LOCATION_COOKIE)?.value;
    const fromCookie = parseDeliveryLocationToken(cookie ? decodeCookieValue(cookie) : "")?.countryCode ?? null;
    const cookieIso = normalizeStorefrontCountry(fromCookie);
    if (cookieIso) return cookieIso;
  } catch {
    /* cookies() unavailable outside a request */
  }
  return SHOPPING_COUNTRY_ISO;
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
