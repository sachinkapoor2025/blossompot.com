import {
  parseGboSlug,
  gboGiftToProduct,
  gboGiftNumericId,
  isGboHiddenFromStorefront,
  isGboStorefrontEnabled,
  productInStorefrontCategory,
  productMatchesSearchQuery,
  productVisibleForDeliveryCountry,
  annotateStorefrontListing,
  arrangeStorefrontProducts,
  filterAlignedListingGroups,
  dedupeStorefrontProducts,
  isProductStorefrontVisible,
  defaultCatalogVendor,
  isCatalogVendorSlug,
  type GboGift,
  type ListingVendorGroup,
  type Product,
  type ShoppingVendorRecord,
  type VendorDisplaySource,
} from "@blossompot/shared";
import { api } from "./api";
import {
  bundledHiddenForDisabledVendor,
  getCatalogProducts,
  getCatalogProductsForCountry,
  rememberStorefrontShoppingVendors,
} from "./catalog-fallback";
import { toListingCardProducts } from "./listing-card";
import { isRakhiRelatedProduct, storefrontSkipsRakhiCategory } from "./rakhi-filter";
import { availabilityAllowsPurchase } from "./product-availability-copy";
import { getStorefrontDeliveryCountry, getStorefrontDeliveryPostal } from "./storefront-country";

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

function forDeliveryCountry(products: Product[], country: string): Product[] {
  return products.filter((product) => productVisibleForDeliveryCountry(product, country));
}

function isProductMissingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /not found/i.test(message) || /\(404\)/.test(message);
}

function decodeProductSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return slug.trim();
  }
}

function catalogListingExtras(params?: {
  category?: string;
  search?: string;
  country?: string;
}): Product[] {
  let extras = (
    params?.country ? getCatalogProductsForCountry(params.country) : getCatalogProducts()
  ).filter(isStorefrontVisible);
  if (params?.category) {
    extras = extras.filter((product) => productInStorefrontCategory(product, params.category as string));
  }
  if (params?.search) {
    extras = extras.filter((product) => productMatchesSearchQuery(product, params.search as string));
  }
  return extras;
}

export async function loadProductForCountry(
  slug: string,
  country: string
): Promise<{ product: Product; deliverable: boolean; reason?: string } | null> {
  const decoded = decodeProductSlug(slug);
  if (!country || isGboHiddenFromStorefront({ slug: decoded })) return null;

  const fromGbo = async (): Promise<{ product: Product; deliverable: boolean } | null> => {
    const gboRef = parseGboSlug(decoded);
    if (!gboRef) return null;
    try {
      const data = await api<{ gift: GboGift }>(
        `/gbo/gifts/${gboRef.productId}?country=${gboRef.country}`,
        { revalidate: false }
      );
      if (!data.gift) return null;
      const mapped = gboGiftToProduct(gboRef.country, data.gift);
      const { vendorCost: _c, ...rest } = mapped;
      const product = rememberProduct(rest as Product);
      if (!isStorefrontVisible(product)) return null;
      return unverifiedProduct(product);
    } catch {
      return null;
    }
  };

  try {
    const postal = await getStorefrontDeliveryPostal();
    const locationQuery = new URLSearchParams({ country });
    if (postal) locationQuery.set("postalCode", postal);
    const data = await api<{
      product: Product;
      availability?: { deliverable?: boolean; reason?: string };
    }>(`/products/${encodeURIComponent(decoded)}?${locationQuery.toString()}`, {
      revalidate: false,
    });
    if (!isStorefrontVisible(data.product)) return null;
    if (vendorHiddenFromStorefront(data.availability?.reason)) return null;
    return {
      product: rememberProduct(data.product),
      deliverable: availabilityAllowsPurchase(data.availability),
      reason: data.availability?.reason,
    };
  } catch (err) {
    if (!isProductMissingError(err)) return null;
    return fromGbo();
  }
}

function vendorHiddenFromStorefront(reason?: string | null): boolean {
  return reason === "vendor_disabled" || reason === "gbo_storefront_disabled";
}

function shoppingRecords(vendors: readonly VendorDisplaySource[]): ShoppingVendorRecord[] {
  return vendors.map((vendor) => ({
    vendorSlug: vendor.vendorSlug,
    enabled: vendor.shoppingAvailable !== false,
    deliveryCountries: isCatalogVendorSlug(vendor.vendorSlug)
      ? defaultCatalogVendor(vendor.vendorSlug).deliveryCountries
      : ["US"],
  }));
}

function withoutDisabledVendors(
  products: Product[],
  country: string,
  vendors: readonly VendorDisplaySource[]
): Product[] {
  if (!vendors.length) return [];
  const records = shoppingRecords(vendors);
  return products.filter((product) => !bundledHiddenForDisabledVendor(product, country, records));
}

/** Product info may still render. Purchasing stays blocked until a location check succeeds. */
function unverifiedProduct(product: Product): { product: Product; deliverable: false } {
  return { product, deliverable: false };
}

/**
 * Live API (Dynamo / GBO) first. Fill missing published bundled catalog SKUs
 * (FNP USA / TF USA) so listings work before Dynamo import completes.
 */
export async function loadProduct(slug: string): Promise<Product | null> {
  const decoded = decodeProductSlug(slug);
  if (isGboHiddenFromStorefront({ slug: decoded })) return null;
  try {
    const data = await api<{ product: Product }>(`/products/${encodeURIComponent(decoded)}`, {
      revalidate: false,
    });
    if (!isStorefrontVisible(data.product)) return null;
    return rememberProduct(data.product);
  } catch {
    const gboRef = parseGboSlug(decoded);
    if (gboRef) {
      if (isGboHiddenFromStorefront({ slug: decoded })) return null;
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

    return null;
  }
}

function filterLiveForCountry(live: Product[], country: string): Product[] {
  return rememberProducts(
    dedupeStorefrontProducts(forDeliveryCountry(live, country).filter(isStorefrontVisible))
  );
}

function catalogQuery(params?: {
  category?: string;
  search?: string;
  country?: string | null;
  postalCode?: string | null;
}): string {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  query.set("country", catalogCountry(params?.country));
  const postal = params?.postalCode?.trim();
  if (postal) query.set("postalCode", postal);
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
  const postalCode = await getStorefrontDeliveryPostal();
  const qs = catalogQuery({
    category: params?.category,
    search: params?.search,
    country: requested,
    postalCode,
  });

  const [dbResult, gboResult] = await Promise.all([
    api<{ products: Product[]; listingGroups?: ListingVendorGroup[]; listingVendors?: VendorDisplaySource[] }>(
      `/products${qs}`,
      { revalidate: false, headers: { "x-blossompot-listing-groups": "1" } }
    )
      .then((data) => {
        const aligned = filterAlignedListingGroups(data.products, data.listingGroups, isStorefrontVisible);
        return {
          products: rememberProducts(aligned.products),
          listingGroups: aligned.groups,
          listingVendors: data.listingVendors ?? [],
        };
      })
      .catch(() => null),
    loadGboStorefrontProducts(country).catch(() => [] as Product[]),
  ]);

  let extra = gboResult;
  if (params?.category) {
    extra = gboResult.filter((product) => productInStorefrontCategory(product, params.category as string));
  }
  if (params?.search) {
    extra = extra.filter((product) => productMatchesSearchQuery(product, params.search as string));
  }

  const apiProducts = dbResult?.products ?? [];
  const seen = new Set(apiProducts.map((product) => product.slug));
  const listingVendors = dbResult?.listingVendors ?? [];
  if (listingVendors.length) rememberStorefrontShoppingVendors(shoppingRecords(listingVendors));
  const bundledExtras = dbResult
    ? withoutDisabledVendors(catalogListingExtras({ ...params, country }), country, listingVendors)
    : [];
  const visibleGbo = dbResult ? withoutDisabledVendors(extra, country, listingVendors) : extra;
  const extras = [...visibleGbo, ...bundledExtras].filter((product) => {
    if (seen.has(product.slug)) return false;
    seen.add(product.slug);
    return true;
  });
  const vendors = dbResult?.listingVendors ?? [];
  const arranged = arrangeStorefrontProducts(apiProducts, dbResult?.listingGroups, extras, vendors);
  return annotateStorefrontListing(filterLiveForCountry(arranged, country), vendors);
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
