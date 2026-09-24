import {
  parseGboSlug,
  gboGiftToProduct,
  gboGiftNumericId,
  productInStorefrontCategory,
  productMatchesSearchQuery,
  productVisibleForDeliveryCountry,
  dedupeStorefrontProducts,
  isProductStorefrontVisible,
  type GboGift,
  type Product,
} from "@blossompot/shared";
import { api } from "./api";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "./rakhi-filter";
import { getStorefrontDeliveryCountry } from "./storefront-country";

function isStorefrontVisible(product: Product): boolean {
  return !isRakhiRelatedProduct(product) && isProductStorefrontVisible(product);
}

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

/** Live Gift Baskets Overseas catalog for the selected delivery country. */
export async function loadGboStorefrontProducts(country?: string): Promise<Product[]> {
  const iso = (country ?? (await getStorefrontDeliveryCountry())).trim().toUpperCase() || "US";
  const data = await api<{ gifts: GboGift[] }>(`/gbo/gifts?country=${iso}`, FRESH_PRODUCT_FETCH);
  return (data.gifts ?? [])
    .filter((gift) => gboGiftNumericId(gift) != null)
    .map((gift) => {
      const mapped = gboGiftToProduct(iso, gift);
      const { vendorCost: _c, ...rest } = mapped;
      return rememberProduct(rest as Product);
    });
}

function mergeBySlug(primary: Product[], extra: Product[]): Product[] {
  const bySlug = new Map(primary.map((product) => [product.slug, product]));
  for (const product of extra) {
    if (!bySlug.has(product.slug)) bySlug.set(product.slug, product);
  }
  return [...bySlug.values()];
}

function forDeliveryCountry(products: Product[], country: string): Product[] {
  return products.filter((product) => productVisibleForDeliveryCountry(product, country));
}

function isProductMissingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /not found/i.test(message) || /\(404\)/.test(message);
}

/**
 * Authoritative storefront product: live API (Dynamo / GBO) only.
 * Bundled catalog JSON is seed data, not a public listing source.
 */
export async function loadProduct(slug: string): Promise<Product | null> {
  try {
    const data = await api<{ product: Product }>(`/products/${slug}`, FRESH_PRODUCT_FETCH);
    if (!isStorefrontVisible(data.product)) return null;
    return rememberProduct(data.product);
  } catch (err) {
    const stale = memoryProduct(slug);
    if (stale) {
      if (!isStorefrontVisible(stale)) return null;
      return stale;
    }

    const gboRef = parseGboSlug(slug);
    if (gboRef) {
      try {
        const data = await api<{ gift: GboGift }>(
          `/gbo/gifts/${gboRef.productId}?country=${gboRef.country}`,
          FRESH_PRODUCT_FETCH
        );
        if (data.gift) {
          const mapped = gboGiftToProduct(gboRef.country, data.gift);
          const { vendorCost: _c, ...rest } = mapped;
          return rememberProduct(rest as Product);
        }
      } catch {
        /* GBO token missing or gift not found */
      }
    }

    if (isProductMissingError(err)) return null;
    return null;
  }
}

function filterLiveForCountry(live: Product[], country: string): Product[] {
  return rememberProducts(
    dedupeStorefrontProducts(forDeliveryCountry(live, country).filter(isStorefrontVisible))
  );
}

/** Shared list loader — same API + cache policy as `loadProduct` (PDP). */
export async function loadProducts(params?: {
  category?: string;
  search?: string;
  country?: string;
}): Promise<Product[]> {
  if (params?.category && isRakhiRelatedCategorySlug(params.category)) return [];

  const country = params?.country ?? (await getStorefrontDeliveryCountry());
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  query.set("country", country);
  const qs = `?${query.toString()}`;

  try {
    const data = await api<{ products: Product[] }>(`/products${qs}`, FRESH_PRODUCT_FETCH);
    const db = rememberProducts(data.products.filter(isStorefrontVisible));
    const gbo = await loadGboStorefrontProducts(country).catch(() => [] as Product[]);
    let extra = gbo;
    if (params?.category) {
      extra = gbo.filter((product) => productInStorefrontCategory(product, params.category as string));
    }
    if (params?.search) {
      extra = extra.filter((product) => productMatchesSearchQuery(product, params.search as string));
    }
    return filterLiveForCountry(mergeBySlug(db, extra), country);
  } catch {
    try {
      const gbo = await loadGboStorefrontProducts(country);
      let extra = gbo;
      if (params?.category) {
        extra = gbo.filter((product) => productInStorefrontCategory(product, params.category as string));
      }
      if (params?.search) {
        extra = extra.filter((product) => productMatchesSearchQuery(product, params.search as string));
      }
      return filterLiveForCountry(extra, country);
    } catch {
      return [];
    }
  }
}

/**
 * Category grids: live API first, then only add missing hamper/catalog SKUs.
 * Never overwrite an API product with bundled catalog prices.
 */
export async function loadProductsByCategory(categorySlug: string, country?: string): Promise<Product[]> {
  let products: Product[] = [];
  try {
    products = await loadProducts({ category: categorySlug, country });
  } catch {
    products = [];
  }
  return dedupeStorefrontProducts(products.filter(isStorefrontVisible));
}

export async function loadFeaturedProducts(limit = 10): Promise<Product[]> {
  const products = await loadProducts();
  return products.slice(0, limit);
}

export async function loadRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  country?: string
): Promise<Product[]> {
  const products = await loadProductsByCategory(categorySlug, country);
  return products.filter((p) => p.slug !== excludeSlug).slice(0, 5);
}

/** Listings are on-demand from the live products API — do not prerender JSON seed SKUs. */
export function getStaticProductSlugs(): string[] {
  return [];
}
