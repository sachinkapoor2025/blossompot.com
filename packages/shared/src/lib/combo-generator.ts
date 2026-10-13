import { type CreateComboInput } from "../schemas/combo";
import { slugify } from "./slug";
import {
  orderProductsByVendor,
  productVendorDisplay,
  type VendorDisplaySource,
  type VendorSortableProduct,
} from "./vendor-display-order";

/** Eligible storefront product. Vendor and category come from the fields the catalog already stores. */
export type ComboSourceProduct = VendorSortableProduct & {
  slug: string;
  name: string;
  categorySlug: string;
};

/** In-memory combo that `comboSchema` can accept later. No copied price, vendor, or inventory. */
export type ComboDraft = CreateComboInput;

/**
 * Pair eligible products inside each vendor.
 * Vendor order follows `orderProductsByVendor`. Pair order follows the existing product order.
 * `sortOrder` is the position in that list so the combo index keeps the same sequence.
 */
export function generateComboDrafts(
  products: readonly ComboSourceProduct[],
  vendors: readonly VendorDisplaySource[],
  limitPerVendor: number
): ComboDraft[] {
  if (!Number.isSafeInteger(limitPerVendor) || limitPerVendor < 1 || products.length === 0) return [];

  const registry = new Map(vendors.map((vendor) => [vendor.vendorSlug, vendor]));
  const groups: ComboSourceProduct[][] = [];
  for (const product of orderProductsByVendor(products, vendors)) {
    const vendorSlug = productVendorDisplay(product, registry).vendorSlug;
    const current = groups[groups.length - 1];
    const currentVendor = current ? productVendorDisplay(current[0]!, registry).vendorSlug : undefined;
    if (!current || currentVendor !== vendorSlug) groups.push([product]);
    else current.push(product);
  }

  const usedSlugs = new Set<string>();
  const drafts: ComboDraft[] = [];
  for (const group of groups) {
    for (const [first, second] of pairsForVendor(group, limitPerVendor)) {
      drafts.push({
        slug: uniqueComboSlug(first.slug, second.slug, usedSlugs),
        name: comboName(first.name, second.name),
        description: "",
        productSlugs: [first.slug, second.slug],
        published: true,
        sortOrder: drafts.length,
      });
    }
  }
  return drafts;
}

function pairsForVendor(
  products: readonly ComboSourceProduct[],
  limit: number
): Array<[ComboSourceProduct, ComboSourceProduct]> {
  const seen = new Set<string>();
  const pairs: Array<[ComboSourceProduct, ComboSourceProduct]> = [];
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      if (pairs.length >= limit) return pairs;
      const first = products[i]!;
      const second = products[j]!;
      if (!first.slug || !second.slug || first.slug === second.slug) continue;
      const firstCategory = first.categorySlug.trim();
      const secondCategory = second.categorySlug.trim();
      if (!firstCategory || !secondCategory || firstCategory === secondCategory) continue;
      const key = [first.slug, second.slug].sort().join("\0");
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([first, second]);
    }
  }
  return pairs;
}

function comboName(first: string, second: string): string {
  const name = `${first.trim() || "Gift"} and ${second.trim() || "Gift"}`;
  return name.length <= 160 ? name : name.slice(0, 160).trimEnd() || "Gift";
}

function uniqueComboSlug(first: string, second: string, used: Set<string>): string {
  const base = slugify(`${first}-${second}`) || "combo";
  let slug = fitComboSlug(base, 80);
  let n = 2;
  while (used.has(slug)) {
    const suffix = `-${n}`;
    slug = `${fitComboSlug(base, 80 - suffix.length)}${suffix}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

function fitComboSlug(value: string, max: number): string {
  const fitted = value.slice(0, Math.max(1, max)).replace(/-+$/g, "");
  return fitted || "combo";
}
