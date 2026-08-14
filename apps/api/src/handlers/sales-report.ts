import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  ORDER_STATUS,
  orderKeys,
  type Order,
  type SalesBucket,
  type SalesOrderRow,
  type SalesPeriod,
  type SalesPeriodReport,
  type SalesReportResponse,
  getOrderPaidAt,
  isRevenueOrder,
  periodRange,
  salesDayBucket,
} from "@blossompot/shared";
import { docClient, ORDERS_TABLE } from "../lib/db";
import { ok, forbidden } from "../lib/response";
import { requireAdmin } from "../lib/auth";

type StoredOrder = Order & { GSI2PK?: string; GSI2SK?: string };

async function fetchOrdersSince(isoFrom: string): Promise<StoredOrder[]> {
  const items: StoredOrder[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk AND GSI2SK >= :from",
        ExpressionAttributeValues: {
          ":pk": orderKeys.gsi2pk(),
          ":from": isoFrom,
        },
        ExclusiveStartKey: lastKey,
        ScanIndexForward: false,
      })
    );
    items.push(...((res.Items ?? []) as StoredOrder[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

function toOrderRow(order: StoredOrder, paidAt: string): SalesOrderRow {
  return {
    orderId: order.orderId,
    paidAt,
    customerName: order.shippingAddress?.name ?? "—",
    email: order.shippingAddress?.email ?? "—",
    total: order.total,
    currency: order.currency,
    status: order.status,
    paymentProvider: order.paymentProvider,
    itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
  };
}

function buildPeriodReport(period: SalesPeriod, orders: StoredOrder[], now = new Date()): SalesPeriodReport {
  const { from, to, label } = periodRange(period, now);
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const excluded = { refunded: 0, cancelled: 0, pendingPayment: 0 };
  const revenueOrders: { order: StoredOrder; paidAt: string }[] = [];

  for (const order of orders) {
    // Revenue is attributed by payment time (IST day). Excluded statuses use createdAt.
    if (order.status === ORDER_STATUS.REFUNDED) {
      const ms = new Date(order.createdAt).getTime();
      if (ms >= fromMs && ms <= toMs) excluded.refunded += 1;
      continue;
    }
    if (order.status === ORDER_STATUS.CANCELLED) {
      const ms = new Date(order.createdAt).getTime();
      if (ms >= fromMs && ms <= toMs) excluded.cancelled += 1;
      continue;
    }
    if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
      const ms = new Date(order.createdAt).getTime();
      if (ms >= fromMs && ms <= toMs) excluded.pendingPayment += 1;
      continue;
    }

    if (!isRevenueOrder(order.status)) continue;

    const paidAt = getOrderPaidAt(order);
    if (!paidAt) continue;

    const paidMs = new Date(paidAt).getTime();
    if (paidMs < fromMs || paidMs > toMs) continue;

    revenueOrders.push({ order, paidAt });
  }

  revenueOrders.sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  let revenueUSD = 0;
  let revenueINR = 0;
  const bucketMap = new Map<string, SalesBucket>();

  for (const { order, paidAt } of revenueOrders) {
    if (order.currency === "USD") revenueUSD += order.total;
    else revenueINR += order.total;

    const date = salesDayBucket(paidAt);
    const bucket = bucketMap.get(date) ?? {
      label: date,
      date,
      orderCount: 0,
      revenueUSD: 0,
      revenueINR: 0,
    };
    bucket.orderCount += 1;
    if (order.currency === "USD") bucket.revenueUSD += order.total;
    else bucket.revenueINR += order.total;
    bucketMap.set(date, bucket);
  }

  const breakdown = [...bucketMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return {
    period,
    label,
    from: from.toISOString(),
    to: to.toISOString(),
    orderCount: revenueOrders.length,
    revenueUSD,
    revenueINR,
    excluded,
    breakdown,
    orders: revenueOrders.map(({ order, paidAt }) => toOrderRow(order, paidAt)),
  };
}

export async function getSalesReport(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();

  const now = new Date();
  const monthRange = periodRange("month", now);
  // Pull a little earlier so orders created before the IST window but paid inside it are included.
  const fetchFrom = new Date(monthRange.from.getTime() - 86_400_000).toISOString();
  const orders = await fetchOrdersSince(fetchFrom);

  const response: SalesReportResponse = {
    generatedAt: now.toISOString(),
    day: buildPeriodReport("day", orders, now),
    week: buildPeriodReport("week", orders, now),
    month: buildPeriodReport("month", orders, now),
  };

  return ok(response);
}
