import { z } from "zod";
import { VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_GBO, VENDOR_ORANGE_COUNTY } from "../constants";

/** Built-in catalog sources. Not marketplace applicant slugs. */
export const CATALOG_VENDOR_SLUGS = [
  VENDOR_BLOSSOMPOT,
  VENDOR_ORANGE_COUNTY,
  VENDOR_GBO,
  VENDOR_FNP,
] as const;

export type CatalogVendorSlug = (typeof CATALOG_VENDOR_SLUGS)[number];

export const CATALOG_INTEGRATION_TYPES = ["owned", "local-catalog", "partner-api", "excel"] as const;
export type CatalogIntegrationType = (typeof CATALOG_INTEGRATION_TYPES)[number];

/** Informational catalog storage. Not a selectable backend. */
export const CATALOG_STORAGE_LABEL = "DynamoDB";

/** Days a trashed catalog vendor stays recoverable. No automatic purge runs from this value. */
export const CATALOG_VENDOR_TRASH_DAYS = 30;

export const catalogVendorSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(64);

export const catalogVendorSchema = z.object({
  vendorSlug: catalogVendorSlugSchema,
  vendorName: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
  integrationType: z.enum(CATALOG_INTEGRATION_TYPES),
  /** ISO-3166 alpha-2. Empty is allowed only while the vendor is disabled. */
  deliveryCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(50),
  /** Business source label. Separate from the config-versus-default record origin. */
  sourceName: z.string().trim().max(160).optional(),
  /** Inventory applied only when a new product or import omits inventory. */
  defaultInventory: z.number().int().min(0).max(100000).optional(),
  trashedAt: z.string().min(1).optional(),
  trashExpiresAt: z.string().min(1).optional(),
  updatedAt: z.string(),
  updatedBy: z.string().trim().max(160).optional(),
});

export type CatalogVendor = z.infer<typeof catalogVendorSchema>;

export const updateCatalogVendorSchema = z.object({
  enabled: z.boolean(),
  deliveryCountries: z.array(z.string()).max(50),
  vendorName: z.string().trim().min(1).max(120).optional(),
  integrationType: z.enum(CATALOG_INTEGRATION_TYPES).optional(),
  sourceName: z.string().trim().max(160).optional(),
  defaultInventory: z.number().int().min(0).max(100000).nullable().optional(),
});

export type UpdateCatalogVendorInput = z.infer<typeof updateCatalogVendorSchema>;

export const createCatalogVendorSchema = z.object({
  vendorName: z.string().trim().min(1).max(120),
  vendorSlug: catalogVendorSlugSchema,
  integrationType: z.enum(CATALOG_INTEGRATION_TYPES),
  deliveryCountries: z.array(z.string()).max(50),
  enabled: z.boolean(),
  sourceName: z.string().trim().max(160).optional(),
  defaultInventory: z.number().int().min(0).max(100000).optional(),
});

export type CreateCatalogVendorInput = z.infer<typeof createCatalogVendorSchema>;

export const trashCatalogVendorSchema = z.object({
  confirmName: z.string().trim().min(1).max(120),
});
