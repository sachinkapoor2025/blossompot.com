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

export const catalogVendorSchema = z.object({
  vendorSlug: z.enum(CATALOG_VENDOR_SLUGS),
  vendorName: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
  integrationType: z.enum(CATALOG_INTEGRATION_TYPES),
  /** ISO-3166 alpha-2. Empty is allowed only while the vendor is disabled. */
  deliveryCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(50),
  updatedAt: z.string(),
  updatedBy: z.string().trim().max(160).optional(),
});

export type CatalogVendor = z.infer<typeof catalogVendorSchema>;

export const updateCatalogVendorSchema = z.object({
  enabled: z.boolean(),
  deliveryCountries: z.array(z.string()).max(50),
});

export type UpdateCatalogVendorInput = z.infer<typeof updateCatalogVendorSchema>;
