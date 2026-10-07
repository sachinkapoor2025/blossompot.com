import { getDeliveryCountry, SHOPPING_COUNTRY_ISO } from "@blossompot/shared";

/** Country sent to the catalog. A known code is kept; the API checks the global enabled list. */
export function shoppingCatalogCountry(country?: string | null): string {
  const iso = (country ?? "").trim().toUpperCase();
  return getDeliveryCountry(iso)?.countryCode ?? SHOPPING_COUNTRY_ISO;
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
