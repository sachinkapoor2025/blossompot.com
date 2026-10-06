import { clampShoppingCountry } from "@blossompot/shared";

/** Country sent to the catalog and Gift Baskets Overseas list. Always the United States. */
export function shoppingCatalogCountry(country?: string | null): string {
  return clampShoppingCountry(country);
}

/** Query string used by `loadProducts`. A non-US country becomes `country=US`. */
export function shoppingCatalogQuery(params?: {
  category?: string;
  search?: string;
  country?: string | null;
}): string {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  query.set("country", shoppingCatalogCountry(params?.country));
  return `?${query.toString()}`;
}
