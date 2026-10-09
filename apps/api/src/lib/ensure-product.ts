/**
 * Resolve a product for storefront/cart: DynamoDB first, then auto-create from
 * bundled catalog JSON, Orange County hampers, or GBO when missing.
 */
import { parseGboSlug } from "@blossompot/shared";
import { ensureUsarakhiCatalogProductInDb } from "./blossompot-catalog";
import { ensureOrangeCountyProductInDb } from "./orange-county-catalog";
import { ensureGboProductInDb } from "./gbo-catalog";

export async function ensureProductInDb(slug: string): Promise<Record<string, unknown> | null> {
  if (parseGboSlug(slug)) {
    try {
      return await ensureGboProductInDb(slug);
    } catch (err) {
      console.error("ensureGboProductInDb failed", slug, err);
      return null;
    }
  }
  try {
    const bundled = await ensureUsarakhiCatalogProductInDb(slug);
    if (bundled) return bundled;
  } catch (err) {
    console.error("ensureUsarakhiCatalogProductInDb failed", slug, err);
  }
  return ensureOrangeCountyProductInDb(slug);
}
