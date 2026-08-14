/**
 * Product Sales Intelligence — API response shapes (admin).
 * External/marketing metrics are typed as nullable for future GA/ads hooks.
 */

import type {
  CoPurchaseEdge,
  DashboardSummary,
  DimensionPerformance,
  GrowthScoreWeights,
  ProductRecommendation,
  ProductSalesDatePreset,
  ProductSalesRow,
  ProductTrendPoint,
  RevenueOpportunity,
  SmartAlert,
  TrendGranularity,
} from "../lib/product-sales-intelligence";

export type ProductSalesIntelSummaryResponse = {
  generatedAt: string;
  source: "orders" | "rollups" | "mixed";
  range: {
    preset: ProductSalesDatePreset;
    label: string;
    from: string;
    to: string;
  };
  previousRange: {
    label: string;
    from: string;
    to: string;
  };
  summary: DashboardSummary;
  rankings: {
    byOrders: ProductSalesRow[];
    byUnits: ProductSalesRow[];
    byRevenue: ProductSalesRow[];
    byProfit: ProductSalesRow[];
    byMargin: ProductSalesRow[];
    needingAttention: ProductSalesRow[];
  };
  alerts: SmartAlert[];
  opportunities: RevenueOpportunity[];
  categories: DimensionPerformance[];
  vendors: DimensionPerformance[];
  coPurchases: Array<
    CoPurchaseEdge & {
      productName: string;
      otherName: string;
    }
  >;
  growthScoreWeights: GrowthScoreWeights;
  /** Explicit calculation notes for admins. */
  definitions: {
    grossRevenue: string;
    netRevenue: string;
    estimatedProfit: string;
    refunds: string;
    excludedOrders: string;
  };
};

export type ProductSalesIntelListResponse = {
  generatedAt: string;
  range: ProductSalesIntelSummaryResponse["range"];
  previousRange: ProductSalesIntelSummaryResponse["previousRange"];
  total: number;
  page: number;
  pageSize: number;
  products: ProductSalesRow[];
};

export type ProductSalesIntelDetailResponse = {
  generatedAt: string;
  range: ProductSalesIntelSummaryResponse["range"];
  previousRange: ProductSalesIntelSummaryResponse["previousRange"];
  product: ProductSalesRow;
  trend: ProductTrendPoint[];
  trendGranularity: TrendGranularity;
  recommendations: ProductRecommendation[];
  coPurchases: Array<{ slug: string; name: string; orderCount: number }>;
  orderAnalysis: {
    avgUnitsPerOrder: number | null;
    customerCount: number;
    /** Repeat purchase rate unavailable without full customer order history join — reserved. */
    repeatPurchaseRate: number | null;
    geographicPerformance: null;
    segmentPerformance: null;
  };
  health: {
    salesDecline: boolean;
    refundProblems: boolean;
    inventoryProblems: boolean;
    pricingIssues: boolean;
    reviewProblems: boolean;
    lowDemand: boolean;
  };
  external: ProductSalesRow["external"];
};

export type ProductSalesIntelCompareResponse = {
  generatedAt: string;
  range: ProductSalesIntelSummaryResponse["range"];
  products: ProductSalesRow[];
};

export type ProductSalesIntelConfig = {
  growthScoreWeights: GrowthScoreWeights;
  updatedAt?: string;
};
