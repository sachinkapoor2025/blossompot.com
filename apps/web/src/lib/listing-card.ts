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
      (product.description ?? "").length > 80 ? LISTING_DESCRIPTION_STUB : (product.description ?? "");
    return {
      slug: product.slug,
      name: product.name,
      description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      currency: product.currency ?? "USD",
      categorySlug: product.categorySlug,
      additionalCategorySlugs: product.additionalCategorySlugs,
      images: product.images ?? [],
      sku: product.sku,
      inventory: product.inventory,
      tags: product.tags ?? [],
      vendorSlug: product.vendorSlug,
      allowsAddons: product.allowsAddons,
      couponExcluded: product.couponExcluded,
      unitsSold: product.unitsSold,
      internationalDelivery: product.internationalDelivery,
      fulfilledByName: product.fulfilledByName,
      featured: product.featured,
      sameDayAvailable: product.sameDayAvailable,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });
}
