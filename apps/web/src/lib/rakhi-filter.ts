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

export function isRakhiRelatedProduct(product: {
  name?: string;
  slug?: string;
  categorySlug?: string;
  description?: string;
  tags?: string[];
  additionalCategorySlugs?: string[];
  seoTitle?: string;
}): boolean {
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
