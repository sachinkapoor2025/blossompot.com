/**
 * Product Sales Intelligence — pure calculation engine.
 *
 * Metrics use order-time line prices and vendorCost snapshots where present.
 * Refunds are full-order status flips (no partial refund amounts in the model).
 * Test/load-test orders are excluded when payment IDs match known patterns.
 *
 * Future hooks (page views, ads, ROAS) live on ProductSalesExternalSignals —
 * leave null until those integrations exist; do not invent values.
 */

import { ORDER_STATUS, VENDOR_BLOSSOMPOT } from "../constants";
import type { CartItem } from "../schemas/cart";
import type { Order } from "../schemas/order";
import type { Product } from "../schemas/product";
import { cartLineUnitTotal } from "./product-addons";
import { couponEligibleSubtotal } from "./flash-sale";
import { getOrderPaidAt, isRevenueOrder } from "./sales-report";

// ---------------------------------------------------------------------------
// Date presets
// ---------------------------------------------------------------------------

export const PRODUCT_SALES_DATE_PRESETS = [
  "today",
  "yesterday",
  "last_7",
  "last_30",
  "last_90",
  "this_month",
  "last_month",
  "this_year",
  "custom",
] as const;

export type ProductSalesDatePreset = (typeof PRODUCT_SALES_DATE_PRESETS)[number];

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
  preset: ProductSalesDatePreset;
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

/** Resolve a named preset or custom ISO range (UTC). */
export function resolveProductSalesDateRange(
  preset: ProductSalesDatePreset,
  now = new Date(),
  customFrom?: string,
  customTo?: string
): DateRange {
  const today = startOfUtcDay(now);

  if (preset === "custom" && customFrom && customTo) {
    const from = startOfUtcDay(new Date(customFrom));
    const to = endOfUtcDay(new Date(customTo));
    return { from, to, label: "Custom range", preset };
  }
  if (preset === "today") {
    return { from: today, to: endOfUtcDay(today), label: "Today", preset };
  }
  if (preset === "yesterday") {
    const y = addUtcDays(today, -1);
    return { from: y, to: endOfUtcDay(y), label: "Yesterday", preset };
  }
  if (preset === "last_7") {
    return {
      from: addUtcDays(today, -6),
      to: endOfUtcDay(today),
      label: "Last 7 days",
      preset,
    };
  }
  if (preset === "last_90") {
    return {
      from: addUtcDays(today, -89),
      to: endOfUtcDay(today),
      label: "Last 90 days",
      preset,
    };
  }
  if (preset === "this_month") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { from, to: endOfUtcDay(today), label: "This month", preset };
  }
  if (preset === "last_month") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const to = endOfUtcDay(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0))
    );
    return { from, to, label: "Last month", preset };
  }
  if (preset === "this_year") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    return { from, to: endOfUtcDay(today), label: "This year", preset };
  }
  // last_30 default
  return {
    from: addUtcDays(today, -29),
    to: endOfUtcDay(today),
    label: "Last 30 days",
    preset: "last_30",
  };
}

/** Previous period of equal length ending the day before `range.from`. */
export function previousEquivalentRange(range: DateRange): DateRange {
  const ms = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  const from = new Date(to.getTime() - ms);
  return {
    from: startOfUtcDay(from),
    to: endOfUtcDay(to),
    label: `Previous ${range.label}`,
    preset: "custom",
  };
}

export function eachUtcDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  let cur = startOfUtcDay(from);
  const end = startOfUtcDay(to);
  while (cur.getTime() <= end.getTime()) {
    days.push(cur.toISOString().slice(0, 10));
    cur = addUtcDays(cur, 1);
  }
  return days;
}

export function daysInRange(range: DateRange): number {
  return Math.max(1, eachUtcDay(range.from, range.to).length);
}

// ---------------------------------------------------------------------------
// Order eligibility
// ---------------------------------------------------------------------------

export function isTestOrLoadTestOrder(
  order: Pick<Order, "paymentIntentId" | "razorpayOrderId" | "razorpayPaymentId">
): boolean {
  const ids = [order.paymentIntentId, order.razorpayOrderId, order.razorpayPaymentId].filter(
    Boolean
  ) as string[];
  return ids.some((id) => /_loadtest_|_dev_/i.test(id));
}

export function orderInAnalyticsScope(order: Order): boolean {
  return !isTestOrLoadTestOrder(order);
}

/** Paid timestamp for revenue or later-refunded orders (statusHistory paid entry). */
export function getAnalyticsPaidAt(order: Order): string | null {
  if (isRevenueOrder(order.status)) return getOrderPaidAt(order);
  if (order.status === ORDER_STATUS.REFUNDED) {
    const paidEntry = order.statusHistory?.find((h) => h.status === ORDER_STATUS.PAID);
    return paidEntry?.at ?? order.createdAt;
  }
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineGrossNative(item: CartItem): number {
  return round2(cartLineUnitTotal(item) * item.quantity);
}

/** Allocate order-level discount across eligible merchandise lines by share. */
export function allocateLineDiscount(order: Order, item: CartItem): number {
  const discount = Number(order.discount) || 0;
  if (discount <= 0) return 0;
  if (item.couponExcluded) return 0;
  const eligible = couponEligibleSubtotal(order.items);
  if (eligible <= 0) return 0;
  const line = lineGrossNative(item);
  // couponEligibleSubtotal already excludes couponExcluded / flash combo
  const eligibleLine = couponEligibleSubtotal([item]);
  if (eligibleLine <= 0) return 0;
  return round2(discount * (eligibleLine / eligible));
}

export function resolveLineVendorCost(item: CartItem, fallbackCost?: number | null): number | null {
  if (typeof item.vendorCost === "number" && item.vendorCost >= 0) return item.vendorCost;
  if (typeof fallbackCost === "number" && fallbackCost >= 0) return fallbackCost;
  return null;
}

// ---------------------------------------------------------------------------
// Raw product accumulators (from orders)
// ---------------------------------------------------------------------------

export type ProductSalesAccumulator = {
  productSlug: string;
  name: string;
  image?: string;
  sku?: string;
  vendorSlug: string;
  /** Unique order ids containing this product (revenue orders). */
  orderIds: Set<string>;
  unitsSold: number;
  grossUSD: number;
  grossINR: number;
  discountUSD: number;
  discountINR: number;
  /** Merchandise from refunded orders (paid in range, status refunded). */
  refundGrossUSD: number;
  refundGrossINR: number;
  refundUnits: number;
  refundOrderIds: Set<string>;
  /** Cost in USD when every unit has known cost; else null flag via costKnown. */
  costUSD: number;
  costKnownUnits: number;
  costUnknownUnits: number;
  lastOrderAt: string | null;
  /** Per-day buckets for trend (UTC YYYY-MM-DD). */
  byDay: Map<
    string,
    {
      orders: Set<string>;
      units: number;
      revenueUSD: number;
      revenueINR: number;
      profitUSD: number | null;
      costKnown: boolean;
    }
  >;
  /** Customer emails for repeat analysis. */
  customerEmails: Set<string>;
  /** Pair co-purchase counts: otherSlug → order count. */
  coPurchase: Map<string, number>;
};

function emptyAcc(slug: string, seed?: Partial<ProductSalesAccumulator>): ProductSalesAccumulator {
  return {
    productSlug: slug,
    name: seed?.name ?? slug,
    image: seed?.image,
    sku: seed?.sku,
    vendorSlug: seed?.vendorSlug ?? VENDOR_BLOSSOMPOT,
    orderIds: new Set(),
    unitsSold: 0,
    grossUSD: 0,
    grossINR: 0,
    discountUSD: 0,
    discountINR: 0,
    refundGrossUSD: 0,
    refundGrossINR: 0,
    refundUnits: 0,
    refundOrderIds: new Set(),
    costUSD: 0,
    costKnownUnits: 0,
    costUnknownUnits: 0,
    lastOrderAt: null,
    byDay: new Map(),
    customerEmails: new Set(),
    coPurchase: new Map(),
  };
}

function ensureDay(
  acc: ProductSalesAccumulator,
  day: string
): NonNullable<ReturnType<ProductSalesAccumulator["byDay"]["get"]>> {
  let d = acc.byDay.get(day);
  if (!d) {
    d = {
      orders: new Set(),
      units: 0,
      revenueUSD: 0,
      revenueINR: 0,
      profitUSD: 0,
      costKnown: true,
    };
    acc.byDay.set(day, d);
  }
  return d;
}

export type CostLookup = (productSlug: string) => number | null | undefined;

/**
 * Fold one order into product accumulators.
 * Revenue orders add sales; refunded orders (with paidAt in range) add refund metrics only.
 */
export function accumulateOrder(
  map: Map<string, ProductSalesAccumulator>,
  order: Order,
  range: { fromMs: number; toMs: number },
  costLookup?: CostLookup
): void {
  if (!orderInAnalyticsScope(order)) return;

  const effectivePaidAt = getAnalyticsPaidAt(order);
  if (!effectivePaidAt) return;
  const paidMs = new Date(effectivePaidAt).getTime();
  if (paidMs < range.fromMs || paidMs > range.toMs) return;

  const day = effectivePaidAt.slice(0, 10);
  const currency = order.currency === "INR" ? "INR" : "USD";
  const isRefunded = order.status === ORDER_STATUS.REFUNDED;
  const isRevenue = isRevenueOrder(order.status);

  if (!isRevenue && !isRefunded) return;

  const distinctSlugs = [...new Set(order.items.map((i) => i.productSlug))];

  for (const item of order.items) {
    const slug = item.productSlug;
    let acc = map.get(slug);
    if (!acc) {
      acc = emptyAcc(slug, {
        name: item.name,
        image: item.image,
        sku: item.sku,
        vendorSlug: item.vendorSlug ?? VENDOR_BLOSSOMPOT,
      });
      map.set(slug, acc);
    } else {
      if (item.name) acc.name = item.name;
      if (item.image && !acc.image) acc.image = item.image;
      if (item.sku && !acc.sku) acc.sku = item.sku;
      if (item.vendorSlug) acc.vendorSlug = item.vendorSlug;
    }

    const gross = lineGrossNative(item);
    const discount = allocateLineDiscount(order, item);
    const unitCost = resolveLineVendorCost(item, costLookup?.(slug));
    const qty = item.quantity;

    if (isRefunded) {
      acc.refundOrderIds.add(order.orderId);
      acc.refundUnits += qty;
      if (currency === "USD") acc.refundGrossUSD += gross;
      else acc.refundGrossINR += gross;
      continue;
    }

    // Revenue path
    acc.orderIds.add(order.orderId);
    acc.unitsSold += qty;
    if (currency === "USD") {
      acc.grossUSD += gross;
      acc.discountUSD += discount;
    } else {
      acc.grossINR += gross;
      acc.discountINR += discount;
    }

    if (unitCost != null) {
      acc.costUSD += round2(unitCost * qty);
      acc.costKnownUnits += qty;
    } else {
      acc.costUnknownUnits += qty;
    }

    if (!acc.lastOrderAt || effectivePaidAt > acc.lastOrderAt) {
      acc.lastOrderAt = effectivePaidAt;
    }

    const email = order.shippingAddress?.email?.trim().toLowerCase();
    if (email) acc.customerEmails.add(email);

    const bucket = ensureDay(acc, day);
    bucket.orders.add(order.orderId);
    bucket.units += qty;
    if (currency === "USD") bucket.revenueUSD += round2(gross - discount);
    else bucket.revenueINR += round2(gross - discount);
    if (unitCost != null && bucket.costKnown) {
      const netUsdApprox = currency === "USD" ? round2(gross - discount) : null;
      if (netUsdApprox != null) {
        bucket.profitUSD = round2((bucket.profitUSD ?? 0) + netUsdApprox - unitCost * qty);
      }
    } else if (unitCost == null) {
      bucket.costKnown = false;
      bucket.profitUSD = null;
    }
  }

  // Co-purchase pairs (revenue orders only)
  if (isRevenue && distinctSlugs.length >= 2) {
    for (let i = 0; i < distinctSlugs.length; i++) {
      for (let j = i + 1; j < distinctSlugs.length; j++) {
        const a = distinctSlugs[i]!;
        const b = distinctSlugs[j]!;
        const accA = map.get(a);
        const accB = map.get(b);
        if (accA) accA.coPurchase.set(b, (accA.coPurchase.get(b) ?? 0) + 1);
        if (accB) accB.coPurchase.set(a, (accB.coPurchase.get(a) ?? 0) + 1);
      }
    }
  }
}

export function accumulateOrders(
  orders: Order[],
  range: DateRange,
  costLookup?: CostLookup
): Map<string, ProductSalesAccumulator> {
  const map = new Map<string, ProductSalesAccumulator>();
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  for (const order of orders) {
    accumulateOrder(map, order, { fromMs, toMs }, costLookup);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Derived product row
// ---------------------------------------------------------------------------

export type PeriodChange = {
  orders: number | null;
  unitsSold: number | null;
  revenueUSD: number | null;
  profitUSD: number | null;
};

export type ProductGrowthLabel =
  | "high_potential"
  | "star_product"
  | "growing"
  | "needs_improvement"
  | "low_performer"
  | "high_profit"
  | "trending"
  | "inventory_risk";

export const PRODUCT_GROWTH_LABEL_DISPLAY: Record<ProductGrowthLabel, string> = {
  high_potential: "High Potential",
  star_product: "Star Product",
  growing: "Growing",
  needs_improvement: "Needs Improvement",
  low_performer: "Low Performer",
  high_profit: "High Profit",
  trending: "Trending",
  inventory_risk: "Inventory Risk",
};

export type RecommendationCategory =
  | "increase_marketing"
  | "increase_inventory"
  | "improve_product_images"
  | "improve_product_title"
  | "improve_product_description"
  | "review_pricing"
  | "reduce_discount"
  | "increase_discount"
  | "create_bundle"
  | "create_product_combo"
  | "promote_as_bestseller"
  | "promote_as_seasonal"
  | "improve_seo"
  | "improve_reviews"
  | "investigate_refunds"
  | "investigate_low_conversion"
  | "consider_discontinuing"
  | "test_new_pricing"
  | "test_new_images"
  | "test_new_offers";

export type ProductRecommendation = {
  category: RecommendationCategory;
  severity: "info" | "warning" | "critical";
  title: string;
  problem: string;
  evidence: string;
  action: string;
  expectedOpportunity: string;
};

export type InventoryHealth = "critical" | "low" | "healthy" | "unknown";

export type ProductSalesRow = {
  productSlug: string;
  name: string;
  sku?: string;
  image?: string;
  categorySlug?: string;
  vendorSlug: string;
  sellingPrice?: number;
  costPrice: number | null;
  profitPerUnit: number | null;
  currency?: "USD" | "INR";
  /** Unique orders containing the product in period. */
  orders: number;
  unitsSold: number;
  grossSalesUSD: number;
  grossSalesINR: number;
  discountsUSD: number;
  discountsINR: number;
  refundsUSD: number;
  refundsINR: number;
  refundUnits: number;
  refundOrders: number;
  netSalesUSD: number;
  netSalesINR: number;
  estimatedProfitUSD: number | null;
  profitMarginPct: number | null;
  avgSellingPriceUSD: number | null;
  avgUnitsPerOrder: number | null;
  inventory: number | null;
  ratingValue: number | null;
  reviewCount: number | null;
  published: boolean | null;
  lastOrderAt: string | null;
  salesVelocity: number | null;
  daysOfInventoryRemaining: number | null;
  inventoryHealth: InventoryHealth;
  growthScore: number;
  labels: ProductGrowthLabel[];
  periodChange: PeriodChange;
  refundRatePct: number | null;
  customerCount: number;
  recommendations: ProductRecommendation[];
  /** Placeholder for future traffic/ads integrations. */
  external: {
    pageViews: number | null;
    addToCarts: number | null;
    conversionRate: number | null;
    adSpend: number | null;
    roas: number | null;
  };
};

export type GrowthScoreWeights = {
  orderVolume: number;
  salesGrowth: number;
  revenue: number;
  profit: number;
  margin: number;
  rating: number;
  inventory: number;
  refundRate: number;
  momentum: number;
};

export const DEFAULT_GROWTH_SCORE_WEIGHTS: GrowthScoreWeights = {
  orderVolume: 18,
  salesGrowth: 18,
  revenue: 14,
  profit: 14,
  margin: 10,
  rating: 8,
  inventory: 6,
  refundRate: 7,
  momentum: 5,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return round2(((current - previous) / previous) * 100);
}

function scoreComponent(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp((value / max) * 100, 0, 100);
}

export function computeGrowthScore(input: {
  orders: number;
  maxOrders: number;
  unitsGrowthPct: number | null;
  revenueUSD: number;
  maxRevenueUSD: number;
  profitUSD: number | null;
  maxProfitUSD: number;
  marginPct: number | null;
  ratingValue: number | null;
  inventoryHealth: InventoryHealth;
  refundRatePct: number | null;
  recentHalfOrders: number;
  earlierHalfOrders: number;
  weights?: GrowthScoreWeights;
}): number {
  const w = input.weights ?? DEFAULT_GROWTH_SCORE_WEIGHTS;
  const totalW =
    w.orderVolume +
    w.salesGrowth +
    w.revenue +
    w.profit +
    w.margin +
    w.rating +
    w.inventory +
    w.refundRate +
    w.momentum;

  const growthScore =
    input.unitsGrowthPct == null
      ? 40
      : clamp(50 + input.unitsGrowthPct / 2, 0, 100);

  const profitScore =
    input.profitUSD == null ? 40 : scoreComponent(Math.max(0, input.profitUSD), input.maxProfitUSD);

  const marginScore =
    input.marginPct == null ? 40 : clamp(input.marginPct * 2, 0, 100);

  const ratingScore =
    input.ratingValue == null ? 50 : clamp(((input.ratingValue - 1) / 4) * 100, 0, 100);

  const invScore =
    input.inventoryHealth === "healthy"
      ? 90
      : input.inventoryHealth === "low"
        ? 55
        : input.inventoryHealth === "critical"
          ? 20
          : 50;

  const refundScore =
    input.refundRatePct == null ? 70 : clamp(100 - input.refundRatePct * 5, 0, 100);

  const momentumBase =
    input.earlierHalfOrders === 0
      ? input.recentHalfOrders > 0
        ? 80
        : 40
      : clamp(
          50 + ((input.recentHalfOrders - input.earlierHalfOrders) / input.earlierHalfOrders) * 50,
          0,
          100
        );

  const weighted =
    (scoreComponent(input.orders, input.maxOrders) * w.orderVolume +
      growthScore * w.salesGrowth +
      scoreComponent(input.revenueUSD, input.maxRevenueUSD) * w.revenue +
      profitScore * w.profit +
      marginScore * w.margin +
      ratingScore * w.rating +
      invScore * w.inventory +
      refundScore * w.refundRate +
      momentumBase * w.momentum) /
    (totalW || 1);

  return Math.round(clamp(weighted, 0, 100));
}

export function deriveLabels(row: {
  growthScore: number;
  orders: number;
  periodChange: PeriodChange;
  estimatedProfitUSD: number | null;
  profitMarginPct: number | null;
  inventoryHealth: InventoryHealth;
  unitsSold: number;
}): ProductGrowthLabel[] {
  const labels: ProductGrowthLabel[] = [];
  const orderGrowth = row.periodChange.orders;

  if (row.inventoryHealth === "critical" || row.inventoryHealth === "low") {
    labels.push("inventory_risk");
  }
  if (row.growthScore >= 75 && row.orders >= 3) labels.push("star_product");
  if (orderGrowth != null && orderGrowth >= 40 && row.orders >= 2) labels.push("growing");
  if (orderGrowth != null && orderGrowth >= 80) labels.push("trending");
  if (
    row.estimatedProfitUSD != null &&
    row.estimatedProfitUSD > 0 &&
    (row.profitMarginPct ?? 0) >= 35
  ) {
    labels.push("high_profit");
  }
  if (row.growthScore >= 60 && row.orders < 5 && (orderGrowth == null || orderGrowth > 0)) {
    labels.push("high_potential");
  }
  if (row.growthScore < 40 || (orderGrowth != null && orderGrowth <= -30)) {
    labels.push("needs_improvement");
  }
  if (row.orders === 0 || (row.unitsSold === 0 && row.growthScore < 35)) {
    labels.push("low_performer");
  }

  // Deduplicate while preserving order
  return [...new Set(labels)];
}

export function inventoryHealthFrom(
  inventory: number | null,
  salesVelocity: number | null
): InventoryHealth {
  if (inventory == null) return "unknown";
  if (inventory <= 0) return "critical";
  if (salesVelocity != null && salesVelocity > 0) {
    const daysLeft = inventory / salesVelocity;
    if (daysLeft < 7) return "critical";
    if (daysLeft < 21) return "low";
    return "healthy";
  }
  if (inventory < 5) return "critical";
  if (inventory < 15) return "low";
  return "healthy";
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export function buildRecommendations(
  row: Pick<
    ProductSalesRow,
    | "name"
    | "orders"
    | "unitsSold"
    | "periodChange"
    | "grossSalesUSD"
    | "estimatedProfitUSD"
    | "profitMarginPct"
    | "refundRatePct"
    | "inventory"
    | "inventoryHealth"
    | "daysOfInventoryRemaining"
    | "ratingValue"
    | "reviewCount"
    | "discountsUSD"
    | "netSalesUSD"
    | "growthScore"
    | "labels"
  >,
  context: {
    storeAvgOrders: number;
    storeAvgMarginPct: number | null;
    storeAvgRefundRatePct: number | null;
    periodLabel: string;
  }
): ProductRecommendation[] {
  const recs: ProductRecommendation[] = [];
  const change = row.periodChange;

  if (row.orders === 0) {
    recs.push({
      category: "increase_marketing",
      severity: "warning",
      title: "No sales in selected period",
      problem: "This product received zero paid orders in the selected date range.",
      evidence: `0 orders and 0 units sold during ${context.periodLabel}.`,
      action:
        "Improve product images, title and description, then increase promotional visibility (homepage, email, ads).",
      expectedOpportunity:
        "Restoring even store-average demand would reopen a measurable sales channel for this SKU.",
    });
    if (row.inventory != null && row.inventory > 0) {
      recs.push({
        category: "consider_discontinuing",
        severity: "info",
        title: "Consider discontinuing or clearing stock",
        problem: "Inventory is tied up with no recent demand.",
        evidence: `${row.inventory} units on hand with no sales in ${context.periodLabel}.`,
        action:
          "Run a clearance discount test, bundle with a bestseller, or mark for discontinue after a final promo push.",
      expectedOpportunity: "Free inventory capital and reduce catalog noise for shoppers.",
      });
    }
  }

  if (change.orders != null && change.orders <= -30 && row.orders > 0) {
    recs.push({
      category: "improve_product_images",
      severity: "warning",
      title: "Sales declining vs previous period",
      problem: "Order volume dropped significantly versus the prior equivalent period.",
      evidence: `Only ${row.orders} orders in ${context.periodLabel}, down ${Math.abs(change.orders)}% from the previous period.`,
      action:
        "Refresh product images, title and description; review pricing and recent discount depth; restore promotional placement.",
      expectedOpportunity:
        "Recovering toward the prior period run-rate would restore lost order volume.",
    });
  }

  if (change.orders != null && change.orders >= 50 && row.orders >= 3) {
    recs.push({
      category: "increase_inventory",
      severity: "info",
      title: "Growing product — protect supply",
      problem: "Demand is accelerating; stockouts would leave revenue on the table.",
      evidence: `Orders increased ${change.orders}% vs the previous period (${row.orders} orders, ${row.unitsSold} units).`,
      action: "Increase inventory and expand marketing exposure (homepage feature, email, ads).",
      expectedOpportunity: "Sustaining growth avoids lost sales as momentum continues.",
    });
    recs.push({
      category: "promote_as_bestseller",
      severity: "info",
      title: "Promote as emerging bestseller",
      problem: "Strong recent growth is under-leveraged if the product is not featured.",
      evidence: `${row.orders} orders and $${row.grossSalesUSD.toFixed(0)} gross sales (USD) in ${context.periodLabel}.`,
      action: "Feature on homepage/category merchandising and include in marketing campaigns.",
      expectedOpportunity: "Featured placement typically amplifies already-growing SKUs.",
    });
  }

  if (
    row.grossSalesUSD >= 200 &&
    row.estimatedProfitUSD != null &&
    row.estimatedProfitUSD < row.grossSalesUSD * 0.15
  ) {
    recs.push({
      category: "review_pricing",
      severity: "critical",
      title: "High revenue, low estimated profit",
      problem: "Sales volume is healthy but contribution margin is thin.",
      evidence: `Generated $${row.grossSalesUSD.toFixed(0)} gross sales (USD) with only $${row.estimatedProfitUSD.toFixed(0)} estimated profit${
        row.profitMarginPct != null ? ` (${row.profitMarginPct}% margin)` : ""
      }.`,
      action: "Review selling price, discount depth and product cost; test a modest price increase or reduce discounts.",
      expectedOpportunity: "Improving margin on an already-selling SKU lifts profit without needing more traffic.",
    });
    if (row.discountsUSD > row.netSalesUSD * 0.1) {
      recs.push({
        category: "reduce_discount",
        severity: "warning",
        title: "Discounts eroding margin",
        problem: "Allocated discounts are large relative to net product sales.",
        evidence: `$${row.discountsUSD.toFixed(0)} discounts allocated vs $${row.netSalesUSD.toFixed(0)} net sales (USD).`,
        action: "Tighten coupon eligibility or exclude this SKU from deep discounts.",
        expectedOpportunity: "Same unit volume at lower discount improves contribution profit.",
      });
    }
  }

  if (
    row.refundRatePct != null &&
    row.refundRatePct >= 8 &&
    (context.storeAvgRefundRatePct == null ||
      row.refundRatePct > context.storeAvgRefundRatePct * 1.5)
  ) {
    recs.push({
      category: "investigate_refunds",
      severity: "critical",
      title: "Elevated refund rate",
      problem: "Customers are requesting refunds more often than the store baseline.",
      evidence: `Refund rate ${row.refundRatePct}% of units${
        context.storeAvgRefundRatePct != null
          ? ` (store average ~${context.storeAvgRefundRatePct}%)`
          : ""
      }.`,
      action:
        "Review product quality, images, description accuracy and shipping expectations; fix mismatches before scaling ads.",
      expectedOpportunity: "Lowering refunds protects revenue and reviews.",
    });
  }

  if (
    (row.inventoryHealth === "critical" || row.inventoryHealth === "low") &&
    row.unitsSold > 0
  ) {
    recs.push({
      category: "increase_inventory",
      severity: row.inventoryHealth === "critical" ? "critical" : "warning",
      title: "Low inventory with active demand",
      problem: "Sales velocity will stock out soon if not replenished.",
      evidence: `Inventory ${row.inventory ?? 0}; ~${
        row.daysOfInventoryRemaining != null
          ? `${Math.round(row.daysOfInventoryRemaining)} days remaining`
          : "limited cover"
      } at current velocity (${row.unitsSold} units in period).`,
      action: "Replenish stock immediately; pause aggressive ads only if stockout is imminent.",
      expectedOpportunity: "Avoid lost orders from an otherwise selling product.",
    });
  }

  if (
    row.orders > 0 &&
    context.storeAvgOrders > 0 &&
    row.orders < context.storeAvgOrders * 0.4
  ) {
    recs.push({
      category: "increase_discount",
      severity: "info",
      title: "Below-average order volume",
      problem: "This SKU under-indexes versus typical product demand.",
      evidence: `${row.orders} orders vs store product average ~${context.storeAvgOrders.toFixed(1)} in ${context.periodLabel}.`,
      action:
        "Test a limited offer, improve SEO title/description, and pair with a bestseller as a bundle.",
      expectedOpportunity: `Closing the gap toward average demand is an estimated ~${Math.max(
        0,
        Math.round(context.storeAvgOrders - row.orders)
      )} additional orders/period (estimate only).`,
    });
    recs.push({
      category: "create_bundle",
      severity: "info",
      title: "Bundle with a stronger seller",
      problem: "Standalone demand is soft; attachment to a hero SKU can lift units.",
      evidence: `Low solo order count (${row.orders}) relative to catalog average.`,
      action: "Create a combo / buy-together offer with a top seller in the same category.",
      expectedOpportunity: "Bundles convert browsers who would not buy this SKU alone.",
    });
  }

  if (row.ratingValue != null && row.ratingValue < 3.5 && (row.reviewCount ?? 0) > 0) {
    recs.push({
      category: "improve_reviews",
      severity: "warning",
      title: "Weak review rating",
      problem: "Low star rating can suppress conversion.",
      evidence: `Rating ${row.ratingValue.toFixed(1)} from ${row.reviewCount} review(s).`,
      action: "Address common review themes, update listing accuracy, and request reviews from recent happy buyers.",
      expectedOpportunity: "Higher ratings typically improve conversion on product pages.",
    });
  }

  if (row.labels.includes("star_product") || row.growthScore >= 80) {
    recs.push({
      category: "promote_as_bestseller",
      severity: "info",
      title: "Star product — scale what works",
      problem: "Under-investing in proven winners leaves easy growth on the table.",
      evidence: `Growth score ${row.growthScore}/100 with ${row.orders} orders and ${row.unitsSold} units sold.`,
      action: "Increase inventory buffer, feature as bestseller, and allocate more marketing budget.",
      expectedOpportunity: "Scaling winners usually yields higher ROAS than fixing weak SKUs first.",
    });
  }

  // Cap to keep UI actionable
  return recs.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Build rows from accumulators + catalog
// ---------------------------------------------------------------------------

export type CatalogProductLite = Pick<
  Product,
  | "slug"
  | "name"
  | "sku"
  | "images"
  | "categorySlug"
  | "vendorSlug"
  | "price"
  | "currency"
  | "vendorCost"
  | "inventory"
  | "published"
  | "ratingAggregate"
>;

export function buildProductSalesRow(
  acc: ProductSalesAccumulator | undefined,
  catalog: CatalogProductLite | undefined,
  prev: ProductSalesAccumulator | undefined,
  opts: {
    periodDays: number;
    maxOrders: number;
    maxRevenueUSD: number;
    maxProfitUSD: number;
    storeAvgOrders: number;
    storeAvgMarginPct: number | null;
    storeAvgRefundRatePct: number | null;
    periodLabel: string;
    weights?: GrowthScoreWeights;
    /** Half-split of period for momentum (order counts). */
    recentHalfOrders?: number;
    earlierHalfOrders?: number;
  }
): ProductSalesRow {
  const slug = acc?.productSlug ?? catalog?.slug ?? "";
  const orders = acc?.orderIds.size ?? 0;
  const unitsSold = acc?.unitsSold ?? 0;
  const grossUSD = round2(acc?.grossUSD ?? 0);
  const grossINR = round2(acc?.grossINR ?? 0);
  const discountsUSD = round2(acc?.discountUSD ?? 0);
  const discountsINR = round2(acc?.discountINR ?? 0);
  const refundsUSD = round2(acc?.refundGrossUSD ?? 0);
  const refundsINR = round2(acc?.refundGrossINR ?? 0);
  const refundUnits = acc?.refundUnits ?? 0;
  const refundOrders = acc?.refundOrderIds.size ?? 0;
  const netSalesUSD = round2(grossUSD - discountsUSD);
  const netSalesINR = round2(grossINR - discountsINR);

  const costFullyKnown =
    !!acc && acc.costUnknownUnits === 0 && acc.costKnownUnits > 0 && unitsSold > 0;
  const estimatedProfitUSD = costFullyKnown
    ? round2(netSalesUSD - (acc?.costUSD ?? 0))
    : acc && acc.costKnownUnits > 0 && netSalesUSD > 0
      ? // Partial: only subtract known cost portion; mark as estimate on known units share
        round2(
          netSalesUSD * (acc.costKnownUnits / (acc.costKnownUnits + acc.costUnknownUnits)) -
            acc.costUSD
        )
      : null;

  // If any cost unknown and no known costs → null profit
  const profitFinal =
    !acc || (acc.costKnownUnits === 0 && unitsSold > 0)
      ? null
      : acc.costUnknownUnits > 0 && acc.costKnownUnits === 0
        ? null
        : estimatedProfitUSD;

  const profitMarginPct =
    profitFinal != null && netSalesUSD > 0
      ? round2((profitFinal / netSalesUSD) * 100)
      : null;

  const costPrice =
    catalog?.vendorCost ??
    (acc && acc.costKnownUnits > 0 ? round2(acc.costUSD / acc.costKnownUnits) : null);

  const sellingPrice = catalog?.price;
  const profitPerUnit =
    sellingPrice != null && costPrice != null ? round2(sellingPrice - costPrice) : null;

  const avgSellingPriceUSD = unitsSold > 0 ? round2(grossUSD / unitsSold) : null;
  const avgUnitsPerOrder = orders > 0 ? round2(unitsSold / orders) : null;

  const inventory = catalog?.inventory ?? null;
  const salesVelocity =
    unitsSold > 0 ? round2(unitsSold / Math.max(1, opts.periodDays)) : unitsSold === 0 ? 0 : null;
  const daysOfInventoryRemaining =
    inventory != null && salesVelocity != null && salesVelocity > 0
      ? round2(inventory / salesVelocity)
      : inventory != null && salesVelocity === 0
        ? null
        : null;
  const invHealth = inventoryHealthFrom(inventory, salesVelocity);

  const prevOrders = prev?.orderIds.size ?? 0;
  const prevUnits = prev?.unitsSold ?? 0;
  const prevNetUSD = round2((prev?.grossUSD ?? 0) - (prev?.discountUSD ?? 0));
  const prevProfit =
    prev && prev.costKnownUnits > 0 && prev.costUnknownUnits === 0
      ? round2(prevNetUSD - prev.costUSD)
      : null;

  const periodChange: PeriodChange = {
    orders: pctChange(orders, prevOrders),
    unitsSold: pctChange(unitsSold, prevUnits),
    revenueUSD: pctChange(netSalesUSD, prevNetUSD),
    profitUSD:
      profitFinal != null && prevProfit != null ? pctChange(profitFinal, prevProfit) : null,
  };

  const totalUnitsForRefund = unitsSold + refundUnits;
  const refundRatePct =
    totalUnitsForRefund > 0 ? round2((refundUnits / totalUnitsForRefund) * 100) : null;

  // Momentum halves from byDay
  let recentHalfOrders = opts.recentHalfOrders ?? 0;
  let earlierHalfOrders = opts.earlierHalfOrders ?? 0;
  if (acc && opts.recentHalfOrders == null) {
    const days = [...acc.byDay.keys()].sort();
    const mid = Math.floor(days.length / 2);
    earlierHalfOrders = days
      .slice(0, mid)
      .reduce((s, d) => s + (acc.byDay.get(d)?.orders.size ?? 0), 0);
    recentHalfOrders = days
      .slice(mid)
      .reduce((s, d) => s + (acc.byDay.get(d)?.orders.size ?? 0), 0);
  }

  const growthScore = computeGrowthScore({
    orders,
    maxOrders: opts.maxOrders,
    unitsGrowthPct: periodChange.unitsSold,
    revenueUSD: netSalesUSD,
    maxRevenueUSD: opts.maxRevenueUSD,
    profitUSD: profitFinal,
    maxProfitUSD: opts.maxProfitUSD,
    marginPct: profitMarginPct,
    ratingValue: catalog?.ratingAggregate?.ratingValue ?? null,
    inventoryHealth: invHealth,
    refundRatePct,
    recentHalfOrders,
    earlierHalfOrders,
    weights: opts.weights,
  });

  const base: ProductSalesRow = {
    productSlug: slug,
    name: catalog?.name ?? acc?.name ?? slug,
    sku: catalog?.sku ?? acc?.sku,
    image: catalog?.images?.[0] ?? acc?.image,
    categorySlug: catalog?.categorySlug,
    vendorSlug: catalog?.vendorSlug ?? acc?.vendorSlug ?? VENDOR_BLOSSOMPOT,
    sellingPrice,
    costPrice,
    profitPerUnit,
    currency: catalog?.currency,
    orders,
    unitsSold,
    grossSalesUSD: grossUSD,
    grossSalesINR: grossINR,
    discountsUSD,
    discountsINR,
    refundsUSD,
    refundsINR,
    refundUnits,
    refundOrders,
    netSalesUSD,
    netSalesINR,
    estimatedProfitUSD: profitFinal,
    profitMarginPct,
    avgSellingPriceUSD,
    avgUnitsPerOrder,
    inventory,
    ratingValue: catalog?.ratingAggregate?.ratingValue ?? null,
    reviewCount: catalog?.ratingAggregate?.reviewCount ?? null,
    published: catalog?.published ?? null,
    lastOrderAt: acc?.lastOrderAt ?? null,
    salesVelocity,
    daysOfInventoryRemaining,
    inventoryHealth: invHealth,
    growthScore,
    labels: [],
    periodChange,
    refundRatePct,
    customerCount: acc?.customerEmails.size ?? 0,
    recommendations: [],
    external: {
      pageViews: null,
      addToCarts: null,
      conversionRate: null,
      adSpend: null,
      roas: null,
    },
  };

  base.labels = deriveLabels(base);
  base.recommendations = buildRecommendations(base, {
    storeAvgOrders: opts.storeAvgOrders,
    storeAvgMarginPct: opts.storeAvgMarginPct,
    storeAvgRefundRatePct: opts.storeAvgRefundRatePct,
    periodLabel: opts.periodLabel,
  });

  return base;
}

export function buildAllProductSalesRows(
  current: Map<string, ProductSalesAccumulator>,
  previous: Map<string, ProductSalesAccumulator>,
  catalog: CatalogProductLite[],
  opts: {
    periodDays: number;
    periodLabel: string;
    weights?: GrowthScoreWeights;
    includeZeroSales?: boolean;
  }
): ProductSalesRow[] {
  const catalogMap = new Map(catalog.map((p) => [p.slug, p]));
  const slugs = new Set<string>([
    ...current.keys(),
    ...(opts.includeZeroSales !== false ? catalog.map((p) => p.slug) : []),
  ]);

  let maxOrders = 1;
  let maxRevenue = 1;
  let maxProfit = 1;
  for (const acc of current.values()) {
    maxOrders = Math.max(maxOrders, acc.orderIds.size);
    maxRevenue = Math.max(maxRevenue, acc.grossUSD - acc.discountUSD);
    if (acc.costKnownUnits > 0 && acc.costUnknownUnits === 0) {
      maxProfit = Math.max(maxProfit, acc.grossUSD - acc.discountUSD - acc.costUSD);
    }
  }

  const soldWithOrders = [...current.values()].filter((a) => a.orderIds.size > 0);
  const storeAvgOrders =
    soldWithOrders.length > 0
      ? soldWithOrders.reduce((s, a) => s + a.orderIds.size, 0) / soldWithOrders.length
      : 0;

  const margins: number[] = [];
  const refundRates: number[] = [];

  const rows: ProductSalesRow[] = [];
  for (const slug of slugs) {
    const row = buildProductSalesRow(current.get(slug), catalogMap.get(slug), previous.get(slug), {
      periodDays: opts.periodDays,
      maxOrders,
      maxRevenueUSD: maxRevenue,
      maxProfitUSD: Math.max(1, maxProfit),
      storeAvgOrders,
      storeAvgMarginPct: null,
      storeAvgRefundRatePct: null,
      periodLabel: opts.periodLabel,
      weights: opts.weights,
    });
    if (row.profitMarginPct != null) margins.push(row.profitMarginPct);
    if (row.refundRatePct != null) refundRates.push(row.refundRatePct);
    rows.push(row);
  }

  const avgMargin =
    margins.length > 0 ? round2(margins.reduce((a, b) => a + b, 0) / margins.length) : null;
  const avgRefund =
    refundRates.length > 0
      ? round2(refundRates.reduce((a, b) => a + b, 0) / refundRates.length)
      : null;

  // Rebuild recommendations with store averages
  return rows.map((row) => {
    const acc = current.get(row.productSlug);
    const rebuilt = buildProductSalesRow(acc, catalogMap.get(row.productSlug), previous.get(row.productSlug), {
      periodDays: opts.periodDays,
      maxOrders,
      maxRevenueUSD: maxRevenue,
      maxProfitUSD: Math.max(1, maxProfit),
      storeAvgOrders,
      storeAvgMarginPct: avgMargin,
      storeAvgRefundRatePct: avgRefund,
      periodLabel: opts.periodLabel,
      weights: opts.weights,
    });
    return rebuilt;
  });
}

// ---------------------------------------------------------------------------
// Rankings, alerts, opportunities, category/vendor rollups
// ---------------------------------------------------------------------------

export type ProductRankingSet = {
  byOrders: ProductSalesRow[];
  byUnits: ProductSalesRow[];
  byRevenue: ProductSalesRow[];
  byProfit: ProductSalesRow[];
  byMargin: ProductSalesRow[];
  needingAttention: ProductSalesRow[];
};

export function buildRankings(rows: ProductSalesRow[], limit = 10): ProductRankingSet {
  const withSales = rows.filter((r) => r.orders > 0 || r.unitsSold > 0);
  const byOrders = [...withSales].sort((a, b) => b.orders - a.orders).slice(0, limit);
  const byUnits = [...withSales].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
  const byRevenue = [...withSales]
    .sort((a, b) => b.netSalesUSD - a.netSalesUSD)
    .slice(0, limit);
  const byProfit = [...withSales]
    .filter((r) => r.estimatedProfitUSD != null)
    .sort((a, b) => (b.estimatedProfitUSD ?? 0) - (a.estimatedProfitUSD ?? 0))
    .slice(0, limit);
  const byMargin = [...withSales]
    .filter((r) => r.profitMarginPct != null)
    .sort((a, b) => (b.profitMarginPct ?? 0) - (a.profitMarginPct ?? 0))
    .slice(0, limit);

  const needingAttention = [...rows]
    .filter(
      (r) =>
        r.labels.includes("needs_improvement") ||
        r.labels.includes("low_performer") ||
        r.labels.includes("inventory_risk") ||
        (r.periodChange.orders != null && r.periodChange.orders <= -30) ||
        (r.refundRatePct != null && r.refundRatePct >= 8) ||
        (r.estimatedProfitUSD != null &&
          r.netSalesUSD >= 200 &&
          r.estimatedProfitUSD < r.netSalesUSD * 0.15)
    )
    .sort((a, b) => a.growthScore - b.growthScore)
    .slice(0, limit);

  return { byOrders, byUnits, byRevenue, byProfit, byMargin, needingAttention };
}

export type SmartAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  type:
    | "stopped_selling"
    | "sales_drop"
    | "bestseller"
    | "sales_spike"
    | "low_inventory"
    | "refund_increase"
    | "margin_fall"
    | "trending";
  productSlug: string;
  productName: string;
  message: string;
};

export function buildSmartAlerts(rows: ProductSalesRow[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  for (const r of rows) {
    if (r.orders === 0 && r.periodChange.orders != null && r.periodChange.orders < 0) {
      alerts.push({
        id: `stopped:${r.productSlug}`,
        severity: "warning",
        type: "stopped_selling",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} stopped selling in this period (had orders previously).`,
      });
    }
    if (r.periodChange.orders != null && r.periodChange.orders <= -40 && r.orders > 0) {
      alerts.push({
        id: `drop:${r.productSlug}`,
        severity: "warning",
        type: "sales_drop",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} orders dropped ${Math.abs(r.periodChange.orders)}% vs previous period.`,
      });
    }
    if (r.periodChange.orders != null && r.periodChange.orders >= 80 && r.orders >= 3) {
      alerts.push({
        id: `spike:${r.productSlug}`,
        severity: "info",
        type: "sales_spike",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} orders spiked +${r.periodChange.orders}% — trending.`,
      });
    }
    if (r.labels.includes("star_product")) {
      alerts.push({
        id: `best:${r.productSlug}`,
        severity: "info",
        type: "bestseller",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} is a star product (growth score ${r.growthScore}).`,
      });
    }
    if (r.inventoryHealth === "critical") {
      alerts.push({
        id: `inv:${r.productSlug}`,
        severity: "critical",
        type: "low_inventory",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} inventory is critical (${r.inventory ?? 0} left).`,
      });
    }
    if (r.refundRatePct != null && r.refundRatePct >= 10) {
      alerts.push({
        id: `ref:${r.productSlug}`,
        severity: "critical",
        type: "refund_increase",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} refund rate is ${r.refundRatePct}%.`,
      });
    }
    if (
      r.periodChange.profitUSD != null &&
      r.periodChange.profitUSD <= -25 &&
      r.estimatedProfitUSD != null
    ) {
      alerts.push({
        id: `margin:${r.productSlug}`,
        severity: "warning",
        type: "margin_fall",
        productSlug: r.productSlug,
        productName: r.name,
        message: `${r.name} estimated profit fell ${Math.abs(r.periodChange.profitUSD)}%.`,
      });
    }
  }
  return alerts.slice(0, 40);
}

export type RevenueOpportunity = {
  productSlug: string;
  productName: string;
  kind: "close_gap_to_category_avg" | "recover_prior_period" | "prevent_stockout";
  estimateLabel: string;
  /** Explicitly an estimate — never present as guaranteed. */
  estimatedAdditionalOrders: number | null;
  estimatedAdditionalRevenueUSD: number | null;
  rationale: string;
};

export function buildOpportunities(
  rows: ProductSalesRow[],
  categoryAvgOrders: Map<string, number>
): RevenueOpportunity[] {
  const out: RevenueOpportunity[] = [];
  for (const r of rows) {
    const catAvg = r.categorySlug ? categoryAvgOrders.get(r.categorySlug) : undefined;
    if (catAvg != null && catAvg > r.orders + 1 && r.orders > 0) {
      const gap = Math.round(catAvg - r.orders);
      const aov = r.orders > 0 ? r.netSalesUSD / r.orders : null;
      out.push({
        productSlug: r.productSlug,
        productName: r.name,
        kind: "close_gap_to_category_avg",
        estimateLabel: "Estimated opportunity (not guaranteed)",
        estimatedAdditionalOrders: gap,
        estimatedAdditionalRevenueUSD: aov != null ? round2(gap * aov) : null,
        rationale: `${r.name} has ${r.orders} orders; similar products in its category average ~${catAvg.toFixed(1)}. Potential additional orders: ~${gap}/period if it reaches category average.`,
      });
    }
    if (r.periodChange.orders != null && r.periodChange.orders <= -30 && r.orders > 0) {
      // recover toward previous: if down 45%, previous ≈ current / 0.55
      const prevApprox = r.periodChange.orders === -100 ? null : r.orders / (1 + r.periodChange.orders / 100);
      if (prevApprox != null) {
        const gap = Math.max(0, Math.round(prevApprox - r.orders));
        const aov = r.netSalesUSD / Math.max(1, r.orders);
        out.push({
          productSlug: r.productSlug,
          productName: r.name,
          kind: "recover_prior_period",
          estimateLabel: "Estimated opportunity (not guaranteed)",
          estimatedAdditionalOrders: gap,
          estimatedAdditionalRevenueUSD: round2(gap * aov),
          rationale: `${r.name} is down ${Math.abs(r.periodChange.orders)}% vs prior period. Recovering prior run-rate is ~${gap} orders.`,
        });
      }
    }
    if (
      r.inventoryHealth === "critical" &&
      r.salesVelocity != null &&
      r.salesVelocity > 0 &&
      (r.daysOfInventoryRemaining ?? 0) < 7
    ) {
      const lostDays = 14 - (r.daysOfInventoryRemaining ?? 0);
      const units = Math.round(Math.max(0, lostDays) * r.salesVelocity);
      const unitRev = r.unitsSold > 0 ? r.netSalesUSD / r.unitsSold : null;
      out.push({
        productSlug: r.productSlug,
        productName: r.name,
        kind: "prevent_stockout",
        estimateLabel: "Estimated opportunity (not guaranteed)",
        estimatedAdditionalOrders: null,
        estimatedAdditionalRevenueUSD: unitRev != null ? round2(units * unitRev) : null,
        rationale: `${r.name} may stock out soon. Covering ~2 weeks of velocity could protect ~${units} units of demand.`,
      });
    }
  }
  return out.slice(0, 25);
}

export type DimensionPerformance = {
  key: string;
  label: string;
  orders: number;
  unitsSold: number;
  revenueUSD: number;
  profitUSD: number | null;
  growthOrdersPct: number | null;
  refundRatePct: number | null;
  productCount: number;
};

export function rollupByDimension(
  rows: ProductSalesRow[],
  keyFn: (r: ProductSalesRow) => string,
  labelFn?: (key: string, sample: ProductSalesRow) => string
): DimensionPerformance[] {
  const map = new Map<
    string,
    {
      label: string;
      orders: number;
      units: number;
      revenue: number;
      profit: number;
      profitKnown: boolean;
      refundUnits: number;
      soldUnits: number;
      productCount: number;
      growthSum: number;
      growthN: number;
    }
  >();

  for (const r of rows) {
    const key = keyFn(r) || "unknown";
    let g = map.get(key);
    if (!g) {
      g = {
        label: labelFn?.(key, r) ?? key,
        orders: 0,
        units: 0,
        revenue: 0,
        profit: 0,
        profitKnown: true,
        refundUnits: 0,
        soldUnits: 0,
        productCount: 0,
        growthSum: 0,
        growthN: 0,
      };
      map.set(key, g);
    }
    g.productCount += 1;
    g.orders += r.orders;
    g.units += r.unitsSold;
    g.revenue += r.netSalesUSD;
    g.refundUnits += r.refundUnits;
    g.soldUnits += r.unitsSold;
    if (r.estimatedProfitUSD == null) g.profitKnown = false;
    else g.profit += r.estimatedProfitUSD;
    if (r.periodChange.orders != null) {
      g.growthSum += r.periodChange.orders;
      g.growthN += 1;
    }
  }

  return [...map.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      orders: g.orders,
      unitsSold: g.units,
      revenueUSD: round2(g.revenue),
      profitUSD: g.profitKnown ? round2(g.profit) : null,
      growthOrdersPct: g.growthN > 0 ? round2(g.growthSum / g.growthN) : null,
      refundRatePct:
        g.soldUnits + g.refundUnits > 0
          ? round2((g.refundUnits / (g.soldUnits + g.refundUnits)) * 100)
          : null,
      productCount: g.productCount,
    }))
    .sort((a, b) => b.revenueUSD - a.revenueUSD);
}

export type CoPurchaseEdge = {
  productSlug: string;
  otherSlug: string;
  orderCount: number;
};

export function topCoPurchases(
  current: Map<string, ProductSalesAccumulator>,
  limit = 30
): CoPurchaseEdge[] {
  const edges: CoPurchaseEdge[] = [];
  for (const acc of current.values()) {
    for (const [other, count] of acc.coPurchase) {
      if (acc.productSlug < other) {
        edges.push({ productSlug: acc.productSlug, otherSlug: other, orderCount: count });
      }
    }
  }
  return edges.sort((a, b) => b.orderCount - a.orderCount).slice(0, limit);
}

export type DashboardSummary = {
  totalProductsSold: number;
  totalOrders: number;
  unitsSold: number;
  revenueUSD: number;
  revenueINR: number;
  estimatedProfitUSD: number | null;
  averageOrderValueUSD: number | null;
  bestSellingProduct: { slug: string; name: string; orders: number } | null;
  fastestGrowingProduct: { slug: string; name: string; growthPct: number } | null;
  highestProfitProduct: { slug: string; name: string; profitUSD: number } | null;
  productsNeedingAttention: number;
  periodChange: PeriodChange;
};

export function buildDashboardSummary(
  rows: ProductSalesRow[],
  previousRows: ProductSalesRow[],
  uniqueOrderCount: number,
  prevUniqueOrderCount: number
): DashboardSummary {
  const withSales = rows.filter((r) => r.orders > 0);
  const unitsSold = rows.reduce((s, r) => s + r.unitsSold, 0);
  const revenueUSD = round2(rows.reduce((s, r) => s + r.netSalesUSD, 0));
  const revenueINR = round2(rows.reduce((s, r) => s + r.netSalesINR, 0));
  const profits = rows
    .map((r) => r.estimatedProfitUSD)
    .filter((p): p is number => p != null);
  // Only sum profit when every sold product has known profit — else null if any missing among sellers
  const sellersMissingProfit = withSales.some((r) => r.estimatedProfitUSD == null);
  const estimatedProfitUSD = sellersMissingProfit
    ? profits.length > 0
      ? round2(profits.reduce((a, b) => a + b, 0)) // partial sum — UI should note partial
      : null
    : round2(profits.reduce((a, b) => a + b, 0));

  const prevUnits = previousRows.reduce((s, r) => s + r.unitsSold, 0);
  const prevRev = round2(previousRows.reduce((s, r) => s + r.netSalesUSD, 0));
  const prevProfits = previousRows
    .map((r) => r.estimatedProfitUSD)
    .filter((p): p is number => p != null);
  const prevProfitSum = prevProfits.length ? round2(prevProfits.reduce((a, b) => a + b, 0)) : null;

  const best = [...withSales].sort((a, b) => b.orders - a.orders)[0];
  const growing = [...withSales]
    .filter((r) => r.periodChange.orders != null)
    .sort((a, b) => (b.periodChange.orders ?? 0) - (a.periodChange.orders ?? 0))[0];
  const highProfit = [...withSales]
    .filter((r) => r.estimatedProfitUSD != null)
    .sort((a, b) => (b.estimatedProfitUSD ?? 0) - (a.estimatedProfitUSD ?? 0))[0];

  return {
    totalProductsSold: withSales.length,
    totalOrders: uniqueOrderCount,
    unitsSold,
    revenueUSD,
    revenueINR,
    estimatedProfitUSD,
    averageOrderValueUSD:
      uniqueOrderCount > 0 ? round2(revenueUSD / uniqueOrderCount) : null,
    bestSellingProduct: best
      ? { slug: best.productSlug, name: best.name, orders: best.orders }
      : null,
    fastestGrowingProduct:
      growing && growing.periodChange.orders != null
        ? {
            slug: growing.productSlug,
            name: growing.name,
            growthPct: growing.periodChange.orders,
          }
        : null,
    highestProfitProduct:
      highProfit && highProfit.estimatedProfitUSD != null
        ? {
            slug: highProfit.productSlug,
            name: highProfit.name,
            profitUSD: highProfit.estimatedProfitUSD,
          }
        : null,
    productsNeedingAttention: buildRankings(rows, 100).needingAttention.length,
    periodChange: {
      orders: pctChange(uniqueOrderCount, prevUniqueOrderCount),
      unitsSold: pctChange(unitsSold, prevUnits),
      revenueUSD: pctChange(revenueUSD, prevRev),
      profitUSD:
        estimatedProfitUSD != null && prevProfitSum != null
          ? pctChange(estimatedProfitUSD, prevProfitSum)
          : null,
    },
  };
}

export type TrendGranularity = "daily" | "weekly" | "monthly";

export type ProductTrendPoint = {
  label: string;
  date: string;
  orders: number;
  unitsSold: number;
  revenueUSD: number;
  profitUSD: number | null;
};

export function buildTrendSeries(
  acc: ProductSalesAccumulator | undefined,
  granularity: TrendGranularity
): ProductTrendPoint[] {
  if (!acc) return [];
  const days = [...acc.byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (granularity === "daily") {
    return days.map(([date, d]) => ({
      label: date,
      date,
      orders: d.orders.size,
      unitsSold: d.units,
      revenueUSD: round2(d.revenueUSD),
      profitUSD: d.costKnown ? round2(d.profitUSD ?? 0) : null,
    }));
  }

  const bucket = new Map<string, ProductTrendPoint>();
  for (const [date, d] of days) {
    const key =
      granularity === "weekly"
        ? utcWeekKey(date)
        : date.slice(0, 7); // YYYY-MM
    let b = bucket.get(key);
    if (!b) {
      b = {
        label: key,
        date: key,
        orders: 0,
        unitsSold: 0,
        revenueUSD: 0,
        profitUSD: 0,
      };
      bucket.set(key, b);
    }
    b.orders += d.orders.size;
    b.unitsSold += d.units;
    b.revenueUSD = round2(b.revenueUSD + d.revenueUSD);
    if (d.costKnown && b.profitUSD != null) {
      b.profitUSD = round2((b.profitUSD ?? 0) + (d.profitUSD ?? 0));
    } else {
      b.profitUSD = null;
    }
  }
  return [...bucket.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function utcWeekKey(isoDay: string): string {
  const d = new Date(isoDay + "T00:00:00.000Z");
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Serialize accumulator day map for API rollup storage. */
export function serializeAccumulatorForRollup(acc: ProductSalesAccumulator): {
  productSlug: string;
  name: string;
  image?: string;
  sku?: string;
  vendorSlug: string;
  orderCount: number;
  orderIds: string[];
  unitsSold: number;
  grossUSD: number;
  grossINR: number;
  discountUSD: number;
  discountINR: number;
  refundGrossUSD: number;
  refundGrossINR: number;
  refundUnits: number;
  refundOrderIds: string[];
  costUSD: number;
  costKnownUnits: number;
  costUnknownUnits: number;
  lastOrderAt: string | null;
  customerEmails: string[];
  coPurchase: Record<string, number>;
} {
  return {
    productSlug: acc.productSlug,
    name: acc.name,
    image: acc.image,
    sku: acc.sku,
    vendorSlug: acc.vendorSlug,
    orderCount: acc.orderIds.size,
    orderIds: [...acc.orderIds],
    unitsSold: acc.unitsSold,
    grossUSD: round2(acc.grossUSD),
    grossINR: round2(acc.grossINR),
    discountUSD: round2(acc.discountUSD),
    discountINR: round2(acc.discountINR),
    refundGrossUSD: round2(acc.refundGrossUSD),
    refundGrossINR: round2(acc.refundGrossINR),
    refundUnits: acc.refundUnits,
    refundOrderIds: [...acc.refundOrderIds],
    costUSD: round2(acc.costUSD),
    costKnownUnits: acc.costKnownUnits,
    costUnknownUnits: acc.costUnknownUnits,
    lastOrderAt: acc.lastOrderAt,
    customerEmails: [...acc.customerEmails],
    coPurchase: Object.fromEntries(acc.coPurchase),
  };
}
