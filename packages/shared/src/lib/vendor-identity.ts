import { FNP_IMPORT_TAG, VENDOR_BLOSSOMPOT, VENDOR_FNP, VENDOR_GBO } from "../constants";
import { isGboVendor, parseGboSku, parseGboSlug } from "./gbo";

/**
 * Catalog vendor used for shopping, ZIP checks, and public cards.
 * An explicit slug wins over tags. Gift Baskets Overseas keeps its existing signals.
 * A listing slug is the identity already resolved before public cards drop vendorSlug.
 * The FNP import tag applies only when both slugs are missing. Anything else is BlossomPot.
 */
export function resolveCatalogVendorSlug(product: {
  vendorSlug?: string | null;
  listingVendorSlug?: string | null;
  internationalDelivery?: boolean | null;
  slug?: string | null;
  productSlug?: string | null;
  sku?: string | null;
  tags?: readonly string[] | null;
}): string {
  const slug = product.slug ?? product.productSlug;
  if (
    isGboVendor(product.vendorSlug) ||
    product.internationalDelivery === true ||
    parseGboSlug(slug) ||
    parseGboSku(product.sku)
  ) {
    return VENDOR_GBO;
  }
  const explicit = product.vendorSlug?.trim();
  if (explicit) return explicit;
  const listed = product.listingVendorSlug?.trim();
  if (listed) return listed;
  if ((product.tags ?? []).includes(FNP_IMPORT_TAG)) return VENDOR_FNP;
  return VENDOR_BLOSSOMPOT;
}
