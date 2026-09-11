import {
  GBO_CATEGORY_SLUG,
  GBO_PRODUCT_INVENTORY,
  ORDER_STATUS,
  VENDOR_GBO,
} from "../constants";
import type { OrderStatus } from "../constants";
import type { GboGift } from "../schemas/vendor-gbo";
import type { Product } from "../schemas/product";
import { roundMoney } from "./vendor-pricing";

/** SKU stored on cart/order lines for live GBO gifts: `gbo:US:10215`. */
export const GBO_SKU_RE = /^gbo:([A-Za-z]{2}):(\d+)$/i;

/** Product slug prefix: `gbo-us-10215-natural-selection`. */
export const GBO_SLUG_RE = /^gbo-([a-z]{2})-(\d+)(?:-|$)/i;

export type GboLineRef = {
  country: string;
  productId: number;
};

export function isGboVendor(slug?: string | null): boolean {
  return (slug ?? "").trim() === VENDOR_GBO;
}

export function formatGboSku(country: string, productId: number): string {
  return `gbo:${country.trim().toUpperCase()}:${productId}`;
}

export function slugifyGboName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatGboProductSlug(country: string, productId: number, name?: string): string {
  const iso = country.trim().toLowerCase();
  const tail = name?.trim() ? `-${slugifyGboName(name)}` : "";
  return `gbo-${iso}-${productId}${tail}`;
}

function normalizeGboLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PRIMARY_CATEGORY_ORDER = [
  "cakes",
  "flowers",
  "flower-bouquets",
  "birthday-gifts",
  "valentines-day-gifts",
  "anniversary-gifts",
  "wedding-gifts",
  "mothers-day-gifts",
  "gift-hampers",
  "personalized-gifts",
  "same-day-gifts",
  GBO_CATEGORY_SLUG,
] as const;

/**
 * Map GBO gift tags onto BlossomPot nav categories so Flowers / Cakes / Hampers
 * can list partner inventory (a gift can appear in more than one).
 */
export function mapGboGiftStorefrontCategories(gift: {
  name?: string;
  categories?: string[];
}): { categorySlug: string; additionalCategorySlugs: string[] } {
  const labels = (gift.categories ?? []).map((c) => normalizeGboLabel(String(c)));
  const text = `${normalizeGboLabel(gift.name ?? "")} ${labels.join(" ")}`;
  const matched = new Set<string>([GBO_CATEGORY_SLUG]);

  if (/\bflower/.test(text)) matched.add("flowers");
  if (/\bbouquet|arrangement/.test(text)) {
    matched.add("flowers");
    matched.add("flower-bouquets");
  }
  if (/\bcake|mooncake/.test(text)) matched.add("cakes");
  if (/\bbirthday/.test(text)) matched.add("birthday-gifts");
  if (/\banniversary/.test(text)) matched.add("anniversary-gifts");
  if (/valentine/.test(text)) matched.add("valentines-day-gifts");
  if (/\bwedding/.test(text)) matched.add("wedding-gifts");
  if (/\bmother/.test(text)) matched.add("mothers-day-gifts");
  if (
    /\bgourmet|wine|champagne|chocolate|fruit basket|gift basket|gift tower|beer |spirits|meat and cheese|care package|hamper/.test(
      text
    )
  ) {
    matched.add("gift-hampers");
  }
  if (/\bcustom|spa |personalized|toys and games|accessories/.test(text)) {
    matched.add("personalized-gifts");
  }
  if (matched.has("flowers") || matched.has("cakes")) matched.add("same-day-gifts");
  if (matched.size === 1) matched.add("gift-hampers");

  const categorySlug = PRIMARY_CATEGORY_ORDER.find((slug) => matched.has(slug)) ?? GBO_CATEGORY_SLUG;
  const additionalCategorySlugs = [...matched].filter((slug) => slug !== categorySlug).sort();
  return { categorySlug, additionalCategorySlugs };
}

export function productInStorefrontCategory(
  product: { categorySlug?: string | null; additionalCategorySlugs?: string[] | null },
  categorySlug: string
): boolean {
  const slug = categorySlug.trim();
  if (!slug) return false;
  if (product.categorySlug === slug) return true;
  return product.additionalCategorySlugs?.includes(slug) ?? false;
}

export function gboImageUrl(image?: string | null): string | undefined {
  const raw = (image ?? "").trim();
  if (!raw) return undefined;
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `https://www.giftbasketsoverseas.com${path}`;
}

function decodeGboEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'");
}

/** Turn partner HTML (bold/br/li) into readable plain text. */
export function stripGboMarkup(raw: string): string {
  return decodeGboEntities(
    raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|b|strong)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isGboOpsNote(line: string): boolean {
  return /^attention\b/i.test(line) || /do not substitute brands/i.test(line);
}

/**
 * Customer-facing contents bullets from GBO `contents` / description HTML.
 * Drops partner ops notes and does not truncate the list into a broken snippet.
 */
export function parseGboContentsLines(raw: string): string[] {
  const fromIncludes = raw.match(/Includes:\s*([\s\S]+)/i);
  const body = stripGboMarkup(fromIncludes ? fromIncludes[1]! : raw);
  if (!body) return [];
  const chunks = body
    .split(/\n+|(?:;\s*)(?=-)|(?:\s+-\s+)/)
    .map((line) =>
      line
        .replace(/^[-•*]+\s*/, "")
        .replace(/;+\s*$/, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length > 1 && !isGboOpsNote(line));
  return [...new Set(chunks)].slice(0, 20);
}

/**
 * Map a GBO catalog gift to a BlossomPot product.
 * Sell at GBO retail (`price_retail`); `price` is reseller cost (~10% off).
 * Extra storefront margin is allowed — we do not cap sell price to vendor cost.
 */
/** Numeric GBO gift id, or undefined when the upstream id is not a positive integer. */
export function gboGiftNumericId(gift: { id: number | string }): number | undefined {
  const n = coerceGboNumber(gift.id);
  if (n == null || !Number.isInteger(n) || n <= 0) return undefined;
  return n;
}

export function gboGiftToProduct(country: string, gift: GboGift, nowIso?: string): Product {
  const iso = country.trim().toUpperCase();
  const productId = gboGiftNumericId(gift) ?? 0;
  const vendorCost = coerceGboNumber(gift.price) ?? 0;
  const retail = coerceGboNumber(gift.price_retail);
  const sell =
    retail && retail > 0 ? roundMoney(retail) : roundMoney(Math.max(vendorCost, 0.01));
  const ts = nowIso ?? new Date().toISOString();
  const image = gboImageUrl(gift.image);
  const descriptionPlain = coerceGboString(gift.description)
    ? stripGboMarkup(coerceGboString(gift.description)!)
    : "";
  const contentsLines = parseGboContentsLines(coerceGboString(gift.contents) ?? "");
  const descriptionParts = [
    descriptionPlain,
    contentsLines.length ? `Includes:\n${contentsLines.map((line) => `- ${line}`).join("\n")}` : "",
  ].filter(Boolean);
  const days = coerceGboNumber(gift.delivery_days);
  const storefrontCats = mapGboGiftStorefrontCategories(gift);
  return {
    slug: formatGboProductSlug(iso, productId, gift.name),
    name: gift.name,
    description: descriptionParts.join("\n\n") || gift.name,
    shortDescription: (descriptionPlain || contentsLines[0] || gift.name).slice(0, 320),
    price: sell,
    currency: "USD",
    categorySlug: storefrontCats.categorySlug,
    additionalCategorySlugs: storefrontCats.additionalCategorySlugs,
    images: image ? [image] : [],
    sku: formatGboSku(iso, productId),
    inventory: GBO_PRODUCT_INVENTORY,
    tags: ["overseas", "gift-basket", iso.toLowerCase(), ...(gift.categories ?? []).slice(0, 8)],
    vendorSlug: VENDOR_GBO,
    ...(vendorCost > 0 ? { vendorCost: roundMoney(vendorCost) } : {}),
    couponExcluded: true,
    allowsAddons: false,
    published: true,
    indexable: false,
    internationalDelivery: true,
    fulfilledByName: "International delivery partner",
    deliveryFee: 0, // customer shipping is charged at checkout (GBO_FLAT_SHIPPING_USD)
    ...(days && days > 0 && days <= 168 ? { prepTimeHours: Math.round(days) * 24 } : {}),
    createdAt: ts,
    updatedAt: ts,
  };
}

export function productMatchesSearchQuery(
  product: Pick<Product, "name" | "shortDescription" | "description" | "categorySlug" | "additionalCategorySlugs" | "tags">,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    product.name,
    product.shortDescription,
    product.description,
    product.categorySlug,
    ...(product.additionalCategorySlugs ?? []),
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function parseGboSku(sku?: string | null): GboLineRef | null {
  const m = sku?.trim().match(GBO_SKU_RE);
  if (!m) return null;
  return { country: m[1]!.toUpperCase(), productId: Number(m[2]) };
}

export function parseGboSlug(slug?: string | null): GboLineRef | null {
  let value = slug?.trim() ?? "";
  if (!value) return null;
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep raw slug */
  }
  const m = value.match(GBO_SLUG_RE);
  if (!m) return null;
  const productId = Number(m[2]);
  if (!Number.isInteger(productId) || productId <= 0) return null;
  return { country: m[1]!.toUpperCase(), productId };
}

export function parseGboLineRef(item: {
  sku?: string | null;
  productSlug?: string | null;
}): GboLineRef | null {
  return parseGboSku(item.sku) ?? parseGboSlug(item.productSlug);
}

/** True when a catalog/cart line is fulfilled by Gift Baskets Overseas. */
export function isGboCatalogProduct(product: {
  vendorSlug?: string | null;
  internationalDelivery?: boolean;
  slug?: string | null;
  sku?: string | null;
}): boolean {
  return (
    isGboVendor(product.vendorSlug) ||
    product.internationalDelivery === true ||
    Boolean(parseGboSku(product.sku) || parseGboSlug(product.slug))
  );
}

/**
 * Destination catalog for a product. Local BlossomPot SKUs are US-only;
 * GBO SKUs are tagged `gbo:{CC}:{id}`.
 */
export function catalogProductCountry(product: {
  vendorSlug?: string | null;
  internationalDelivery?: boolean;
  slug?: string | null;
  sku?: string | null;
}): string | null {
  const ref = parseGboSku(product.sku) ?? parseGboSlug(product.slug);
  if (ref) return ref.country;
  if (isGboCatalogProduct(product)) return null;
  return "US";
}

/** Keep the selected country's GBO catalog; hide US-only SKUs abroad. */
export function productVisibleForDeliveryCountry(
  product: {
    vendorSlug?: string | null;
    internationalDelivery?: boolean;
    slug?: string | null;
    sku?: string | null;
  },
  country: string
): boolean {
  const iso = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return true;
  const dest = catalogProductCountry(product);
  if (!dest) return true;
  return dest === iso;
}

/**
 * Numeric partner order id GBO requires on create/get.
 * Namespaces OC vs BP/US sequences so 10001 does not collide.
 */
export function gboPartnerOrderId(order: {
  orderNumber?: string | null;
  orderId: string;
}): number {
  const n = (order.orderNumber ?? "").trim().toUpperCase();
  const m = n.match(/^(OC|US|BP)(\d{5,})$/);
  if (m) {
    const seq = Number(m[2]);
    const ns = m[1] === "OC" ? 200_000 : 100_000;
    return ns + seq;
  }
  const hex = order.orderId.replace(/-/g, "").slice(0, 8);
  const parsed = Number.parseInt(hex, 16);
  if (Number.isFinite(parsed) && parsed > 0) return parsed % 1_900_000_000;
  return Math.abs(hash32(order.orderId)) || 1;
}

function hash32(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return h;
}

export function clipGboGiftCardText(text?: string | null): string | undefined {
  const t = (text ?? "").trim();
  if (!t) return undefined;
  return t.length <= 180 ? t : t.slice(0, 180);
}

/**
 * GBO order status IDs from Get Order Details docs.
 * https://gboapi.readme.io/reference/get-order-details
 */
export const GBO_STATUS_LABEL: Record<number, string> = {
  0: "Received — in queue",
  5: "Received — in queue",
  14: "Received — in queue",
  17: "Received — in queue",
  13: "Being processed",
  2: "Being processed",
  18: "Being processed",
  4: "Passed to local office for delivery",
  19: "Passed to local office for delivery",
  12: "Paused — issue / more info needed",
  16: "Paused — issue / more info needed",
  20: "Paused — issue / more info needed",
  21: "Paused — issue / more info needed",
  3: "Cancelled",
  1: "Delivered",
  15: "Delivered",
};

const RECEIVED = new Set([0, 5, 14, 17]);
const PROCESSING = new Set([13, 2, 18]);
const LOCAL_DELIVERY = new Set([4, 19]);
const PAUSED = new Set([12, 16, 20, 21]);
const DELIVERED = new Set([1, 15]);

export function gboStatusLabel(statusId: number | string | undefined | null): string {
  const n = Number(statusId);
  if (!Number.isFinite(n)) return "Unknown";
  return GBO_STATUS_LABEL[n] ?? `Status ${n}`;
}

/**
 * Map GBO status → our order status.
 * Cancelled (3) stays on_hold so we never auto-cancel a paid BlossomPot order.
 */
export function mapGboStatusToOrderStatus(
  statusId: number | string | undefined | null
): OrderStatus | null {
  const n = Number(statusId);
  if (!Number.isFinite(n)) return null;
  if (RECEIVED.has(n)) return ORDER_STATUS.ACCEPTED;
  if (PROCESSING.has(n)) return ORDER_STATUS.PROCESSING;
  if (LOCAL_DELIVERY.has(n)) return ORDER_STATUS.OUT_FOR_DELIVERY;
  if (PAUSED.has(n)) return ORDER_STATUS.ON_HOLD;
  if (n === 3) return ORDER_STATUS.ON_HOLD;
  if (DELIVERED.has(n)) return ORDER_STATUS.DELIVERED;
  return null;
}

export function coerceGboNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function coerceGboString(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}
