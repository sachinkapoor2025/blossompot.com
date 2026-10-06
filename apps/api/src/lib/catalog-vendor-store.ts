import { GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  CATALOG_VENDOR_SLUGS,
  catalogVendorKeys,
  productAllowedForNewShopping,
  readStoredCatalogVendor,
  type CatalogVendor,
  type CatalogVendorSlug,
  type NewShoppingDecision,
  type ShoppingVendorRecord,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient } from "./db";

const CACHE_MS = 30_000;
let cache: { at: number; vendors: Map<CatalogVendorSlug, CatalogVendor> } | null = null;

export function invalidateCatalogVendorCache() {
  cache = null;
}

/** Catalog vendor rows, falling back to code defaults when a row is missing. */
export async function loadCatalogVendorRegistry(): Promise<Map<CatalogVendorSlug, CatalogVendor>> {
  const nowMs = Date.now();
  if (cache && nowMs - cache.at < CACHE_MS) return cache.vendors;

  const items = await Promise.all(
    CATALOG_VENDOR_SLUGS.map(async (slug) => {
      const result = await docClient.send(
        new GetCommand({
          TableName: CONFIG_TABLE,
          Key: { PK: catalogVendorKeys.pk(slug), SK: catalogVendorKeys.sk() },
        })
      );
      return [slug, readStoredCatalogVendor(slug, result.Item as Record<string, unknown> | undefined).vendor] as const;
    })
  );
  const vendors = new Map(items);
  cache = { at: nowMs, vendors };
  return vendors;
}

export async function decideNewShopping(
  product: Parameters<typeof productAllowedForNewShopping>[0],
  country: string | null | undefined
): Promise<NewShoppingDecision> {
  const registry = await loadCatalogVendorRegistry();
  const vendors = new Map<string, ShoppingVendorRecord>();
  for (const [slug, vendor] of registry) {
    vendors.set(slug, vendor);
  }
  return productAllowedForNewShopping(product, country, vendors);
}
