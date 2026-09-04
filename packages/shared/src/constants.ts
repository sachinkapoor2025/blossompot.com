export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  ACCEPTED: "accepted",
  /** Paid order paused for review (fraud, underpricing, stock, etc.). */
  ON_HOLD: "on_hold",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  /** Carrier scan: package moving through network (USPS sync). */
  IN_TRANSIT: "in_transit",
  /** Carrier scan: out for delivery today (USPS sync). */
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  COMPLETE: "complete",
  /** Carrier delivery exception — still active until resolved. */
  DELIVERY_EXCEPTION: "delivery_exception",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

/** Allowed next statuses an admin can move an order to from its current status. */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.ON_HOLD,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.ACCEPTED]: [
    ORDER_STATUS.ON_HOLD,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.ON_HOLD]: [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.ON_HOLD,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.DELIVERY_EXCEPTION,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.IN_TRANSIT]: [
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.DELIVERY_EXCEPTION,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.DELIVERY_EXCEPTION,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.DELIVERY_EXCEPTION]: [
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETE,
    ORDER_STATUS.REFUNDED,
  ],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.COMPLETE, ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.COMPLETE]: [ORDER_STATUS.REFUNDED],
  /** Admin can revive a cancelled (non-refunded) order for fulfillment. */
  [ORDER_STATUS.CANCELLED]: [
    ORDER_STATUS.ON_HOLD,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PROCESSING,
  ],
  [ORDER_STATUS.REFUNDED]: [],
};

export const EVENT_TYPES = {
  PAGE_VIEW: "page_view",
  PRODUCT_VIEW: "product_view",
  SEARCH: "search",
  CART_ADD: "cart_add",
  CART_REMOVE: "cart_remove",
  CHECKOUT_START: "checkout_start",
  PURCHASE: "purchase",
  /** Time spent on a page before leave/navigation (metadata.durationMs). */
  SESSION_PING: "session_ping",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/** Raw analytics events expire after this many days (TTL); rollups are kept. */
export const EVENT_TTL_DAYS = 90;

export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export const PAYMENT_REGIONS = {
  US: "US",
  IN: "IN",
} as const;

export const PAYMENT_PROVIDERS = {
  STRIPE: "stripe",
  RAZORPAY: "razorpay",
} as const;

/** Default stock when creating products or seeding catalog. */
export const DEFAULT_PRODUCT_INVENTORY = 200;

/** Stock for Orange County hamper imports (keep cart-ready). */
export const ORANGE_COUNTY_PRODUCT_INVENTORY = 500;

/**
 * Backend-only vendor key for hamper fulfillment API / order tagging.
 * Never show this name on the storefront — customers only see "Gift Hamper".
 */
export const VENDOR_ORANGE_COUNTY = "orange-county" as const;

/**
 * Gift Baskets Overseas dropship partner (international catalog + fulfillment).
 * Public label: "Gift Baskets Overseas" — never expose partner login or API token.
 */
export const VENDOR_GBO = "gift-baskets-overseas" as const;

/** Default BlossomPot fulfillment key (catalog lines without product.vendorSlug). */
export const VENDOR_BLOSSOMPOT = "blossompot" as const;

/** Public category slug (legacy; prefer gift-hampers). */
export const ORANGE_COUNTY_CATEGORY_SLUG = "rakhi-hampers" as const;

/**
 * Hamper pricing from vendor cost (Excel). Uses retail margin on selling price:
 *   sale price = cost × 2.0  → 50% margin before coupons  ((P−C)/P)
 *   list/compare-at = cost × 2.5 → sale badge (~20% off list)
 *
 * After spin-the-wheel 6–10% off sale price, net margin stays ~44–47%
 * (≈40–44%+ band at the higher discount end).
 */
export const ORANGE_COUNTY_LIST_MARKUP = 2.5;
export const ORANGE_COUNTY_SALE_MARKUP = 2.0;

/** Email restock alert when inventory drops to this level or below. */
export const LOW_STOCK_THRESHOLD = 10;

export const LOW_STOCK_ALERT_EMAIL = "dgv@mydgv.com";

/** Minimum units sold to show in "Fast Selling" section and badge. */
export const FAST_SELLING_THRESHOLD = 10;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type PaymentRegion = (typeof PAYMENT_REGIONS)[keyof typeof PAYMENT_REGIONS];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];
