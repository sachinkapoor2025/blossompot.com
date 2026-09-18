import {
  convertCurrencyAmount,
  roundForCurrency,
  type ShopCurrency,
} from "../currency";
import { DELIVERY_COUNTRIES, getDeliveryCountry } from "./postal-countries";

export const STOREFRONT_CURRENCIES = [
  "USD",
  "GBP",
  "CAD",
  "AUD",
  "AED",
  "EUR",
  "INR",
  "CHF",
  "SEK",
  "DKK",
  "NOK",
  "PLN",
  "CZK",
  "ISK",
  "HUF",
  "RON",
  "BGN",
  "UAH",
  "MDL",
  "ALL",
  "BAM",
  "MKD",
  "RSD",
] as const;

export type DisplayCurrency = (typeof STOREFRONT_CURRENCIES)[number];

/** Approximate USD→currency fallbacks when live FX is unavailable. */
export const DEFAULT_USD_RATES: Record<DisplayCurrency, number> = {
  USD: 1,
  GBP: 0.75,
  CAD: 1.37,
  AUD: 1.52,
  AED: 3.6725,
  EUR: 0.86,
  INR: 96,
  CHF: 0.81,
  SEK: 9.4,
  DKK: 6.4,
  NOK: 10.1,
  PLN: 3.65,
  CZK: 21.5,
  ISK: 127,
  HUF: 340,
  RON: 4.4,
  BGN: 1.68,
  UAH: 41,
  MDL: 17,
  ALL: 90,
  BAM: 1.72,
  MKD: 54,
  RSD: 103,
};

const CURRENCY_LOCALE: Record<DisplayCurrency, string> = {
  USD: "en-US",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  AED: "en-AE",
  EUR: "en-IE",
  INR: "en-IN",
  CHF: "de-CH",
  SEK: "sv-SE",
  DKK: "da-DK",
  NOK: "nb-NO",
  PLN: "pl-PL",
  CZK: "cs-CZ",
  ISK: "is-IS",
  HUF: "hu-HU",
  RON: "ro-RO",
  BGN: "bg-BG",
  UAH: "uk-UA",
  MDL: "ro-MD",
  ALL: "sq-AL",
  BAM: "bs-BA",
  MKD: "mk-MK",
  RSD: "sr-RS",
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return (STOREFRONT_CURRENCIES as readonly string[]).includes(value);
}

export function normalizeDisplayCurrency(value: string): DisplayCurrency {
  const code = value.trim().toUpperCase();
  return isDisplayCurrency(code) ? code : "USD";
}

export function currencyForCountryCode(countryIso: string): DisplayCurrency {
  const iso = countryIso.trim().toUpperCase();
  if (iso === "IN") return "INR";
  const fromCountry = getDeliveryCountry(iso)?.currency;
  if (fromCountry && isDisplayCurrency(fromCountry)) return fromCountry;
  return "USD";
}

/** Unique storefront currencies covering every delivery country plus INR. */
export function storefrontCurrenciesForDelivery(): DisplayCurrency[] {
  const seen = new Set<DisplayCurrency>(["USD", "INR"]);
  for (const country of DELIVERY_COUNTRIES) {
    if (isDisplayCurrency(country.currency)) seen.add(country.currency);
  }
  return STOREFRONT_CURRENCIES.filter((code) => seen.has(code));
}

export function displayCurrencyLocale(currency: DisplayCurrency): string {
  return CURRENCY_LOCALE[currency] ?? "en-US";
}

export function roundDisplayAmount(amount: number, currency: DisplayCurrency): number {
  if (currency === "INR" || currency === "ISK" || currency === "HUF" || currency === "ALL") {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Convert catalog amounts between display currencies.
 * `usdInrRate` remains the USD→INR quote used at checkout.
 * Optional `usdRates` supplies extra USD→code multipliers (GBP, CAD, …).
 */
export function convertCurrency(
  amount: number,
  from: DisplayCurrency | string,
  to: DisplayCurrency | string,
  usdInrRate: number,
  usdRates?: Partial<Record<string, number>>
): number {
  const src = normalizeDisplayCurrency(typeof from === "string" ? from : from);
  const dst = normalizeDisplayCurrency(typeof to === "string" ? to : to);
  if (src === dst) return roundDisplayAmount(amount, dst);

  if ((src === "USD" || src === "INR") && (dst === "USD" || dst === "INR")) {
    return roundForCurrency(convertCurrencyAmount(amount, src, dst, usdInrRate), dst as ShopCurrency);
  }

  const rates: Record<string, number> = {
    ...DEFAULT_USD_RATES,
    INR: usdInrRate > 0 ? usdInrRate : DEFAULT_USD_RATES.INR,
    ...usdRates,
    USD: 1,
  };
  const fromPerUsd = rates[src] || 1;
  const toPerUsd = rates[dst] || 1;
  const inUsd = amount / fromPerUsd;
  return roundDisplayAmount(inUsd * toPerUsd, dst);
}

export function checkoutCurrencyForDisplay(display: DisplayCurrency): ShopCurrency {
  return display === "INR" ? "INR" : "USD";
}
