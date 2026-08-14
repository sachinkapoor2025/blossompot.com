/**
 * Resolve a product for storefront/cart: DynamoDB first, then auto-create from
 * bundled catalogs (Orange County hampers, BlossomPot catalog) when missing.
 */
import { ensureOrangeCountyProductInDb } from "./orange-county-catalog";
import { ensureUsarakhiCatalogProductInDb } from "./blossompot-catalog";

export async function ensureProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  const fromOc = await ensureOrangeCountyProductInDb(slug);
  if (fromOc) return fromOc;
  return ensureUsarakhiCatalogProductInDb(slug);
}
