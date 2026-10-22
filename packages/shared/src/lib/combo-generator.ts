import { VENDOR_ORANGE_COUNTY } from "../constants";
import { type CreateComboInput } from "../schemas/combo";
import { RAKHI_SET_SIZE_CATEGORIES } from "./rakhi-set-size";
import { slugify } from "./slug";
import { normalizedFulfillmentVendorSlug } from "./serviceability";
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
  /** Optional free-text occasion already stored on the product. Empty means no marker. */
  occasion?: string | null;
  /** Optional extra categories. Only known occasion slugs count as markers. */
  additionalCategorySlugs?: readonly string[] | null;
};

/** In-memory combo that `comboSchema` can accept later. No copied price, vendor, or inventory. */
export type ComboDraft = CreateComboInput;

/**
 * Pair eligible products inside each vendor.
 * Vendor order follows `orderProductsByVendor`. Within a vendor, products are sorted by slug
 * and pairs prefer a new category combination, then the least-used components.
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
  const resolved = products.map((product) => ({
    ...product,
    listingVendorSlug: normalizedFulfillmentVendorSlug(product),
  }));
  for (const product of orderProductsByVendor(resolved, vendors)) {
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

/** Primary category for products that are already combinations. They are not combo components. */
const COMBO_PRIMARY_CATEGORY = "combos";

/**
 * Additional category slugs the storefront already uses as occasion pages.
 * A free-text `occasion` value is also a marker. Other tags and titles are not.
 */
const EXPLICIT_OCCASION_CATEGORY_SLUGS = new Set([
  "anniversary-gifts",
  "birthday-gifts",
  "mothers-day-gifts",
  "valentines-day-gifts",
  "wedding-gifts",
]);

/**
 * Catalog category slugs that already identify one festival.
 * A product title is not used. Rakhi set-size slugs come from the existing set-size list.
 */
export const COMBO_FESTIVALS = ["bhai-dooj", "diwali", "rakhi"] as const;
export type ComboFestival = (typeof COMBO_FESTIVALS)[number];

const FESTIVAL_CATEGORY_SLUGS: Record<ComboFestival, readonly string[]> = {
  "bhai-dooj": ["bhai-dooj"],
  diwali: ["diwali"],
  rakhi: [
    "rakhi",
    "rakhi-combo",
    "rakhi-hampers",
    "rakhi-with-chocolates",
    "rakhi-with-dry-fruits",
    "rakhi-with-sweets",
    "single-rakhi",
    "bhaiya-bhabhi-rakhi",
    "kids-rakhi",
    "lumba-rakhi",
    ...RAKHI_SET_SIZE_CATEGORIES,
  ],
};

const FESTIVAL_BY_CATEGORY = new Map<string, ComboFestival>(
  COMBO_FESTIVALS.flatMap((festival) => FESTIVAL_CATEGORY_SLUGS[festival].map((slug) => [slug, festival] as const))
);

/** Festival keys found on the primary category and additional categories. More than one means the product is ambiguous. */
export function comboFestivalKeys(product: {
  categorySlug?: string | null;
  additionalCategorySlugs?: readonly string[] | null;
}): ComboFestival[] {
  const keys = new Set<ComboFestival>();
  const add = (slug: string | null | undefined) => {
    const festival = FESTIVAL_BY_CATEGORY.get(slug?.trim().toLowerCase() ?? "");
    if (festival) keys.add(festival);
  };
  add(product.categorySlug);
  for (const slug of product.additionalCategorySlugs ?? []) add(slug);
  return [...keys].sort();
}

function pairsForVendor(
  products: readonly ComboSourceProduct[],
  limit: number
): Array<[ComboSourceProduct, ComboSourceProduct]> {
  const eligible = eligibleProducts(products);
  const byCategory = new Map<string, ComboSourceProduct[]>();
  for (const product of eligible) {
    const category = product.categorySlug.trim();
    const rows = byCategory.get(category) ?? [];
    rows.push(product);
    byCategory.set(category, rows);
  }
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b));
  const categoryPairs: Array<[string, string]> = [];
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) categoryPairs.push([categories[i]!, categories[j]!]);
  }

  const seen = new Set<string>();
  const use = new Map(eligible.map((product) => [product.slug, 0]));
  const categoryPairUse = new Map(categoryPairs.map(([left, right]) => [pairKey(left, right), 0]));
  const pairs: Array<[ComboSourceProduct, ComboSourceProduct]> = [];

  while (pairs.length < limit) {
    let best: { first: ComboSourceProduct; second: ComboSourceProduct; key: string; score: string; categoryKey: string } | undefined;
    for (const [left, right] of categoryPairs) {
      const categoryKey = pairKey(left, right);
      for (const leftProduct of byCategory.get(left) ?? []) {
        for (const rightProduct of byCategory.get(right) ?? []) {
          if (occasionConflict(leftProduct, rightProduct) || festivalConflict(leftProduct, rightProduct)) continue;
          const key = pairKey(leftProduct.slug, rightProduct.slug);
          if (seen.has(key)) continue;
          const leftUse = use.get(leftProduct.slug) ?? 0;
          const rightUse = use.get(rightProduct.slug) ?? 0;
          const score = [
            padded(categoryPairUse.get(categoryKey) ?? 0),
            padded(leftUse + rightUse),
            padded(Math.max(leftUse, rightUse)),
            leftProduct.slug < rightProduct.slug ? leftProduct.slug : rightProduct.slug,
            leftProduct.slug < rightProduct.slug ? rightProduct.slug : leftProduct.slug,
          ].join("\0");
          if (!best || score < best.score) {
            const [first, second] = orderComponents(leftProduct, rightProduct);
            best = { first, second, key, score, categoryKey };
          }
        }
      }
    }
    if (!best) break;
    seen.add(best.key);
    use.set(best.first.slug, (use.get(best.first.slug) ?? 0) + 1);
    use.set(best.second.slug, (use.get(best.second.slug) ?? 0) + 1);
    categoryPairUse.set(best.categoryKey, (categoryPairUse.get(best.categoryKey) ?? 0) + 1);
    pairs.push([best.first, best.second]);
  }
  return pairs;
}

function eligibleProducts(products: readonly ComboSourceProduct[]): ComboSourceProduct[] {
  const sorted = [...products].sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.categorySlug.localeCompare(b.categorySlug)
  );
  const seen = new Set<string>();
  const eligible: ComboSourceProduct[] = [];
  for (const product of sorted) {
    const slug = product.slug.trim();
    const category = product.categorySlug.trim();
    if (!slug || !category || category === COMBO_PRIMARY_CATEGORY || seen.has(slug)) continue;
    seen.add(slug);
    eligible.push(product);
  }
  return eligible;
}

function occasionMarkers(product: ComboSourceProduct): Set<string> {
  const markers = new Set<string>();
  const occasion = product.occasion?.trim().toLowerCase();
  if (occasion) markers.add(occasion);
  for (const slug of product.additionalCategorySlugs ?? []) {
    const normalized = slug.trim().toLowerCase();
    if (EXPLICIT_OCCASION_CATEGORY_SLUGS.has(normalized)) markers.add(normalized);
  }
  return markers;
}

/**
 * Different festivals never pair. A product whose categories name more than one of these festivals pairs with nobody.
 * An Orange County product with one festival pairs only with that same festival. Other vendors keep pairing a single festival with a general product.
 */
function festivalConflict(left: ComboSourceProduct, right: ComboSourceProduct): boolean {
  const leftKeys = comboFestivalKeys(left);
  const rightKeys = comboFestivalKeys(right);
  if (leftKeys.length > 1 || rightKeys.length > 1) return true;
  if (leftKeys.length === 1 && rightKeys.length === 1) return leftKeys[0] !== rightKeys[0];
  if (leftKeys.length === rightKeys.length) return false;
  const festivalProduct = leftKeys.length === 1 ? left : right;
  return normalizedFulfillmentVendorSlug(festivalProduct) === VENDOR_ORANGE_COUNTY;
}

/** Both sides must carry a marker, and those sets must be disjoint. */
function occasionConflict(left: ComboSourceProduct, right: ComboSourceProduct): boolean {
  const leftMarkers = occasionMarkers(left);
  const rightMarkers = occasionMarkers(right);
  if (leftMarkers.size === 0 || rightMarkers.size === 0) return false;
  for (const marker of leftMarkers) {
    if (rightMarkers.has(marker)) return false;
  }
  return true;
}

function orderComponents(
  left: ComboSourceProduct,
  right: ComboSourceProduct
): [ComboSourceProduct, ComboSourceProduct] {
  return left.slug.localeCompare(right.slug) <= 0 ? [left, right] : [right, left];
}

function pairKey(left: string, right: string): string {
  return left < right ? `${left}\0${right}` : `${right}\0${left}`;
}

function padded(value: number): string {
  return String(value).padStart(6, "0");
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
