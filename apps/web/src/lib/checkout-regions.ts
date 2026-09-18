import { getDeliveryCountry } from "@blossompot/shared";
import { US_STATES } from "@/lib/shipping-address";

export { US_STATES };

export const CA_PROVINCES: { code: string; name: string }[] = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

export const AU_STATES: { code: string; name: string }[] = [
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NSW", name: "New South Wales" },
  { code: "NT", name: "Northern Territory" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "VIC", name: "Victoria" },
  { code: "WA", name: "Western Australia" },
];

export const AE_EMIRATES: { code: string; name: string }[] = [
  { code: "AZ", name: "Abu Dhabi" },
  { code: "DU", name: "Dubai" },
  { code: "SH", name: "Sharjah" },
  { code: "AJ", name: "Ajman" },
  { code: "UQ", name: "Umm Al Quwain" },
  { code: "RK", name: "Ras Al Khaimah" },
  { code: "FU", name: "Fujairah" },
];

export function regionOptionsForCountry(countryIso: string): { code: string; name: string }[] | null {
  const iso = countryIso.trim().toUpperCase();
  if (iso === "US") return US_STATES;
  if (iso === "CA") return CA_PROVINCES;
  if (iso === "AU") return AU_STATES;
  if (iso === "AE") return AE_EMIRATES;
  return null;
}

export function regionFieldLabel(countryIso: string): string {
  const iso = countryIso.trim().toUpperCase();
  if (iso === "US") return "State";
  if (iso === "CA") return "Province / territory";
  if (iso === "AU") return "State / territory";
  if (iso === "AE") return "Emirate";
  if (iso === "GB" || iso === "IE") return "County / region";
  return "State / region";
}

export function postalFieldLabel(countryIso: string): string {
  return getDeliveryCountry(countryIso)?.postalLabel ?? "Postal / ZIP";
}

export function postalPlaceholder(countryIso: string): string {
  return getDeliveryCountry(countryIso)?.postalPlaceholder ?? "Postal code";
}

export function postalInputMode(countryIso: string): "numeric" | "text" {
  const iso = countryIso.trim().toUpperCase();
  return iso === "US" || iso === "AU" || iso === "DE" || iso === "FR" || iso === "IT" ? "numeric" : "text";
}
