import { z } from "zod";

export const cartItemAddonSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  /** Unit price in the cart line currency. */
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).default(1),
});

export const cartItemSchema = z.object({
  /** Stable cart line id (required for update/delete when add-ons differ). */
  lineId: z.string().min(1).optional(),
  productSlug: z.string(),
  name: z.string(),
  price: z.number(),
  currency: z.enum(["USD", "INR"]),
  quantity: z.number().int().min(1),
  image: z.string().optional(),
  /** Copied from product at add-to-cart for vendor order feeds. */
  vendorSlug: z.string().min(1).max(80).optional(),
  /**
   * Snapshot of product.vendorCost at add-to-cart (USD wholesale).
   * Used for vendor payouts so catalog price changes do not rewrite history.
   */
  vendorCost: z.number().nonnegative().optional(),
  sku: z.string().optional(),
  /** Copied from product — flash / fixed deals are not coupon-eligible. */
  couponExcluded: z.boolean().optional(),
  /** Optional BlossomPot dry-fruit / chocolate extras on this line. */
  addons: z.array(cartItemAddonSchema).max(20).optional(),
  /** Set by GET /cart when the current delivery location cannot fulfill this line. */
  unavailableForLocation: z.boolean().optional(),
  unavailableReason: z.string().optional(),
});

const addToCartAddonSchema = z.union([
  z.string().min(1).max(80),
  z.object({
    id: z.string().min(1).max(80),
    quantity: z.number().int().min(1).max(10).default(1),
  }),
]);

export const addToCartSchema = z.object({
  productSlug: z.string(),
  quantity: z.number().int().min(1).default(1),
  name: z.string().max(120).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(40).optional(),
  /**
   * Product add-ons: catalog ids and/or `{ id, quantity }` (server fills name/price).
   * Plain string ids still accepted (= quantity 1).
   */
  addons: z.array(addToCartAddonSchema).max(20).optional(),
  /** Optional delivery location for server-side serviceability (country + postal only). */
  deliveryCountry: z.string().trim().min(2).max(2).optional(),
  deliveryPostal: z.string().trim().min(2).max(16).optional(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  updatedAt: z.string(),
});

export type CartItemAddon = z.infer<typeof cartItemAddonSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
