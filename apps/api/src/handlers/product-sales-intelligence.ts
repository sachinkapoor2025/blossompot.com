/**
 * Admin Product Sales Intelligence APIs.
 */
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  PRODUCT_SALES_DATE_PRESETS,
  DEFAULT_GROWTH_SCORE_WEIGHTS,
  buildAllProductSalesRows,
  buildDashboardSummary,
  buildOpportunities,
  buildRankings,
  buildSmartAlerts,
  buildTrendSeries,
  daysInRange,
  previousEquivalentRange,
  resolveProductSalesDateRange,
  rollupByDimension,
  topCoPurchases,
  configKeys,
  type CatalogProductLite,
  type GrowthScoreWeights,
  type Product,
  type ProductSalesDatePreset,
  type ProductSalesIntelCompareResponse,
  type ProductSalesIntelDetailResponse,
  type ProductSalesIntelListResponse,
  type ProductSalesIntelSummaryResponse,
  type ProductSalesRow,
  type TrendGranularity,
} from "@blossompot/shared";
import { requireAdmin } from "../lib/auth";
import { docClient, PRODUCTS_TABLE, CONFIG_TABLE, now } from "../lib/db";
import { ok, badRequest, forbidden, notFound } from "../lib/response";
import {
  loadProductSalesAccumulators,
  rebuildProductSalesRange,
} from "../lib/product-sales-rollups";

const DEFINITIONS = {
  grossRevenue: "Sum of (line unit price including add-ons) × quantity at order time, by currency.",
  netRevenue:
    "Gross revenue minus order-level discounts allocated to eligible merchandise lines by share.",
  estimatedProfit:
    "Net USD merchandise revenue minus line vendorCost × qty when cost is known. Null when cost missing (common for BlossomPot SKUs). Shipping/tax excluded from product P&L.",
  refunds:
    "Full-order refunds only (status=refunded). Refund merchandise attributed to the original paid day. Partial gateway refunds are not modeled.",
  excludedOrders:
    "pending_payment, cancelled, and payment IDs matching _loadtest_ / _dev_ are excluded from revenue.",
};

function parsePreset(raw: string | undefined): ProductSalesDatePreset {
  if (raw && (PRODUCT_SALES_DATE_PRESETS as readonly string[]).includes(raw)) {
    return raw as ProductSalesDatePreset;
  }
  return "last_30";
}

function parseRange(event: APIGatewayProxyEventV2) {
  const q = event.queryStringParameters ?? {};
  const preset = parsePreset(q.preset ?? q.period);
  return resolveProductSalesDateRange(preset, new Date(), q.from, q.to);
}

async function loadCatalog(): Promise<CatalogProductLite[]> {
  const items: Product[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :p) AND SK = :sk",
        ExpressionAttributeValues: { ":p": "PRODUCT#", ":sk": "META" },
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...((res.Items ?? []) as Product[]));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items.map((p) => ({
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    images: p.images ?? [],
    categorySlug: p.categorySlug,
    vendorSlug: p.vendorSlug,
    price: p.price,
    currency: p.currency,
    vendorCost: p.vendorCost,
    inventory: p.inventory,
    published: p.published,
    ratingAggregate: p.ratingAggregate,
  }));
}

async function loadWeights(): Promise<GrowthScoreWeights> {
  try {
    const res = await docClient.send(
      new GetCommand({
        TableName: CONFIG_TABLE,
        Key: { PK: configKeys.productSalesIntel.pk, SK: configKeys.productSalesIntel.sk },
      })
    );
    const w = res.Item?.growthScoreWeights as GrowthScoreWeights | undefined;
    if (!w) return { ...DEFAULT_GROWTH_SCORE_WEIGHTS };
    return { ...DEFAULT_GROWTH_SCORE_WEIGHTS, ...w };
  } catch {
    return { ...DEFAULT_GROWTH_SCORE_WEIGHTS };
  }
}

function uniqueOrderCount(rows: ProductSalesRow[], mapOrderIds: Set<string>): number {
  // Prefer true unique orders from accumulator merge when provided
  if (mapOrderIds.size > 0) return mapOrderIds.size;
  // Fallback: cannot sum row.orders (double-counts multi-item orders)
  return 0;
}

function collectUniqueOrderIds(
  map: Map<string, import("@blossompot/shared").ProductSalesAccumulator>
): Set<string> {
  const ids = new Set<string>();
  for (const acc of map.values()) {
    for (const id of acc.orderIds) ids.add(id);
  }
  return ids;
}

function applyFilters(
  rows: ProductSalesRow[],
  q: Record<string, string | undefined>
): ProductSalesRow[] {
  let out = rows;
  const search = (q.q ?? q.search ?? "").trim().toLowerCase();
  if (search) {
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.productSlug.toLowerCase().includes(search) ||
        (r.sku ?? "").toLowerCase().includes(search)
    );
  }
  if (q.category) out = out.filter((r) => r.categorySlug === q.category);
  if (q.vendor) out = out.filter((r) => r.vendorSlug === q.vendor);
  if (q.status === "published") out = out.filter((r) => r.published === true);
  if (q.status === "unpublished") out = out.filter((r) => r.published === false);
  if (q.performance === "sellers") out = out.filter((r) => r.orders > 0);
  if (q.performance === "no_sales") out = out.filter((r) => r.orders === 0);
  if (q.performance === "attention") {
    out = out.filter(
      (r) =>
        r.labels.includes("needs_improvement") ||
        r.labels.includes("low_performer") ||
        r.labels.includes("inventory_risk")
    );
  }
  if (q.performance === "growing") out = out.filter((r) => r.labels.includes("growing"));
  if (q.inventoryHealth) {
    out = out.filter((r) => r.inventoryHealth === q.inventoryHealth);
  }

  const num = (k: string) => (q[k] != null && q[k] !== "" ? Number(q[k]) : null);
  const minOrders = num("minOrders");
  const maxOrders = num("maxOrders");
  const minUnits = num("minUnits");
  const maxUnits = num("maxUnits");
  const minRevenue = num("minRevenue");
  const maxRevenue = num("maxRevenue");
  const minProfit = num("minProfit");
  const maxProfit = num("maxProfit");
  const minMargin = num("minMargin");
  const maxMargin = num("maxMargin");
  const minPrice = num("minPrice");
  const maxPrice = num("maxPrice");
  const minInventory = num("minInventory");
  const maxInventory = num("maxInventory");
  const minGrowth = num("minGrowth");

  if (minOrders != null) out = out.filter((r) => r.orders >= minOrders);
  if (maxOrders != null) out = out.filter((r) => r.orders <= maxOrders);
  if (minUnits != null) out = out.filter((r) => r.unitsSold >= minUnits);
  if (maxUnits != null) out = out.filter((r) => r.unitsSold <= maxUnits);
  if (minRevenue != null) out = out.filter((r) => r.netSalesUSD >= minRevenue);
  if (maxRevenue != null) out = out.filter((r) => r.netSalesUSD <= maxRevenue);
  if (minProfit != null)
    out = out.filter((r) => r.estimatedProfitUSD != null && r.estimatedProfitUSD >= minProfit);
  if (maxProfit != null)
    out = out.filter((r) => r.estimatedProfitUSD != null && r.estimatedProfitUSD <= maxProfit);
  if (minMargin != null)
    out = out.filter((r) => r.profitMarginPct != null && r.profitMarginPct >= minMargin);
  if (maxMargin != null)
    out = out.filter((r) => r.profitMarginPct != null && r.profitMarginPct <= maxMargin);
  if (minPrice != null)
    out = out.filter((r) => r.sellingPrice != null && r.sellingPrice >= minPrice);
  if (maxPrice != null)
    out = out.filter((r) => r.sellingPrice != null && r.sellingPrice <= maxPrice);
  if (minInventory != null)
    out = out.filter((r) => r.inventory != null && r.inventory >= minInventory);
  if (maxInventory != null)
    out = out.filter((r) => r.inventory != null && r.inventory <= maxInventory);
  if (minGrowth != null)
    out = out.filter(
      (r) => r.periodChange.orders != null && r.periodChange.orders >= minGrowth
    );

  return out;
}

function sortRows(rows: ProductSalesRow[], sort: string | undefined, dir: string | undefined) {
  const desc = dir !== "asc";
  const key = sort ?? "netSalesUSD";
  const get = (r: ProductSalesRow): number | string => {
    switch (key) {
      case "name":
        return r.name.toLowerCase();
      case "orders":
        return r.orders;
      case "unitsSold":
        return r.unitsSold;
      case "grossSalesUSD":
        return r.grossSalesUSD;
      case "netSalesUSD":
        return r.netSalesUSD;
      case "estimatedProfitUSD":
        return r.estimatedProfitUSD ?? -Infinity;
      case "profitMarginPct":
        return r.profitMarginPct ?? -Infinity;
      case "growthScore":
        return r.growthScore;
      case "inventory":
        return r.inventory ?? -Infinity;
      case "refundRatePct":
        return r.refundRatePct ?? -Infinity;
      case "lastOrderAt":
        return r.lastOrderAt ?? "";
      case "avgUnitsPerOrder":
        return r.avgUnitsPerOrder ?? -Infinity;
      case "periodChangeOrders":
        return r.periodChange.orders ?? -Infinity;
      default:
        return r.netSalesUSD;
    }
  };
  return [...rows].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

async function buildRowsForRange(event: APIGatewayProxyEventV2) {
  const range = parseRange(event);
  const prev = previousEquivalentRange(range);
  const weights = await loadWeights();
  const catalog = await loadCatalog();

  const [currentPack, prevPack] = await Promise.all([
    loadProductSalesAccumulators(range),
    loadProductSalesAccumulators(prev),
  ]);

  const rows = buildAllProductSalesRows(currentPack.map, prevPack.map, catalog, {
    periodDays: daysInRange(range),
    periodLabel: range.label,
    weights,
    includeZeroSales: true,
  });

  const prevRows = buildAllProductSalesRows(prevPack.map, new Map(), catalog, {
    periodDays: daysInRange(prev),
    periodLabel: prev.label,
    weights,
    includeZeroSales: false,
  });

  return {
    range,
    prev,
    weights,
    catalog,
    currentPack,
    prevPack,
    rows,
    prevRows,
  };
}

export async function getProductSalesSummary(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();

  const built = await buildRowsForRange(event);
  const { range, prev, weights, rows, prevRows, currentPack } = built;
  const orderIds = collectUniqueOrderIds(currentPack.map);
  const prevOrderIds = collectUniqueOrderIds(built.prevPack.map);

  const summary = buildDashboardSummary(
    rows,
    prevRows,
    uniqueOrderCount(rows, orderIds),
    uniqueOrderCount(prevRows, prevOrderIds)
  );
  const rankings = buildRankings(rows, 10);
  const alerts = buildSmartAlerts(rows);

  const categories = rollupByDimension(rows, (r) => r.categorySlug ?? "uncategorized");
  const vendors = rollupByDimension(rows, (r) => r.vendorSlug || "unknown");

  const catAvg = new Map<string, number>();
  for (const c of categories) {
    if (c.productCount > 0) catAvg.set(c.key, c.orders / c.productCount);
  }
  const opportunities = buildOpportunities(rows, catAvg);

  const nameBySlug = new Map(rows.map((r) => [r.productSlug, r.name]));
  const coPurchases = topCoPurchases(currentPack.map, 25).map((e) => ({
    ...e,
    productName: nameBySlug.get(e.productSlug) ?? e.productSlug,
    otherName: nameBySlug.get(e.otherSlug) ?? e.otherSlug,
  }));

  const response: ProductSalesIntelSummaryResponse = {
    generatedAt: now(),
    source: currentPack.source,
    range: {
      preset: range.preset,
      label: range.label,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
    previousRange: {
      label: prev.label,
      from: prev.from.toISOString(),
      to: prev.to.toISOString(),
    },
    summary,
    rankings,
    alerts,
    opportunities,
    categories,
    vendors,
    coPurchases,
    growthScoreWeights: weights,
    definitions: DEFINITIONS,
  };

  return ok(response);
}

export async function listProductSalesProducts(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();

  const q = event.queryStringParameters ?? {};
  const built = await buildRowsForRange(event);
  const filtered = applyFilters(built.rows, q);
  const sorted = sortRows(filtered, q.sort, q.dir);
  const page = Math.max(1, Number(q.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(q.pageSize ?? 25) || 25));
  const start = (page - 1) * pageSize;

  const response: ProductSalesIntelListResponse = {
    generatedAt: now(),
    range: {
      preset: built.range.preset,
      label: built.range.label,
      from: built.range.from.toISOString(),
      to: built.range.to.toISOString(),
    },
    previousRange: {
      label: built.prev.label,
      from: built.prev.from.toISOString(),
      to: built.prev.to.toISOString(),
    },
    total: sorted.length,
    page,
    pageSize,
    products: sorted.slice(start, start + pageSize),
  };

  return ok(response);
}

export async function getProductSalesDetail(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();

  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("Product slug required");

  const q = event.queryStringParameters ?? {};
  const granularity = (q.granularity as TrendGranularity) || "daily";
  if (!["daily", "weekly", "monthly"].includes(granularity)) {
    return badRequest("granularity must be daily|weekly|monthly");
  }

  const built = await buildRowsForRange(event);
  const product = built.rows.find((r) => r.productSlug === slug);
  if (!product) return notFound("Product not found");

  const acc = built.currentPack.map.get(slug);
  const trend = buildTrendSeries(acc, granularity);
  const coPurchases = [...(acc?.coPurchase.entries() ?? [])]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([other, orderCount]) => ({
      slug: other,
      name: built.rows.find((r) => r.productSlug === other)?.name ?? other,
      orderCount,
    }));

  const response: ProductSalesIntelDetailResponse = {
    generatedAt: now(),
    range: {
      preset: built.range.preset,
      label: built.range.label,
      from: built.range.from.toISOString(),
      to: built.range.to.toISOString(),
    },
    previousRange: {
      label: built.prev.label,
      from: built.prev.from.toISOString(),
      to: built.prev.to.toISOString(),
    },
    product,
    trend,
    trendGranularity: granularity,
    recommendations: product.recommendations,
    coPurchases,
    orderAnalysis: {
      avgUnitsPerOrder: product.avgUnitsPerOrder,
      customerCount: product.customerCount,
      repeatPurchaseRate: null,
      geographicPerformance: null,
      segmentPerformance: null,
    },
    health: {
      salesDecline:
        product.periodChange.orders != null && product.periodChange.orders <= -30,
      refundProblems: product.refundRatePct != null && product.refundRatePct >= 8,
      inventoryProblems:
        product.inventoryHealth === "critical" || product.inventoryHealth === "low",
      pricingIssues:
        product.estimatedProfitUSD != null &&
        product.netSalesUSD >= 200 &&
        product.estimatedProfitUSD < product.netSalesUSD * 0.15,
      reviewProblems: product.ratingValue != null && product.ratingValue < 3.5,
      lowDemand: product.orders === 0 || product.growthScore < 35,
    },
    external: product.external,
  };

  return ok(response);
}

export async function compareProductSales(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();

  const q = event.queryStringParameters ?? {};
  const slugs = (q.slugs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (slugs.length < 2) return badRequest("Provide at least 2 slugs via ?slugs=a,b");

  const built = await buildRowsForRange(event);
  const products = slugs
    .map((s) => built.rows.find((r) => r.productSlug === s))
    .filter((r): r is ProductSalesRow => Boolean(r));

  if (products.length < 2) return badRequest("Need at least 2 matching products");

  const response: ProductSalesIntelCompareResponse = {
    generatedAt: now(),
    range: {
      preset: built.range.preset,
      label: built.range.label,
      from: built.range.from.toISOString(),
      to: built.range.to.toISOString(),
    },
    products,
  };
  return ok(response);
}

export async function rebuildProductSales(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const range = parseRange(event);
  const result = await rebuildProductSalesRange(range);
  return ok({
    rebuiltAt: now(),
    days: result.days,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });
}

export async function getProductSalesConfig(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const weights = await loadWeights();
  return ok({ growthScoreWeights: weights });
}

export async function updateProductSalesConfig(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const body = JSON.parse(event.body ?? "{}");
  const incoming = body.growthScoreWeights as Partial<GrowthScoreWeights> | undefined;
  if (!incoming || typeof incoming !== "object") {
    return badRequest("growthScoreWeights object required");
  }
  const weights: GrowthScoreWeights = {
    ...DEFAULT_GROWTH_SCORE_WEIGHTS,
    ...incoming,
  };
  for (const [k, v] of Object.entries(weights)) {
    if (typeof v !== "number" || v < 0 || v > 100) {
      return badRequest(`Invalid weight for ${k}`);
    }
  }
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: configKeys.productSalesIntel.pk,
        SK: configKeys.productSalesIntel.sk,
        growthScoreWeights: weights,
        updatedAt: now(),
      },
    })
  );
  return ok({ growthScoreWeights: weights, updatedAt: now() });
}

/** Full export payload (respects filters; client may also CSV locally). */
export async function exportProductSales(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const q = event.queryStringParameters ?? {};
  const built = await buildRowsForRange(event);
  const filtered = sortRows(applyFilters(built.rows, q), q.sort, q.dir);
  return ok({
    generatedAt: now(),
    range: {
      preset: built.range.preset,
      label: built.range.label,
      from: built.range.from.toISOString(),
      to: built.range.to.toISOString(),
    },
    definitions: DEFINITIONS,
    total: filtered.length,
    products: filtered,
  });
}
