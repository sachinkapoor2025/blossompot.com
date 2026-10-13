import type { Product } from "@blossompot/shared";

/** Shopper-facing copy. No status codes, hosts, or response bodies. */
export const CATALOG_LOAD_ERROR_MESSAGE = "We couldn't load products right now. Please try again.";

export type HomeCategoryLoad =
  | { ok: false }
  | { ok: true; apiProductCount: number; products: Product[] };

export type ShopCatalogLoad = { ok: false } | { ok: true; products: Product[] };

export type CatalogView =
  | { state: "products"; products: Product[] }
  | { state: "empty"; products: Product[] }
  | { state: "error"; products: Product[] };

/**
 * Homepage category row.
 * A successful empty API list stays empty. Bundled rows passed in `products`
 * are ignored unless the API itself returned at least one visible product.
 * A failed request never displays those rows.
 */
export function presentHomeCategoryRow(load: HomeCategoryLoad): CatalogView {
  if (!load.ok) return { state: "error", products: [] };
  if (load.apiProductCount <= 0) return { state: "empty", products: [] };
  if (load.products.length === 0) return { state: "empty", products: [] };
  return { state: "products", products: load.products };
}

/** Category page. Same rule as the homepage row: bundled rows are not a second catalog. */
export function presentCategoryPage(load: HomeCategoryLoad): CatalogView {
  return presentHomeCategoryRow(load);
}

/** Shop page. An empty successful list is not a failed request. */
export function presentShopCatalog(load: ShopCatalogLoad): CatalogView {
  if (!load.ok) return { state: "error", products: [] };
  if (load.products.length === 0) return { state: "empty", products: [] };
  return { state: "products", products: load.products };
}

/** Re-runs the current page request. The caller supplies the router refresh. */
export function runCatalogRetry(refresh: () => void): void {
  refresh();
}
