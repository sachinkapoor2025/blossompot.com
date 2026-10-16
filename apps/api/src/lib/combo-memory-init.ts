import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  isGboHiddenFromStorefront,
  isProductStorefrontVisible,
  sortVendorsForDisplay,
  type ComboSourceProduct,
  type Product,
  type VendorDisplaySource,
} from "@blossompot/shared";
import { loadCatalogVendorRegistry } from "./catalog-vendor-store";
import { publishGeneratedCombos, type ComboPublishResult } from "./combo-publish";
import { docClient, PRODUCTS_TABLE } from "./db";

export type MemoryComboPublishResult =
  | { ran: false; reason: "not-memory" }
  | ({ ran: true } & ComboPublishResult);

/**
 * Publish generated combos into the local in-memory database.
 * A real database process returns before any read or write.
 */
export async function publishSeededMemoryCombos(): Promise<MemoryComboPublishResult> {
  if (process.env.USE_MEMORY_DB !== "true") return { ran: false, reason: "not-memory" };

  const result = await publishGeneratedCombos(await loadComboPublishInputs());
  return { ran: true, ...result };
}

/** Eligible catalog products and vendor order for one explicit publish run. */
export async function loadComboPublishInputs(): Promise<{
  products: ComboSourceProduct[];
  vendors: VendorDisplaySource[];
}> {
  const products = (await readCatalogProducts()).filter(isComboSource);
  const vendors = vendorRanking(await loadCatalogVendorRegistry());
  return { products, vendors };
}

function isComboSource(product: Product): product is Product & ComboSourceProduct {
  return (
    product.published !== false &&
    (product.inventory ?? 0) > 0 &&
    isProductStorefrontVisible(product) &&
    !isGboHiddenFromStorefront(product) &&
    product.slug.trim().length > 0 &&
    product.name.trim().length > 0 &&
    product.categorySlug.trim().length > 0
  );
}

function vendorRanking(registry: Awaited<ReturnType<typeof loadCatalogVendorRegistry>>): VendorDisplaySource[] {
  return sortVendorsForDisplay([...registry.values()]).map((vendor) => ({
    vendorSlug: vendor.vendorSlug,
    vendorName: vendor.vendorName,
    ...(vendor.displayOrder != null ? { displayOrder: vendor.displayOrder } : {}),
  }));
}

async function readCatalogProducts(): Promise<Product[]> {
  const items: Product[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
        ExpressionAttributeValues: { ":prefix": "PRODUCT#", ":sk": "META" },
        ExclusiveStartKey,
      })
    );
    if (result.Items?.length) items.push(...(result.Items as Product[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}
