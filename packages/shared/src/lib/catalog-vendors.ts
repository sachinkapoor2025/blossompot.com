import { VENDOR_GBO } from "../constants";
import { catalogVendorKeys, marketplaceVendorKeys } from "../db/keys";
import { isGboStorefrontEnabled, restrictedDeliveryCountries } from "./gbo";
import { fulfillmentVendorSlug } from "./serviceability";
import {
  CATALOG_STORAGE_LABEL,
  CATALOG_VENDOR_SLUGS,
  CATALOG_VENDOR_TRASH_DAYS,
  catalogVendorSchema,
  type CatalogIntegrationType,
  type CatalogVendor,
  type CatalogVendorSlug,
} from "../schemas/catalog-vendor";

export const CATALOG_INTEGRATION_LABELS: Record<CatalogIntegrationType, string> = {
  owned: "Owned",
  "local-catalog": "Local Catalog",
  "partner-api": "Partner API",
  excel: "Excel",
};

/** Admin method column. Stored values stay the existing integration types. */
export const CATALOG_METHOD_LABELS: Record<CatalogIntegrationType, string> = {
  owned: "Manual",
  "partner-api": "API",
  excel: "Excel",
  "local-catalog": "JSON/Bundle",
};

export { CATALOG_STORAGE_LABEL };

export function catalogMethodLabel(integrationType: CatalogIntegrationType): string {
  return CATALOG_METHOD_LABELS[integrationType];
}

export function catalogVendorTrashExpiry(from = new Date()): string {
  const expiry = new Date(from.getTime());
  expiry.setUTCDate(expiry.getUTCDate() + CATALOG_VENDOR_TRASH_DAYS);
  return expiry.toISOString();
}

export function catalogVendorConfirmName(vendorName: string, typed: string): boolean {
  return vendorName.trim() === typed.trim();
}

const DEFAULTS: Record<
  CatalogVendorSlug,
  { vendorName: string; integrationType: CatalogIntegrationType; displayOrder: number }
> = {
  blossompot: { vendorName: "BlossomPot", integrationType: "owned", displayOrder: 1 },
  "orange-county": { vendorName: "Orange County", integrationType: "local-catalog", displayOrder: 2 },
  "gift-baskets-overseas": { vendorName: "Gift Baskets Overseas", integrationType: "partner-api", displayOrder: 3 },
  fnp: { vendorName: "FNP", integrationType: "excel", displayOrder: 4 },
};

export function isCatalogVendorSlug(slug: string): slug is CatalogVendorSlug {
  return (CATALOG_VENDOR_SLUGS as readonly string[]).includes(slug);
}

/**
 * Used when `CATALOGVENDOR#<slug>` is missing or unreadable.
 * Enabled + USA keeps the current storefront available until an admin record says otherwise.
 */
export function defaultCatalogVendor(slug: CatalogVendorSlug): CatalogVendor {
  const meta = DEFAULTS[slug];
  return {
    vendorSlug: slug,
    vendorName: meta.vendorName,
    enabled: true,
    integrationType: meta.integrationType,
    deliveryCountries: ["US"],
    displayOrder: meta.displayOrder,
    updatedAt: "",
  };
}

export function catalogVendorKey(slug: CatalogVendorSlug) {
  return { PK: catalogVendorKeys.pk(slug), SK: catalogVendorKeys.sk() };
}

/** True when a key belongs to the marketplace applicant table, not the catalog registry. */
export function isMarketplaceVendorKey(pk: string): boolean {
  return pk.startsWith(marketplaceVendorKeys.pkPrefix());
}

export function isCatalogVendorKey(pk: string): boolean {
  return pk.startsWith(catalogVendorKeys.pkPrefix());
}

/**
 * Uppercase, drop blanks, keep the first occurrence of each ISO-2 code.
 * Non-ISO values are rejected.
 */
export function normalizeDeliveryCountries(
  codes: string[]
): { countries: string[] } | { error: string } {
  const countries: string[] = [];
  const seen = new Set<string>();
  for (const raw of codes) {
    const code = raw.trim().toUpperCase();
    if (!code) continue;
    if (!/^[A-Z]{2}$/.test(code)) {
      return { error: `"${raw.trim()}" is not a two-letter country code.` };
    }
    if (seen.has(code)) continue;
    seen.add(code);
    countries.push(code);
  }
  return { countries };
}

export function parseStoredCatalogVendor(
  slug: string,
  item: Record<string, unknown> | null | undefined
): CatalogVendor | null {
  if (!item) return null;
  const parsed = catalogVendorSchema.safeParse({
    vendorSlug: item.vendorSlug,
    vendorName: item.vendorName,
    enabled: item.enabled,
    integrationType: item.integrationType,
    deliveryCountries: item.deliveryCountries,
    sourceName: item.sourceName,
    defaultInventory: item.defaultInventory,
    trashedAt: item.trashedAt,
    trashExpiresAt: item.trashExpiresAt,
    updatedAt: item.updatedAt ?? "",
    updatedBy: item.updatedBy,
  });
  if (!parsed.success || parsed.data.vendorSlug !== slug) return null;
  return parsed.data;
}

export function readStoredCatalogVendor(
  slug: CatalogVendorSlug,
  item: Record<string, unknown> | null | undefined
): { vendor: CatalogVendor; source: "config" | "default" } {
  const parsed = parseStoredCatalogVendor(slug, item);
  if (!parsed) return { vendor: defaultCatalogVendor(slug), source: "default" };
  return { vendor: parsed, source: "config" };
}

export type CatalogVendorShoppingStatus = {
  /** Catalog `enabled` combined with the GBO environment flag. */
  shoppingAvailable: boolean;
  /** Null for vendors other than Gift Baskets Overseas. */
  storefrontEnvEnabled: boolean | null;
  storefrontBlockReason: string | null;
};

/**
 * GBO shopping requires both the catalog flag and `GBO_STOREFRONT_ENABLED`.
 * Other catalog vendors follow the catalog flag only.
 */
export function catalogVendorShoppingStatus(
  vendor: Pick<CatalogVendor, "vendorSlug" | "enabled" | "trashedAt">,
  env: Record<string, string | undefined> = process.env
): CatalogVendorShoppingStatus {
  if (vendor.trashedAt) {
    return {
      shoppingAvailable: false,
      storefrontEnvEnabled: vendor.vendorSlug === VENDOR_GBO ? isGboStorefrontEnabled(env) : null,
      storefrontBlockReason: "In trash",
    };
  }
  if (vendor.vendorSlug !== VENDOR_GBO) {
    return {
      shoppingAvailable: vendor.enabled,
      storefrontEnvEnabled: null,
      storefrontBlockReason: null,
    };
  }
  const storefrontEnvEnabled = isGboStorefrontEnabled(env);
  if (!storefrontEnvEnabled) {
    return {
      shoppingAvailable: false,
      storefrontEnvEnabled: false,
      storefrontBlockReason: "Blocked by environment",
    };
  }
  return {
    shoppingAvailable: vendor.enabled,
    storefrontEnvEnabled: true,
    storefrontBlockReason: null,
  };
}

export const CATALOG_VENDOR_UNAVAILABLE_MESSAGE = "This product is temporarily unavailable.";

export type NewShoppingBlockReason = "vendor_disabled" | "country_not_allowed" | "gbo_storefront_disabled";

export type NewShoppingDecision = {
  available: boolean;
  vendorSlug: string;
  reason?: NewShoppingBlockReason;
};

export type ShoppingVendorRecord = {
  vendorSlug: string;
  enabled: boolean;
  deliveryCountries: readonly string[];
  trashedAt?: string;
};

function asVendorMap(
  vendors: ReadonlyMap<string, ShoppingVendorRecord> | readonly ShoppingVendorRecord[]
): ReadonlyMap<string, ShoppingVendorRecord> {
  if (Array.isArray(vendors)) {
    return new Map(vendors.map((vendor) => [vendor.vendorSlug, vendor]));
  }
  return vendors as ReadonlyMap<string, ShoppingVendorRecord>;
}

/**
 * Whether a product may be newly shopped.
 * A missing vendorSlug follows BlossomPot. Marketplace slugs that are not catalog vendors are left to serviceability.
 * This does not decide historical order fulfillment.
 */
function shoppingDestination(country: string | null | undefined): string {
  const iso = (country ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(iso) ? iso : "US";
}

function productCountryRestriction(
  product: {
    vendorSlug?: string | null;
    internationalDelivery?: boolean | null;
    slug?: string | null;
    sku?: string | null;
    productSlug?: string | null;
    deliveryCountries?: readonly string[] | null;
  },
  vendorSlug: string,
  dest: string
): NewShoppingDecision | null {
  const own = restrictedDeliveryCountries({
    ...product,
    slug: product.slug ?? product.productSlug,
    vendorSlug,
  });
  if (own && !own.includes(dest)) {
    return { available: false, vendorSlug, reason: "country_not_allowed" };
  }
  return null;
}

export function productAllowedForNewShopping(
  product: {
    vendorSlug?: string | null;
    internationalDelivery?: boolean;
    slug?: string | null;
    sku?: string | null;
    productSlug?: string | null;
    deliveryCountries?: readonly string[] | null;
  },
  country: string | null | undefined,
  vendors: ReadonlyMap<string, ShoppingVendorRecord> | readonly ShoppingVendorRecord[],
  env: Record<string, string | undefined> = process.env
): NewShoppingDecision {
  const vendorSlug = fulfillmentVendorSlug({
    ...product,
    slug: product.slug ?? product.productSlug,
  });
  const dest = shoppingDestination(country);
  const registry = asVendorMap(vendors);
  const stored = registry.get(vendorSlug);
  if (!isCatalogVendorSlug(vendorSlug) && !stored) {
    return productCountryRestriction(product, vendorSlug, dest) ?? { available: true, vendorSlug };
  }
  const record = stored ?? defaultCatalogVendor(vendorSlug as CatalogVendorSlug);
  const status = catalogVendorShoppingStatus(
    { vendorSlug, enabled: record.enabled, trashedAt: record.trashedAt },
    env
  );
  if (!status.shoppingAvailable) {
    return {
      available: false,
      vendorSlug,
      reason: record.trashedAt
        ? "vendor_disabled"
        : vendorSlug === VENDOR_GBO && status.storefrontEnvEnabled === false
          ? "gbo_storefront_disabled"
          : "vendor_disabled",
    };
  }

  if (!record.deliveryCountries.includes(dest)) {
    return { available: false, vendorSlug, reason: "country_not_allowed" };
  }
  return productCountryRestriction(product, vendorSlug, dest) ?? { available: true, vendorSlug };
}

/**
 * A vendor that delivers to the selected country stays shoppable when no service
 * area is stored for that country. ZIP/prefix/city rules stay in force: pass
 * `hasLocationScopedAreas: true` so those vendors still require a matching area.
 */
export function vendorCoversShoppingCountryWithoutArea(
  vendor: { vendorSlug: string; enabled: boolean; deliveryCountries: readonly string[]; trashedAt?: string } | null | undefined,
  countryCode: string,
  areaReason: string | undefined,
  env: Record<string, string | undefined> = process.env,
  hasLocationScopedAreas?: boolean
): boolean {
  if (areaReason !== "no_matching_service_area" || !vendor) return false;
  const iso = countryCode.trim().toUpperCase();
  if (!iso) return false;
  if (hasLocationScopedAreas) return false;
  if (iso === "US" && hasLocationScopedAreas !== false) return false;
  if (!vendor.deliveryCountries.includes(iso)) return false;
  return catalogVendorShoppingStatus(
    { vendorSlug: vendor.vendorSlug, enabled: vendor.enabled, trashedAt: vendor.trashedAt },
    env
  ).shoppingAvailable;
}
