/** Delivery-country config — labels and validation. Ask the customer for country + postal only. */

export type DeliveryCountryConfig = {
  countryCode: string;
  countryName: string;
  postalLabel: string;
  postalPlaceholder: string;
  postalRegex: RegExp;
  currency: string;
  enabled: boolean;
};

export const DELIVERY_COUNTRIES: DeliveryCountryConfig[] = [
  {
    countryCode: "US",
    countryName: "United States",
    postalLabel: "ZIP Code",
    postalPlaceholder: "90012",
    postalRegex: /^\d{5}(?:-\d{4})?$/,
    currency: "USD",
    enabled: true,
  },
  {
    countryCode: "CA",
    countryName: "Canada",
    postalLabel: "Postal Code",
    postalPlaceholder: "M5V 3A8",
    postalRegex: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    currency: "CAD",
    enabled: true,
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    postalLabel: "Postcode",
    postalPlaceholder: "SW1A 1AA",
    postalRegex: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    currency: "GBP",
    enabled: true,
  },
  {
    countryCode: "AU",
    countryName: "Australia",
    postalLabel: "Postcode",
    postalPlaceholder: "2000",
    postalRegex: /^\d{4}$/,
    currency: "AUD",
    enabled: true,
  },
  {
    countryCode: "IN",
    countryName: "India",
    postalLabel: "PIN Code",
    postalPlaceholder: "110001",
    postalRegex: /^\d{6}$/,
    currency: "INR",
    enabled: true,
  },
  {
    countryCode: "IE",
    countryName: "Ireland",
    postalLabel: "Eircode",
    postalPlaceholder: "D02 AF30",
    postalRegex: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    postalLabel: "Postal Code",
    postalPlaceholder: "10115",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "FR",
    countryName: "France",
    postalLabel: "Postal Code",
    postalPlaceholder: "75001",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "NL",
    countryName: "Netherlands",
    postalLabel: "Postcode",
    postalPlaceholder: "1012 AB",
    postalRegex: /^\d{4}\s?[A-Z]{2}$/i,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "IT",
    countryName: "Italy",
    postalLabel: "Postal Code",
    postalPlaceholder: "00100",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "ES",
    countryName: "Spain",
    postalLabel: "Postal Code",
    postalPlaceholder: "28001",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "CH",
    countryName: "Switzerland",
    postalLabel: "Postal Code",
    postalPlaceholder: "8001",
    postalRegex: /^\d{4}$/,
    currency: "CHF",
    enabled: true,
  },
  {
    countryCode: "AT",
    countryName: "Austria",
    postalLabel: "Postal Code",
    postalPlaceholder: "1010",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "BE",
    countryName: "Belgium",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  },
  {
    countryCode: "SE",
    countryName: "Sweden",
    postalLabel: "Postal Code",
    postalPlaceholder: "111 22",
    postalRegex: /^\d{3}\s?\d{2}$/,
    currency: "SEK",
    enabled: true,
  },
  {
    countryCode: "DK",
    countryName: "Denmark",
    postalLabel: "Postal Code",
    postalPlaceholder: "1050",
    postalRegex: /^\d{4}$/,
    currency: "DKK",
    enabled: true,
  },
  {
    countryCode: "NO",
    countryName: "Norway",
    postalLabel: "Postal Code",
    postalPlaceholder: "0150",
    postalRegex: /^\d{4}$/,
    currency: "NOK",
    enabled: true,
  },
  {
    countryCode: "FI",
    countryName: "Finland",
    postalLabel: "Postal Code",
    postalPlaceholder: "00100",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  },
];

const byCode = new Map(DELIVERY_COUNTRIES.map((c) => [c.countryCode, c]));

export function getDeliveryCountry(code: string): DeliveryCountryConfig | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function enabledDeliveryCountries(): DeliveryCountryConfig[] {
  return DELIVERY_COUNTRIES.filter((c) => c.enabled);
}

/** Normalize for matching. Keeps a display form separately. */
export function normalizePostal(countryCode: string, raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  const country = countryCode.toUpperCase();
  if (country === "US") return trimmed.replace(/\D/g, "").slice(0, 5);
  if (country === "CA" || country === "GB" || country === "IE" || country === "NL") {
    return trimmed.replace(/\s+/g, "");
  }
  if (country === "SE") return trimmed.replace(/\s+/g, "");
  return trimmed.replace(/\s+/g, "");
}

export function formatPostalDisplay(countryCode: string, raw: string): string {
  const country = countryCode.toUpperCase();
  const n = normalizePostal(country, raw);
  if (country === "CA" && n.length === 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
  if (country === "US" && n.length === 5) return n;
  return raw.trim();
}

export function isValidPostal(countryCode: string, raw: string): boolean {
  const cfg = getDeliveryCountry(countryCode);
  if (!cfg) return false;
  return cfg.postalRegex.test(raw.trim());
}

export function normalizePrefix(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "").replace(/\*+$/, "");
}
