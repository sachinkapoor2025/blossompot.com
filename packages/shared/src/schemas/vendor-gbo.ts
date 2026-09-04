import { z } from "zod";

/** Upstream Gift Baskets Overseas REST base (v1). */
export const GBO_UPSTREAM_BASE_URL = "https://www.giftbasketsoverseas.com/api/v1";

export const GBO_PAYMENT_TYPES = ["monthlyBilling", "balance"] as const;
export type GboPaymentType = (typeof GBO_PAYMENT_TYPES)[number];

export const gboCountrySchema = z.object({
  id: z.string().min(1),
  country: z.string().min(1),
  iso_code: z.string().min(2).max(2),
});

export const gboCategorySchema = z.object({
  id: z.union([z.number(), z.string()]),
  code: z.string().optional(),
  name: z.string().min(1),
  type: z.string().optional(),
});

export const gboGiftSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  delivery_days: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]),
  image: z.string().optional(),
  description: z.string().optional(),
  contents: z.string().optional(),
  priority: z.union([z.number(), z.string()]).optional(),
  categories: z.array(z.string()).optional(),
});

export const gboGiftQuerySchema = z.object({
  country: z
    .string()
    .trim()
    .length(2, "country must be a 2-letter ISO code")
    .transform((v) => v.toUpperCase()),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  category: z.string().trim().min(1).max(80).optional(),
  sandbox: z.coerce.boolean().optional(),
});

export const gboGiftDetailQuerySchema = z.object({
  country: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
  productId: z.coerce.number().int().positive(),
  sandbox: z.coerce.boolean().optional(),
});

export const gboCreateOrderGiftSchema = z.object({
  id: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
});

export const gboCreateOrderSchema = z.object({
  country_iso_alpha2: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
  order_id: z.union([z.number().int().positive(), z.string().min(1).max(40)]),
  payment: z.object({
    type: z.enum(GBO_PAYMENT_TYPES),
    amount: z.coerce.number().nonnegative(),
  }),
  gifts: z.array(gboCreateOrderGiftSchema).min(1).max(40),
  buyer: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(1).max(40),
    email: z.string().email().optional(),
  }),
  recipient: z.object({
    name: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(80),
    zip: z.string().trim().min(1).max(20),
    phone: z.string().trim().min(1).max(40),
    state: z.string().trim().min(1).max(80),
  }),
  gift_card_text: z.string().trim().max(180).optional(),
  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  sandbox: z.boolean().optional(),
});

export const gboCreateOrderResponseSchema = z.object({
  invoice: z.union([z.string(), z.number()]).optional(),
  order_id: z.union([z.string(), z.number()]).optional(),
});

export const gboOrderDetailsSchema = z.object({
  invoice: z.union([z.string(), z.number()]).optional(),
  order_id: z.union([z.string(), z.number()]).optional(),
  status: z.union([z.number(), z.string()]).optional(),
  recipient: z
    .object({
      name: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  greeting_card: z.string().optional(),
  delivery_date: z.string().optional(),
  order_total: z.union([z.string(), z.number()]).optional(),
  order_placed: z.union([z.string(), z.number()]).optional(),
  tracking: z
    .object({
      status: z.union([z.number(), z.string()]).optional(),
      number: z.string().optional(),
      link: z.string().optional(),
    })
    .optional(),
});

/** Snapshot stored on our BlossomPot order after a GBO place/sync. */
export const orderGboFulfillmentSchema = z.object({
  partnerOrderId: z.number().int().positive(),
  invoice: z.string().optional(),
  statusId: z.number().int().optional(),
  statusLabel: z.string().max(120).optional(),
  placedAt: z.string().optional(),
  lastSyncAt: z.string().optional(),
  lastError: z.string().max(500).optional(),
  trackingNumber: z.string().max(80).optional(),
  trackingLink: z.string().max(500).optional(),
});

export type GboCountry = z.infer<typeof gboCountrySchema>;
export type GboCategory = z.infer<typeof gboCategorySchema>;
export type GboGift = z.infer<typeof gboGiftSchema>;
export type GboGiftQuery = z.infer<typeof gboGiftQuerySchema>;
export type GboCreateOrderInput = z.infer<typeof gboCreateOrderSchema>;
export type GboOrderDetails = z.infer<typeof gboOrderDetailsSchema>;
export type OrderGboFulfillment = z.infer<typeof orderGboFulfillmentSchema>;
