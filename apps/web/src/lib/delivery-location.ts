import {
  enabledDeliveryCountries,
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

export function parseDeliveryLocationToken(raw: string | null | undefined): StoredDeliveryLocation | null {
  if (!raw) return null;
  const [countryCode, ...rest] = raw.split(":");
  const postalCode = rest.join(":").trim();
  if (!countryCode || !postalCode) return null;
  const country = getDeliveryCountry(countryCode);
  if (!country?.enabled || !isValidPostal(countryCode, postalCode)) return null;
  return {
    countryCode: country.countryCode,
    postalCode,
    postalDisplay: formatPostalDisplay(country.countryCode, postalCode),
  };
}

export function deliveryLocationToken(location: StoredDeliveryLocation): string {
  return `${location.countryCode}:${location.postalCode}`;
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

export function readDeliveryLocation(): StoredDeliveryLocation | null {
  if (typeof window === "undefined") return null;
  const fromCookie = parseDeliveryLocationToken(readCookie(DELIVERY_LOCATION_COOKIE));
  if (fromCookie) return fromCookie;
  try {
    return parseDeliveryLocationToken(window.localStorage.getItem(DELIVERY_LOCATION_COOKIE));
  } catch {
    return null;
  }
}

export function writeDeliveryLocation(location: StoredDeliveryLocation) {
  const token = deliveryLocationToken(location);
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
  const q = new URLSearchParams({
    country: location.countryCode,
    postalCode: location.postalCode,
  });
  return `?${q.toString()}`;
}

export function deliveryCountryOptions() {
  return enabledDeliveryCountries();
}

export function postalLabelFor(countryCode: string): string {
  return getDeliveryCountry(countryCode)?.postalLabel ?? "Postal Code";
}

export function headerLocationLabel(location: StoredDeliveryLocation): string {
  return `Deliver to ${location.postalDisplay}`;
}
