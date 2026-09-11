import { cookies } from "next/headers";
import { DELIVERY_LOCATION_COOKIE, parseDeliveryLocationToken } from "./delivery-location";

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

/** ISO-2 country from ?country= or the delivery-location cookie. Defaults to US. */
export async function getStorefrontDeliveryCountry(
  preferred?: string | string[] | null
): Promise<string> {
  const fromQuery = normalizeStorefrontCountry(preferred);
  if (fromQuery) return fromQuery;
  try {
    const raw = (await cookies()).get(DELIVERY_LOCATION_COOKIE)?.value;
    const loc = parseDeliveryLocationToken(raw ? decodeCookieValue(raw) : "");
    if (loc?.countryCode) return loc.countryCode;
  } catch {
    /* cookies() unavailable outside a request */
  }
  return "US";
}
