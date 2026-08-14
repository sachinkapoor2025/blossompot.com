import {
  productAllowsAddons,
  resolveProductImageUrls,
  stripVendorPrivateFields,
  withCompetitiveStorefrontPricing,
  type Product,
} from "@blossompot/shared";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "./rakhi-filter";

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

/** Read bundled catalog JSON — excludes legacy Rakhi SKUs from the storefront. */
export function getCatalogProducts(): Product[] {
  if (cached) return cached;
  const bySlug = new Map<string, Product>();
  for (const product of [
    ...loadCatalogFile("blossompot-catalog.json"),
    ...loadCatalogFile("sample-marketplace-catalog.json"),
  ]) {
    if (isRakhiRelatedProduct(product)) continue;
    const allowsAddons = productAllowsAddons(product);
    const publicProduct = stripVendorPrivateFields(product) as Product;
    publicProduct.allowsAddons = allowsAddons;
    publicProduct.images = resolveProductImageUrls(publicProduct.images);
    bySlug.set(product.slug, withCompetitiveStorefrontPricing(publicProduct));
  }
  cached = [...bySlug.values()];
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
  return [...bySlug.values()];
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
    existing.filter((p) => !isRakhiRelatedProduct(p)).map((product) => [product.slug, product])
  );
  for (const product of additions) {
    if (isRakhiRelatedProduct(product)) continue;
    if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
  }
  return [...bySlug.values()];
}
