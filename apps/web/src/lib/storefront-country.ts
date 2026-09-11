import { cookies } from "next/headers";
import { DELIVERY_LOCATION_COOKIE, parseDeliveryLocationToken } from "./delivery-location";

/** ISO-2 country from the delivery-location cookie. Defaults to US. */
export async function getStorefrontDeliveryCountry(): Promise<string> {
  try {
    const raw = (await cookies()).get(DELIVERY_LOCATION_COOKIE)?.value;
    const loc = parseDeliveryLocationToken(raw ? decodeURIComponent(raw) : "");
    if (loc?.countryCode) return loc.countryCode;
  } catch {
    /* cookies() unavailable outside a request */
  }
  return "US";
}
