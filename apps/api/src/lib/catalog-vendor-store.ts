import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CATALOG_VENDOR_SLUGS,
  catalogVendorKeys,
  productAllowedForNewShopping,
  parseStoredCatalogVendor,
  readStoredCatalogVendor,
  type CatalogVendor,
  type NewShoppingDecision,
  type ShoppingVendorRecord,
} from "@blossompot/shared";
import { CONFIG_TABLE, docClient } from "./db";

const CACHE_MS = 30_000;
let cache: { at: number; vendors: Map<string, CatalogVendor> } | null = null;

export function invalidateCatalogVendorCache() {
  cache = null;
}

/** Catalog vendor rows, falling back to code defaults when a built-in row is missing. */
export async function loadCatalogVendorRegistry(): Promise<Map<string, CatalogVendor>> {
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
  const vendors = new Map<string, CatalogVendor>(items);
  const scanned = await docClient.send(
    new ScanCommand({
      TableName: CONFIG_TABLE,
      FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": catalogVendorKeys.pkPrefix(),
        ":sk": catalogVendorKeys.sk(),
      },
    })
  );
  for (const item of scanned.Items ?? []) {
    const slug = String(item.vendorSlug ?? "").trim().toLowerCase();
    if (!slug || (CATALOG_VENDOR_SLUGS as readonly string[]).includes(slug)) continue;
    const parsed = parseStoredCatalogVendor(slug, item as Record<string, unknown>);
    if (!parsed) continue;
    vendors.set(slug, parsed);
  }
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
