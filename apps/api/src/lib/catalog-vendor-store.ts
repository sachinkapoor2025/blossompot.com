import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CATALOG_VENDOR_SLUGS,
  catalogVendorKeys,
  productAllowedForNewShopping,
  productForShoppingDecision,
  applyStoredDisplayOrder,
  parseStoredCatalogVendor,
  readStoredCatalogVendor,
  productKeys,
  type CatalogVendor,
  type NewShoppingDecision,
  type ShoppingVendorRecord,
} from "@blossompot/shared";
import { CONFIG_TABLE, PRODUCTS_TABLE, docClient } from "./db";

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
      const item = result.Item as Record<string, unknown> | undefined;
      return [slug, applyStoredDisplayOrder(readStoredCatalogVendor(slug, item).vendor, item?.displayOrder)] as const;
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
    vendors.set(slug, applyStoredDisplayOrder(parsed, item.displayOrder));
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
  return productAllowedForNewShopping(productForShoppingDecision(product), country, vendors);
}

type ShoppingIdentity = {
  productSlug?: string | null;
  slug?: string | null;
  vendorSlug?: string | null;
  tags?: readonly string[] | null;
  sku?: string | null;
  internationalDelivery?: boolean | null;
};

/**
 * Cart lines often omit vendorSlug. Read the stored product's tag so the existing
 * shopping decision can see an FNP import. This does not write the cart line.
 */
export async function withStoredShoppingIdentity<T extends ShoppingIdentity>(item: T): Promise<T> {
  const identified = productForShoppingDecision(item);
  if (identified.vendorSlug?.trim()) return identified;
  const slug = (item.productSlug || item.slug || "").trim();
  if (!slug) return identified;
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  const stored = result.Item as ShoppingIdentity | undefined;
  if (!stored) return identified;
  return productForShoppingDecision({
    ...item,
    slug: stored.slug ?? slug,
    vendorSlug: stored.vendorSlug,
    tags: stored.tags,
    sku: item.sku ?? stored.sku,
    internationalDelivery: item.internationalDelivery ?? stored.internationalDelivery,
  });
}
