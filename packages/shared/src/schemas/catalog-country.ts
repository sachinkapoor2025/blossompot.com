import { z } from "zod";

/** Administrative on/off state. Names and postal rules stay in the country catalog. */
export const catalogCountrySettingSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  enabled: z.boolean(),
});

export type CatalogCountrySetting = z.infer<typeof catalogCountrySettingSchema>;

export const catalogCountriesConfigSchema = z.object({
  countries: z.array(catalogCountrySettingSchema).max(300),
  /** Enabled ISO code used for indexable homepage SEO. Omitted on older rows. */
  defaultCountry: z.string().trim().max(16).optional(),
  updatedAt: z.string(),
  updatedBy: z.string().trim().max(160).optional(),
});

export type CatalogCountriesConfig = z.infer<typeof catalogCountriesConfigSchema>;

export const updateCatalogCountriesSchema = z.object({
  countries: z
    .array(
      z.object({
        countryCode: z.string(),
        enabled: z.boolean(),
      })
    )
    .max(300),
  /** Blank or omitted keeps the US-then-first fallback. A disabled code is rejected. */
  defaultCountry: z.string().trim().max(16).nullish(),
});

export type UpdateCatalogCountriesInput = z.infer<typeof updateCatalogCountriesSchema>;
