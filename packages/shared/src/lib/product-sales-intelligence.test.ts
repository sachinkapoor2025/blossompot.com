import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allocateLineDiscount,
  accumulateOrders,
  buildAllProductSalesRows,
  buildDashboardSummary,
  buildRecommendations,
  buildRankings,
  computeGrowthScore,
  getAnalyticsPaidAt,
  isTestOrLoadTestOrder,
  lineGrossNative,
  previousEquivalentRange,
  resolveProductSalesDateRange,
  type CatalogProductLite,
} from "./product-sales-intelligence";
import { ORDER_STATUS } from "../constants";
import type { Order } from "../schemas/order";
import type { CartItem } from "../schemas/cart";

function item(partial: Partial<CartItem> & Pick<CartItem, "productSlug" | "name" | "price">): CartItem {
  return {
    currency: "USD",
    quantity: 1,
    ...partial,
  };
}

function order(partial: Partial<Order> & Pick<Order, "orderId" | "items" | "status">): Order {
  return {
    sessionId: "s1",
    subtotal: 100,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 100,
    currency: "USD",
    shippingAddress: {
      name: "A",
      email: "a@example.com",
      phone: "1",
      line1: "x",
      city: "y",
      state: "CA",
      postalCode: "1",
      country: "US",
    },
    createdAt: "2026-08-01T12:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
    statusHistory: [{ status: ORDER_STATUS.PAID, at: "2026-08-01T12:00:00.000Z" }],
    ...partial,
  };
}

describe("product-sales-intelligence dates", () => {
  it("resolves last_30 and previous equivalent period", () => {
    const now = new Date("2026-08-12T15:00:00.000Z");
    const range = resolveProductSalesDateRange("last_30", now);
    assert.equal(range.from.toISOString().slice(0, 10), "2026-07-14");
    assert.equal(range.to.toISOString().slice(0, 10), "2026-08-12");
    const prev = previousEquivalentRange(range);
    assert.ok(prev.to.getTime() < range.from.getTime());
    const len = range.to.getTime() - range.from.getTime();
    const prevLen = prev.to.getTime() - prev.from.getTime();
    assert.ok(Math.abs(len - prevLen) < 2 * 86400000);
  });
});

describe("product-sales-intelligence order filters", () => {
  it("detects load-test payment ids", () => {
    assert.equal(isTestOrLoadTestOrder({ paymentIntentId: "pi_loadtest_1" }), true);
    assert.equal(isTestOrLoadTestOrder({ razorpayOrderId: "order_dev_x" }), true);
    assert.equal(isTestOrLoadTestOrder({ paymentIntentId: "pi_live_abc" }), false);
  });

  it("reads paidAt for refunded orders", () => {
    const o = order({
      orderId: "o1",
      status: ORDER_STATUS.REFUNDED,
      items: [item({ productSlug: "p1", name: "P1", price: 10, quantity: 2 })],
      statusHistory: [
        { status: ORDER_STATUS.PAID, at: "2026-08-02T10:00:00.000Z" },
        { status: ORDER_STATUS.REFUNDED, at: "2026-08-05T10:00:00.000Z" },
      ],
    });
    assert.equal(getAnalyticsPaidAt(o), "2026-08-02T10:00:00.000Z");
  });
});

describe("product-sales-intelligence metrics", () => {
  it("counts unique orders vs units sold separately", () => {
    const range = resolveProductSalesDateRange("custom", new Date(), "2026-08-01", "2026-08-31");
    const orders: Order[] = [
      order({
        orderId: "o1",
        status: ORDER_STATUS.PAID,
        items: [item({ productSlug: "rakhi-a", name: "Rakhi A", price: 20, quantity: 3 })],
        subtotal: 60,
        total: 60,
      }),
      order({
        orderId: "o2",
        status: ORDER_STATUS.SHIPPED,
        items: [item({ productSlug: "rakhi-a", name: "Rakhi A", price: 20, quantity: 1 })],
        subtotal: 20,
        total: 20,
        shippingAddress: {
          name: "B",
          email: "b@example.com",
          phone: "1",
          line1: "x",
          city: "y",
          state: "CA",
          postalCode: "1",
          country: "US",
        },
        createdAt: "2026-08-03T12:00:00.000Z",
        statusHistory: [{ status: ORDER_STATUS.PAID, at: "2026-08-03T12:00:00.000Z" }],
      }),
    ];
    const map = accumulateOrders(orders, range);
    const acc = map.get("rakhi-a")!;
    assert.equal(acc.orderIds.size, 2);
    assert.equal(acc.unitsSold, 4);
    assert.equal(acc.grossUSD, 80);
  });

  it("allocates order discount by eligible merchandise share", () => {
    const line = item({ productSlug: "p1", name: "P1", price: 50, quantity: 2 });
    const o = order({
      orderId: "o1",
      status: ORDER_STATUS.PAID,
      items: [line, item({ productSlug: "p2", name: "P2", price: 50, quantity: 2 })],
      discount: 20,
      subtotal: 200,
      total: 180,
    });
    assert.equal(lineGrossNative(line), 100);
    assert.equal(allocateLineDiscount(o, line), 10);
  });

  it("excludes cancelled and pending; tracks refunds separately", () => {
    const range = resolveProductSalesDateRange("custom", new Date(), "2026-08-01", "2026-08-31");
    const orders: Order[] = [
      order({
        orderId: "paid",
        status: ORDER_STATUS.PAID,
        items: [
          item({
            productSlug: "p1",
            name: "P1",
            price: 30,
            quantity: 1,
            vendorCost: 10,
          }),
        ],
        subtotal: 30,
        total: 30,
      }),
      order({
        orderId: "pending",
        status: ORDER_STATUS.PENDING_PAYMENT,
        items: [item({ productSlug: "p1", name: "P1", price: 30, quantity: 5 })],
      }),
      order({
        orderId: "refund",
        status: ORDER_STATUS.REFUNDED,
        items: [
          item({
            productSlug: "p1",
            name: "P1",
            price: 30,
            quantity: 2,
            vendorCost: 10,
          }),
        ],
        subtotal: 60,
        total: 60,
      }),
      order({
        orderId: "test",
        status: ORDER_STATUS.PAID,
        paymentIntentId: "pi_loadtest_9",
        items: [item({ productSlug: "p1", name: "P1", price: 30, quantity: 9 })],
      }),
    ];
    const map = accumulateOrders(orders, range);
    const acc = map.get("p1")!;
    assert.equal(acc.orderIds.size, 1);
    assert.equal(acc.unitsSold, 1);
    assert.equal(acc.refundUnits, 2);
    assert.equal(acc.refundOrderIds.size, 1);
  });

  it("builds rows with profit when cost known", () => {
    const range = resolveProductSalesDateRange("custom", new Date(), "2026-08-01", "2026-08-31");
    const prevRange = previousEquivalentRange(range);
    const currentOrders = [
      order({
        orderId: "o1",
        status: ORDER_STATUS.COMPLETE,
        items: [
          item({
            productSlug: "p1",
            name: "Hero",
            price: 40,
            quantity: 2,
            vendorCost: 15,
            vendorSlug: "orange-county",
          }),
        ],
        subtotal: 80,
        total: 80,
      }),
    ];
    const prevOrders = [
      order({
        orderId: "old",
        status: ORDER_STATUS.PAID,
        items: [
          item({
            productSlug: "p1",
            name: "Hero",
            price: 40,
            quantity: 1,
            vendorCost: 15,
          }),
        ],
        subtotal: 40,
        total: 40,
        createdAt: "2026-07-01T12:00:00.000Z",
        statusHistory: [{ status: ORDER_STATUS.PAID, at: "2026-07-01T12:00:00.000Z" }],
      }),
    ];
    const current = accumulateOrders(currentOrders, range);
    const previous = accumulateOrders(prevOrders, prevRange);
    const catalog: CatalogProductLite[] = [
      {
        slug: "p1",
        name: "Hero",
        description: "",
        price: 40,
        currency: "USD",
        categorySlug: "rakhi",
        images: [],
        inventory: 8,
        published: true,
        vendorSlug: "orange-county",
        vendorCost: 15,
        tags: [],
      } as CatalogProductLite,
    ];
    // Fix catalog type - Product requires description etc. Use partial cast
    const rows = buildAllProductSalesRows(current, previous, catalog, {
      periodDays: 31,
      periodLabel: "Last 30 days",
    });
    const row = rows.find((r) => r.productSlug === "p1")!;
    assert.equal(row.orders, 1);
    assert.equal(row.unitsSold, 2);
    assert.equal(row.netSalesUSD, 80);
    assert.equal(row.estimatedProfitUSD, 50); // 80 - 30
    assert.equal(row.avgUnitsPerOrder, 2);
    assert.ok(row.recommendations.length > 0);
    assert.ok(row.growthScore >= 0 && row.growthScore <= 100);
  });

  it("growth score respects weights and clamps", () => {
    const score = computeGrowthScore({
      orders: 10,
      maxOrders: 10,
      unitsGrowthPct: 100,
      revenueUSD: 1000,
      maxRevenueUSD: 1000,
      profitUSD: 400,
      maxProfitUSD: 400,
      marginPct: 40,
      ratingValue: 5,
      inventoryHealth: "healthy",
      refundRatePct: 0,
      recentHalfOrders: 8,
      earlierHalfOrders: 2,
    });
    assert.ok(score >= 80);
    assert.equal(computeGrowthScore({
      orders: 0,
      maxOrders: 10,
      unitsGrowthPct: -100,
      revenueUSD: 0,
      maxRevenueUSD: 1000,
      profitUSD: null,
      maxProfitUSD: 400,
      marginPct: null,
      ratingValue: null,
      inventoryHealth: "critical",
      refundRatePct: 50,
      recentHalfOrders: 0,
      earlierHalfOrders: 5,
    }) < 50, true);
  });

  it("recommendations are evidence-based for low sales", () => {
    const recs = buildRecommendations(
      {
        name: "Slow SKU",
        orders: 4,
        unitsSold: 4,
        periodChange: { orders: -45, unitsSold: -45, revenueUSD: -40, profitUSD: null },
        grossSalesUSD: 120,
        estimatedProfitUSD: null,
        profitMarginPct: null,
        refundRatePct: null,
        inventory: 40,
        inventoryHealth: "healthy",
        daysOfInventoryRemaining: null,
        ratingValue: null,
        reviewCount: null,
        discountsUSD: 0,
        netSalesUSD: 120,
        growthScore: 30,
        labels: ["needs_improvement"],
      },
      {
        storeAvgOrders: 20,
        storeAvgMarginPct: null,
        storeAvgRefundRatePct: null,
        periodLabel: "Last 30 days",
      }
    );
    assert.ok(recs.some((r) => r.evidence.includes("4 orders")));
    assert.ok(recs.some((r) => r.evidence.includes("45%")));
  });

  it("rankings separate revenue leaders from profit leaders", () => {
    const rows = [
      {
        productSlug: "hi-rev",
        name: "Hi Rev",
        vendorSlug: "blossompot",
        orders: 20,
        unitsSold: 20,
        netSalesUSD: 2000,
        estimatedProfitUSD: 50,
        profitMarginPct: 2.5,
        growthScore: 60,
        labels: [],
        periodChange: { orders: 0, unitsSold: 0, revenueUSD: 0, profitUSD: 0 },
        refundRatePct: 0,
        refundUnits: 0,
        grossSalesUSD: 2000,
        grossSalesINR: 0,
        discountsUSD: 0,
        discountsINR: 0,
        refundsUSD: 0,
        refundsINR: 0,
        refundOrders: 0,
        netSalesINR: 0,
        avgSellingPriceUSD: 100,
        avgUnitsPerOrder: 1,
        inventory: 10,
        ratingValue: null,
        reviewCount: null,
        published: true,
        lastOrderAt: null,
        salesVelocity: 1,
        daysOfInventoryRemaining: 10,
        inventoryHealth: "healthy" as const,
        customerCount: 20,
        recommendations: [],
        costPrice: 90,
        profitPerUnit: 10,
        external: {
          pageViews: null,
          addToCarts: null,
          conversionRate: null,
          adSpend: null,
          roas: null,
        },
      },
      {
        productSlug: "hi-profit",
        name: "Hi Profit",
        vendorSlug: "orange-county",
        orders: 8,
        unitsSold: 8,
        netSalesUSD: 400,
        estimatedProfitUSD: 200,
        profitMarginPct: 50,
        growthScore: 70,
        labels: ["high_profit"],
        periodChange: { orders: 10, unitsSold: 10, revenueUSD: 10, profitUSD: 10 },
        refundRatePct: 0,
        refundUnits: 0,
        grossSalesUSD: 400,
        grossSalesINR: 0,
        discountsUSD: 0,
        discountsINR: 0,
        refundsUSD: 0,
        refundsINR: 0,
        refundOrders: 0,
        netSalesINR: 0,
        avgSellingPriceUSD: 50,
        avgUnitsPerOrder: 1,
        inventory: 10,
        ratingValue: null,
        reviewCount: null,
        published: true,
        lastOrderAt: null,
        salesVelocity: 0.3,
        daysOfInventoryRemaining: 30,
        inventoryHealth: "healthy" as const,
        customerCount: 8,
        recommendations: [],
        costPrice: 25,
        profitPerUnit: 25,
        external: {
          pageViews: null,
          addToCarts: null,
          conversionRate: null,
          adSpend: null,
          roas: null,
        },
      },
    ];
    const rankings = buildRankings(rows as never, 5);
    assert.equal(rankings.byRevenue[0]!.productSlug, "hi-rev");
    assert.equal(rankings.byProfit[0]!.productSlug, "hi-profit");
  });

  it("dashboard summary uses unique order count", () => {
    const rows = [
      {
        productSlug: "a",
        name: "A",
        vendorSlug: "x",
        orders: 2,
        unitsSold: 5,
        netSalesUSD: 100,
        netSalesINR: 0,
        estimatedProfitUSD: 40,
        periodChange: { orders: 10, unitsSold: 10, revenueUSD: 10, profitUSD: 10 },
        labels: [],
        growthScore: 50,
        refundUnits: 0,
        grossSalesUSD: 100,
        grossSalesINR: 0,
        discountsUSD: 0,
        discountsINR: 0,
        refundsUSD: 0,
        refundsINR: 0,
        refundOrders: 0,
        refundRatePct: 0,
        avgSellingPriceUSD: 20,
        avgUnitsPerOrder: 2.5,
        inventory: 1,
        ratingValue: null,
        reviewCount: null,
        published: true,
        lastOrderAt: null,
        salesVelocity: 1,
        daysOfInventoryRemaining: 1,
        inventoryHealth: "critical" as const,
        customerCount: 2,
        recommendations: [],
        costPrice: null,
        profitPerUnit: null,
        profitMarginPct: 40,
        external: {
          pageViews: null,
          addToCarts: null,
          conversionRate: null,
          adSpend: null,
          roas: null,
        },
      },
    ];
    const summary = buildDashboardSummary(rows as never, [], 2, 1);
    assert.equal(summary.totalOrders, 2);
    assert.equal(summary.unitsSold, 5);
    assert.equal(summary.periodChange.orders, 100);
  });
});
