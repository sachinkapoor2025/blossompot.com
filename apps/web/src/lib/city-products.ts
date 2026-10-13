import {
  productGalleryNeedsCatalogPhotos,
  resolveProductImageUrls,
  type Product,
} from "@blossompot/shared";
import { toListingCardProducts } from "./listing-card";

const LOCATION_FEATURED_LIMIT = 24;

/** Prefer products that already have real gallery photos so location cards are not blank. */
export function productsWithDisplayableImages(products: readonly Product[]): Product[] {
  return products.filter((product) => !productGalleryNeedsCatalogPhotos(product.images));
}

/**
 * Stable featured set for /gifts-to-{slug} and international location pages.
 * Uses the city shuffle, then keeps products with photos when enough exist.
 */
export function featuredLocationProducts(
  products: readonly Product[],
  locationSlug: string,
  limit = LOCATION_FEATURED_LIMIT
): Product[] {
  const withPhotos = productsWithDisplayableImages(products);
  const pool = withPhotos.length >= Math.min(limit, 8) ? withPhotos : products;
  return toListingCardProducts(shuffleForCity(pool, locationSlug).slice(0, limit)).map((product) => ({
    ...product,
    images: resolveProductImageUrls(product.images),
  }));
}

/** Stable numeric seed from a city slug (same city → same seed). */
function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle with a fixed seed — looks random, same order every visit per city. */
export function shuffleForCity<T>(items: readonly T[], citySlug: string): T[] {
  const result = [...items];
  const random = mulberry32(seedFromString(citySlug));

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
