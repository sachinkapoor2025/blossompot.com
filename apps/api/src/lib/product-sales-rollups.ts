/**
 * Product sales daily rollups on the events table.
 * PK: PRODUCT_SALES#yyyy-mm-dd  SK: META | PRODUCT#slug
 *
 * META.dirty=true forces rebuild from orders on next read.
 */
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  eventKeys,
  eachUtcDay,
  accumulateOrders,
  serializeAccumulatorForRollup,
  resolveProductSalesDateRange,
  orderKeys,
  type DateRange,
  type Order,
  type ProductSalesAccumulator,
} from "@blossompot/shared";
import { docClient, EVENTS_TABLE, ORDERS_TABLE, now, dayBucket } from "./db";

type DayMeta = {
  PK: string;
  SK: string;
  rebuiltAt?: string;
  dirty?: boolean;
  productCount?: number;
  orderCount?: number;
};

type StoredProductRollup = ReturnType<typeof serializeAccumulatorForRollup> & {
  PK: string;
  SK: string;
  day: string;
  byDay?: Record<
    string,
    {
      orderIds: string[];
      units: number;
      revenueUSD: number;
      revenueINR: number;
      profitUSD: number | null;
      costKnown: boolean;
    }
  >;
};

async function fetchOrdersSince(isoFrom: string): Promise<Order[]> {
  const items: Order[] = [];
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
        ScanIndexForward: true,
      })
    );
    items.push(...((res.Items ?? []) as Order[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function getDayMeta(day: string): Promise<DayMeta | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: EVENTS_TABLE,
      Key: {
        PK: eventKeys.productSalesDayPk(day),
        SK: eventKeys.productSalesMetaSk(),
      },
    })
  );
  return (res.Item as DayMeta) ?? null;
}

async function listDayProductRollups(day: string): Promise<StoredProductRollup[]> {
  const items: StoredProductRollup[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": eventKeys.productSalesDayPk(day),
          ":sk": "PRODUCT#",
        },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...((res.Items ?? []) as StoredProductRollup[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

function hydrateAccumulator(row: StoredProductRollup, day: string): ProductSalesAccumulator {
  const acc: ProductSalesAccumulator = {
    productSlug: row.productSlug,
    name: row.name,
    image: row.image,
    sku: row.sku,
    vendorSlug: row.vendorSlug,
    orderIds: new Set(row.orderIds ?? []),
    unitsSold: row.unitsSold ?? 0,
    grossUSD: row.grossUSD ?? 0,
    grossINR: row.grossINR ?? 0,
    discountUSD: row.discountUSD ?? 0,
    discountINR: row.discountINR ?? 0,
    refundGrossUSD: row.refundGrossUSD ?? 0,
    refundGrossINR: row.refundGrossINR ?? 0,
    refundUnits: row.refundUnits ?? 0,
    refundOrderIds: new Set(row.refundOrderIds ?? []),
    costUSD: row.costUSD ?? 0,
    costKnownUnits: row.costKnownUnits ?? 0,
    costUnknownUnits: row.costUnknownUnits ?? 0,
    lastOrderAt: row.lastOrderAt ?? null,
    byDay: new Map(),
    customerEmails: new Set(row.customerEmails ?? []),
    coPurchase: new Map(Object.entries(row.coPurchase ?? {})),
  };

  if (row.byDay) {
    for (const [d, b] of Object.entries(row.byDay)) {
      acc.byDay.set(d, {
        orders: new Set(b.orderIds ?? []),
        units: b.units,
        revenueUSD: b.revenueUSD,
        revenueINR: b.revenueINR,
        profitUSD: b.profitUSD,
        costKnown: b.costKnown,
      });
    }
  } else if (acc.orderIds.size > 0 || acc.unitsSold > 0 || acc.refundUnits > 0) {
    acc.byDay.set(day, {
      orders: new Set(acc.orderIds),
      units: acc.unitsSold,
      revenueUSD: acc.grossUSD - acc.discountUSD,
      revenueINR: acc.grossINR - acc.discountINR,
      profitUSD:
        acc.costUnknownUnits === 0 && acc.costKnownUnits > 0
          ? acc.grossUSD - acc.discountUSD - acc.costUSD
          : null,
      costKnown: acc.costUnknownUnits === 0 && acc.costKnownUnits > 0,
    });
  }

  return acc;
}

function mergeAccumulators(
  into: Map<string, ProductSalesAccumulator>,
  from: ProductSalesAccumulator
) {
  const existing = into.get(from.productSlug);
  if (!existing) {
    into.set(from.productSlug, from);
    return;
  }
  for (const id of from.orderIds) existing.orderIds.add(id);
  for (const id of from.refundOrderIds) existing.refundOrderIds.add(id);
  for (const e of from.customerEmails) existing.customerEmails.add(e);
  existing.unitsSold += from.unitsSold;
  existing.grossUSD += from.grossUSD;
  existing.grossINR += from.grossINR;
  existing.discountUSD += from.discountUSD;
  existing.discountINR += from.discountINR;
  existing.refundGrossUSD += from.refundGrossUSD;
  existing.refundGrossINR += from.refundGrossINR;
  existing.refundUnits += from.refundUnits;
  existing.costUSD += from.costUSD;
  existing.costKnownUnits += from.costKnownUnits;
  existing.costUnknownUnits += from.costUnknownUnits;
  if (from.name) existing.name = from.name;
  if (from.image && !existing.image) existing.image = from.image;
  if (from.sku && !existing.sku) existing.sku = from.sku;
  if (from.vendorSlug) existing.vendorSlug = from.vendorSlug;
  if (from.lastOrderAt && (!existing.lastOrderAt || from.lastOrderAt > existing.lastOrderAt)) {
    existing.lastOrderAt = from.lastOrderAt;
  }
  for (const [other, count] of from.coPurchase) {
    existing.coPurchase.set(other, (existing.coPurchase.get(other) ?? 0) + count);
  }
  for (const [day, bucket] of from.byDay) {
    const cur = existing.byDay.get(day);
    if (!cur) {
      existing.byDay.set(day, {
        orders: new Set(bucket.orders),
        units: bucket.units,
        revenueUSD: bucket.revenueUSD,
        revenueINR: bucket.revenueINR,
        profitUSD: bucket.profitUSD,
        costKnown: bucket.costKnown,
      });
    } else {
      for (const id of bucket.orders) cur.orders.add(id);
      cur.units += bucket.units;
      cur.revenueUSD += bucket.revenueUSD;
      cur.revenueINR += bucket.revenueINR;
      if (cur.costKnown && bucket.costKnown && cur.profitUSD != null && bucket.profitUSD != null) {
        cur.profitUSD += bucket.profitUSD;
      } else {
        cur.costKnown = false;
        cur.profitUSD = null;
      }
    }
  }
}

/** Rebuild one UTC day from orders and persist rollups. */
export async function rebuildProductSalesDay(day: string, orders?: Order[]): Promise<number> {
  const range: DateRange = {
    from: new Date(`${day}T00:00:00.000Z`),
    to: new Date(`${day}T23:59:59.999Z`),
    label: day,
    preset: "custom",
  };

  const source =
    orders ??
    (await fetchOrdersSince(
      // Look back a bit so late-paid orders created earlier still appear when paidAt is today
      new Date(new Date(`${day}T00:00:00.000Z`).getTime() - 14 * 86400000).toISOString()
    ));

  const map = accumulateOrders(source, range);
  const existing = await listDayProductRollups(day);
  const keep = new Set([...map.keys()]);
  const deletes = existing
    .filter((row) => !keep.has(row.productSlug))
    .map((row) =>
      docClient.send(
        new DeleteCommand({
          TableName: EVENTS_TABLE,
          Key: {
            PK: eventKeys.productSalesDayPk(day),
            SK: eventKeys.productSalesProductSk(row.productSlug),
          },
        })
      )
    );

  const writes: Promise<unknown>[] = [...deletes];

  for (const acc of map.values()) {
    const serialized = serializeAccumulatorForRollup(acc);
    const byDay: StoredProductRollup["byDay"] = {};
    for (const [d, b] of acc.byDay) {
      byDay[d] = {
        orderIds: [...b.orders],
        units: b.units,
        revenueUSD: b.revenueUSD,
        revenueINR: b.revenueINR,
        profitUSD: b.profitUSD,
        costKnown: b.costKnown,
      };
    }
    writes.push(
      docClient.send(
        new PutCommand({
          TableName: EVENTS_TABLE,
          Item: {
            PK: eventKeys.productSalesDayPk(day),
            SK: eventKeys.productSalesProductSk(acc.productSlug),
            day,
            ...serialized,
            byDay,
            updatedAt: now(),
          },
        })
      )
    );
  }

  // Unique order ids across products for meta
  const orderIds = new Set<string>();
  for (const acc of map.values()) {
    for (const id of acc.orderIds) orderIds.add(id);
  }

  await Promise.all(writes);
  await docClient.send(
    new PutCommand({
      TableName: EVENTS_TABLE,
      Item: {
        PK: eventKeys.productSalesDayPk(day),
        SK: eventKeys.productSalesMetaSk(),
        rebuiltAt: now(),
        dirty: false,
        productCount: map.size,
        orderCount: orderIds.size,
        updatedAt: now(),
      },
    })
  );

  return map.size;
}

/** Mark a day dirty so the next dashboard load rebuilds it. */
export async function markProductSalesDayDirty(day: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: {
          PK: eventKeys.productSalesDayPk(day),
          SK: eventKeys.productSalesMetaSk(),
        },
        UpdateExpression: "SET dirty = :t, updatedAt = :now",
        ExpressionAttributeValues: { ":t": true, ":now": now() },
      })
    );
  } catch {
    // META may not exist yet — create dirty marker
    await docClient.send(
      new PutCommand({
        TableName: EVENTS_TABLE,
        Item: {
          PK: eventKeys.productSalesDayPk(day),
          SK: eventKeys.productSalesMetaSk(),
          dirty: true,
          updatedAt: now(),
        },
      })
    );
  }
}

/** Invalidate rollups for an order's paid day (call on paid / refund). */
export async function invalidateProductSalesForOrder(order: {
  statusHistory?: { status: string; at: string }[];
  createdAt: string;
}): Promise<void> {
  const paid = order.statusHistory?.find((h) => h.status === "paid")?.at ?? order.createdAt;
  const day = dayBucket(new Date(paid));
  await markProductSalesDayDirty(day);
}

/**
 * Load product sales accumulators for a date range.
 * Rebuilds any missing/dirty days, then merges rollups.
 */
export async function loadProductSalesAccumulators(
  range: DateRange
): Promise<{ map: Map<string, ProductSalesAccumulator>; source: "orders" | "rollups" | "mixed" }> {
  const days = eachUtcDay(range.from, range.to);
  let rebuilt = 0;
  let fromCache = 0;

  // Prefetch a wide order window once if any day needs rebuild
  const metas = await Promise.all(days.map((d) => getDayMeta(d)));
  const needsRebuild = days.filter((d, i) => {
    const m = metas[i];
    return !m?.rebuiltAt || m.dirty === true;
  });

  let ordersCache: Order[] | undefined;
  if (needsRebuild.length > 0) {
    const earliest = new Date(range.from.getTime() - 14 * 86400000).toISOString();
    ordersCache = await fetchOrdersSince(earliest);
    await Promise.all(needsRebuild.map((d) => rebuildProductSalesDay(d, ordersCache)));
    rebuilt = needsRebuild.length;
  }
  fromCache = days.length - rebuilt;

  const merged = new Map<string, ProductSalesAccumulator>();
  for (const day of days) {
    const rows = await listDayProductRollups(day);
    for (const row of rows) {
      mergeAccumulators(merged, hydrateAccumulator(row, day));
    }
  }

  const source =
    rebuilt === 0 ? "rollups" : fromCache === 0 ? "orders" : "mixed";
  return { map: merged, source };
}

export async function rebuildProductSalesRange(range: DateRange): Promise<{ days: number }> {
  const days = eachUtcDay(range.from, range.to);
  const earliest = new Date(range.from.getTime() - 14 * 86400000).toISOString();
  const orders = await fetchOrdersSince(earliest);
  for (const day of days) {
    await rebuildProductSalesDay(day, orders);
  }
  return { days: days.length };
}

export { fetchOrdersSince, resolveProductSalesDateRange };
