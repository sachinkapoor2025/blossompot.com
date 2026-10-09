/**
 * BlossomPot is flowers/cakes/gifts — never surface Rakhi / Raksha Bandhan catalog.
 * Used to hide legacy SKUs and categories still present in DynamoDB/catalog JSON.
 */
export function isRakhiRelatedText(...parts: Array<string | null | undefined>): boolean {
  const blob = parts.filter(Boolean).join(" ").toLowerCase();
  if (!blob) return false;
  return (
    /\brakhi\b/.test(blob) ||
    /\braksha\b/.test(blob) ||
    /\bbandhan\b/.test(blob) ||
    /\broli\b/.test(blob) ||
    /\bchawal\b/.test(blob) ||
    /\blumba\b/.test(blob) ||
    /\bbhaiya\b/.test(blob) ||
    /\bbhabhi\b/.test(blob)
  );
}

const ORANGE_COUNTY_VENDOR = "orange-county";
const ORANGE_COUNTY_CATEGORY = "rakhi-hampers";

export function isOrangeCountyCatalogProduct(product: { vendorSlug?: string | null }): boolean {
  return (product.vendorSlug ?? "").trim() === ORANGE_COUNTY_VENDOR;
}

export function isRakhiRelatedProduct(product: {
  name?: string;
  slug?: string;
  categorySlug?: string;
  description?: string;
  tags?: string[];
  additionalCategorySlugs?: string[];
  seoTitle?: string;
  vendorSlug?: string | null;
}): boolean {
  if (isOrangeCountyCatalogProduct(product)) return false;
  // Public product responses omit vendorSlug. rakhi-hampers is the Orange County catalog.
  if ((product.categorySlug ?? "").trim() === ORANGE_COUNTY_CATEGORY) return false;
  return isRakhiRelatedText(
    product.name,
    product.slug,
    product.categorySlug,
    product.description,
    product.seoTitle,
    ...(product.tags ?? []),
    ...(product.additionalCategorySlugs ?? [])
  );
}

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
