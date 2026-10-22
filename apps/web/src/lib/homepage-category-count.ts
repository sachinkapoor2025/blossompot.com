import type { Category } from "@blossompot/shared";
import { api } from "./api";
import { CATALOG_REVALIDATE_SECONDS } from "./product-loader";

/**
 * Homepage sentence count. This is `categories.length` from `/categories`.
 * It does not load products, so it does not scan the uncategorized catalog.
 */
export function categoryCountFromList(categories: unknown): number | null {
  if (!Array.isArray(categories) || categories.length <= 0) return null;
  return categories.length;
}

export async function loadHomepageCategoryCount(): Promise<number | null> {
  const data = await api<{ categories?: Category[] }>("/categories", {
    revalidate: CATALOG_REVALIDATE_SECONDS,
  });
  return categoryCountFromList(data?.categories);
}
