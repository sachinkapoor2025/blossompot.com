import type { VendorCommissionConfig, CommissionMode } from "../schemas/marketplace-vendor";

export type PricingBreakdownInput = {
  vendorCost: number;
  sellPrice: number;
  deliveryFee?: number;
  taxAmount?: number;
  commissionMode?: CommissionMode;
  commissionValue?: number;
  paymentProcessingFeePercent?: number;
  paymentProcessingFeeFixed?: number;
};

export type PricingBreakdown = {
  vendorCost: number;
  sellPrice: number;
  deliveryFee: number;
  taxAmount: number;
  blossompotGrossMargin: number;
  commissionAmount: number;
  paymentProcessingFee: number;
  vendorPayable: number;
  netBlossompotRevenue: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function resolveCommissionRule(
  config: VendorCommissionConfig,
  opts: { vendorSlug?: string; categorySlug?: string }
): { mode: CommissionMode; value: number } {
  if (opts.vendorSlug && config.byVendorSlug[opts.vendorSlug]) {
    return config.byVendorSlug[opts.vendorSlug]!;
  }
  if (opts.categorySlug && config.byCategory[opts.categorySlug]) {
    return config.byCategory[opts.categorySlug]!;
  }
  return config.global;
}

/** Vendor cost → sell price → margin / fees / vendor payable (server-side source of truth). */
export function calculateMarketplacePricing(input: PricingBreakdownInput): PricingBreakdown {
  const vendorCost = round2(input.vendorCost);
  const sellPrice = round2(input.sellPrice);
  const deliveryFee = round2(input.deliveryFee ?? 0);
  const taxAmount = round2(input.taxAmount ?? 0);
  const mode = input.commissionMode ?? "percentage";
  const value = input.commissionValue ?? 20;
  const feePct = input.paymentProcessingFeePercent ?? 2.9;
  const feeFixed = input.paymentProcessingFeeFixed ?? 0.3;

  const blossompotGrossMargin = round2(Math.max(0, sellPrice - vendorCost));
  const commissionAmount =
    mode === "fixed" ? round2(value) : round2((sellPrice * value) / 100);
  const paymentProcessingFee = round2((sellPrice * feePct) / 100 + feeFixed);
  const vendorPayable = round2(Math.max(0, vendorCost));
  const netBlossompotRevenue = round2(
    sellPrice + deliveryFee - vendorPayable - paymentProcessingFee - taxAmount * 0
  );

  return {
    vendorCost,
    sellPrice,
    deliveryFee,
    taxAmount,
    blossompotGrossMargin,
    commissionAmount,
    paymentProcessingFee,
    vendorPayable,
    netBlossompotRevenue,
  };
}

/** Suggest a sell price from vendor cost + commission target (percentage mode). */
export function suggestSellPriceFromCost(
  vendorCost: number,
  commissionPercent: number
): number {
  if (commissionPercent >= 100) return round2(vendorCost * 1.25);
  return round2(vendorCost / (1 - commissionPercent / 100));
}

export function scoreVendorHealth(metrics: {
  acceptanceRate?: number;
  cancellationRate?: number;
  onTimeRate?: number;
  avgRating?: number;
}): { score: number; band: "excellent" | "good" | "needs_attention" | "at_risk" } {
  const acceptance = metrics.acceptanceRate ?? 80;
  const cancellation = metrics.cancellationRate ?? 5;
  const onTime = metrics.onTimeRate ?? 80;
  const rating = (metrics.avgRating ?? 4) * 20;
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        acceptance * 0.35 + onTime * 0.3 + rating * 0.25 + Math.max(0, 100 - cancellation * 8) * 0.1
      )
    )
  );
  const band =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs_attention" : "at_risk";
  return { score, band };
}
