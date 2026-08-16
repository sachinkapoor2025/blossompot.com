import { z } from "zod";
import { SERVICE_RULE_TYPES, SERVICE_SCOPES } from "../lib/serviceability";

export const deliveryLocationInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(2),
  postalCode: z.string().trim().min(2).max(16),
  stateCode: z.string().trim().max(8).optional(),
  city: z.string().trim().max(80).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const vendorServiceAreaInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(2),
  scope: z.enum(SERVICE_SCOPES),
  ruleType: z.enum(SERVICE_RULE_TYPES).default("ALLOW"),
  stateCode: z.string().trim().max(8).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(16).optional(),
  postalPrefix: z.string().trim().max(12).optional(),
  radius: z.number().positive().max(500).optional(),
  radiusUnit: z.enum(["mi", "km"]).optional(),
  originLat: z.number().min(-90).max(90).optional(),
  originLng: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const vendorServiceAreaImportRowSchema = z.object({
  country_code: z.string().trim().min(2).max(2),
  state_code: z.string().trim().max(8).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postal_code: z.string().trim().max(16).optional().or(z.literal("")),
  postal_prefix: z.string().trim().max(12).optional().or(z.literal("")),
  scope: z.enum(SERVICE_SCOPES).optional(),
  rule: z.enum(SERVICE_RULE_TYPES).default("ALLOW"),
});

export const vendorServiceAreaUpdateSchema = vendorServiceAreaInputSchema.partial();

export const checkServiceabilitySchema = deliveryLocationInputSchema;

export type DeliveryLocationInputDto = z.infer<typeof deliveryLocationInputSchema>;
export type VendorServiceAreaInput = z.infer<typeof vendorServiceAreaInputSchema>;
