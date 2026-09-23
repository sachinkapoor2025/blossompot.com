/**
 * Resolve a product for storefront/cart: DynamoDB first, then auto-create from
 * live vendor catalogs (Orange County hampers, GBO) when missing.
 * Bundled BlossomPot JSON seed is not created on public product views.
 */
import { parseGboSlug } from "@blossompot/shared";
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
  return ensureOrangeCountyProductInDb(slug);
}
