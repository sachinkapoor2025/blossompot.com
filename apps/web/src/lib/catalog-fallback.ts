import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  isRakhiSetSizeCategory,
  productAllowsAddons,
  productMatchesRakhiSetCategory,
  resolveProductImageUrls,
  stripVendorPrivateFields,
  withCompetitiveStorefrontPricing,
  type Product,
} from "@blossompot/shared";

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

/** Read bundled catalog JSON — reliable during CI static generation when API is rate-limited. */
export function getCatalogProducts(): Product[] {
  if (cached) return cached;
  const bySlug = new Map<string, Product>();
  for (const product of [
    ...loadCatalogFile("blossompot-catalog.json"),
  ]) {
    // Never expose vendorCost / vendorSlug to the browser via SSR props.
    const allowsAddons = productAllowsAddons(product);
    const publicProduct = stripVendorPrivateFields(product) as Product;
    publicProduct.allowsAddons = allowsAddons;
    // Rewrite legacy WordPress / non-www media hosts to CloudFront.
    publicProduct.images = resolveProductImageUrls(publicProduct.images);
    bySlug.set(product.slug, withCompetitiveStorefrontPricing(publicProduct));
  }
  cached = [...bySlug.values()];
  return cached;
}

export function getCatalogProduct(slug: string): Product | undefined {
  return getCatalogProducts().find((p) => p.slug === slug);
}

function isKidsComboProduct(product: Product): boolean {
  if (product.categorySlug !== "kids-rakhi") return false;

  const text = [product.name, product.description, ...(product.tags ?? [])]
    .join(" ")
    .toLowerCase();

  return [
    "combo",
    "chocolate",
    "chocolates",
    "hershey",
    "lindor",
    "lindt",
    "kitkat",
    "dairy milk",
    "snicker",
    "milky way",
  ].some((term) => text.includes(term));
}

function productInCategory(product: Product, categorySlug: string): boolean {
  if (product.categorySlug === categorySlug) return true;
  return product.additionalCategorySlugs?.includes(categorySlug) ?? false;
}

export function getCatalogProductsByCategory(categorySlug: string): Product[] {
  if (isRakhiSetSizeCategory(categorySlug)) {
    return getCatalogProducts().filter((product) => productMatchesRakhiSetCategory(product, categorySlug));
  }

  const bySlug = new Map<string, Product>();
  for (const product of getCatalogProducts()) {
    if (productInCategory(product, categorySlug)) bySlug.set(product.slug, product);
  }
  if (categorySlug === "rakhi-combo") {
    for (const product of getCatalogProducts().filter(isKidsComboProduct)) {
      bySlug.set(product.slug, product);
    }
  }
  return [...bySlug.values()];
}

/**
 * Merge catalog fallback into API results. API prices always win for shared slugs —
 * catalog JSON can be stale (e.g. Om Single Rakhi at $1.50 vs live $14.72).
 */
export function mergeProductsPreferExisting(
  existing: Product[],
  additions: Product[]
): Product[] {
  const bySlug = new Map(existing.map((product) => [product.slug, product]));
  for (const product of additions) {
    if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
  }
  return [...bySlug.values()];
}
