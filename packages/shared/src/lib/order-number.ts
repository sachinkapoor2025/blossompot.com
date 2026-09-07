import { VENDOR_ORANGE_COUNTY } from "../constants";

/** Human-readable order numbers: OC10001… (Orange County) / BP10002… (all others). */
export const ORDER_NUMBER_START = 10001;

/** Prefix stamped on new orders. */
export type OrderNumberPrefix = "OC" | "BP";

/** Includes legacy US##### numbers already issued. */
export type StoredOrderNumberPrefix = OrderNumberPrefix | "US";

const HUMAN_ORDER_NUMBER_RE = /^(OC|US|BP)(\d{5,})$/i;

export function isHumanOrderNumber(value: string): boolean {
  return HUMAN_ORDER_NUMBER_RE.test(value.trim());
}

export function parseHumanOrderNumber(
  value: string
): { prefix: StoredOrderNumberPrefix; seq: number } | null {
  const m = value.trim().match(HUMAN_ORDER_NUMBER_RE);
  if (!m) return null;
  return {
    prefix: m[1]!.toUpperCase() as StoredOrderNumberPrefix,
    seq: Number(m[2]),
  };
}

export function formatOrderNumber(prefix: StoredOrderNumberPrefix, seq: number): string {
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

/** Prefer human orderNumber when present; else short UUID for display. */
export function displayOrderRef(order: {
  orderNumber?: string | null;
  orderId: string;
}): string {
  const n = order.orderNumber?.trim();
  if (n) return n;
  return order.orderId.slice(0, 8).toUpperCase();
}

/**
 * DynamoDB counter key for a display prefix.
 * BP continues the legacy US sequence so BP10002 follows US10001.
 */
export function orderNumberCounterPrefix(prefix: OrderNumberPrefix): "OC" | "US" {
  return prefix === "OC" ? "OC" : "US";
}

/** OC prefix when the order includes any Orange County vendor lines. */
export function orderNumberPrefixForItems(
  items: Array<{ vendorSlug?: string | null }>,
  vendorSlugs?: string[] | null
): OrderNumberPrefix {
  if (vendorSlugs?.includes(VENDOR_ORANGE_COUNTY)) return "OC";
  if (items.some((i) => i.vendorSlug === VENDOR_ORANGE_COUNTY)) return "OC";
  return "BP";
}
