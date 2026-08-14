import {
  convertCurrencyAmount,
  roundForCurrency,
  type ShopCurrency,
} from "../currency";
import {
  FLASH_COMBO_SHIPPING_USD,
  isFlashComboProduct,
} from "./flash-sale";
import { cartLineUnitTotal } from "./product-addons";

/** Cart subtotal at or above this (USD) unlocks free shipping (above $13.99 → $14.00+). */
export const FREE_SHIPPING_MIN_SUBTOTAL_USD = 14;

/**
 * At or above this (USD) and below free-shipping threshold → reduced $3.99 shipping.
 * Below this → $6.99 shipping.
 */
export const REDUCED_SHIPPING_MIN_SUBTOTAL_USD = 8;

/** Flat shipping when bucket is under $8. */
export const BELOW_THRESHOLD_SHIPPING_USD = 6.99;

/** Flat shipping when bucket is $8+ but under $14 (i.e. through $13.99). */
export const REDUCED_SHIPPING_USD = 3.99;

export type FreeShippingTier = "low" | "mid" | "free";

export type FreeShippingQuote = {
  /** Shipping charged to the customer in `currency`. */
  charge: number;
  qualifiesForFreeShipping: boolean;
  /** How much more cart value (in `currency`) is needed for free shipping. */
  amountAwayFromFreeShipping: number;
  /** How much more cart value (in `currency`) is needed to reach the $3.99 tier. */
  amountAwayFromReducedShipping: number;
  /** Free-shipping threshold expressed in `currency`. */
  thresholdInCurrency: number;
  /** Reduced-shipping ($3.99) threshold expressed in `currency`. */
  reducedThresholdInCurrency: number;
  /** $6.99 tier fee in `currency`. */
  lowTierFeeInCurrency: number;
  /** $3.99 tier fee in `currency`. */
  midTierFeeInCurrency: number;
  /** Current tier for this bucket. */
  tier: FreeShippingTier;
  /** Shipping fee for the current bucket tier, in `currency`. */
  belowThresholdFeeInCurrency: number;
};

function toCurrency(
  amountUsd: number,
  currency: ShopCurrency,
  usdInrRate: number
): number {
  if (currency === "USD") return roundForCurrency(amountUsd, "USD");
  return roundForCurrency(
    convertCurrencyAmount(amountUsd, "USD", "INR", usdInrRate),
    "INR"
  );
}

function toUsd(
  amount: number,
  currency: ShopCurrency,
  usdInrRate: number
): number {
  if (currency === "USD") return amount;
  return convertCurrencyAmount(amount, "INR", "USD", usdInrRate);
}

/**
 * Shipping tiers (per address × vendor bucket, in USD):
 * - under $8 → $6.99
 * - $8 to $13.99 → $3.99
 * - above $13.99 ($14+) → free
 * Evaluated in USD, then converted when the shopper currency is INR.
 */
export function quoteFreeShippingThreshold(input: {
  subtotal: number;
  currency: ShopCurrency;
  usdInrRate: number;
}): FreeShippingQuote {
  const { subtotal, currency, usdInrRate } = input;
  const thresholdInCurrency = toCurrency(
    FREE_SHIPPING_MIN_SUBTOTAL_USD,
    currency,
    usdInrRate
  );
  const reducedThresholdInCurrency = toCurrency(
    REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
    currency,
    usdInrRate
  );
  const lowTierFee = toCurrency(BELOW_THRESHOLD_SHIPPING_USD, currency, usdInrRate);
  const midTierFee = toCurrency(REDUCED_SHIPPING_USD, currency, usdInrRate);
  const subtotalUsd = toUsd(subtotal, currency, usdInrRate);

  let charge = 0;
  let qualifiesForFreeShipping = false;
  let tier: FreeShippingTier = "low";
  if (subtotalUsd >= FREE_SHIPPING_MIN_SUBTOTAL_USD) {
    qualifiesForFreeShipping = true;
    tier = "free";
    charge = 0;
  } else if (subtotalUsd >= REDUCED_SHIPPING_MIN_SUBTOTAL_USD) {
    tier = "mid";
    charge = midTierFee;
  } else {
    tier = "low";
    charge = lowTierFee;
  }

  const amountAwayFromFreeShipping = qualifiesForFreeShipping
    ? 0
    : Math.max(0, roundForCurrency(thresholdInCurrency - subtotal, currency));
  const amountAwayFromReducedShipping =
    tier === "low"
      ? Math.max(0, roundForCurrency(reducedThresholdInCurrency - subtotal, currency))
      : 0;

  return {
    charge,
    qualifiesForFreeShipping,
    amountAwayFromFreeShipping,
    amountAwayFromReducedShipping,
    thresholdInCurrency,
    reducedThresholdInCurrency,
    lowTierFeeInCurrency: lowTierFee,
    midTierFeeInCurrency: midTierFee,
    tier,
    belowThresholdFeeInCurrency: charge,
  };
}

/** Default vendor bucket for catalog SKUs without `vendorSlug` (BlossomPot). */
export const SHIPPING_VENDOR_BLOSSOMPOT = "blossompot";

/** Normalize cart/product vendor for per-vendor free-shipping buckets. */
export function shippingVendorKey(item: { vendorSlug?: string }): string {
  const slug = item.vendorSlug?.trim();
  return slug || SHIPPING_VENDOR_BLOSSOMPOT;
}

/**
 * Free-shipping groups: each subtotal is one chargeable bucket
 * (delivery address × vendor). Tiers apply per bucket; total = sum.
 */
export function quoteShipmentsShipping(input: {
  shipmentSubtotals: number[];
  currency: ShopCurrency;
  usdInrRate: number;
}): {
  totalCharge: number;
  perShipment: FreeShippingQuote[];
} {
  const perShipment = input.shipmentSubtotals.map((subtotal) =>
    quoteFreeShippingThreshold({
      subtotal,
      currency: input.currency,
      usdInrRate: input.usdInrRate,
    })
  );
  const totalCharge = roundForCurrency(
    perShipment.reduce((sum, q) => sum + q.charge, 0),
    input.currency
  );
  return { totalCharge, perShipment };
}

/** Subtotals keyed by vendor within one delivery address (includes add-ons). */
export function vendorSubtotalsForItems(
  items: Array<{
    price: number;
    quantity: number;
    vendorSlug?: string;
    addons?: Array<{ price: number; quantity: number }>;
  }>
): number[] {
  const byVendor = new Map<string, number>();
  for (const item of items) {
    const key = shippingVendorKey(item);
    byVendor.set(
      key,
      (byVendor.get(key) ?? 0) + cartLineUnitTotal(item) * item.quantity
    );
  }
  return [...byVendor.values()];
}

function flashComboShippingQuote(
  currency: ShopCurrency,
  usdInrRate: number
): FreeShippingQuote {
  const charge = toCurrency(FLASH_COMBO_SHIPPING_USD, currency, usdInrRate);
  const thresholdInCurrency = toCurrency(
    FREE_SHIPPING_MIN_SUBTOTAL_USD,
    currency,
    usdInrRate
  );
  const reducedThresholdInCurrency = toCurrency(
    REDUCED_SHIPPING_MIN_SUBTOTAL_USD,
    currency,
    usdInrRate
  );
  return {
    charge,
    qualifiesForFreeShipping: false,
    amountAwayFromFreeShipping: 0,
    amountAwayFromReducedShipping: 0,
    thresholdInCurrency,
    reducedThresholdInCurrency,
    lowTierFeeInCurrency: toCurrency(BELOW_THRESHOLD_SHIPPING_USD, currency, usdInrRate),
    midTierFeeInCurrency: toCurrency(REDUCED_SHIPPING_USD, currency, usdInrRate),
    tier: "low",
    belowThresholdFeeInCurrency: charge,
  };
}

/**
 * Shipping for one delivery address: evaluate tiers per vendor inside that
 * address (BlossomPot vs Orange County, etc.), then sum.
 * Flash-combo-only buckets use a flat $1 shipping fee.
 */
export function quoteAddressShipmentShipping(input: {
  items: Array<{
    price: number;
    quantity: number;
    vendorSlug?: string;
    productSlug?: string;
    addons?: Array<{ price: number; quantity: number }>;
  }>;
  currency: ShopCurrency;
  usdInrRate: number;
}): {
  totalCharge: number;
  perVendor: FreeShippingQuote[];
} {
  const byVendor = new Map<
    string,
    Array<{
      price: number;
      quantity: number;
      productSlug?: string;
      addons?: Array<{ price: number; quantity: number }>;
    }>
  >();
  for (const item of input.items) {
    const key = shippingVendorKey(item);
    const list = byVendor.get(key) ?? [];
    list.push(item);
    byVendor.set(key, list);
  }

  const perVendor = [...byVendor.values()].map((vendorItems) => {
    const flashOnly =
      vendorItems.length > 0 &&
      vendorItems.every((i) => isFlashComboProduct(i.productSlug));
    if (flashOnly) {
      return flashComboShippingQuote(input.currency, input.usdInrRate);
    }
    // Must include add-ons — otherwise Razorpay totals diverge from checkout UI.
    const subtotal = vendorItems.reduce(
      (sum, i) => sum + cartLineUnitTotal(i) * i.quantity,
      0
    );
    return quoteFreeShippingThreshold({
      subtotal,
      currency: input.currency,
      usdInrRate: input.usdInrRate,
    });
  });

  const totalCharge = roundForCurrency(
    perVendor.reduce((sum, q) => sum + q.charge, 0),
    input.currency
  );
  return { totalCharge, perVendor };
}
