import { z } from "zod";
import { DEFAULT_PRODUCT_INVENTORY } from "../constants";
import { productRatingAggregateSchema } from "./review";

export const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.enum(["USD", "INR"]).default("USD"),
  categorySlug: z.string().min(1),
  /**
   * Extra storefront categories (e.g. hamper also listed under single-rakhi / kids-rakhi).
   * Primary GSI remains categorySlug; list APIs merge these in.
   */
  additionalCategorySlugs: z.array(z.string().min(1)).optional(),
  images: z.array(z.string().url()).default([]),
  sku: z.string().optional(),
  inventory: z.number().int().min(0).default(DEFAULT_PRODUCT_INVENTORY),
  tags: z.array(z.string()).default([]),
  /** Supplier / marketplace vendor key (e.g. orange-county). */
  vendorSlug: z.string().min(1).max(80).optional(),
  /** Wholesale cost from vendor — never expose on public storefront APIs. */
  vendorCost: z.number().positive().optional(),
  /**
   * Public storefront flag: show dry-fruit / chocolate add-on picker.
   * Set by API after stripping vendorSlug (true for BlossomPot, false for OC).
   */
  allowsAddons: z.boolean().optional(),
  /**
   * When true, coupons cannot discount this product (flash / fixed-price deals).
   * Also skips competitive storefront price cuts so the listed price stays exact.
   */
  couponExcluded: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  published: z.boolean().default(true),
  /** Set when low-stock email sent; cleared when restocked above threshold. */
  lowStockAlertSentAt: z.string().optional(),
  /** Lifetime units sold (incremented when order is paid). */
  unitsSold: z.number().int().min(0).optional(),
  /**
   * Denormalized star rating for Product JSON-LD / widgets.
   * Kept in sync when reviews are published under PRODUCT#slug / REVIEW#id.
   */
  ratingAggregate: productRatingAggregateSchema.optional(),
  /** Shipping weight in ounces (recommended for accurate USPS rates). */
  weightOz: z.number().positive().optional(),
  /** Package dimensions in inches (recommended for accurate USPS rates). */
  lengthIn: z.number().positive().optional(),
  widthIn: z.number().positive().optional(),
  heightIn: z.number().positive().optional(),
});

export const createProductSchema = productSchema.omit({ slug: true }).extend({
  name: z.string().min(1),
});

export const updateProductSchema = productSchema.partial().omit({ slug: true });

export const bulkProductRowSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  currency: z.enum(["USD", "INR"]).default("USD"),
  categorySlug: z.string().min(1),
  sku: z.string().optional(),
  inventory: z.coerce.number().int().min(0).default(DEFAULT_PRODUCT_INVENTORY),
  tags: z.string().optional(),
  vendorSlug: z.string().min(1).max(80).optional(),
  vendorCost: z.coerce.number().positive().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  published: z.coerce.boolean().default(true),
  weightOz: z.coerce.number().positive().optional(),
  lengthIn: z.coerce.number().positive().optional(),
  widthIn: z.coerce.number().positive().optional(),
  heightIn: z.coerce.number().positive().optional(),
});

export type Product = z.infer<typeof productSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkProductRow = z.infer<typeof bulkProductRowSchema>;
