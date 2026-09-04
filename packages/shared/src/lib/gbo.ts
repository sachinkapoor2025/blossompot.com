import { ORDER_STATUS, VENDOR_GBO } from "../constants";
import type { OrderStatus } from "../constants";

/** SKU stored on cart/order lines for live GBO gifts: `gbo:US:10215`. */
export const GBO_SKU_RE = /^gbo:([A-Za-z]{2}):(\d+)$/i;

/** Product slug prefix: `gbo-us-10215-natural-selection`. */
export const GBO_SLUG_RE = /^gbo-([a-z]{2})-(\d+)(?:-|$)/i;

export type GboLineRef = {
  country: string;
  productId: number;
};

export function isGboVendor(slug?: string | null): boolean {
  return (slug ?? "").trim() === VENDOR_GBO;
}

export function formatGboSku(country: string, productId: number): string {
  return `gbo:${country.trim().toUpperCase()}:${productId}`;
}

export function parseGboSku(sku?: string | null): GboLineRef | null {
  const m = sku?.trim().match(GBO_SKU_RE);
  if (!m) return null;
  return { country: m[1]!.toUpperCase(), productId: Number(m[2]) };
}

export function parseGboSlug(slug?: string | null): GboLineRef | null {
  const m = slug?.trim().match(GBO_SLUG_RE);
  if (!m) return null;
  return { country: m[1]!.toUpperCase(), productId: Number(m[2]) };
}

export function parseGboLineRef(item: {
  sku?: string | null;
  productSlug?: string | null;
}): GboLineRef | null {
  return parseGboSku(item.sku) ?? parseGboSlug(item.productSlug);
}

/**
 * Numeric partner order id GBO requires on create/get.
 * Namespaces US vs OC sequences so 10001 does not collide.
 */
export function gboPartnerOrderId(order: {
  orderNumber?: string | null;
  orderId: string;
}): number {
  const n = (order.orderNumber ?? "").trim().toUpperCase();
  const m = n.match(/^(OC|US)(\d{5,})$/);
  if (m) {
    const seq = Number(m[2]);
    const ns = m[1] === "OC" ? 200_000 : 100_000;
    return ns + seq;
  }
  const hex = order.orderId.replace(/-/g, "").slice(0, 8);
  const parsed = Number.parseInt(hex, 16);
  if (Number.isFinite(parsed) && parsed > 0) return parsed % 1_900_000_000;
  return Math.abs(hash32(order.orderId)) || 1;
}

function hash32(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return h;
}

export function clipGboGiftCardText(text?: string | null): string | undefined {
  const t = (text ?? "").trim();
  if (!t) return undefined;
  return t.length <= 180 ? t : t.slice(0, 180);
}

/**
 * GBO order status IDs from Get Order Details docs.
 * https://gboapi.readme.io/reference/get-order-details
 */
export const GBO_STATUS_LABEL: Record<number, string> = {
  0: "Received — in queue",
  5: "Received — in queue",
  14: "Received — in queue",
  17: "Received — in queue",
  13: "Being processed",
  2: "Being processed",
  18: "Being processed",
  4: "Passed to local office for delivery",
  19: "Passed to local office for delivery",
  12: "Paused — issue / more info needed",
  16: "Paused — issue / more info needed",
  20: "Paused — issue / more info needed",
  21: "Paused — issue / more info needed",
  3: "Cancelled",
  1: "Delivered",
  15: "Delivered",
};

const RECEIVED = new Set([0, 5, 14, 17]);
const PROCESSING = new Set([13, 2, 18]);
const LOCAL_DELIVERY = new Set([4, 19]);
const PAUSED = new Set([12, 16, 20, 21]);
const DELIVERED = new Set([1, 15]);

export function gboStatusLabel(statusId: number | string | undefined | null): string {
  const n = Number(statusId);
  if (!Number.isFinite(n)) return "Unknown";
  return GBO_STATUS_LABEL[n] ?? `Status ${n}`;
}

/**
 * Map GBO status → our order status.
 * Cancelled (3) stays on_hold so we never auto-cancel a paid BlossomPot order.
 */
export function mapGboStatusToOrderStatus(
  statusId: number | string | undefined | null
): OrderStatus | null {
  const n = Number(statusId);
  if (!Number.isFinite(n)) return null;
  if (RECEIVED.has(n)) return ORDER_STATUS.ACCEPTED;
  if (PROCESSING.has(n)) return ORDER_STATUS.PROCESSING;
  if (LOCAL_DELIVERY.has(n)) return ORDER_STATUS.OUT_FOR_DELIVERY;
  if (PAUSED.has(n)) return ORDER_STATUS.ON_HOLD;
  if (n === 3) return ORDER_STATUS.ON_HOLD;
  if (DELIVERED.has(n)) return ORDER_STATUS.DELIVERED;
  return null;
}

export function coerceGboNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function coerceGboString(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}
