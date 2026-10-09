import { fulfillmentVendorSlug } from "./serviceability";

/** Vendor merchandising order. Stored on the catalog vendor record, not on products. */
export type VendorDisplaySource = {
  vendorSlug: string;
  vendorName: string;
  displayOrder?: number;
  /** From `catalogVendorShoppingStatus`. Omitted vendors stay on the existing shopping helper. */
  shoppingAvailable?: boolean;
};

export type VendorSortableProduct = {
  vendorSlug?: string | null;
  internationalDelivery?: boolean | null;
  slug?: string | null;
  productSlug?: string | null;
  sku?: string | null;
  tags?: readonly string[] | null;
  /** Computed listing key. Not stored on the product record. */
  listingVendorSlug?: string;
  listingVendorName?: string;
  listingDisplayOrder?: number;
};

export type StorefrontProductSort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export type ListingVendorGroup = {
  vendorSlug: string;
  vendorName: string;
  displayOrder?: number;
  count: number;
};

export function readStoredDisplayOrder(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 1000) return undefined;
  return value;
}

/**
 * Copies a valid stored displayOrder onto the vendor.
 * A missing or invalid stored value leaves the vendor unchanged, so a code default
 * keeps its order and a stored record that omitted the field stays unordered.
 */
export function applyStoredDisplayOrder<T extends { displayOrder?: number }>(vendor: T, value: unknown): T {
  const displayOrder = readStoredDisplayOrder(value);
  if (displayOrder == null) return vendor;
  return { ...vendor, displayOrder };
}

/** Ordered vendors first, ascending. Unordered vendors follow by name, then slug. */
export function compareVendorDisplay(a: VendorDisplaySource, b: VendorDisplaySource): number {
  const aOrdered = a.displayOrder != null;
  const bOrdered = b.displayOrder != null;
  if (aOrdered !== bOrdered) return aOrdered ? -1 : 1;
  if (aOrdered && bOrdered && a.displayOrder !== b.displayOrder) {
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  }
  const byName = a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: "base" });
  if (byName !== 0) return byName;
  return a.vendorSlug.localeCompare(b.vendorSlug);
}

export function sortVendorsForDisplay<T extends VendorDisplaySource>(vendors: readonly T[]): T[] {
  return [...vendors].sort(compareVendorDisplay);
}

export function nextDisplayOrder(vendors: readonly { displayOrder?: number }[]): number {
  let max = 0;
  for (const vendor of vendors) {
    if (vendor.displayOrder != null && vendor.displayOrder > max) max = vendor.displayOrder;
  }
  return max + 1;
}

export function moveVendorToPosition(
  vendorSlugs: readonly string[],
  vendorSlug: string,
  position: number
): string[] | null {
  const current = vendorSlugs.indexOf(vendorSlug);
  if (current < 0) return null;
  if (!Number.isInteger(position) || position < 1 || position > vendorSlugs.length) return null;
  const next = [...vendorSlugs];
  const [moved] = next.splice(current, 1);
  next.splice(position - 1, 0, moved!);
  return next;
}

export function insertVendorAtPosition(
  vendorSlugs: readonly string[],
  vendorSlug: string,
  position: number
): string[] | null {
  if (vendorSlugs.includes(vendorSlug)) return null;
  if (!Number.isInteger(position) || position < 1 || position > vendorSlugs.length + 1) return null;
  const next = [...vendorSlugs];
  next.splice(position - 1, 0, vendorSlug);
  return next;
}

export function planVendorDisplaySequence(
  knownSlugs: readonly string[],
  requestedSlugs: readonly string[]
):
  | { ok: true; assignments: Array<{ vendorSlug: string; displayOrder: number }> }
  | { ok: false; error: string } {
  if (requestedSlugs.length !== knownSlugs.length) {
    return { ok: false, error: "The vendor sequence must include every vendor once." };
  }
  const known = new Set(knownSlugs);
  const seen = new Set<string>();
  for (const slug of requestedSlugs) {
    if (!known.has(slug)) return { ok: false, error: "Unknown vendor in the sequence." };
    if (seen.has(slug)) return { ok: false, error: "Each vendor can appear only once." };
    seen.add(slug);
  }
  if (seen.size !== known.size) {
    return { ok: false, error: "The vendor sequence must include every vendor once." };
  }
  return {
    ok: true,
    assignments: requestedSlugs.map((vendorSlug, index) => ({ vendorSlug, displayOrder: index + 1 })),
  };
}

function vendorMap(vendors: readonly VendorDisplaySource[]): Map<string, VendorDisplaySource> {
  return new Map(vendors.map((vendor) => [vendor.vendorSlug, vendor]));
}

export function productVendorDisplay(
  product: VendorSortableProduct,
  vendors: ReadonlyMap<string, VendorDisplaySource>
): VendorDisplaySource {
  const slug = product.listingVendorSlug?.trim() || fulfillmentVendorSlug(product);
  const known = vendors.get(slug);
  return {
    vendorSlug: slug,
    vendorName: known?.vendorName || product.listingVendorName || "",
    displayOrder: known ? known.displayOrder : product.listingDisplayOrder,
  };
}

export function orderProductsByVendor<T extends VendorSortableProduct>(
  products: readonly T[],
  vendors: readonly VendorDisplaySource[],
  withinVendor: (a: T, b: T) => number = () => 0
): T[] {
  const registry = vendorMap(vendors);
  const buckets = new Map<string, Array<{ product: T; index: number; vendor: VendorDisplaySource }>>();
  products.forEach((product, index) => {
    const vendor = productVendorDisplay(product, registry);
    const bucket = buckets.get(vendor.vendorSlug) ?? [];
    bucket.push({ product, index, vendor });
    buckets.set(vendor.vendorSlug, bucket);
  });
  const orderedBuckets = [...buckets.values()].sort((a, b) => compareVendorDisplay(a[0]!.vendor, b[0]!.vendor));
  const ordered: T[] = [];
  for (const bucket of orderedBuckets) {
    bucket.sort((a, b) => {
      const compared = withinVendor(a.product, b.product);
      if (compared !== 0) return compared;
      return a.index - b.index;
    });
    for (const entry of bucket) ordered.push(entry.product);
  }
  return ordered;
}

export function compareWithinVendor<T extends { name: string; price: number }>(
  sort: StorefrontProductSort
): (a: T, b: T) => number {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "name-asc":
      return (a, b) => a.name.localeCompare(b.name);
    case "name-desc":
      return (a, b) => b.name.localeCompare(a.name);
    default:
      return () => 0;
  }
}

export function sortStorefrontProducts<T extends VendorSortableProduct & { name: string; price: number }>(
  products: readonly T[],
  sort: StorefrontProductSort,
  vendors: readonly VendorDisplaySource[] = []
): T[] {
  return orderProductsByVendor(products, vendors, compareWithinVendor(sort));
}

export function listingGroupsForProducts<T extends VendorSortableProduct>(
  products: readonly T[],
  vendors: readonly VendorDisplaySource[]
): ListingVendorGroup[] {
  const registry = vendorMap(vendors);
  const groups: ListingVendorGroup[] = [];
  for (const product of products) {
    const vendor = productVendorDisplay(product, registry);
    const last = groups[groups.length - 1];
    if (last && last.vendorSlug === vendor.vendorSlug) {
      last.count += 1;
    } else {
      groups.push({
        vendorSlug: vendor.vendorSlug,
        vendorName: vendor.vendorName,
        ...(vendor.displayOrder != null ? { displayOrder: vendor.displayOrder } : {}),
        count: 1,
      });
    }
  }
  return groups;
}

export function filterAlignedListingGroups<T>(
  products: readonly T[],
  groups: readonly { vendorSlug: string; count: number }[] | undefined,
  keep: (product: T) => boolean
): { products: T[]; groups: Array<{ vendorSlug: string; count: number }> | undefined } {
  const expected = groups?.reduce((sum, group) => sum + group.count, 0) ?? -1;
  if (!groups || expected !== products.length) {
    return { products: products.filter(keep), groups: undefined };
  }
  const nextProducts: T[] = [];
  const nextGroups: Array<{ vendorSlug: string; count: number }> = [];
  let index = 0;
  for (const group of groups) {
    const kept = products.slice(index, index + group.count).filter(keep);
    index += group.count;
    if (kept.length === 0) continue;
    nextProducts.push(...kept);
    nextGroups.push({ vendorSlug: group.vendorSlug, count: kept.length });
  }
  return { products: nextProducts, groups: nextGroups };
}

export function arrangeStorefrontProducts<T extends VendorSortableProduct>(
  products: readonly T[],
  groups: readonly { vendorSlug: string; count: number }[] | undefined,
  extras: readonly T[],
  vendors: readonly VendorDisplaySource[]
): T[] {
  const tagged: T[] = [];
  const expected = groups?.reduce((sum, group) => sum + group.count, 0) ?? -1;
  if (groups && expected === products.length) {
    let index = 0;
    for (const group of groups) {
      for (const product of products.slice(index, index + group.count)) {
        tagged.push({ ...product, listingVendorSlug: group.vendorSlug });
      }
      index += group.count;
    }
  } else {
    tagged.push(...products);
  }
  tagged.push(...extras);
  return orderProductsByVendor(tagged, vendors);
}

/** Public listing product. The stored vendorSlug and vendorCost are not included. */
export type AnnotatedStorefrontProduct<T> = Omit<
  T,
  "vendorSlug" | "vendorCost" | "listingVendorSlug" | "listingVendorName" | "listingDisplayOrder"
> & {
  listingVendorSlug: string;
  listingVendorName: string;
  listingDisplayOrder?: number;
};

export function annotateStorefrontListing<T extends VendorSortableProduct & { vendorCost?: unknown }>(
  products: readonly T[],
  vendors: readonly VendorDisplaySource[]
): AnnotatedStorefrontProduct<T>[] {
  const registry = vendorMap(vendors);
  return products.map((product) => annotateOneStorefrontProduct(product, productVendorDisplay(product, registry)));
}

function annotateOneStorefrontProduct<T extends VendorSortableProduct & { vendorCost?: unknown }>(
  product: T,
  vendor: VendorDisplaySource
): AnnotatedStorefrontProduct<T> {
  const {
    vendorSlug: _vendorSlug,
    vendorCost: _vendorCost,
    listingVendorSlug: _listingSlug,
    listingVendorName: _listingName,
    listingDisplayOrder: _listingOrder,
    ...rest
  } = product;
  return {
    ...rest,
    listingVendorSlug: vendor.vendorSlug,
    listingVendorName: vendor.vendorName,
    ...(vendor.displayOrder != null ? { listingDisplayOrder: vendor.displayOrder } : {}),
  };
}
