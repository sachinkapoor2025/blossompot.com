import {
  enabledDeliveryCountries,
  resolveEnabledShoppingCountry,
  SHOPPING_COUNTRY_ISO,
} from "@blossompot/shared";
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

type EnabledCache = { at: number; codes: string[] | null };
let enabledCache: EnabledCache | null = null;
const ENABLED_CACHE_MS = 30_000;

/**
 * Globally enabled shopping countries.
 * `null` means the config was read and nothing is enabled.
 * A failed read falls back to the USA default.
 */
export async function loadEnabledShoppingCountryCodes(): Promise<string[] | null> {
  const now = Date.now();
  if (enabledCache && now - enabledCache.at < ENABLED_CACHE_MS) return enabledCache.codes;
  try {
    const data = await api<{ countries?: { countryCode?: string }[] }>("/catalog-countries", {
      revalidate: 30,
    });
    const fromApi = (data.countries ?? [])
      .map((country) => (country.countryCode ?? "").trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code));
    const catalog = enabledDeliveryCountries().map((country) => country.countryCode);
    const codes = [...new Set([...catalog, ...fromApi])];
    enabledCache = { at: now, codes };
    return codes;
  } catch {
    return enabledCache?.codes ?? [SHOPPING_COUNTRY_ISO];
  }
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
  const enabled = await loadEnabledShoppingCountryCodes();
  if (!enabled || enabled.length === 0) return "";
  return (
    resolveEnabledShoppingCountry(
      raw,
      enabled.map((countryCode) => ({ countryCode, enabled: true }))
    ) ?? ""
  );
}
