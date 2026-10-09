import type { CartItem } from "../schemas/cart";
import { cartLineOptionsSignature } from "./product-addons";

/** Merge a guest session cart into the signed-in account cart. Same-line quantities add together. */
export function mergeCartItems(accountItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const merged = accountItems.map((item) => ({ ...item }));
  for (const guest of guestItems) {
    const sig = cartLineOptionsSignature(guest.addons, guest.shippingOptionLabel);
    const existing = merged.findIndex(
      (item) =>
        item.productSlug === guest.productSlug &&
        cartLineOptionsSignature(item.addons, item.shippingOptionLabel) === sig
    );
    if (existing >= 0) {
      merged[existing] = {
        ...merged[existing],
        quantity: merged[existing].quantity + guest.quantity,
      };
      continue;
    }
    merged.push({ ...guest });
  }
  return merged;
}
