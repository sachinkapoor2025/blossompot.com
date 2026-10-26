import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  getDeliveryCountry,
  isCatalogCountryEnabled,
  isGboHiddenFromStorefront,
  isProductStorefrontVisible,
  isRakhiRelatedProduct,
  normalizedFulfillmentVendorSlug,
  productAllowedForNewShopping,
  productForShoppingDecision,
  productVisibleForDeliveryCountry,
  sortVendorsForDisplay,
  type ComboSourceProduct,
  type Product,
  type VendorDisplaySource,
} from "@blossompot/shared";
import { invalidateCatalogCountryCache, loadCatalogCountries } from "./catalog-country-store";
import { invalidateCatalogVendorCache, loadCatalogVendorRegistry } from "./catalog-vendor-store";
import { ComboPublishConfigError } from "./combo-publish-config";
import { publishGeneratedCombos, type ComboPublishResult } from "./combo-publish";
import { docClient, PRODUCTS_TABLE } from "./db";
import { evaluateProductsForLocation } from "../handlers/serviceability";
import { invalidateServiceabilityCache } from "./serviceability-store";

export type MemoryComboPublishResult =
  | { ran: false; reason: "not-memory" | "country-not-set" | "country-not-enabled" }
  | ({ ran: true } & ComboPublishResult);

export type ComboPublishInputs = {
  products: ComboSourceProduct[];
  vendors: VendorDisplaySource[];
  scannedProducts: number;
  exclusions: Array<{ reason: string; count: number }>;
};

/**
 * Publish generated combos into the local in-memory database.
 * A real database process returns before any read or write.
 * COMBO_COUNTRY must name a known delivery country. The publisher does not assume one.
 */
export async function publishSeededMemoryCombos(): Promise<MemoryComboPublishResult> {
  if (process.env.USE_MEMORY_DB !== "true") return { ran: false, reason: "not-memory" };
  const country = explicitCountry(process.env.COMBO_COUNTRY);
  if (!country) return { ran: false, reason: "country-not-set" };
  try {
    await assertEnabledShoppingCountry(country);
  } catch (err) {
    if (err instanceof ComboPublishConfigError) return { ran: false, reason: "country-not-enabled" };
    throw err;
  }
  const result = await publishGeneratedCombos(await loadComboPublishInputs(country));
  return { ran: true, ...result };
}

/** Eligible catalog products and vendor order for one explicit publish run. */
export async function loadComboPublishInputs(country: string): Promise<ComboPublishInputs> {
  const destination = explicitCountry(country);
  if (!destination) {
    throw new ComboPublishConfigError(
      "Set --country to the delivery country for this run. The publisher does not choose a country."
    );
  }
  await assertEnabledShoppingCountry(destination);
  invalidateCatalogVendorCache();
  invalidateCatalogCountryCache();
  invalidateServiceabilityCache();

  const scanned = await readCatalogProducts();
  const registry = await loadCatalogVendorRegistry();
  const exclusions = new Map<string, number>();
  const pending: Product[] = [];
  for (const product of scanned) {
    const reason = sourceExclusion(product, destination, registry);
    if (reason) {
      exclusions.set(reason, (exclusions.get(reason) ?? 0) + 1);
      continue;
    }
    pending.push(product);
  }

  const delivery = await evaluateProductsForLocation(
    pending.map((product) => ({
      slug: product.slug,
      vendorSlug: product.vendorSlug,
      published: product.published,
      inventory: product.inventory,
      sku: product.sku,
      internationalDelivery: product.internationalDelivery,
      tags: product.tags,
    })),
    { countryCode: destination, postalCode: "" }
  );
  const deliverable = new Map(delivery.map((row) => [row.slug, row]));
  const products: Array<Product & ComboSourceProduct> = [];
  for (const product of pending) {
    const row = deliverable.get(product.slug);
    if (!row?.deliverable) {
      const reason = row?.reason || "not-deliverable";
      exclusions.set(reason, (exclusions.get(reason) ?? 0) + 1);
      continue;
    }
    products.push(product as Product & ComboSourceProduct);
  }

  return {
    products,
    vendors: vendorRanking(registry),
    scannedProducts: scanned.length,
    exclusions: [...exclusions.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) => left.reason.localeCompare(right.reason) || left.count - right.count),
  };
}

export async function assertEnabledShoppingCountry(country: string): Promise<void> {
  invalidateCatalogCountryCache();
  const stored = await loadCatalogCountries();
  if (!isCatalogCountryEnabled(stored.countries, country)) {
    throw new ComboPublishConfigError(
      `Refusing to publish combos. ${country} is not an enabled shopping country.`
    );
  }
}

function explicitCountry(value: string | null | undefined): string | null {
  const country = value?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(country) || !getDeliveryCountry(country)) return null;
  return country;
}

function sourceExclusion(
  product: Product,
  country: string,
  registry: Awaited<ReturnType<typeof loadCatalogVendorRegistry>>
): string | null {
  if (product.published === false) return "unpublished";
  if ((product.inventory ?? 0) <= 0) return "out-of-stock";
  if (!isProductStorefrontVisible(product)) return "not-storefront-visible";
  if (isGboHiddenFromStorefront(product)) return "gbo-hidden";
  const slug = text(product.slug);
  const name = text(product.name);
  const category = text(product.categorySlug);
  if (!slug || !name || !category) return "incomplete";
  if (category === "combos") return "combo-category";
  if (!productVisibleForDeliveryCountry(product, country)) return "country-not-visible";
  if (
    isRakhiRelatedProduct({
      ...product,
      vendorSlug: normalizedFulfillmentVendorSlug(product),
    })
  ) {
    return "rakhi-hidden";
  }
  const shopping = productAllowedForNewShopping(productForShoppingDecision(product), country, registry);
  if (!shopping.available) return shopping.reason ?? "shopping-blocked";
  if (normalizedFulfillmentVendorSlug(product).length === 0) return "incomplete";
  return null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
