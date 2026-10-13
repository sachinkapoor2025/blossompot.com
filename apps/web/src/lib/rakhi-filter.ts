/**
 * BlossomPot is flowers/cakes/gifts — never surface Rakhi / Raksha Bandhan catalog.
 * The product predicate lives in shared so the listing card view uses the same rule.
 */
import { isRakhiRelatedText } from "@blossompot/shared";

export { isRakhiRelatedProduct, isRakhiRelatedText } from "@blossompot/shared";

const ORANGE_COUNTY_CATEGORY = "rakhi-hampers";

export function isRakhiRelatedCategorySlug(slug: string | null | undefined): boolean {
  return isRakhiRelatedText(slug);
}

/** Rakhi category pages stay hidden, except the Orange County hamper catalog. */
export function storefrontSkipsRakhiCategory(category: string | null | undefined): boolean {
  if ((category ?? "").trim() === ORANGE_COUNTY_CATEGORY) return false;
  return isRakhiRelatedCategorySlug(category);
}

/** Products whose category is outside the homepage sections still need a place on the shop page. */
export function productsNotShownInSections<T extends { slug: string }>(
  products: readonly T[],
  shown: readonly T[]
): T[] {
  const slugs = new Set(shown.map((product) => product.slug));
  return products.filter((product) => !slugs.has(product.slug));
}
