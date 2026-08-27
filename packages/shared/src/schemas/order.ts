import { z } from "zod";
import { cartItemSchema } from "./cart";
import { ORDER_STATUS } from "../constants";
import { checkoutAttributionSchema, orderAttributionSchema } from "./attribution";

/** International phone: 10–15 digits; allows +, spaces, dashes, parentheses. */
export function isValidShippingPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s().-]{10,22}$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(isValidShippingPhone, {
    message: "Enter a valid phone number with country code (e.g. +1 408 555 0100 or +91 98765 43210)",
  });

export const shippingAddressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(2),
  phone: phoneSchema,
  email: z.string().email(),
  /** Buyer / sender name — shown on shipping label so the recipient knows who sent the gift. */
  senderName: z.string().trim().max(80).optional(),
  /** Personal note from sister — printed on the shipping label. */
  senderMessage: z.string().trim().max(500).optional(),
});

export const DEFAULT_SENDER_MESSAGE =
  "Thinking of you — hope this gift brings a smile. With love from BlossomPot.";

export const checkoutShippingAddressSchema = shippingAddressSchema.extend({
  senderName: z
    .string()
    .trim()
    .min(1, "Sender name is required")
    .max(80, "Sender name is too long"),
  senderMessage: z
    .string()
    .trim()
    .min(10, "Please write a short message for your brother")
    .max(500, "Message is too long (max 500 characters)"),
});

/** Line assignment for a checkout shipment (must partition the cart). */
export const checkoutShipmentItemSchema = z.object({
  productSlug: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkoutShipmentSchema = z.object({
  shippingAddress: checkoutShippingAddressSchema,
  items: z.array(checkoutShipmentItemSchema).min(1),
});

export const checkoutSchema = z.object({
  shippingAddress: checkoutShippingAddressSchema,
  /**
   * Optional multi-address split. When omitted, the whole cart ships to
   * `shippingAddress`. When present, must cover every cart line exactly once.
   */
  shipments: z.array(checkoutShipmentSchema).min(1).max(40).optional(),
  paymentMethod: z.enum(["stripe", "razorpay"]),
  /** Customer-selected display/checkout currency (from currency switcher). */
  checkoutCurrency: z.enum(["USD", "INR"]).optional(),
  /** Live USD→INR rate shown to the customer (optional; server validates). */
  usdInrRate: z.number().positive().max(200).optional(),
  /** Welcome or promo coupon (e.g. GIFT-ABC123). */
  couponCode: z.string().min(4).max(32).optional(),
  /** Customer-requested delivery date (YYYY-MM-DD), max 2026-08-28. */
  preferredDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  /** Customer override — must match a returned rate. */
  shippingServiceCode: z.string().optional(),
  shippingRateId: z.string().optional(),
  /** First/last-touch marketing attribution snapshot from the browser. */
  attribution: checkoutAttributionSchema.optional(),
});

/** Persisted per-delivery package on an order. */
export const orderShipmentSchema = z.object({
  shipmentId: z.string(),
  shippingAddress: shippingAddressSchema,
  items: z.array(cartItemSchema).min(1),
  subtotal: z.number(),
  shipping: z.number().default(0),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippingServiceCode: z.string().optional(),
  shippingServiceName: z.string().optional(),
  shippingRateId: z.string().optional(),
  estimatedLabelCost: z.number().optional(),
  labelCost: z.number().optional(),
  labelPdfUrl: z.string().optional(),
  labelStatus: z.enum(["none", "queued", "purchased", "failed"]).optional(),
  labelError: z.string().optional(),
});

const orderStatusEnum = z.enum([
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.PAID,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ON_HOLD,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERY_EXCEPTION,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETE,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

export const trackingEventSchema = z.object({
  date: z.string(),
  description: z.string(),
  location: z.string().optional(),
  code: z.string().optional(),
});

export const orderStatusHistoryEntrySchema = z.object({
  status: orderStatusEnum,
  at: z.string(),
  note: z.string().optional(),
});

export const orderSchema = z.object({
  orderId: z.string(),
  /**
   * Human-readable order number for staff, customers, and vendors.
   * Orange County fulfill orders: OC10001…
   * All other BlossomPot orders: US10001…
   */
  orderNumber: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  items: z.array(cartItemSchema),
  subtotal: z.number(),
  discount: z.number().default(0),
  couponCode: z.string().optional(),
  shipping: z.number().default(0),
  tax: z.number().default(0),
  total: z.number(),
  currency: z.enum(["USD", "INR"]),
  /** Distinct vendorSlug values present on line items (for vendor order APIs). */
  vendorSlugs: z.array(z.string()).optional(),
  status: orderStatusEnum,
  statusHistory: z.array(orderStatusHistoryEntrySchema).optional(),
  /** Primary / first delivery address (always set; mirrors shipments[0] when multi). */
  shippingAddress: shippingAddressSchema,
  /** Snapshot of serviceability at order time — do not rewrite if vendor areas change later. */
  deliverySnapshot: z
    .object({
      countryCode: z.string(),
      postalCode: z.string(),
      checkedAt: z.string(),
      vendors: z
        .array(
          z.object({
            vendorSlug: z.string(),
            serviceable: z.boolean(),
            matchedRuleId: z.string().optional(),
            matchedScope: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  /** Multi-address deliveries. Omitted on older single-address orders. */
  shipments: z.array(orderShipmentSchema).optional(),
  paymentProvider: z.enum(["stripe", "razorpay"]).optional(),
  paymentIntentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  /** Normalized carrier phase from last sync (label_created|shipped|in_transit|…). */
  carrierTrackingStatus: z.string().max(80).optional(),
  /** Human-readable carrier summary (e.g. Delivered, In/At Mailbox). */
  carrierStatusDetail: z.string().max(500).optional(),
  /** ISO timestamp of last successful/attempted carrier sync. */
  lastTrackingSyncAt: z.string().optional(),
  /** Last sync error message (cleared on success). */
  lastTrackingSyncError: z.string().max(500).optional(),
  /** Append-only carrier scan events (deduped). */
  trackingEvents: z.array(trackingEventSchema).max(50).optional(),
  /** Last order.status for which a customer status email was sent (dedupe). */
  lastTrackingNotificationStatus: z.string().optional(),
  /** Last order.status for which customer email/WhatsApp status notify ran (dedupe). */
  lastCustomerStatusNotification: z.string().optional(),
  /**
   * Per-vendor fulfillment (tracking) for mixed Orange County + BlossomPot carts.
   * Legacy single-vendor orders may only have top-level trackingNumber/carrier.
   */
  vendorFulfillments: z
    .array(
      z.object({
        vendorSlug: z.string().min(1).max(80),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]).optional(),
        updatedAt: z.string().optional(),
      })
    )
    .optional(),
  /** Last shipment status string received from vendor tracking API (e.g. in_transit). */
  vendorShipmentStatus: z.string().max(80).optional(),
  adminNotes: z.string().max(2000).optional(),
  estimatedDeliveryAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  /** ISO timestamp when post-delivery review email should send (deliveredAt + 1 day). */
  reviewEmailDueAt: z.string().optional(),
  /** Set after review request email is sent (idempotency). */
  reviewEmailSentAt: z.string().optional(),
  /** Last pending-payment reminder send time (ISO). */
  pendingPaymentReminderLastSentAt: z.string().optional(),
  /** America/New_York calendar day (YYYY-MM-DD) of last pending-payment reminder. */
  pendingPaymentReminderLastDateKey: z.string().optional(),
  /** How many pending-payment reminder emails have been sent. */
  pendingPaymentReminderCount: z.number().int().min(0).optional(),
  /** USPS rate-shopping metadata (customer may still pay $0 when mode is free). */
  shippingServiceCode: z.string().optional(),
  shippingServiceName: z.string().optional(),
  shippingRateId: z.string().optional(),
  estimatedLabelCost: z.number().optional(),
  labelCost: z.number().optional(),
  labelPdfUrl: z.string().optional(),
  labelStatus: z.enum(["none", "queued", "purchased", "failed"]).optional(),
  labelError: z.string().optional(),
  addressValidated: z.boolean().optional(),
  /**
   * Marketing attribution snapshot (first/last/assisted touch).
   * Stored on the order so Order Route survives analytics event TTL.
   */
  attribution: orderAttributionSchema.optional(),
});

/** Admin order status update payload. */
export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum.optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  /** Upsert per-vendor tracking (mixed OC + BlossomPot orders). */
  vendorFulfillments: z
    .array(
      z.object({
        vendorSlug: z.string().min(1).max(80),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]).optional(),
      })
    )
    .optional(),
  note: z.string().max(500).optional(),
  adminNotes: z.string().max(2000).optional(),
  estimatedDeliveryAt: z.string().optional(),
  shippingServiceCode: z.string().optional(),
  shippingServiceName: z.string().optional(),
  shippingRateId: z.string().optional(),
  estimatedLabelCost: z.number().optional(),
  labelStatus: z.enum(["none", "queued", "purchased", "failed"]).optional(),
  labelError: z.string().optional(),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CheckoutShipment = z.infer<typeof checkoutShipmentSchema>;
export type OrderShipment = z.infer<typeof orderShipmentSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>;
export type OrderStatusHistoryEntry = z.infer<typeof orderStatusHistoryEntrySchema>;
export type Order = z.infer<typeof orderSchema> & {
  createdAt: string;
  updatedAt: string;
};
