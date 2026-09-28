import type { Product } from "@blossompot/shared";

/** Keeps client-side dedupe rank (description length > 80) without shipping the full HTML body. */
const LISTING_DESCRIPTION_STUB = "x".repeat(81);

/**
 * Fields a listing card, filter, and client dedupe actually read.
 * Full description, SEO, shipping, and variant payloads stay on the product detail response.
 */
export function toListingCardProducts(products: Product[]): Product[] {
  return products.map((product) => {
    const description =
      (product.description ?? "").length > 80 ? LISTING_DESCRIPTION_STUB : product.description;
    return {
      ...product,
      description,
      seoTitle: undefined,
      seoDescription: undefined,
      shortDescription: undefined,
      shippingNote: undefined,
      shippingOptions: undefined,
      variants: undefined,
      imageAssets: undefined,
    };
  });
}
