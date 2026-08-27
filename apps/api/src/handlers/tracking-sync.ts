/**
 * Carrier tracking synchronization (USPS primary).
 * Cron: processUspsTrackingSync — poll active shipments and advance order.status.
 * Manual: POST /admin/orders/{orderId}/tracking/sync
 */
import { QueryCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  TRACKING_POLL_STATUSES,
  TRACKING_LOCKED_STATUSES,
  mapCarrierTrackingPhase,
  orderStatusForCarrierPhase,
  shouldAdvanceOrderStatus,
  mergeTrackingEvents,
  isActivelyTrackedStatus,
  orderKeys,
  ensureVendorFulfillments,
  upsertVendorFulfillment,
  VENDOR_BLOSSOMPOT,
  type Order,
  type TrackingEventInput,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { docClient, ORDERS_TABLE, now } from "../lib/db";
import { ok, badRequest, forbidden, notFound } from "../lib/response";
import { createUSPSProvider } from "../lib/shipping/usps";
import { loadShippingSettings } from "../lib/shipping/settings";
import { applyDeliveryReviewSchedule } from "./review-emails";
import { notifyCustomerOrderStatusChange } from "../lib/email";

type StoredOrder = Order & { PK: string; SK: string; GSI3PK?: string; GSI3SK?: string };

const BATCH_LIMIT = 40;
const PER_ORDER_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isUspsCarrier(carrier?: string | null): boolean {
  if (!carrier) return true; // default domestic carrier
  const c = carrier.toLowerCase();
  return c.includes("usps") || c.includes("postal") || c === "us";
}

function primaryTracking(order: Order): { trackingNumber: string; carrier: string } | null {
  const top = order.trackingNumber?.trim();
  if (top) {
    return { trackingNumber: top, carrier: order.carrier?.trim() || "USPS" };
  }
  for (const f of order.vendorFulfillments ?? []) {
    const tn = f.trackingNumber?.trim();
    if (tn) return { trackingNumber: tn, carrier: f.carrier?.trim() || "USPS" };
  }
  for (const s of order.shipments ?? []) {
    const tn = s.trackingNumber?.trim();
    if (tn) return { trackingNumber: tn, carrier: s.carrier?.trim() || "USPS" };
  }
  return null;
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

async function fetchOrder(orderId: string): Promise<StoredOrder | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { PK: orderKeys.pk(orderId), SK: orderKeys.sk() },
    })
  );
  return (res.Item as StoredOrder) ?? null;
}

export type SyncOrderResult = {
  orderId: string;
  trackingNumber?: string;
  phase?: string;
  previousStatus: string;
  nextStatus: string;
  updated: boolean;
  emailed: boolean;
  error?: string;
};

export async function syncOrderTracking(
  order: StoredOrder,
  opts?: { forceEmail?: boolean }
): Promise<SyncOrderResult> {
  const previousStatus = order.status;
  const base: SyncOrderResult = {
    orderId: order.orderId,
    previousStatus,
    nextStatus: previousStatus,
    updated: false,
    emailed: false,
  };

  if (TRACKING_LOCKED_STATUSES.has(order.status)) {
    return { ...base, error: `Status ${order.status} is locked from tracking sync` };
  }

  const track = primaryTracking(order);
  if (!track) {
    return { ...base, error: "No tracking number on order" };
  }
  base.trackingNumber = track.trackingNumber;

  if (!isUspsCarrier(track.carrier)) {
    return {
      ...base,
      error: `Carrier ${track.carrier} auto-sync not supported yet (USPS only)`,
    };
  }

  const settings = await loadShippingSettings();
  const provider = createUSPSProvider(settings);
  const tracking = await provider.trackShipment(track.trackingNumber);

  if (
    tracking.status === "unknown" &&
    /HTTP 401|unauthorized|invalid_client/i.test(tracking.statusDetail ?? "")
  ) {
    const timestamp = now();
    const failed: StoredOrder = {
      ...order,
      lastTrackingSyncAt: timestamp,
      lastTrackingSyncError: tracking.statusDetail ?? "USPS tracking unauthorized",
      updatedAt: timestamp,
    };
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: failed }));
    return {
      ...base,
      error: failed.lastTrackingSyncError,
    };
  }

  const phase = mapCarrierTrackingPhase({
    status: tracking.status,
    statusDetail: tracking.statusDetail,
    events: tracking.events,
  });
  base.phase = phase;

  const mappedStatus = orderStatusForCarrierPhase(phase);
  const timestamp = now();
  const events = mergeTrackingEvents(
    order.trackingEvents as TrackingEventInput[] | undefined,
    tracking.events
  );

  let nextStatus: Order["status"] = previousStatus as Order["status"];
  if (mappedStatus && shouldAdvanceOrderStatus(previousStatus, mappedStatus)) {
    const allowed = ORDER_STATUS_TRANSITIONS[previousStatus] ?? [];
    if (allowed.includes(mappedStatus) || previousStatus === mappedStatus) {
      nextStatus = mappedStatus as Order["status"];
    }
  }

  const statusChanged = nextStatus !== previousStatus;
  const detailChanged =
    (tracking.statusDetail ?? "") !== (order.carrierStatusDetail ?? "") ||
    phase !== (order.carrierTrackingStatus ?? "") ||
    events.length !== (order.trackingEvents?.length ?? 0);

  if (!statusChanged && !detailChanged && tracking.status !== "unknown") {
    // Still bump sync timestamp so admins see last check
    const touched: StoredOrder = {
      ...order,
      lastTrackingSyncAt: timestamp,
      lastTrackingSyncError: undefined,
      carrierTrackingStatus: phase,
      carrierStatusDetail: tracking.statusDetail ?? order.carrierStatusDetail,
      trackingEvents: events,
      updatedAt: timestamp,
    };
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: touched }));
    return { ...base, nextStatus, updated: false };
  }

  if (tracking.status === "unknown" && !statusChanged) {
    const failed: StoredOrder = {
      ...order,
      lastTrackingSyncAt: timestamp,
      lastTrackingSyncError: tracking.statusDetail ?? "Tracking unavailable",
      updatedAt: timestamp,
    };
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: failed }));
    return { ...base, error: failed.lastTrackingSyncError };
  }

  let vendorFulfillments = ensureVendorFulfillments(order);
  if (statusChanged && nextStatus === ORDER_STATUS.DELIVERED) {
    const blossompot = vendorFulfillments.find(
      (f) => f.vendorSlug === VENDOR_BLOSSOMPOT || isUspsCarrier(f.carrier)
    );
    if (blossompot) {
      vendorFulfillments = upsertVendorFulfillment(vendorFulfillments, {
        vendorSlug: blossompot.vendorSlug,
        trackingNumber: blossompot.trackingNumber ?? track.trackingNumber,
        carrier: blossompot.carrier ?? track.carrier,
        status: "delivered",
        updatedAt: timestamp,
      });
    }
  }

  const historyEntry =
    statusChanged
      ? {
          status: nextStatus,
          at: timestamp,
          note: `USPS tracking sync: ${phase}${
            tracking.statusDetail ? ` — ${tracking.statusDetail}` : ""
          }`,
        }
      : null;

  const deliveryPatch = statusChanged
    ? applyDeliveryReviewSchedule(order, nextStatus, timestamp)
    : {};

  const estimated =
    tracking.estimatedDeliveryDate && !order.estimatedDeliveryAt
      ? `${tracking.estimatedDeliveryDate}T12:00:00.000Z`
      : undefined;

  const updated: StoredOrder = {
    ...order,
    status: nextStatus,
    statusHistory: historyEntry
      ? [...(order.statusHistory ?? []), historyEntry]
      : order.statusHistory,
    vendorFulfillments,
    carrierTrackingStatus: phase,
    carrierStatusDetail: tracking.statusDetail ?? order.carrierStatusDetail,
    lastTrackingSyncAt: timestamp,
    lastTrackingSyncError: undefined,
    trackingEvents: events,
    ...(estimated ? { estimatedDeliveryAt: estimated } : {}),
    ...deliveryPatch,
    updatedAt: timestamp,
    ...(statusChanged
      ? {
          GSI3PK: orderKeys.gsi3pk(nextStatus),
          GSI3SK: orderKeys.gsi3sk(order.createdAt),
        }
      : {}),
  };

  // Email only when meaningful status changes and we haven't notified for this status
  let emailed = false;
  if (
    statusChanged &&
    (opts?.forceEmail || order.lastTrackingNotificationStatus !== nextStatus)
  ) {
    updated.lastTrackingNotificationStatus = nextStatus;
    updated.lastCustomerStatusNotification = nextStatus;
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: updated }));
    try {
      const emailResult = await notifyCustomerOrderStatusChange(updated, {
        previousNotificationStatus: order.lastCustomerStatusNotification,
      });
      emailed = Boolean(emailResult.ok && !emailResult.skipped);
      if (!emailResult.ok && !emailResult.skipped) {
        console.error("Tracking sync email failed:", order.orderId, emailResult.error);
      }
    } catch (err) {
      console.error("Tracking sync email error:", order.orderId, err);
    }
  } else {
    await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: updated }));
  }

  console.log("Tracking sync", {
    orderId: order.orderId,
    trackingNumber: track.trackingNumber,
    phase,
    previousStatus,
    nextStatus,
    statusChanged,
    emailed,
  });

  return {
    ...base,
    nextStatus,
    updated: statusChanged || detailChanged,
    emailed,
  };
}

export async function processUspsTrackingSync(opts?: {
  maxOrders?: number;
}): Promise<{
  scanned: number;
  updated: number;
  emailed: number;
  errors: number;
  results: SyncOrderResult[];
}> {
  const maxOrders = opts?.maxOrders ?? BATCH_LIMIT;
  const candidates: StoredOrder[] = [];

  for (const status of TRACKING_POLL_STATUSES) {
    const rows = await queryOrdersByStatus(status);
    for (const row of rows) {
      if (primaryTracking(row)) candidates.push(row);
    }
  }

  // Prefer older syncs first
  candidates.sort((a, b) =>
    (a.lastTrackingSyncAt ?? a.updatedAt ?? "").localeCompare(
      b.lastTrackingSyncAt ?? b.updatedAt ?? ""
    )
  );

  const batch = candidates.slice(0, maxOrders);
  const results: SyncOrderResult[] = [];
  let updated = 0;
  let emailed = 0;
  let errors = 0;

  for (const order of batch) {
    try {
      const result = await syncOrderTracking(order);
      results.push(result);
      if (result.updated) updated += 1;
      if (result.emailed) emailed += 1;
      if (result.error) errors += 1;
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error("Tracking sync failed for order", order.orderId, message);
      results.push({
        orderId: order.orderId,
        previousStatus: order.status,
        nextStatus: order.status,
        updated: false,
        emailed: false,
        error: message,
      });
    }
    await sleep(PER_ORDER_DELAY_MS);
  }

  console.log("USPS tracking sync cron", {
    scanned: batch.length,
    pool: candidates.length,
    updated,
    emailed,
    errors,
  });

  return { scanned: batch.length, updated, emailed, errors, results };
}

export async function syncAdminOrderTracking(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const orderId = event.pathParameters?.orderId;
  if (!orderId) return badRequest("Order ID required");

  const order = await fetchOrder(orderId);
  if (!order) return notFound("Order not found");

  const result = await syncOrderTracking(order);
  const fresh = await fetchOrder(orderId);
  return ok({ result, order: fresh });
}

export async function getOrderTracking(event: APIGatewayProxyEventV2) {
  const { getAuth, getSessionId } = await import("../lib/auth");
  const orderId = event.pathParameters?.orderId;
  if (!orderId) return badRequest("Order ID required");

  const order = await fetchOrder(orderId);
  if (!order) return notFound("Order not found");

  const auth = getAuth(event);
  const sessionId = getSessionId(event);
  const isOwner =
    auth?.isAdmin ||
    (auth?.userId && order.userId === auth.userId) ||
    (sessionId && order.sessionId === sessionId);
  if (!isOwner) return forbidden();

  return ok({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    carrierTrackingStatus: order.carrierTrackingStatus,
    carrierStatusDetail: order.carrierStatusDetail,
    lastTrackingSyncAt: order.lastTrackingSyncAt,
    lastTrackingSyncError: order.lastTrackingSyncError,
    estimatedDeliveryAt: order.estimatedDeliveryAt,
    deliveredAt: order.deliveredAt,
    trackingEvents: order.trackingEvents ?? [],
  });
}

export { isActivelyTrackedStatus };
