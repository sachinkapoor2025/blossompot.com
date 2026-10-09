import {
  SHOPPING_COUNTRY_ISO,
  formatPostalDisplay,
  getDeliveryCountry,
  isValidPostal,
} from "@blossompot/shared";

export const DELIVERY_LOCATION_COOKIE = "bp_dl";
export const DELIVERY_LOCATION_EVENT = "bp-delivery-changed";
const DISMISS_KEY = "bp_dl_dismissed";

export type StoredDeliveryLocation = {
  countryCode: string;
  postalCode: string;
  postalDisplay: string;
};

/** Stored shopper location. Unknown codes fall back to the USA. A known country keeps a valid postal code. */
export function toShoppingDeliveryLocation(location: StoredDeliveryLocation): StoredDeliveryLocation {
  const iso = location.countryCode.trim().toUpperCase();
  const country = getDeliveryCountry(iso);
  if (!country) {
    return {
      countryCode: SHOPPING_COUNTRY_ISO,
      postalCode: "",
      postalDisplay: SHOPPING_COUNTRY_ISO,
    };
  }
  const postalCode = location.postalCode.trim();
  const postalOk = !postalCode || isValidPostal(iso, postalCode);
  return {
    countryCode: iso,
    postalCode: postalOk ? postalCode : "",
    postalDisplay: postalOk && postalCode ? formatPostalDisplay(iso, postalCode) : iso,
  };
}

export function parseDeliveryLocationToken(raw: string | null | undefined): StoredDeliveryLocation | null {
  if (!raw) return null;
  const [countryCode, ...rest] = raw.split(":");
  const postalCode = rest.join(":").trim();
  if (!countryCode) return null;
  const iso = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return null;
  return toShoppingDeliveryLocation({
    countryCode: iso,
    postalCode,
    postalDisplay: iso,
  });
}

export function deliveryLocationToken(location: StoredDeliveryLocation): string {
  return `${location.countryCode}:${location.postalCode}`;
}

/** One year. Matches the client cookie and the middleware `maxAge`. */
export const DELIVERY_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type DeliveryCookieUpdate = {
  value: string;
  maxAge: number;
};

/**
 * App Router client navigations and prefetches are fetch responses. The browser
 * applies their Set-Cookie when the bytes arrive, which can be after a newer
 * selection has already written `bp_dl`. Those flights must not set the cookie.
 * A document load is the navigation the browser is committing, so it still may.
 *
 * Next removes `rsc` and the router prefetch headers before user middleware runs.
 * `Sec-Fetch-*`, `next-url`, and `Accept` are still visible there.
 */
export function isDeliveryCookieFlight(headers: { get(name: string): string | null }): boolean {
  const dest = headers.get("sec-fetch-dest")?.toLowerCase() ?? "";
  const mode = headers.get("sec-fetch-mode")?.toLowerCase() ?? "";
  if (dest === "document" || mode === "navigate") return false;
  if (dest === "empty" || mode === "cors" || mode === "no-cors" || mode === "same-origin") return true;
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""}`.toLowerCase();
  if (purpose.includes("prefetch")) return true;
  if ((headers.get("accept") ?? "").includes("text/x-component")) return true;
  if (headers.get("next-url")) return true;
  if (headers.get("rsc") === "1") return true;
  if (headers.get("next-router-prefetch") === "1") return true;
  if (headers.get("next-router-segment-prefetch")) return true;
  return false;
}

/**
 * Cookie to attach to this response, or null when the response must leave `bp_dl` alone.
 * Document loads keep the existing token shape and lifetime. Flights do not emit one.
 */
export function deliveryCookieUpdate(input: {
  resolvedCountry: string | null;
  requestCookie: string | null | undefined;
  flight: boolean;
}): DeliveryCookieUpdate | null {
  if (!input.resolvedCountry || input.flight) return null;
  const requested = input.resolvedCountry.trim().toUpperCase();
  const country = getDeliveryCountry(requested)?.countryCode ?? SHOPPING_COUNTRY_ISO;
  const existing = parseDeliveryLocationToken(input.requestCookie);
  const postalCode = existing?.countryCode === country ? existing.postalCode : "";
  return {
    value: deliveryLocationToken({
      countryCode: country,
      postalCode,
      postalDisplay: postalCode || country,
    }),
    maxAge: DELIVERY_COOKIE_MAX_AGE_SECONDS,
  };
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function storedToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function readDeliveryLocation(): StoredDeliveryLocation | null {
  if (typeof window === "undefined") return null;
  const cookieRaw = readCookie(DELIVERY_LOCATION_COOKIE);
  let localRaw: string | null = null;
  try {
    localRaw = window.localStorage.getItem(DELIVERY_LOCATION_COOKIE);
  } catch {
    localRaw = null;
  }
  const parsed =
    parseDeliveryLocationToken(cookieRaw) ?? parseDeliveryLocationToken(localRaw);
  if (!parsed) return null;
  const expected = deliveryLocationToken(parsed);
  const cookieToken = storedToken(cookieRaw);
  const localToken = storedToken(localRaw);
  if (cookieToken !== expected || localToken !== expected) {
    writeDeliveryLocation(parsed);
  }
  return parsed;
}

export function writeDeliveryLocation(location: StoredDeliveryLocation) {
  const normalized = toShoppingDeliveryLocation(location);
  const token = deliveryLocationToken(normalized);
  writeCookie(DELIVERY_LOCATION_COOKIE, token);
  try {
    window.localStorage.setItem(DELIVERY_LOCATION_COOKIE, token);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(DELIVERY_LOCATION_EVENT));
}

export function clearDeliveryLocation() {
  writeCookie(DELIVERY_LOCATION_COOKIE, "", -1);
  try {
    window.localStorage.removeItem(DELIVERY_LOCATION_COOKIE);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DELIVERY_LOCATION_EVENT));
}

export function wasLocationPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissLocationPrompt() {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function locationQueryString(location: StoredDeliveryLocation | null): string {
  if (!location) return "";
  const q = new URLSearchParams({ country: location.countryCode });
  if (location.postalCode.trim()) q.set("postalCode", location.postalCode);
  return `?${q.toString()}`;
}

export function deliveryCountryOptions() {
  const unitedStates = getDeliveryCountry(SHOPPING_COUNTRY_ISO);
  return unitedStates ? [unitedStates] : [];
}

export function postalLabelFor(countryCode: string): string {
  return getDeliveryCountry(countryCode)?.postalLabel ?? "Postal / ZIP";
}

export function headerLocationLabel(location: StoredDeliveryLocation, countryName?: string): string {
  if (location.postalCode) return `Deliver to ${location.postalDisplay}`;
  return `Deliver to ${countryName || location.countryCode}`;
}
