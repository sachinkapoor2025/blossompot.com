import { productSkuKeys } from "../db/keys";

/**
 * Catalog SKU identity.
 * Trim the value, then compare and reserve it in lowercase.
 * The product item keeps the trimmed spelling. A blank value has no reservation.
 * Legacy products do not gain a reservation until a write path reserves that SKU.
 */
export function normalizeCatalogSku(sku: string | null | undefined): string | null {
  const trimmed = (sku ?? "").trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function displayCatalogSku(sku: string | null | undefined): string | undefined {
  const trimmed = (sku ?? "").trim();
  return trimmed || undefined;
}

/** Claim a SKU for this product, or refresh the reservation this product already owns. */
export const SKU_OWNER_CONDITION = "attribute_not_exists(PK) OR productSlug = :skuOwner";

export type SkuReservationDiagnosis = {
  productsWithSkuAndNoReservation: Array<{ slug: string; sku: string }>;
  duplicateNormalizedSkus: Array<{ sku: string; slugs: string[] }>;
  reservationsMissingOwner: Array<{ sku: string; productSlug: string }>;
  reservationsWithDifferentSku: Array<{ sku: string; productSlug: string; productSku: string | null }>;
};

/**
 * Read-only classification of product rows and SKU# reservations.
 * It does not repair, delete, or choose a winner.
 */
export function diagnoseCatalogSkuReservations(
  items: ReadonlyArray<Record<string, unknown>>
): SkuReservationDiagnosis {
  const products = items.filter(
    (item) => String(item.PK ?? "").startsWith("PRODUCT#") && item.SK === "META"
  );
  const reservations = items.filter(
    (item) => String(item.PK ?? "").startsWith("SKU#") && item.SK === "META"
  );
  const productBySlug = new Map<string, Record<string, unknown>>();
  for (const product of products) {
    const slug = String(product.slug ?? String(product.PK).slice("PRODUCT#".length));
    productBySlug.set(slug, product);
  }
  const reservationBySku = new Map<string, Record<string, unknown>>();
  for (const row of reservations) {
    reservationBySku.set(String(row.PK).slice("SKU#".length), row);
  }

  const productsWithSkuAndNoReservation: SkuReservationDiagnosis["productsWithSkuAndNoReservation"] = [];
  const skuToSlugs = new Map<string, string[]>();
  for (const product of products) {
    const slug = String(product.slug ?? String(product.PK).slice("PRODUCT#".length));
    const sku = normalizeCatalogSku(typeof product.sku === "string" ? product.sku : undefined);
    if (!sku) continue;
    const slugs = skuToSlugs.get(sku) ?? [];
    slugs.push(slug);
    skuToSlugs.set(sku, slugs);
    if (!reservationBySku.has(sku)) productsWithSkuAndNoReservation.push({ slug, sku });
  }

  const reservationsMissingOwner: SkuReservationDiagnosis["reservationsMissingOwner"] = [];
  const reservationsWithDifferentSku: SkuReservationDiagnosis["reservationsWithDifferentSku"] = [];
  for (const [sku, row] of reservationBySku) {
    const productSlug = typeof row.productSlug === "string" ? row.productSlug : "";
    const owner = productBySlug.get(productSlug);
    if (!owner) {
      reservationsMissingOwner.push({ sku, productSlug });
      continue;
    }
    const productSku = normalizeCatalogSku(typeof owner.sku === "string" ? owner.sku : undefined);
    if (productSku !== sku) reservationsWithDifferentSku.push({ sku, productSlug, productSku });
  }

  return {
    productsWithSkuAndNoReservation,
    duplicateNormalizedSkus: [...skuToSlugs.entries()]
      .filter(([, slugs]) => slugs.length > 1)
      .map(([sku, slugs]) => ({ sku, slugs })),
    reservationsMissingOwner,
    reservationsWithDifferentSku,
  };
}

export function catalogSkuReservationItem(
  sku: string,
  productSlug: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> | null {
  const normalized = normalizeCatalogSku(sku);
  const shown = displayCatalogSku(sku);
  if (!normalized || !shown) return null;
  return {
    PK: productSkuKeys.pk(normalized),
    SK: productSkuKeys.sk(),
    sku: shown,
    productSlug,
    ...extra,
  };
}
