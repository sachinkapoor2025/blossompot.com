import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  TRACKING_LOCKED_STATUSES,
  VENDOR_GBO,
  clipGboGiftCardText,
  coerceGboNumber,
  coerceGboString,
  gboPartnerOrderId,
  gboStatusLabel,
  isGboVendor,
  mapGboStatusToOrderStatus,
  orderHasGbo,
  orderKeys,
  parseGboLineRef,
  upsertVendorFulfillment,
  type CartItem,
  type Order,
  type OrderGboFulfillment,
} from "@blossompot/shared";
import { docClient, ORDERS_TABLE, now } from "./db";
import { GboClientError, gboCreateOrder, gboGetOrder, gboTokenConfigured } from "./gbo-client";
import { applyDeliveryReviewSchedule } from "../handlers/review-emails";
import { notifyCustomerOrderStatusChange } from "./email";

type StoredOrder = Order & { PK: string; SK: string; GSI3PK?: string; GSI3SK?: string };

const GBO_POLL_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ON_HOLD,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERY_EXCEPTION,
] as const;

const BATCH_LIMIT = 30;
const PER_ORDER_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function paymentType(): "monthlyBilling" | "balance" {
  const v = (process.env.GBO_PAYMENT_TYPE ?? "monthlyBilling").trim();
  return v === "balance" ? "balance" : "monthlyBilling";
}

function gboLines(order: Order): Array<CartItem & { country: string; productId: number; unitCost: number }> {
  const dest = order.shippingAddress?.country?.trim().toUpperCase() || "US";
  const rows: Array<CartItem & { country: string; productId: number; unitCost: number }> = [];
  for (const item of order.items ?? []) {
    if (!isGboVendor(item.vendorSlug) && !parseGboLineRef(item)) continue;
    const ref = parseGboLineRef(item);
    if (!ref) continue;
    const unitCost =
      typeof item.vendorCost === "number" && item.vendorCost > 0 ? item.vendorCost : item.price;
    rows.push({
      ...item,
      country: ref.country || dest,
      productId: ref.productId,
      unitCost,
    });
  }
  return rows;
}

export function orderNeedsGboPlacement(order: Order): boolean {
  if (!orderHasGbo(order) && !gboLines(order).length) return false;
  if (order.gbo?.invoice) return false;
  return gboLines(order).length > 0;
}

function street(order: Order): string {
  const a = order.shippingAddress;
  return [a?.line1, a?.line2].filter(Boolean).join(", ");
}

function deliveryDateYmd(order: Order): string | undefined {
  const iso = order.estimatedDeliveryAt?.trim();
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  return undefined;
}

export async function placeGboOrderForPaidOrder(
  order: StoredOrder,
  opts?: { force?: boolean }
): Promise<{ placed: boolean; skipped?: string; invoice?: string; error?: string }> {
  if (!gboTokenConfigured()) {
    return { placed: false, skipped: "GBO_API_TOKEN is not configured" };
  }
  const lines = gboLines(order);
  if (!lines.length) return { placed: false, skipped: "No GBO gift lines" };
  if (order.gbo?.invoice && !opts?.force) {
    return { placed: false, skipped: "Already placed", invoice: order.gbo.invoice };
  }

  const country = (order.shippingAddress?.country || lines[0]!.country || "US").toUpperCase();
  const partnerOrderId = order.gbo?.partnerOrderId ?? gboPartnerOrderId(order);
  const amount = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);
  const gifts = lines.flatMap((l) =>
    Array.from({ length: l.quantity }, () => ({ id: l.productId, price: l.unitCost }))
  );

  const senderName =
    order.shippingAddress?.senderName?.trim() || order.shippingAddress?.name || "BlossomPot";
  const buyerPhone = order.shippingAddress?.phone || "";
  const buyerEmail = order.shippingAddress?.email;

  try {
    const created = await gboCreateOrder({
      country_iso_alpha2: country,
      order_id: partnerOrderId,
      payment: { type: paymentType(), amount: Math.round(amount * 100) / 100 },
      gifts,
      buyer: {
        name: senderName,
        phone: buyerPhone,
        ...(buyerEmail ? { email: buyerEmail } : {}),
      },
      recipient: {
        name: order.shippingAddress?.name || senderName,
        street: street(order) || "Address",
        city: order.shippingAddress?.city || "",
        zip: order.shippingAddress?.postalCode || "",
        phone: buyerPhone,
        state: order.shippingAddress?.state || "N/A",
      },
      gift_card_text: clipGboGiftCardText(order.shippingAddress?.senderMessage),
      delivery_date: deliveryDateYmd(order),
    });

    const ts = now();
    const gbo: OrderGboFulfillment = {
      partnerOrderId,
      invoice: created.invoice,
      placedAt: ts,
      lastSyncAt: ts,
    };
    const updated: StoredOrder = {
      ...order,
      gbo,
      vendorFulfillments: upsertVendorFulfillment(order.vendorFulfillments ?? [], {
        vendorSlug: VENDOR_GBO,
        status: "processing",
        updatedAt: ts,
      }),
      updatedAt: ts,
    };
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: updated }));
    return { placed: true, invoice: created.invoice };
  } catch (err) {
    const message = err instanceof GboClientError ? err.message : err instanceof Error ? err.message : "GBO place failed";
    const ts = now();
    const updated: StoredOrder = {
      ...order,
      gbo: {
        partnerOrderId,
        lastError: message.slice(0, 500),
        lastSyncAt: ts,
        invoice: order.gbo?.invoice,
        placedAt: order.gbo?.placedAt,
      },
      updatedAt: ts,
    };
    try {
      await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: updated }));
    } catch (putErr) {
      console.error("Failed to persist GBO place error", order.orderId, putErr);
    }
    console.error("GBO place order failed", order.orderId, message);
    return { placed: false, error: message };
  }
}

async function fetchOrder(orderId: string): Promise<StoredOrder | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { PK: orderKeys.pk(orderId), SK: orderKeys.sk() },
    })
  );
  return (res.Item as StoredOrder) ?? null;
}

export async function syncGboOrderFromVendor(
  order: StoredOrder
): Promise<{
  orderId: string;
  updated: boolean;
  previousStatus: string;
  nextStatus: string;
  emailed: boolean;
  error?: string;
}> {
  const previousStatus = order.status;
  const base = {
    orderId: order.orderId,
    updated: false,
    previousStatus,
    nextStatus: previousStatus,
    emailed: false,
  };
  if (TRACKING_LOCKED_STATUSES.has(order.status)) {
    return { ...base, error: `Status ${order.status} is locked` };
  }
  const partnerId = order.gbo?.partnerOrderId ?? gboPartnerOrderId(order);
  if (!order.gbo?.invoice && !order.gbo?.partnerOrderId) {
    return { ...base, error: "Order has not been placed with GBO yet" };
  }

  let details;
  try {
    details = await gboGetOrder(partnerId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "GBO get order failed";
    return { ...base, error: message };
  }

  const statusId = coerceGboNumber(details.status);
  const mapped = mapGboStatusToOrderStatus(statusId);
  const trackingNumber = details.tracking?.number?.trim();
  const trackingLink = details.tracking?.link?.trim();
  const ts = now();

  const gbo: OrderGboFulfillment = {
    partnerOrderId: partnerId,
    invoice: coerceGboString(details.invoice) ?? order.gbo?.invoice,
    statusId,
    statusLabel: gboStatusLabel(statusId),
    placedAt: order.gbo?.placedAt,
    lastSyncAt: ts,
    trackingNumber,
    trackingLink,
  };

  let nextStatus = order.status;
  if (mapped && mapped !== order.status && (ORDER_STATUS_TRANSITIONS[order.status] ?? []).includes(mapped)) {
    nextStatus = mapped;
  }

  const vendorFulfillments = upsertVendorFulfillment(order.vendorFulfillments ?? [], {
    vendorSlug: VENDOR_GBO,
    trackingNumber,
    carrier: trackingNumber ? "GBO" : undefined,
    status:
      nextStatus === ORDER_STATUS.DELIVERED || nextStatus === ORDER_STATUS.COMPLETE
        ? "delivered"
        : trackingNumber
          ? "shipped"
          : "processing",
    updatedAt: ts,
  });

  const statusChanged = nextStatus !== order.status;
  const reviewPatch = statusChanged ? applyDeliveryReviewSchedule(order, nextStatus, ts) : {};
  const updated: StoredOrder = {
    ...order,
    ...reviewPatch,
    gbo,
    vendorFulfillments,
    ...(trackingNumber ? { trackingNumber, carrier: order.carrier || "GBO" } : {}),
    ...(statusChanged
      ? {
          status: nextStatus,
          statusHistory: [...(order.statusHistory ?? []), { status: nextStatus, at: ts }],
          GSI3PK: orderKeys.gsi3pk(nextStatus),
          GSI3SK: orderKeys.gsi3sk(order.createdAt),
        }
      : {}),
    updatedAt: ts,
  };
  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: updated }));

  let emailed = false;
  if (statusChanged) {
    const mail = await notifyCustomerOrderStatusChange(updated);
    emailed = Boolean(mail.ok && !mail.skipped);
  }

  return {
    orderId: order.orderId,
    updated: statusChanged || Boolean(trackingNumber && trackingNumber !== order.gbo?.trackingNumber),
    previousStatus,
    nextStatus,
    emailed,
  };
}

async function queryOrdersByStatus(status: string): Promise<StoredOrder[]> {
  const items: StoredOrder[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :pk",
        ExpressionAttributeValues: { ":pk": orderKeys.gsi3pk(status) },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...((res.Items ?? []) as StoredOrder[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

export async function processGboTrackingSync(): Promise<{
  scanned: number;
  synced: number;
  updated: number;
  errors: number;
}> {
  if (!gboTokenConfigured()) {
    return { scanned: 0, synced: 0, updated: 0, errors: 0 };
  }

  const candidates: StoredOrder[] = [];
  for (const status of GBO_POLL_STATUSES) {
    const rows = await queryOrdersByStatus(status);
    for (const order of rows) {
      if (orderNeedsGboPlacement(order) || order.gbo?.invoice || order.gbo?.partnerOrderId) {
        candidates.push(order);
      }
    }
  }

  const unique = new Map<string, StoredOrder>();
  for (const o of candidates) unique.set(o.orderId, o);
  const list = [...unique.values()].slice(0, BATCH_LIMIT);

  let synced = 0;
  let updated = 0;
  let errors = 0;
  for (const order of list) {
    if (orderNeedsGboPlacement(order)) {
      const placed = await placeGboOrderForPaidOrder(order);
      synced += 1;
      if (placed.error) errors += 1;
      if (placed.placed) updated += 1;
      await sleep(PER_ORDER_DELAY_MS);
      continue;
    }
    const result = await syncGboOrderFromVendor(order);
    synced += 1;
    if (result.error) errors += 1;
    if (result.updated) updated += 1;
    await sleep(PER_ORDER_DELAY_MS);
  }

  return { scanned: unique.size, synced, updated, errors };
}

export async function placeOrSyncGboByOrderId(
  orderId: string,
  action: "place" | "sync",
  force = false
) {
  const order = await fetchOrder(orderId);
  if (!order) return { error: "Order not found" as const };
  if (action === "place") return placeGboOrderForPaidOrder(order, { force });
  return syncGboOrderFromVendor(order);
}
