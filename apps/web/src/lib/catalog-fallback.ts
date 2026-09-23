import {
  isSampleCatalogProduct,
  productAllowsAddons,
  productVisibleForDeliveryCountry,
  resolveProductImageUrls,
  stripVendorPrivateFields,
  withCompetitiveStorefrontPricing,
  dedupeStorefrontProducts,
  type Product,
} from "@blossompot/shared";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "./rakhi-filter";
import blossompotCatalog from "../../../../scripts/data/blossompot-catalog.json";
import tfUsaCatalog from "../../../../scripts/data/tf-usa-catalog.json";

interface CatalogFile {
  products: Product[];
}

let cached: Product[] | null = null;

function resolveDataPath(filename: string): string | null {
  const candidates = [
    join(process.cwd(), "scripts/data", filename),
    join(process.cwd(), "../scripts/data", filename),
    join(process.cwd(), "../../scripts/data", filename),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function loadCatalogFile(filename: string): Product[] {
  const path = resolveDataPath(filename);
  if (!path) return [];
  const data = JSON.parse(readFileSync(path, "utf-8")) as CatalogFile;
  return data.products ?? [];
}

function ingestCatalogProducts(
  bySlug: Map<string, Product>,
  products: unknown,
  options: { fillMissingOnly?: boolean } = {}
) {
  if (!Array.isArray(products)) return;
  for (const row of products) {
    const product = row as Product;
    if (!product?.slug) continue;
    if (options.fillMissingOnly && bySlug.has(product.slug)) continue;
    if (isRakhiRelatedProduct(product)) continue;
    if (isSampleCatalogProduct(product)) continue;
    const allowsAddons = productAllowsAddons(product);
    const publicProduct = stripVendorPrivateFields(product) as Product;
    publicProduct.allowsAddons = allowsAddons;
    publicProduct.images = resolveProductImageUrls(publicProduct.images);
    publicProduct.createdAt = product.createdAt || "2026-09-23T00:00:00.000Z";
    publicProduct.updatedAt = product.updatedAt || publicProduct.createdAt;
    bySlug.set(product.slug, withCompetitiveStorefrontPricing(publicProduct));
  }
}

/** Read bundled catalog JSON — real BlossomPot SKUs only (never the sample marketplace dump). */
export function getCatalogProducts(): Product[] {
  if (cached) return cached;
  const bySlug = new Map<string, Product>();
  ingestCatalogProducts(bySlug, (blossompotCatalog as { products?: unknown }).products);
  ingestCatalogProducts(bySlug, (tfUsaCatalog as { products?: unknown }).products, { fillMissingOnly: true });
  ingestCatalogProducts(bySlug, loadCatalogFile("blossompot-catalog.json"));
  ingestCatalogProducts(bySlug, loadCatalogFile("tf-usa-catalog.json"), { fillMissingOnly: true });
  cached = dedupeStorefrontProducts([...bySlug.values()]);
  return cached;
}

export function getCatalogProduct(slug: string): Product | undefined {
  return getCatalogProducts().find((p) => p.slug === slug);
}

function productInCategory(product: Product, categorySlug: string): boolean {
  if (product.categorySlug === categorySlug) return true;
  return product.additionalCategorySlugs?.includes(categorySlug) ?? false;
}

export function getCatalogProductsByCategory(categorySlug: string): Product[] {
  if (isRakhiRelatedCategorySlug(categorySlug)) return [];
  const bySlug = new Map<string, Product>();
  for (const product of getCatalogProducts()) {
    if (productInCategory(product, categorySlug)) bySlug.set(product.slug, product);
  }
  return dedupeStorefrontProducts([...bySlug.values()]);
}

/**
 * Merge catalog fallback into API results. API prices always win for shared slugs.
 * Filters out legacy Rakhi products from both sides.
 */
export function mergeProductsPreferExisting(
  existing: Product[],
  additions: Product[]
): Product[] {
  const bySlug = new Map(
    existing
      .filter((p) => !isRakhiRelatedProduct(p) && !isSampleCatalogProduct(p))
      .map((product) => [product.slug, product])
  );
  for (const product of additions) {
    if (isRakhiRelatedProduct(product)) continue;
    if (isSampleCatalogProduct(product)) continue;
    if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
  }
  return dedupeStorefrontProducts([...bySlug.values()]);
}
export function getCatalogProductsForCountry(country: string): Product[] {
  return getCatalogProducts().filter((product) => productVisibleForDeliveryCountry(product, country));
}

/** Keep API (and live GBO) results for this country — never inject bundled JSON SKUs. */
export function mergeProductsForCountry(existing: Product[], country: string): Product[] {
  return dedupeStorefrontProducts(
    existing.filter(
      (product) =>
        !isRakhiRelatedProduct(product) &&
        !isSampleCatalogProduct(product) &&
        productVisibleForDeliveryCountry(product, country)
    )
  );
}
