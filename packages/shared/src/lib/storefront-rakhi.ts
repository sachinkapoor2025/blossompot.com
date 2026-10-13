import { VENDOR_ORANGE_COUNTY } from "../constants";

const ORANGE_COUNTY_CATEGORY = "rakhi-hampers";

/** BlossomPot storefront hides legacy Rakhi / Raksha Bandhan catalog text. */
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

/**
 * True when a public product should leave the storefront.
 * Orange County hampers stay, including responses that no longer carry vendorSlug.
 */
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
  if ((product.vendorSlug ?? "").trim() === VENDOR_ORANGE_COUNTY) return false;
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
