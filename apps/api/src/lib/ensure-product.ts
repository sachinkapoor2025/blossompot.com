/**
 * Resolve a product for storefront/cart: DynamoDB first, then auto-create from
 * bundled catalogs (Orange County hampers, BlossomPot catalog) when missing.
 */
import { parseGboSlug } from "@blossompot/shared";
import { ensureOrangeCountyProductInDb } from "./orange-county-catalog";
import { ensureUsarakhiCatalogProductInDb } from "./blossompot-catalog";
import { ensureGboProductInDb } from "./gbo-catalog";

export async function ensureProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  if (parseGboSlug(slug)) {
    return ensureGboProductInDb(slug);
  }
  const fromOc = await ensureOrangeCountyProductInDb(slug);
  if (fromOc) return fromOc;
  return ensureUsarakhiCatalogProductInDb(slug);
}
