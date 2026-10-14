import type { Product } from "@blossompot/shared";

/** Keep the product returned by a successful save when a later list read is stale. */
export function mergeSavedAdminProduct(products: Product[], saved: Product): Product[] {
  const index = products.findIndex((product) => product.slug === saved.slug);
  if (index < 0) return [saved, ...products];
  const next = products.slice();
  next[index] = { ...products[index], ...saved };
  return next;
}
