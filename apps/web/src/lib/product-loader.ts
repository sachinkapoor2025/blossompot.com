import type { Product } from "@blossompot/shared";
import { api } from "./api";
import {
  getCatalogProduct,
  getCatalogProducts,
  getCatalogProductsByCategory,
  mergeProductsPreferExisting,
} from "./catalog-fallback";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "./rakhi-filter";

/**
 * Prefer last good API price over bundled catalog when the API blips.
 * Catalog JSON has historically diverged from DynamoDB (e.g. Om at $1.50 vs live $14.72)
 * and ISR + year-long stale-while-revalidate kept those wrong prices in HTML/OG tags.
 */
const PRODUCT_MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour
const productMemoryCache = new Map<string, { product: Product; at: number }>();

/** Same cache policy for listing + PDP — never serve a stale Next Data Cache price. */
const FRESH_PRODUCT_FETCH = { revalidate: false as const };

function rememberProduct(product: Product): Product {
  productMemoryCache.set(product.slug, { product, at: Date.now() });
  return product;
}

function rememberProducts(products: Product[]): Product[] {
  for (const product of products) rememberProduct(product);
  return products;
}

function memoryProduct(slug: string): Product | null {
  const hit = productMemoryCache.get(slug);
  if (!hit) return null;
  if (Date.now() - hit.at > PRODUCT_MEMORY_TTL_MS) return null;
  return hit.product;
}

/** Catalog is OK for vendor SKUs that may not be in DynamoDB yet. */
function allowCatalogFallback(product: Product): boolean {
  return Boolean(product.vendorSlug);
}

function isProductMissingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /not found/i.test(message) || /\(404\)/.test(message);
}

/**
 * Authoritative storefront product: API first for standard SKUs.
 * On API 404 for a bundled catalog slug, fall back so PDPs do not hard-redirect home.
 * Do not fall back on transient API failures — that reintroduced stale catalog prices.
 */
export async function loadProduct(slug: string): Promise<Product | null> {
  try {
    const data = await api<{ product: Product }>(`/products/${slug}`, FRESH_PRODUCT_FETCH);
    if (isRakhiRelatedProduct(data.product)) return null;
    return rememberProduct(data.product);
  } catch (err) {
    const stale = memoryProduct(slug);
    if (stale) {
      if (isRakhiRelatedProduct(stale)) return null;
      return stale;
    }

    const catalog = getCatalogProduct(slug);
    if (catalog && isRakhiRelatedProduct(catalog)) return null;
    if (catalog && (allowCatalogFallback(catalog) || isProductMissingError(err))) {
      return catalog;
    }

    if (process.env.NODE_ENV !== "production") return catalog ?? null;
    return null;
  }
}

/** Shared list loader — same API + cache policy as `loadProduct` (PDP). */
export async function loadProducts(params?: {
  category?: string;
  search?: string;
}): Promise<Product[]> {
  if (params?.category && isRakhiRelatedCategorySlug(params.category)) return [];

  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString() ? `?${query.toString()}` : "";

  try {
    const data = await api<{ products: Product[] }>(`/products${qs}`, FRESH_PRODUCT_FETCH);
    return rememberProducts(data.products.filter((p) => !isRakhiRelatedProduct(p)));
  } catch {
    if (params?.category) {
      return getCatalogProductsByCategory(params.category);
    }
    return getCatalogProducts();
  }
}

/**
 * Category grids: live API first, then only add missing hamper/catalog SKUs.
 * Never overwrite an API product with bundled catalog prices.
 */
export async function loadProductsByCategory(categorySlug: string): Promise<Product[]> {
  let products: Product[] = [];
  try {
    products = await loadProducts({ category: categorySlug });
  } catch {
    products = [];
  }
  return mergeProductsPreferExisting(products, getCatalogProductsByCategory(categorySlug));
}

export async function loadFeaturedProducts(limit = 10): Promise<Product[]> {
  const products = await loadProducts();
  return products.slice(0, limit);
}

export async function loadRelatedProducts(categorySlug: string, excludeSlug: string): Promise<Product[]> {
  const products = await loadProductsByCategory(categorySlug);
  return products.filter((p) => p.slug !== excludeSlug).slice(0, 5);
}

/** Prefer catalog slugs at build time — avoids CI/API rate-limit prerender failures. */
export function getStaticProductSlugs(): string[] {
  const fromCatalog = getCatalogProducts().map((p) => p.slug);
  if (fromCatalog.length > 0) return fromCatalog;
  return [];
}
