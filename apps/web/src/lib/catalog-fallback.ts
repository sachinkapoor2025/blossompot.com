import {
  CATALOG_VENDOR_SLUGS,
  defaultCatalogVendor,
  isSampleCatalogProduct,
  productAllowsAddons,
  productAllowedForNewShopping,
  productVisibleForDeliveryCountry,
  productInStorefrontCategory,
  resolveProductImageUrls,
  coalesceProductImages,
  stripVendorPrivateFields,
  withCompetitiveStorefrontPricing,
  dedupeStorefrontProducts,
  type Product,
} from "@blossompot/shared";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isRakhiRelatedProduct, storefrontSkipsRakhiCategory } from "./rakhi-filter";
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

export function getCatalogProductsByCategory(categorySlug: string): Product[] {
  if (storefrontSkipsRakhiCategory(categorySlug)) return [];
  const bySlug = new Map<string, Product>();
  for (const product of getCatalogProducts()) {
    if (productInStorefrontCategory(product, categorySlug)) bySlug.set(product.slug, product);
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
  const catalogBySlug = new Map(additions.map((product) => [product.slug, product]));
  const bySlug = new Map(
    existing
      .filter((p) => !isRakhiRelatedProduct(p) && !isSampleCatalogProduct(p))
      .map((product) => {
        const catalog = catalogBySlug.get(product.slug);
        const images = coalesceProductImages(product.images, catalog?.images);
        return [product.slug, images === product.images ? product : { ...product, images }] as const;
      })
  );
  for (const product of additions) {
    if (isRakhiRelatedProduct(product)) continue;
    if (isSampleCatalogProduct(product)) continue;
    if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
  }
  return dedupeStorefrontProducts([...bySlug.values()]);
}
const DEFAULT_BUNDLED_VENDORS = CATALOG_VENDOR_SLUGS.map((slug) => defaultCatalogVendor(slug));

/**
 * Bundled JSON is not a second catalog. It may fill a missing SKU only when that
 * product's built-in vendor delivers to the country. Live admin delivery countries
 * stay on the product API, which already filtered its own rows.
 */
function bundledProductAllowedForCountry(product: Product, country: string): boolean {
  if (!productVisibleForDeliveryCountry(product, country)) return false;
  const decision = productAllowedForNewShopping(product, country, DEFAULT_BUNDLED_VENDORS);
  if (decision.available) return true;
  if (decision.reason !== "gbo_storefront_disabled") return false;
  const record = DEFAULT_BUNDLED_VENDORS.find((vendor) => vendor.vendorSlug === decision.vendorSlug);
  return Boolean(record?.deliveryCountries.includes(country.trim().toUpperCase()));
}

export function getCatalogProductsForCountry(country: string): Product[] {
  return getCatalogProducts().filter((product) => bundledProductAllowedForCountry(product, country));
}

/** API/GBO prices win for shared slugs; fill in published bundled catalog SKUs that Dynamo never imported. */
export function mergeProductsForCountry(existing: Product[], country: string): Product[] {
  return mergeProductsPreferExisting(
    existing.filter(
      (product) =>
        !isRakhiRelatedProduct(product) &&
        !isSampleCatalogProduct(product) &&
        productVisibleForDeliveryCountry(product, country)
    ),
    getCatalogProductsForCountry(country)
  );
}
