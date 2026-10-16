export type AssignedProductCategories = {
  categorySlug: string;
  /** Present only when additional categories were included in the request. */
  additionalCategorySlugs?: string[];
};

/**
 * Primary category is required and must already exist.
 * Additional categories must exist too. The primary slug is not stored again
 * in additionalCategorySlugs. Omitted additional categories are left unchanged.
 */
export function assignProductCategories(input: {
  categorySlug: string;
  additionalCategorySlugs?: readonly string[] | null;
  knownSlugs: ReadonlySet<string>;
}): { ok: true } & AssignedProductCategories | { ok: false; error: string } {
  const categorySlug = input.categorySlug.trim();
  if (!categorySlug) return { ok: false, error: "A primary category is required." };
  if (!input.knownSlugs.has(categorySlug)) {
    return { ok: false, error: `Category "${categorySlug}" does not exist.` };
  }
  if (input.additionalCategorySlugs == null) return { ok: true, categorySlug };

  const additionalCategorySlugs: string[] = [];
  const seen = new Set<string>();
  for (const value of input.additionalCategorySlugs) {
    const slug = value.trim();
    if (!slug || slug === categorySlug || seen.has(slug)) continue;
    if (!input.knownSlugs.has(slug)) {
      return { ok: false, error: `Category "${slug}" does not exist.` };
    }
    seen.add(slug);
    additionalCategorySlugs.push(slug);
  }
  return { ok: true, categorySlug, additionalCategorySlugs };
}
