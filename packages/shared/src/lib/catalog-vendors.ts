import { VENDOR_GBO } from "../constants";
import { catalogVendorKeys, marketplaceVendorKeys } from "../db/keys";
import { isGboStorefrontEnabled } from "./gbo";
import { fulfillmentVendorSlug } from "./serviceability";
import {
  CATALOG_VENDOR_SLUGS,
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

const DEFAULTS: Record<
  CatalogVendorSlug,
  { vendorName: string; integrationType: CatalogIntegrationType }
> = {
  blossompot: { vendorName: "BlossomPot", integrationType: "owned" },
  "orange-county": { vendorName: "Orange County", integrationType: "local-catalog" },
  "gift-baskets-overseas": { vendorName: "Gift Baskets Overseas", integrationType: "partner-api" },
  fnp: { vendorName: "FNP", integrationType: "excel" },
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

export function readStoredCatalogVendor(
  slug: CatalogVendorSlug,
  item: Record<string, unknown> | null | undefined
): { vendor: CatalogVendor; source: "config" | "default" } {
  if (!item) return { vendor: defaultCatalogVendor(slug), source: "default" };
  const parsed = catalogVendorSchema.safeParse({
    vendorSlug: item.vendorSlug,
    vendorName: item.vendorName,
    enabled: item.enabled,
    integrationType: item.integrationType,
    deliveryCountries: item.deliveryCountries,
    updatedAt: item.updatedAt ?? "",
    updatedBy: item.updatedBy,
  });
  if (!parsed.success || parsed.data.vendorSlug !== slug) {
    return { vendor: defaultCatalogVendor(slug), source: "default" };
  }
  return { vendor: parsed.data, source: "config" };
}

export type CatalogVendorShoppingStatus = {
  /** Catalog `enabled` combined with the GBO environment flag. Not applied to product queries in this phase. */
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
  vendor: Pick<CatalogVendor, "vendorSlug" | "enabled">,
  env: Record<string, string | undefined> = process.env
): CatalogVendorShoppingStatus {
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
export function productAllowedForNewShopping(
  product: {
    vendorSlug?: string | null;
    internationalDelivery?: boolean;
    slug?: string | null;
    sku?: string | null;
    productSlug?: string | null;
  },
  country: string | null | undefined,
  vendors: ReadonlyMap<string, ShoppingVendorRecord> | readonly ShoppingVendorRecord[],
  env: Record<string, string | undefined> = process.env
): NewShoppingDecision {
  const vendorSlug = fulfillmentVendorSlug({
    ...product,
    slug: product.slug ?? product.productSlug,
  });
  if (!isCatalogVendorSlug(vendorSlug)) return { available: true, vendorSlug };

  const record = asVendorMap(vendors).get(vendorSlug) ?? defaultCatalogVendor(vendorSlug);
  const status = catalogVendorShoppingStatus(
    { vendorSlug, enabled: record.enabled },
    env
  );
  if (!status.shoppingAvailable) {
    return {
      available: false,
      vendorSlug,
      reason:
        vendorSlug === VENDOR_GBO && status.storefrontEnvEnabled === false
          ? "gbo_storefront_disabled"
          : "vendor_disabled",
    };
  }

  const iso = (country ?? "").trim().toUpperCase();
  const dest = /^[A-Z]{2}$/.test(iso) ? iso : "US";
  if (!record.deliveryCountries.includes(dest)) {
    return { available: false, vendorSlug, reason: "country_not_allowed" };
  }
  return { available: true, vendorSlug };
}
