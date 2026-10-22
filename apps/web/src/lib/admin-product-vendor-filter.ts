import {
  CATALOG_VENDOR_SLUGS,
  defaultCatalogVendor,
  fulfillmentVendorSlug,
} from "@blossompot/shared";

/** Fields the shopping and vendor-disable resolvers use to identify a product. */
export type AdminVendorIdentity = {
  vendorSlug?: string | null;
  listingVendorSlug?: string | null;
  internationalDelivery?: boolean | null;
  slug?: string | null;
  sku?: string | null;
  tags?: readonly string[] | null;
};

export type AdminVendorFilterProduct = AdminVendorIdentity & {
  name: string;
  slug: string;
  sku?: string | null;
};

export type AdminVendorFilterOption = {
  vendorSlug: string;
  vendorName: string;
};

/**
 * Same resolver as shopping and vendor disable, compared case-insensitively.
 * A missing or blank vendorSlug is BlossomPot unless a Gift Baskets Overseas
 * signal or the FNP import tag identifies another vendor.
 */
export function adminProductVendorSlug(product: AdminVendorIdentity): string {
  return fulfillmentVendorSlug(product).trim().toLowerCase();
}

/** Client-side list filter. An empty vendor keeps every product. */
export function filterAdminProducts<T extends AdminVendorFilterProduct>(
  products: readonly T[],
  filters: { vendor?: string | null; search?: string | null }
): T[] {
  const vendor = filters.vendor?.trim().toLowerCase() ?? "";
  const query = filters.search?.trim().toLowerCase() ?? "";
  return products.filter((product) => {
    if (vendor && vendor !== "all" && adminProductVendorSlug(product) !== vendor) return false;
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      product.slug.includes(query) ||
      Boolean(product.sku?.toLowerCase().includes(query))
    );
  });
}

/** Configured vendors first, then any built-in the list omitted. */
export function adminVendorFilterOptions(
  configured: readonly { vendorSlug: string; vendorName: string }[]
): AdminVendorFilterOption[] {
  const options: AdminVendorFilterOption[] = [];
  const seen = new Set<string>();
  for (const vendor of configured) {
    const vendorSlug = vendor.vendorSlug.trim().toLowerCase();
    const vendorName = vendor.vendorName.trim();
    if (!vendorSlug || !vendorName || seen.has(vendorSlug)) continue;
    seen.add(vendorSlug);
    options.push({ vendorSlug, vendorName });
  }
  for (const slug of CATALOG_VENDOR_SLUGS) {
    if (seen.has(slug)) continue;
    options.push({ vendorSlug: slug, vendorName: defaultCatalogVendor(slug).vendorName });
  }
  return options;
}
