import {
  parseGboSlug,
  gboGiftToProduct,
  gboGiftNumericId,
  isGboHiddenFromStorefront,
  isGboStorefrontEnabled,
  productInStorefrontCategory,
  productMatchesSearchQuery,
  productVisibleForDeliveryCountry,
  dedupeStorefrontProducts,
  isProductStorefrontVisible,
  type GboGift,
  type Product,
} from "@blossompot/shared";
import { api } from "./api";
import {
  getCatalogProduct,
  getCatalogProducts,
  mergeProductsPreferExisting,
} from "./catalog-fallback";
import { toListingCardProducts } from "./listing-card";
import { isRakhiRelatedProduct, storefrontSkipsRakhiCategory } from "./rakhi-filter";
import { getStorefrontDeliveryCountry } from "./storefront-country";

function isStorefrontVisible(product: Product): boolean {
  return (
    !isGboHiddenFromStorefront(product) &&
    !isRakhiRelatedProduct(product) &&
    isProductStorefrontVisible(product)
  );
}

/**
 * Prefer last good API price over bundled catalog when the API blips.
 * Catalog JSON has historically diverged from DynamoDB (e.g. Om at $1.50 vs live $14.72)
 * and ISR + year-long stale-while-revalidate kept those wrong prices in HTML/OG tags.
 */
const PRODUCT_MEMORY_TTL_MS = 60 * 60 * 1000; // 1 hour
const productMemoryCache = new Map<string, { product: Product; at: number }>();

/**
 * Public catalog only. Cart, checkout, and account calls do not use this.
 * Short enough that a price edit is visible within a minute.
 */
export const CATALOG_REVALIDATE_SECONDS = 45;

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

function catalogCountry(country?: string | null): string {
  return (country ?? "").trim().toUpperCase() || "US";
}

async function fetchGboStorefrontProducts(iso: string): Promise<Product[]> {
  const data = await api<{ gifts: GboGift[] }>(`/gbo/gifts?country=${iso}`, { revalidate: false });
  return (data.gifts ?? [])
    .filter((gift) => gboGiftNumericId(gift) != null)
    .map((gift) => {
      const mapped = gboGiftToProduct(iso, gift);
      const { vendorCost: _c, ...rest } = mapped;
      return rememberProduct(rest as Product);
    });
}

/**
 * Coalesce concurrent loads for the same country into one fetch and one mapping pass.
 * Cleared when the shared promise settles, so this is not an extra TTL cache.
 * Country keys stay separate. Product and GBO gift reads are no-store so a vendor toggle is not frozen.
 */
const gboInFlight = new Map<string, Promise<Product[]>>();

/** Live Gift Baskets Overseas catalog for the selected delivery country. */
export async function loadGboStorefrontProducts(country?: string): Promise<Product[]> {
  if (!isGboStorefrontEnabled()) return [];
  const requested = country ?? (await getStorefrontDeliveryCountry());
  const iso = catalogCountry(requested);
  const pending = gboInFlight.get(iso);
  if (pending) return pending;

  let resolveJob: (products: Product[]) => void = () => undefined;
  let rejectJob: (err: unknown) => void = () => undefined;
  const job = new Promise<Product[]>((resolve, reject) => {
    resolveJob = resolve;
    rejectJob = reject;
  });
  gboInFlight.set(iso, job);
  fetchGboStorefrontProducts(iso).then(resolveJob, rejectJob);
  void job.finally(() => {
    if (gboInFlight.get(iso) === job) gboInFlight.delete(iso);
  });
  return job;
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

function bundledCatalogProduct(slug: string): Product | null {
  const bundled = getCatalogProduct(slug);
  if (!bundled || !isStorefrontVisible(bundled)) return null;
  return rememberProduct(bundled);
}

function catalogListingExtras(params?: {
  category?: string;
  search?: string;
  country?: string;
}): Product[] {
  let extras = getCatalogProducts().filter(isStorefrontVisible);
  if (params?.category) {
    extras = extras.filter((product) => productInStorefrontCategory(product, params.category as string));
  }
  if (params?.search) {
    extras = extras.filter((product) => productMatchesSearchQuery(product, params.search as string));
  }
  if (params?.country) {
    extras = extras.filter((product) => productVisibleForDeliveryCountry(product, params.country as string));
  }
  return extras;
}

export async function loadProductForCountry(
  slug: string,
  country: string
): Promise<{ product: Product; deliverable: boolean; reason?: string } | null> {
  if (!country || isGboHiddenFromStorefront({ slug })) return null;
  try {
    const data = await api<{
      product: Product;
      availability?: { deliverable?: boolean; reason?: string };
    }>(`/products/${slug}?country=${encodeURIComponent(country)}`, { revalidate: false });
    if (!isStorefrontVisible(data.product)) return null;
    return {
      product: rememberProduct(data.product),
      deliverable: data.availability?.deliverable !== false,
      reason: data.availability?.reason,
    };
  } catch (err) {
    const gboRef = parseGboSlug(slug);
    if (gboRef && !isProductMissingError(err)) {
      try {
        const data = await api<{ gift: GboGift }>(
          `/gbo/gifts/${gboRef.productId}?country=${gboRef.country}`,
          { revalidate: false }
        );
        if (data.gift) {
          const mapped = gboGiftToProduct(gboRef.country, data.gift);
          const { vendorCost: _c, ...rest } = mapped;
          const product = rememberProduct(rest as Product);
          return {
            product,
            deliverable: productVisibleForDeliveryCountry(product, country),
          };
        }
      } catch {
        /* GBO token missing, storefront off, or gift not found */
      }
    }
    if (isProductMissingError(err)) return null;
    const stale = memoryProduct(slug);
    if (stale && isStorefrontVisible(stale)) {
      return { product: stale, deliverable: productVisibleForDeliveryCountry(stale, country) };
    }
    return null;
  }
}

/**
 * Live API (Dynamo / GBO) first. Fill missing published bundled catalog SKUs
 * (FNP USA / TF USA) so listings work before Dynamo import completes.
 */
export async function loadProduct(slug: string): Promise<Product | null> {
  if (isGboHiddenFromStorefront({ slug })) return null;
  try {
    const data = await api<{ product: Product }>(`/products/${slug}`, { revalidate: false });
    if (!isStorefrontVisible(data.product)) return null;
    return rememberProduct(data.product);
  } catch (err) {
    const gboRef = parseGboSlug(slug);
    if (gboRef) {
      if (isGboHiddenFromStorefront({ slug })) return null;
      try {
        const data = await api<{ gift: GboGift }>(
          `/gbo/gifts/${gboRef.productId}?country=${gboRef.country}`,
          { revalidate: false }
        );
        if (data.gift) {
          const mapped = gboGiftToProduct(gboRef.country, data.gift);
          const { vendorCost: _c, ...rest } = mapped;
          return rememberProduct(rest as Product);
        }
      } catch {
        /* GBO token missing, storefront off, or gift not found */
      }
    }

    const bundled = bundledCatalogProduct(slug);
    if (bundled) return bundled;
    if (isProductMissingError(err)) return null;
    const stale = memoryProduct(slug);
    if (stale && isStorefrontVisible(stale)) return stale;
    return null;
  }
}

function filterLiveForCountry(live: Product[], country: string): Product[] {
  return rememberProducts(
    dedupeStorefrontProducts(forDeliveryCountry(live, country).filter(isStorefrontVisible))
  );
}

function catalogQuery(params?: { category?: string; search?: string; country?: string | null }): string {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  query.set("country", catalogCountry(params?.country));
  return `?${query.toString()}`;
}

/** Shared list loader — same API + cache policy as `loadProduct` (PDP). */
export async function loadProducts(params?: {
  category?: string;
  search?: string;
  country?: string;
}): Promise<Product[]> {
  if (params?.category && storefrontSkipsRakhiCategory(params.category)) {
    return [];
  }

  const requested = params?.country ?? (await getStorefrontDeliveryCountry());
  if (!requested) return [];
  const country = catalogCountry(requested);
  const qs = catalogQuery({
    category: params?.category,
    search: params?.search,
    country: requested,
  });

  const [dbResult, gboResult] = await Promise.all([
    api<{ products: Product[] }>(`/products${qs}`, { revalidate: false })
      .then((data) => rememberProducts(data.products.filter(isStorefrontVisible)))
      .catch(() => null as Product[] | null),
    loadGboStorefrontProducts(country).catch(() => [] as Product[]),
  ]);

  let extra = gboResult;
  if (params?.category) {
    extra = gboResult.filter((product) => productInStorefrontCategory(product, params.category as string));
  }
  if (params?.search) {
    extra = extra.filter((product) => productMatchesSearchQuery(product, params.search as string));
  }

  const live = dbResult ? mergeBySlug(dbResult, extra) : extra;
  return filterLiveForCountry(
    mergeProductsPreferExisting(live, catalogListingExtras({ ...params, country })),
    country
  );
}

export { toListingCardProducts };

/**
 * Category grids: live API first, then fill missing hamper/catalog SKUs.
 * Never overwrite an API product with bundled catalog prices.
 */
export async function loadProductsByCategory(categorySlug: string, country?: string): Promise<Product[]> {
  let products: Product[] = [];
  try {
    products = await loadProducts({ category: categorySlug, country });
  } catch {
    products = mergeProductsPreferExisting(
      [],
      catalogListingExtras({ category: categorySlug, country: catalogCountry(country) })
    );
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
