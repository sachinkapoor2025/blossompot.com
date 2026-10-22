import { DELIVERY_COUNTRIES, getDeliveryCountry } from "@blossompot/shared";

/** Shown when a save would leave no global target country enabled. */
export const GLOBAL_COUNTRY_REQUIRED_MESSAGE = "At least one country must remain enabled.";

/** Shown when an enabled vendor would be saved with no delivery countries. */
export const VENDOR_COUNTRY_REQUIRED_MESSAGE = "An enabled vendor needs at least one delivery country.";

export const VENDOR_GLOBAL_COUNTRY_NOTE =
  "Customers can only select countries enabled in Global Target Countries.";

export type CountryChoice = {
  countryCode: string;
  countryName: string;
  selected: boolean;
};

/**
 * Every delivery-catalog country, unselected.
 * Names come from `DELIVERY_COUNTRIES`. The catalog's own `enabled` flag is not the admin switch.
 */
export function deliveryCountryChoices(): CountryChoice[] {
  return DELIVERY_COUNTRIES.map((country) => ({
    countryCode: country.countryCode,
    countryName: country.countryName,
    selected: false,
  }));
}

/**
 * Overlay stored global target countries onto the delivery catalog.
 * A country missing from the stored list stays disabled. Nothing is enabled automatically.
 */
export function applyStoredGlobalCountries(
  stored: readonly { countryCode: string; enabled: boolean }[]
): CountryChoice[] {
  const enabled = new Set(
    stored
      .filter((row) => row.enabled === true)
      .map((row) => row.countryCode.trim().toUpperCase())
  );
  return deliveryCountryChoices().map((row) => ({
    ...row,
    selected: enabled.has(row.countryCode),
  }));
}

/**
 * Mark the vendor's stored ISO codes as selected.
 * Codes outside the catalog stay selected and are appended so a save does not drop them.
 */
export function applyVendorDeliveryCountries(codes: readonly string[]): CountryChoice[] {
  const selected = new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean));
  const rows = deliveryCountryChoices().map((row) => ({
    ...row,
    selected: selected.has(row.countryCode),
  }));
  for (const code of selected) {
    if (rows.some((row) => row.countryCode === code)) continue;
    rows.push({
      countryCode: code,
      countryName: getDeliveryCountry(code)?.countryName ?? code,
      selected: true,
    });
  }
  return rows;
}

export function filterCountryChoices(rows: readonly CountryChoice[], query: string): CountryChoice[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...rows];
  return rows.filter(
    (row) => row.countryName.toLowerCase().includes(q) || row.countryCode.toLowerCase().includes(q)
  );
}

export function toggleCountryChoice(
  rows: readonly CountryChoice[],
  countryCode: string,
  selected: boolean
): CountryChoice[] {
  const code = countryCode.trim().toUpperCase();
  return rows.map((row) => (row.countryCode === code ? { ...row, selected } : row));
}

export function formatDeliveryCountryList(codes: readonly string[]): string {
  const labels = codes
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .map((code) => getDeliveryCountry(code)?.countryName ?? code);
  return labels.join(", ");
}

export function globalCountrySaveRequest(
  rows: readonly CountryChoice[],
  defaultCountry?: string | null
):
  | {
      path: "/admin/catalog-countries";
      method: "PUT";
      body: { countries: { countryCode: string; enabled: boolean }[]; defaultCountry?: string };
    }
  | { error: string } {
  if (!rows.some((row) => row.selected)) {
    return { error: GLOBAL_COUNTRY_REQUIRED_MESSAGE };
  }
  const countries = rows.map((row) => ({
    countryCode: row.countryCode,
    enabled: row.selected,
  }));
  const requested = (defaultCountry ?? "").trim().toUpperCase();
  if (!requested) {
    return {
      path: "/admin/catalog-countries",
      method: "PUT",
      body: { countries },
    };
  }
  if (!countries.some((country) => country.countryCode === requested && country.enabled)) {
    return { error: `"${requested}" is not an enabled country.` };
  }
  return {
    path: "/admin/catalog-countries",
    method: "PUT",
    body: { countries, defaultCountry: requested },
  };
}

export function vendorCountrySaveRequest(
  vendorSlug: string,
  enabled: boolean,
  rows: readonly CountryChoice[]
):
  | {
      path: string;
      method: "PUT";
      body: { enabled: boolean; deliveryCountries: string[] };
    }
  | { error: string } {
  const deliveryCountries = rows.filter((row) => row.selected).map((row) => row.countryCode);
  if (enabled && deliveryCountries.length === 0) {
    return { error: VENDOR_COUNTRY_REQUIRED_MESSAGE };
  }
  return {
    path: `/admin/catalog-vendors/${vendorSlug}`,
    method: "PUT",
    body: { enabled, deliveryCountries },
  };
}
