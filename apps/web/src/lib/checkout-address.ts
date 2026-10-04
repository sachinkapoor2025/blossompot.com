import { isShoppingCountry, USA_ONLY_DELIVERY_MESSAGE, type ShippingAddress } from "@blossompot/shared";

export type CheckoutAddressCandidate = Partial<ShippingAddress> & { country?: string | null };

const FOREIGN_SAVED_ADDRESS_NOTICE = `${USA_ONLY_DELIVERY_MESSAGE} Your saved address is outside the United States. Enter a US delivery address.`;

/** Blocks a new or edited account address that is still outside the United States. */
export function nonUsAccountSaveMessage(country?: string | null): string | null {
  const iso = (country || "US").trim().toUpperCase();
  if (isShoppingCountry(iso)) return null;
  return `${USA_ONLY_DELIVERY_MESSAGE} Enter a US street, city, state, and ZIP code.`;
}

/**
 * Prefer a United States address. A rejected non-US address does not block a later US one,
 * and it is not copied into the form.
 */
export function chooseCheckoutAddressPrefill(input: {
  accountAddress?: CheckoutAddressCandidate | null;
  saved?: CheckoutAddressCandidate[] | null;
  previousOrder?: CheckoutAddressCandidate | null;
}): { address: CheckoutAddressCandidate | null; notice: string | null } {
  const candidates = [input.accountAddress, ...(input.saved ?? []), input.previousOrder];
  const usable = candidates.find((address) => address && isShoppingCountry(address.country));
  if (usable) return { address: usable, notice: null };
  const sawForeign = candidates.some(
    (address) => Boolean(address?.country) && !isShoppingCountry(address?.country)
  );
  return { address: null, notice: sawForeign ? FOREIGN_SAVED_ADDRESS_NOTICE : null };
}
