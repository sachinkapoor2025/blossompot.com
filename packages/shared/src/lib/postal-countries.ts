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

function country(partial: DeliveryCountryConfig): DeliveryCountryConfig {
  return partial;
}

/**
 * Served delivery markets: USA, Canada, Australia, Europe, and UAE.
 * India is intentionally omitted — BlossomPot does not take delivery locations there.
 */
export const DELIVERY_COUNTRIES: DeliveryCountryConfig[] = [
  country({
    countryCode: "US",
    countryName: "United States",
    postalLabel: "ZIP Code",
    postalPlaceholder: "90012",
    postalRegex: /^\d{5}(?:-\d{4})?$/,
    currency: "USD",
    enabled: true,
  }),
  country({
    countryCode: "CA",
    countryName: "Canada",
    postalLabel: "Postal Code",
    postalPlaceholder: "M5V 3A8",
    postalRegex: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    currency: "CAD",
    enabled: true,
  }),
  country({
    countryCode: "AU",
    countryName: "Australia",
    postalLabel: "Postcode",
    postalPlaceholder: "2000",
    postalRegex: /^\d{4}$/,
    currency: "AUD",
    enabled: true,
  }),
  country({
    countryCode: "AE",
    countryName: "United Arab Emirates",
    postalLabel: "Postal Code",
    postalPlaceholder: "00000",
    postalRegex: /^\d{5}$/,
    currency: "AED",
    enabled: true,
  }),
  country({
    countryCode: "GB",
    countryName: "United Kingdom",
    postalLabel: "Postcode",
    postalPlaceholder: "SW1A 1AA",
    postalRegex: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
    currency: "GBP",
    enabled: true,
  }),
  country({
    countryCode: "IE",
    countryName: "Ireland",
    postalLabel: "Eircode",
    postalPlaceholder: "D02 AF30",
    postalRegex: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "DE",
    countryName: "Germany",
    postalLabel: "Postal Code",
    postalPlaceholder: "10115",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "FR",
    countryName: "France",
    postalLabel: "Postal Code",
    postalPlaceholder: "75001",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "NL",
    countryName: "Netherlands",
    postalLabel: "Postcode",
    postalPlaceholder: "1012 AB",
    postalRegex: /^\d{4}\s?[A-Z]{2}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "IT",
    countryName: "Italy",
    postalLabel: "Postal Code",
    postalPlaceholder: "00100",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "ES",
    countryName: "Spain",
    postalLabel: "Postal Code",
    postalPlaceholder: "28001",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "PT",
    countryName: "Portugal",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000-001",
    postalRegex: /^\d{4}(?:-\d{3})?$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "CH",
    countryName: "Switzerland",
    postalLabel: "Postal Code",
    postalPlaceholder: "8001",
    postalRegex: /^\d{4}$/,
    currency: "CHF",
    enabled: true,
  }),
  country({
    countryCode: "AT",
    countryName: "Austria",
    postalLabel: "Postal Code",
    postalPlaceholder: "1010",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "BE",
    countryName: "Belgium",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "LU",
    countryName: "Luxembourg",
    postalLabel: "Postal Code",
    postalPlaceholder: "1009",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "SE",
    countryName: "Sweden",
    postalLabel: "Postal Code",
    postalPlaceholder: "111 22",
    postalRegex: /^\d{3}\s?\d{2}$/,
    currency: "SEK",
    enabled: true,
  }),
  country({
    countryCode: "DK",
    countryName: "Denmark",
    postalLabel: "Postal Code",
    postalPlaceholder: "1050",
    postalRegex: /^\d{4}$/,
    currency: "DKK",
    enabled: true,
  }),
  country({
    countryCode: "NO",
    countryName: "Norway",
    postalLabel: "Postal Code",
    postalPlaceholder: "0150",
    postalRegex: /^\d{4}$/,
    currency: "NOK",
    enabled: true,
  }),
  country({
    countryCode: "FI",
    countryName: "Finland",
    postalLabel: "Postal Code",
    postalPlaceholder: "00100",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "IS",
    countryName: "Iceland",
    postalLabel: "Postal Code",
    postalPlaceholder: "101",
    postalRegex: /^\d{3}$/,
    currency: "ISK",
    enabled: true,
  }),
  country({
    countryCode: "PL",
    countryName: "Poland",
    postalLabel: "Postal Code",
    postalPlaceholder: "00-001",
    postalRegex: /^\d{2}-?\d{3}$/,
    currency: "PLN",
    enabled: true,
  }),
  country({
    countryCode: "CZ",
    countryName: "Czechia",
    postalLabel: "Postal Code",
    postalPlaceholder: "110 00",
    postalRegex: /^\d{3}\s?\d{2}$/,
    currency: "CZK",
    enabled: true,
  }),
  country({
    countryCode: "SK",
    countryName: "Slovakia",
    postalLabel: "Postal Code",
    postalPlaceholder: "811 01",
    postalRegex: /^\d{3}\s?\d{2}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "HU",
    countryName: "Hungary",
    postalLabel: "Postal Code",
    postalPlaceholder: "1051",
    postalRegex: /^\d{4}$/,
    currency: "HUF",
    enabled: true,
  }),
  country({
    countryCode: "RO",
    countryName: "Romania",
    postalLabel: "Postal Code",
    postalPlaceholder: "010011",
    postalRegex: /^\d{6}$/,
    currency: "RON",
    enabled: true,
  }),
  country({
    countryCode: "BG",
    countryName: "Bulgaria",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000",
    postalRegex: /^\d{4}$/,
    currency: "BGN",
    enabled: true,
  }),
  country({
    countryCode: "GR",
    countryName: "Greece",
    postalLabel: "Postal Code",
    postalPlaceholder: "105 57",
    postalRegex: /^\d{3}\s?\d{2}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "HR",
    countryName: "Croatia",
    postalLabel: "Postal Code",
    postalPlaceholder: "10000",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "SI",
    countryName: "Slovenia",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "EE",
    countryName: "Estonia",
    postalLabel: "Postal Code",
    postalPlaceholder: "10111",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "LV",
    countryName: "Latvia",
    postalLabel: "Postal Code",
    postalPlaceholder: "LV-1050",
    postalRegex: /^(?:LV-?)?\d{4}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "LT",
    countryName: "Lithuania",
    postalLabel: "Postal Code",
    postalPlaceholder: "LT-01100",
    postalRegex: /^(?:LT-?)?\d{5}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "MT",
    countryName: "Malta",
    postalLabel: "Postcode",
    postalPlaceholder: "VLT 1117",
    postalRegex: /^[A-Z]{3}\s?\d{4}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "CY",
    countryName: "Cyprus",
    postalLabel: "Postal Code",
    postalPlaceholder: "1010",
    postalRegex: /^\d{4}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "LI",
    countryName: "Liechtenstein",
    postalLabel: "Postal Code",
    postalPlaceholder: "9490",
    postalRegex: /^\d{4}$/,
    currency: "CHF",
    enabled: true,
  }),
  country({
    countryCode: "MC",
    countryName: "Monaco",
    postalLabel: "Postal Code",
    postalPlaceholder: "98000",
    postalRegex: /^980\d{2}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "AD",
    countryName: "Andorra",
    postalLabel: "Postal Code",
    postalPlaceholder: "AD500",
    postalRegex: /^AD\d{3}$/i,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "SM",
    countryName: "San Marino",
    postalLabel: "Postal Code",
    postalPlaceholder: "47890",
    postalRegex: /^4789\d$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "UA",
    countryName: "Ukraine",
    postalLabel: "Postal Code",
    postalPlaceholder: "01001",
    postalRegex: /^\d{5}$/,
    currency: "UAH",
    enabled: true,
  }),
  country({
    countryCode: "MD",
    countryName: "Moldova",
    postalLabel: "Postal Code",
    postalPlaceholder: "2001",
    postalRegex: /^(?:MD-?)?\d{4}$/i,
    currency: "MDL",
    enabled: true,
  }),
  country({
    countryCode: "AL",
    countryName: "Albania",
    postalLabel: "Postal Code",
    postalPlaceholder: "1001",
    postalRegex: /^\d{4}$/,
    currency: "ALL",
    enabled: true,
  }),
  country({
    countryCode: "BA",
    countryName: "Bosnia and Herzegovina",
    postalLabel: "Postal Code",
    postalPlaceholder: "71000",
    postalRegex: /^\d{5}$/,
    currency: "BAM",
    enabled: true,
  }),
  country({
    countryCode: "ME",
    countryName: "Montenegro",
    postalLabel: "Postal Code",
    postalPlaceholder: "81000",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
  country({
    countryCode: "MK",
    countryName: "North Macedonia",
    postalLabel: "Postal Code",
    postalPlaceholder: "1000",
    postalRegex: /^\d{4}$/,
    currency: "MKD",
    enabled: true,
  }),
  country({
    countryCode: "RS",
    countryName: "Serbia",
    postalLabel: "Postal Code",
    postalPlaceholder: "11000",
    postalRegex: /^\d{5}$/,
    currency: "RSD",
    enabled: true,
  }),
  country({
    countryCode: "XK",
    countryName: "Kosovo",
    postalLabel: "Postal Code",
    postalPlaceholder: "10000",
    postalRegex: /^\d{5}$/,
    currency: "EUR",
    enabled: true,
  }),
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
  if (country === "SE" || country === "CZ" || country === "SK" || country === "GR") {
    return trimmed.replace(/\s+/g, "");
  }
  if (country === "PL") return trimmed.replace(/[-\s]/g, "");
  if (country === "LV" || country === "LT" || country === "MD") {
    return trimmed.replace(/^(LV|LT|MD)-?/i, "").replace(/\s+/g, "");
  }
  return trimmed.replace(/\s+/g, "");
}

export function formatPostalDisplay(countryCode: string, raw: string): string {
  const country = countryCode.toUpperCase();
  const n = normalizePostal(country, raw);
  if (country === "CA" && n.length === 6) return `${n.slice(0, 3)} ${n.slice(3)}`;
  if (country === "US" && n.length === 5) return n;
  if (country === "PL" && n.length === 5) return `${n.slice(0, 2)}-${n.slice(2)}`;
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
