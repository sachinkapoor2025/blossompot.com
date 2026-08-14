import { z } from "zod";

/** Marketplace vendor lifecycle (applications + active partners). */
export const MARKETPLACE_VENDOR_STATUSES = [
  "pending",
  "under_review",
  "approved",
  "active",
  "suspended",
  "rejected",
] as const;
export type MarketplaceVendorStatus = (typeof MARKETPLACE_VENDOR_STATUSES)[number];

export const VENDOR_BUSINESS_TYPES = [
  "florist",
  "cake_shop",
  "bakery",
  "gift_shop",
  "chocolates",
  "balloon_decor",
  "personalized_gifts",
  "other",
] as const;
export type VendorBusinessType = (typeof VENDOR_BUSINESS_TYPES)[number];

export const VENDOR_PRODUCT_APPROVAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "paused",
] as const;
export type VendorProductApprovalStatus = (typeof VENDOR_PRODUCT_APPROVAL_STATUSES)[number];

export const VENDOR_ORDER_ACTION_STATUSES = [
  "new",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
] as const;
export type VendorOrderActionStatus = (typeof VENDOR_ORDER_ACTION_STATUSES)[number];

export const VENDOR_LEDGER_STATUSES = ["pending", "approved", "payable", "paid"] as const;
export type VendorLedgerStatus = (typeof VENDOR_LEDGER_STATUSES)[number];

export const COMMISSION_MODES = ["percentage", "fixed"] as const;
export type CommissionMode = (typeof COMMISSION_MODES)[number];

export const VENDOR_HEALTH_BANDS = ["excellent", "good", "needs_attention", "at_risk"] as const;
export type VendorHealthBand = (typeof VENDOR_HEALTH_BANDS)[number];

export const vendorDeliveryZoneSchema = z.object({
  zipCodes: z.array(z.string().trim().min(3).max(10)).max(500).default([]),
  cities: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
  radiusMiles: z.number().positive().max(500).optional(),
  sameDay: z.boolean().default(false),
  nextDay: z.boolean().default(true),
  cutoffTimeLocal: z.string().trim().max(20).optional(),
  deliveryFee: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
});

export const marketplaceVendorApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(15),
  website: z.string().trim().url().max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(120).optional(),
  facebook: z.string().trim().max(200).optional(),
  businessType: z.enum(VENDOR_BUSINESS_TYPES),
  productCategories: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  deliveryZips: z.array(z.string().trim().min(3).max(10)).max(500).default([]),
  sameDayAvailable: z.boolean().default(false),
  businessHours: z.string().trim().max(500).optional(),
  yearsInBusiness: z.number().int().min(0).max(200).optional(),
  taxId: z.string().trim().max(80).optional(),
  paymentNotes: z.string().trim().max(500).optional(),
  minimumOrderValue: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  leadTimeHours: z.number().int().min(0).max(720).optional(),
  notes: z.string().trim().max(2000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  storePhotoUrls: z.array(z.string().url()).max(12).default([]),
  documentUrls: z.array(z.string().url()).max(12).default([]),
  acceptAgreement: z.literal(true),
  agreementVersion: z.string().trim().min(1).max(40).default("v1"),
});

export type MarketplaceVendorApplicationInput = z.infer<typeof marketplaceVendorApplicationSchema>;

export const marketplaceVendorSchema = z.object({
  vendorId: z.string().min(1),
  vendorSlug: z.string().min(1).max(80),
  status: z.enum(MARKETPLACE_VENDOR_STATUSES),
  businessName: z.string(),
  contactName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  businessType: z.enum(VENDOR_BUSINESS_TYPES),
  productCategories: z.array(z.string()).default([]),
  deliveryZone: vendorDeliveryZoneSchema.optional(),
  sameDayAvailable: z.boolean().default(false),
  businessHours: z.string().optional(),
  yearsInBusiness: z.number().optional(),
  taxId: z.string().optional(),
  paymentNotes: z.string().optional(),
  minimumOrderValue: z.number().optional(),
  deliveryFee: z.number().optional(),
  leadTimeHours: z.number().optional(),
  notes: z.string().optional(),
  logoUrl: z.string().optional(),
  storePhotoUrls: z.array(z.string()).default([]),
  documentUrls: z.array(z.string()).default([]),
  /** Override commission for this vendor (null = use category/global). */
  commissionMode: z.enum(COMMISSION_MODES).optional(),
  commissionValue: z.number().min(0).optional(),
  agreementVersion: z.string().optional(),
  agreementAcceptedAt: z.string().optional(),
  healthScore: z.number().min(0).max(100).optional(),
  healthBand: z.enum(VENDOR_HEALTH_BANDS).optional(),
  performance: z
    .object({
      acceptanceRate: z.number().optional(),
      cancellationRate: z.number().optional(),
      onTimeRate: z.number().optional(),
      orderVolume: z.number().optional(),
      revenue: z.number().optional(),
      avgRating: z.number().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
});

export type MarketplaceVendor = z.infer<typeof marketplaceVendorSchema>;

export const updateMarketplaceVendorStatusSchema = z.object({
  status: z.enum(MARKETPLACE_VENDOR_STATUSES),
  reviewNotes: z.string().trim().max(2000).optional(),
  temporaryPassword: z.string().min(8).max(64).optional(),
});

export const vendorLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(64),
});

export const vendorProductUpsertSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(8000).default(""),
  /** What BlossomPot pays the vendor (wholesale/partner cost). */
  vendorCost: z.number().positive(),
  /** Optional suggested retail for BlossomPot merchandising. */
  suggestedRetailPrice: z.number().positive().optional(),
  /** Floor BlossomPot should not sell below. */
  minSellPrice: z.number().positive().optional(),
  categorySlug: z.string().trim().min(1).max(80),
  images: z.array(z.string().url()).max(12).default([]),
  inventory: z.number().int().min(0).default(100),
  prepTimeHours: z.number().int().min(0).max(168).optional(),
  deliveryFee: z.number().min(0).optional(),
  sameDayAvailable: z.boolean().optional(),
  blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(60).optional(),
  tags: z.array(z.string()).max(30).default([]),
  submitForApproval: z.boolean().default(false),
});

export type VendorProductUpsertInput = z.infer<typeof vendorProductUpsertSchema>;

export const adminApproveVendorProductSchema = z.object({
  approvalStatus: z.enum(["approved", "rejected", "paused"]),
  /** Customer-facing sell price (after margin). Required when approving. */
  sellPrice: z.number().positive().optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  reviewNotes: z.string().max(2000).optional(),
});

export const vendorOrderActionSchema = z.object({
  action: z.enum(VENDOR_ORDER_ACTION_STATUSES),
  note: z.string().trim().max(1000).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  carrier: z.string().trim().max(40).optional(),
});

export const vendorCommissionRuleSchema = z.object({
  mode: z.enum(COMMISSION_MODES).default("percentage"),
  /** Percentage (e.g. 20) or fixed USD amount. */
  value: z.number().min(0),
});

export const vendorCommissionConfigSchema = z.object({
  global: vendorCommissionRuleSchema.default({ mode: "percentage", value: 20 }),
  byCategory: z.record(z.string(), vendorCommissionRuleSchema).default({}),
  byVendorSlug: z.record(z.string(), vendorCommissionRuleSchema).default({}),
  paymentProcessingFeePercent: z.number().min(0).max(15).default(2.9),
  paymentProcessingFeeFixed: z.number().min(0).default(0.3),
  updatedAt: z.string().optional(),
});

export type VendorCommissionConfig = z.infer<typeof vendorCommissionConfigSchema>;

export const CURRENT_VENDOR_AGREEMENT_VERSION = "v1-2026-08";
