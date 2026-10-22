import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ENABLED_SHOPPING_COUNTRIES_HEADER, shoppingSeoCountryStatus } from "@/lib/location-seo-urls";
import { loadEnabledShoppingCountryCodes } from "@/lib/storefront-country";

async function enabledShoppingCodesForRequest(): Promise<string[] | null> {
  try {
    const header = (await headers()).get(ENABLED_SHOPPING_COUNTRIES_HEADER);
    if (header !== null) {
      return [
        ...new Set(
          header
            .split(",")
            .map((code) => code.trim().toUpperCase())
            .filter((code) => /^[A-Z]{2}$/.test(code))
        ),
      ];
    }
  } catch {
    /* headers() unavailable outside a request */
  }
  return loadEnabledShoppingCountryCodes();
}

/** 404 before any product query when the URL names a disabled or unknown shopping country. */
export async function notFoundIfShoppingCountryDisabled(pathname: string): Promise<void> {
  const enabled = await enabledShoppingCodesForRequest();
  if (shoppingSeoCountryStatus(pathname, enabled) === "unavailable") notFound();
}
