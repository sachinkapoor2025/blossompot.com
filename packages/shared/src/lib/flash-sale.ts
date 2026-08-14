/** 24-hour flash combo: Blue Beads Pearl + Om Rakhi (roli/chawal) + 21g pistachio pack. */

export const FLASH_COMBO_SALE_SLUG = "blue-beads-om-pista-flash-combo";

/** Inclusive start of the sale window (UTC). 24h from this instant. */
export const FLASH_COMBO_SALE_STARTED_AT = "2026-08-03T20:17:00.000Z";

/** Sale length from start. */
export const FLASH_COMBO_SALE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Flat shipping for flash-combo-only vendor buckets (USD). */
export const FLASH_COMBO_SHIPPING_USD = 0.99;

export const FLASH_COMBO_SALE = {
  slug: FLASH_COMBO_SALE_SLUG,
  title: "24-Hour Flash Sale",
  headline: "Grab Your Offer (5 product combo)",
  priceUsd: 12.96,
  compareAtUsd: 24.99,
  shippingUsd: FLASH_COMBO_SHIPPING_USD,
  includes: [
    "Blue Beads Pearl Single Rakhi",
    "Om Rakhi for Brother",
    "Wonderful Pistachios No Shells — 0.75 oz (21 g)",
    "1 packet Roli",
    "1 packet Chawal",
  ],
  /** Canonical gallery — overrides stale Dynamo images on storefront. */
  images: [
    "https://blossompot.com/wp-content/uploads/2026/03/50dada5d-eb61-454a-8fe4-51eb5e420753-e1775488586506.webp",
    "https://blossompot.com/wp-content/uploads/2026/05/WhatsApp-Image-2026-05-06-at-10.36.39-PM-2.jpeg",
    "https://d301af4ndyn9qx.cloudfront.net/uploads/flash-sale/wonderful-pistachios-21g-v3.png",
    "https://d301af4ndyn9qx.cloudfront.net/uploads/flash-sale/roli-chawal-packets.jpeg",
  ],
} as const;

export function flashComboSaleEndsAt(): Date {
  return new Date(
    new Date(FLASH_COMBO_SALE_STARTED_AT).getTime() + FLASH_COMBO_SALE_DURATION_MS
  );
}

export function isFlashComboSaleActive(now = new Date()): boolean {
  const start = new Date(FLASH_COMBO_SALE_STARTED_AT).getTime();
  const end = flashComboSaleEndsAt().getTime();
  const t = now.getTime();
  return t >= start && t < end;
}

export function isFlashComboProduct(slug: string | undefined | null): boolean {
  return (slug ?? "").trim() === FLASH_COMBO_SALE_SLUG;
}

/** True when storefront/cart must keep the exact listed price (no competitive cut). */
export function productUsesFixedStorefrontPrice(product: {
  couponExcluded?: boolean;
  tags?: string[];
  slug?: string;
}): boolean {
  if (product.couponExcluded) return true;
  if (isFlashComboProduct(product.slug)) return true;
  const tags = product.tags ?? [];
  return tags.includes("fixed-price") || tags.includes("flash-sale");
}

/** Force flash-combo list price + gallery from code (ignores stale Dynamo data). */
export function withFlashComboStorefrontPricing<
  T extends {
    slug?: string;
    price: number;
    compareAtPrice?: number;
    couponExcluded?: boolean;
    images?: string[];
  }
>(product: T): T {
  if (!isFlashComboProduct(product.slug)) return product;
  return {
    ...product,
    price: FLASH_COMBO_SALE.priceUsd,
    compareAtPrice: Math.max(
      product.compareAtPrice ?? 0,
      FLASH_COMBO_SALE.compareAtUsd
    ),
    images: [...FLASH_COMBO_SALE.images],
    couponExcluded: true,
  };
}

/** Unit price charged for the flash combo (cart / checkout). */
export function flashComboUnitPriceUsd(): number {
  return FLASH_COMBO_SALE.priceUsd;
}

type CouponLine = {
  price: number;
  quantity: number;
  couponExcluded?: boolean;
  productSlug?: string;
  addons?: Array<{ price: number; quantity: number }>;
};

function lineTotal(item: CouponLine): number {
  const addonTotal =
    item.addons?.reduce((sum, a) => sum + a.price * a.quantity, 0) ?? 0;
  return (item.price + addonTotal) * item.quantity;
}

/** Subtotal of cart lines that coupons may discount. */
export function couponEligibleSubtotal(items: CouponLine[]): number {
  return Math.round(
    items.reduce((sum, item) => {
      if (item.couponExcluded || isFlashComboProduct(item.productSlug)) return sum;
      return sum + lineTotal(item);
    }, 0) * 100
  ) / 100;
}

export function cartHasCouponExcludedItems(items: CouponLine[]): boolean {
  return items.some(
    (item) => item.couponExcluded || isFlashComboProduct(item.productSlug)
  );
}
