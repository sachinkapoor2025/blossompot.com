import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/metadata.min.json";

export type PhoneCountryValidation = { ok: true; e164: string } | { ok: false };

/**
 * The number must be valid for the country selected in the dial-code dropdown.
 * A leading + is parsed as an international number. Otherwise the selected
 * country is the default, so a national number does not need a calling code.
 */
export function validatePhoneForCountry(countryIso: string, rawInput: string): PhoneCountryValidation {
  const iso = countryIso.trim().toUpperCase();
  const input = rawInput.trim();
  if (!input || !/^[A-Z]{2}$/.test(iso)) return { ok: false };

  try {
    const parsed = parsePhoneNumberFromString(input, iso as CountryCode, metadata);
    if (!parsed?.isValid() || parsed.country !== iso) return { ok: false };
    return { ok: true, e164: parsed.number };
  } catch {
    return { ok: false };
  }
}

export function phoneCountryErrorMessage(countryIso: string): string {
  if (countryIso.trim().toUpperCase() === "US") {
    return "Please enter a valid US phone number or select the correct country.";
  }
  return "Please enter a valid phone number for the selected country.";
}
