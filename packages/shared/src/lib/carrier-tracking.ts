/**
 * Carrier tracking → internal order status mapping (USPS primary).
 * Keep mapping centralized — do not scatter USPS string checks in handlers/UI.
 */

import { ORDER_STATUS } from "../constants";

export const CARRIER_TRACKING_PHASE = {
  LABEL_CREATED: "label_created",
  SHIPPED: "shipped",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  DELIVERY_EXCEPTION: "delivery_exception",
  RETURNED: "returned",
  UNKNOWN: "unknown",
} as const;

export type CarrierTrackingPhase =
  (typeof CARRIER_TRACKING_PHASE)[keyof typeof CARRIER_TRACKING_PHASE];

export type TrackingEventInput = {
  date: string;
  description: string;
  location?: string;
  code?: string;
};

/** Progression rank — only advance (or exception), never silently go backwards from delivered. */
export const CARRIER_PHASE_RANK: Record<CarrierTrackingPhase, number> = {
  [CARRIER_TRACKING_PHASE.UNKNOWN]: 0,
  [CARRIER_TRACKING_PHASE.LABEL_CREATED]: 1,
  [CARRIER_TRACKING_PHASE.SHIPPED]: 2,
  [CARRIER_TRACKING_PHASE.IN_TRANSIT]: 3,
  [CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY]: 4,
  [CARRIER_TRACKING_PHASE.DELIVERY_EXCEPTION]: 3,
  [CARRIER_TRACKING_PHASE.RETURNED]: 5,
  [CARRIER_TRACKING_PHASE.DELIVERED]: 6,
};

export const ORDER_STATUS_RANK: Record<string, number> = {
  [ORDER_STATUS.PROCESSING]: 1,
  [ORDER_STATUS.SHIPPED]: 2,
  [ORDER_STATUS.IN_TRANSIT]: 3,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 4,
  [ORDER_STATUS.DELIVERY_EXCEPTION]: 3,
  [ORDER_STATUS.DELIVERED]: 6,
  [ORDER_STATUS.COMPLETE]: 7,
};

/** Statuses that are still actively polled for carrier updates. */
export const TRACKING_POLL_STATUSES = [
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERY_EXCEPTION,
] as const;

/** Terminal / non-poll statuses — never overwrite with carrier sync. */
export const TRACKING_LOCKED_STATUSES = new Set<string>([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.COMPLETE,
]);

export function normalizeCarrierText(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Map USPS (or generic carrier) status + detail + event text → phase.
 */
export function mapCarrierTrackingPhase(input: {
  status?: string;
  statusDetail?: string;
  events?: TrackingEventInput[];
}): CarrierTrackingPhase {
  const blob = [
    input.status,
    input.statusDetail,
    ...(input.events ?? []).slice(0, 5).map((e) => e.description),
  ]
    .map(normalizeCarrierText)
    .filter(Boolean)
    .join(" | ");

  if (!blob) return CARRIER_TRACKING_PHASE.UNKNOWN;

  if (
    /\bdelivered\b/.test(blob) ||
    /\bin\/?at mailbox\b/.test(blob) ||
    /\bleft with individual\b/.test(blob)
  ) {
    return CARRIER_TRACKING_PHASE.DELIVERED;
  }

  if (/\breturn(?:ed|ing)? to sender\b/.test(blob) || /\breturned\b/.test(blob)) {
    return CARRIER_TRACKING_PHASE.RETURNED;
  }

  if (
    /\bexception\b/.test(blob) ||
    /\bundeliverable\b/.test(blob) ||
    /\bdelivery attempt\b/.test(blob) ||
    /\bnotice left\b/.test(blob) ||
    /\baction needed\b/.test(blob)
  ) {
    return CARRIER_TRACKING_PHASE.DELIVERY_EXCEPTION;
  }

  if (
    /\bout for delivery\b/.test(blob) ||
    /\barriving today\b/.test(blob) ||
    /\bout_for_delivery\b/.test(normalizeCarrierText(input.status))
  ) {
    return CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY;
  }

  if (
    /\bin transit\b/.test(blob) ||
    /\bmoving through\b/.test(blob) ||
    /\bin_transit\b/.test(normalizeCarrierText(input.status)) ||
    /\bdeparted\b/.test(blob) ||
    /\barrived at\b/.test(blob) ||
    /\benroute\b/.test(blob) ||
    /\ben route\b/.test(blob)
  ) {
    return CARRIER_TRACKING_PHASE.IN_TRANSIT;
  }

  if (
    /\baccepted\b/.test(blob) ||
    /\borigin acceptance\b/.test(blob) ||
    /\bpicked up\b/.test(blob) ||
    /\bshipment received\b/.test(blob)
  ) {
    return CARRIER_TRACKING_PHASE.SHIPPED;
  }

  if (
    /\bpre.?shipment\b/.test(blob) ||
    /\blabel created\b/.test(blob) ||
    /\belectronic shipping info\b/.test(blob) ||
    /\bshipping label\b/.test(blob)
  ) {
    return CARRIER_TRACKING_PHASE.LABEL_CREATED;
  }

  // USPS often returns status enum-like strings
  const statusOnly = normalizeCarrierText(input.status);
  if (statusOnly === "delivered") return CARRIER_TRACKING_PHASE.DELIVERED;
  if (statusOnly === "out for delivery" || statusOnly === "out_for_delivery") {
    return CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY;
  }
  if (statusOnly === "in transit" || statusOnly === "in_transit") {
    return CARRIER_TRACKING_PHASE.IN_TRANSIT;
  }
  if (statusOnly === "accepted" || statusOnly === "shipped") {
    return CARRIER_TRACKING_PHASE.SHIPPED;
  }

  return CARRIER_TRACKING_PHASE.UNKNOWN;
}

/** Map carrier phase → internal order.status (null = do not change business status). */
export function orderStatusForCarrierPhase(
  phase: CarrierTrackingPhase
): string | null {
  switch (phase) {
    case CARRIER_TRACKING_PHASE.LABEL_CREATED:
      return null; // keep processing/shipped as-is
    case CARRIER_TRACKING_PHASE.SHIPPED:
      return ORDER_STATUS.SHIPPED;
    case CARRIER_TRACKING_PHASE.IN_TRANSIT:
      return ORDER_STATUS.IN_TRANSIT;
    case CARRIER_TRACKING_PHASE.OUT_FOR_DELIVERY:
      return ORDER_STATUS.OUT_FOR_DELIVERY;
    case CARRIER_TRACKING_PHASE.DELIVERED:
      return ORDER_STATUS.DELIVERED;
    case CARRIER_TRACKING_PHASE.DELIVERY_EXCEPTION:
      return ORDER_STATUS.DELIVERY_EXCEPTION;
    case CARRIER_TRACKING_PHASE.RETURNED:
      return null; // do not auto-set returned as order status (business review)
    default:
      return null;
  }
}

export function shouldAdvanceOrderStatus(
  currentStatus: string,
  nextStatus: string
): boolean {
  if (TRACKING_LOCKED_STATUSES.has(currentStatus)) return false;
  if (currentStatus === nextStatus) return false;
  const cur = ORDER_STATUS_RANK[currentStatus] ?? 0;
  const next = ORDER_STATUS_RANK[nextStatus] ?? 0;
  // Allow exception from active shipment ranks; allow recovery from exception to higher ranks
  if (nextStatus === ORDER_STATUS.DELIVERY_EXCEPTION) {
    return cur < ORDER_STATUS_RANK[ORDER_STATUS.DELIVERED]!;
  }
  if (currentStatus === ORDER_STATUS.DELIVERY_EXCEPTION) {
    return next >= ORDER_STATUS_RANK[ORDER_STATUS.IN_TRANSIT]!;
  }
  return next > cur;
}

export function isActivelyTrackedStatus(status: string): boolean {
  return (TRACKING_POLL_STATUSES as readonly string[]).includes(status);
}

/** Deduplicate and merge tracking events (newest last). */
export function mergeTrackingEvents(
  existing: TrackingEventInput[] | undefined,
  incoming: TrackingEventInput[] | undefined,
  max = 40
): TrackingEventInput[] {
  const key = (e: TrackingEventInput) =>
    `${e.date}|${e.description}|${e.location ?? ""}`.toLowerCase();
  const map = new Map<string, TrackingEventInput>();
  for (const e of existing ?? []) {
    if (e.date || e.description) map.set(key(e), e);
  }
  for (const e of incoming ?? []) {
    if (e.date || e.description) map.set(key(e), e);
  }
  return [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-max);
}

/** Customer-facing fulfillment timeline steps. */
export const CUSTOMER_FULFILLMENT_TIMELINE = [
  { key: "placed", label: "Order Placed", statuses: [ORDER_STATUS.PENDING_PAYMENT] },
  {
    key: "paid",
    label: "Payment Confirmed",
    statuses: [ORDER_STATUS.PAID, ORDER_STATUS.ACCEPTED, ORDER_STATUS.ON_HOLD],
  },
  { key: "processing", label: "Processing", statuses: [ORDER_STATUS.PROCESSING] },
  { key: "shipped", label: "Shipped", statuses: [ORDER_STATUS.SHIPPED] },
  { key: "in_transit", label: "In Transit", statuses: [ORDER_STATUS.IN_TRANSIT] },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    statuses: [ORDER_STATUS.OUT_FOR_DELIVERY],
  },
  {
    key: "delivered",
    label: "Delivered",
    statuses: [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETE],
  },
] as const;

export function customerTimelineStepIndex(status: string): number {
  if (status === ORDER_STATUS.DELIVERY_EXCEPTION) {
    return CUSTOMER_FULFILLMENT_TIMELINE.findIndex((s) => s.key === "in_transit");
  }
  for (let i = CUSTOMER_FULFILLMENT_TIMELINE.length - 1; i >= 0; i--) {
    if ((CUSTOMER_FULFILLMENT_TIMELINE[i]!.statuses as readonly string[]).includes(status)) {
      return i;
    }
  }
  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REFUNDED) return -1;
  // paid-ish default
  if (
    [
      ORDER_STATUS.PAID,
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.ON_HOLD,
      ORDER_STATUS.PROCESSING,
    ].includes(status as never)
  ) {
    return CUSTOMER_FULFILLMENT_TIMELINE.findIndex((s) =>
      (s.statuses as readonly string[]).includes(status)
    );
  }
  return 0;
}
