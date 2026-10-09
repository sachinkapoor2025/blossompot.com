import {
  SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE,
  USA_ONLY_DELIVERY_MESSAGE,
  type ShippingAddress,
} from "@blossompot/shared";

export type CheckoutAddressCandidate = Partial<ShippingAddress> & { country?: string | null };

const FOREIGN_SAVED_ADDRESS_NOTICE = `${USA_ONLY_DELIVERY_MESSAGE} Your saved address is outside the United States. Enter a US delivery address.`;

function enabledSet(enabledCountryCodes?: readonly string[]): Set<string> {
  return new Set((enabledCountryCodes ?? ["US"]).map((code) => code.trim().toUpperCase()));
}

/** Blocks an address outside the globally enabled shopping countries. Defaults to the USA. */
export function nonUsAccountSaveMessage(
  country?: string | null,
  enabledCountryCodes?: readonly string[]
): string | null {
  const enabled = enabledSet(enabledCountryCodes);
  const iso = (country || "US").trim().toUpperCase();
  if (enabled.has(iso)) return null;
  if (enabled.size === 1 && enabled.has("US")) {
    return `${USA_ONLY_DELIVERY_MESSAGE} Enter a US street, city, state, and ZIP code.`;
  }
  return SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE;
}

/**
 * Prefer a United States address. A rejected non-US address does not block a later US one,
 * and it is not copied into the form.
 */
export function chooseCheckoutAddressPrefill(input: {
  accountAddress?: CheckoutAddressCandidate | null;
  saved?: CheckoutAddressCandidate[] | null;
  previousOrder?: CheckoutAddressCandidate | null;
  enabledCountryCodes?: readonly string[];
}): { address: CheckoutAddressCandidate | null; notice: string | null } {
  const enabled = enabledSet(input.enabledCountryCodes);
  const candidates = [input.accountAddress, ...(input.saved ?? []), input.previousOrder];
  const usable = candidates.find((address) => address && enabled.has((address.country || "").trim().toUpperCase()));
  if (usable) return { address: usable, notice: null };
  const sawForeign = candidates.some((address) => {
    const code = address?.country?.trim().toUpperCase();
    if (!code) return false;
    return !enabled.has(code);
  });
  const usaOnly = enabled.size === 1 && enabled.has("US");
  return {
    address: null,
    notice: sawForeign
      ? usaOnly
        ? FOREIGN_SAVED_ADDRESS_NOTICE
        : SHOPPING_COUNTRY_UNAVAILABLE_MESSAGE
      : null,
  };
}
