import { normalizeProductImageKey } from "./product-images";

export type StorefrontDedupeProduct = {
  slug: string;
  name: string;
  sku?: string | null;
  categorySlug?: string;
  additionalCategorySlugs?: string[];
  images?: string[];
  description?: string;
  couponExcluded?: boolean;
  tags?: string[];
  vendorSlug?: string | null;
};

export function normalizeStorefrontDedupeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`′’]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[|–—−]/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function storefrontProductRank(product: StorefrontDedupeProduct): number {
  let rank = 0;
  const sku = (product.sku ?? "").toUpperCase();
  if (/^(TFFF|TFCC|TFWGC|TFBW)/.test(sku)) rank += 100;
  if ((product.tags ?? []).includes("tf-usa")) rank += 30;
  if (product.couponExcluded) rank += 20;
  if (product.vendorSlug) rank += 10;
  rank += Math.min(product.images?.length ?? 0, 8);
  if ((product.description ?? "").length > 80) rank += 5;
  return rank;
}

function imageDedupeKey(product: StorefrontDedupeProduct): string {
  const first = product.images?.find((url) => url.trim()) ?? "";
  if (!first) return "";
  const key = normalizeProductImageKey(first);
  // Only collapse gallery clones of the same TF import asset — shared Unsplash/CDN
  // placeholders are reused across real distinct SKUs.
  if (!key.includes("/uploads/tf-usa/")) return "";
  return key;
}

/**
 * One card per slug, SKU, display name (within category), and featured image.
 * Prefers TF USA / coupon-excluded catalog rows when the same item appears twice.
 */
export function dedupeStorefrontProducts<T extends StorefrontDedupeProduct>(products: T[]): T[] {
  const ranked = [...products].sort((a, b) => storefrontProductRank(b) - storefrontProductRank(a));
  const usedSlug = new Set<string>();
  const usedSku = new Set<string>();
  const usedName = new Set<string>();
  const usedImage = new Set<string>();
  const keep = new Set<T>();

  for (const product of ranked) {
    const slug = product.slug.trim().toLowerCase();
    const sku = (product.sku ?? "").trim().toUpperCase();
    const name = `${normalizeStorefrontDedupeLabel(product.name)}|${(product.categorySlug ?? "").trim().toLowerCase()}`;
    const image = imageDedupeKey(product);
    if (!slug) continue;
    if (usedSlug.has(slug)) continue;
    if (sku && usedSku.has(sku)) continue;
    if (name !== "|" && usedName.has(name)) continue;
    if (image && usedImage.has(image)) continue;
    usedSlug.add(slug);
    if (sku) usedSku.add(sku);
    if (name !== "|") usedName.add(name);
    if (image) usedImage.add(image);
    keep.add(product);
  }

  return products.filter((product) => keep.has(product));
}

/** Each product appears in one section: primary category first, then a single additional match. */
export function groupStorefrontProductsOnce<T extends StorefrontDedupeProduct>(
  products: T[],
  categorySlugs: readonly string[]
): Map<string, T[]> {
  const unique = dedupeStorefrontProducts(products);
  const claimed = new Set<string>();
  const groups = new Map<string, T[]>();

  for (const slug of categorySlugs) {
    const list = unique.filter((product) => product.categorySlug === slug && !claimed.has(product.slug));
    for (const product of list) claimed.add(product.slug);
    groups.set(slug, list);
  }

  for (const slug of categorySlugs) {
    const list = groups.get(slug) ?? [];
    for (const product of unique) {
      if (claimed.has(product.slug)) continue;
      if (product.additionalCategorySlugs?.includes(slug)) {
        list.push(product);
        claimed.add(product.slug);
      }
    }
    groups.set(slug, list);
  }

  return groups;
}
