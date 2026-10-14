import type { Product } from "@blossompot/shared";
import type { CatalogView } from "./catalog-load-state";
import { isRakhiRelatedProduct } from "./rakhi-filter";

type HomepageRowCard = Product & { listingVendorSlug?: string };

export const HOME_PRODUCT_ROW_LIMIT = 8;

/**
 * Homepage section rule, applied before the row is sliced.
 * Rakhi products are removed, then only the section's primary category remains.
 */
export function productsForHomeSection(slug: string, products: Product[]): Product[] {
  const withoutRakhi = products.filter(
    (product) => product.categorySlug !== "rakhi-hampers" && !isRakhiRelatedProduct(product)
  );
  // Homepage rows stay on the primary category. Additional-category matches belong on the category page.
  return withoutRakhi.filter((product) => product.categorySlug === slug);
}

/** Same eight products the homepage row already showed from the full loaded list. */
export function selectHomepageRowProducts(slug: string, products: Product[]): Product[] {
  return productsForHomeSection(slug, products).slice(0, HOME_PRODUCT_ROW_LIMIT);
}

/**
 * Cards for one homepage row.
 * An empty or failed catalog view stays empty. This does not refill from bundled JSON.
 */
export function productsForHomepageRow(slug: string, view: CatalogView): Product[] {
  if (view.state !== "products") return [];
  return selectHomepageRowProducts(slug, view.products);
}

/**
 * Fields the homepage card, wishlist, and client location check read.
 * Applied only after the row's eight products are chosen.
 */
export function toHomepageRowCards(products: Product[]): HomepageRowCard[] {
  return products.map((product) => {
    const card: HomepageRowCard = {
      slug: product.slug,
      name: product.name,
      description: "",
      price: product.price,
      currency: product.currency,
      categorySlug: product.categorySlug,
      images: product.images ?? [],
      inventory: product.inventory,
      tags: product.tags ?? [],
      published: product.published !== false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
    if (product.compareAtPrice != null) card.compareAtPrice = product.compareAtPrice;
    if (product.sku) card.sku = product.sku;
    if (product.deliveryCountries?.length) card.deliveryCountries = [...product.deliveryCountries];
    if (product.internationalDelivery) card.internationalDelivery = true;
    if (product.unitsSold != null) card.unitsSold = product.unitsSold;
    const listingVendorSlug = (product as HomepageRowCard).listingVendorSlug;
    if (listingVendorSlug) card.listingVendorSlug = listingVendorSlug;
    return card;
  });
}
