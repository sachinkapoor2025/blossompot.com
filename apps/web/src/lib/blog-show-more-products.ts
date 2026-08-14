import type { Product } from "@blossompot/shared";
import {
  getCatalogProductsByCategory,
  mergeProductsPreferExisting,
} from "@/lib/catalog-fallback";
import { resolveImageUrl } from "@/lib/images";
import { loadProducts } from "@/lib/product-loader";

/** Categories featured in the blog “Show More” product image grid (2 products each). */
export const BLOG_SHOW_MORE_CATEGORIES = [
  { slug: "single-rakhi", label: "Single Rakhi" },
  { slug: "bhaiya-bhabhi-rakhi", label: "Bhaiya Bhabhi Rakhi" },
  { slug: "kids-rakhi", label: "Kids Rakhi" },
  { slug: "lumba-rakhi", label: "Lumba Rakhi" },
  { slug: "rakhi-combo", label: "Rakhi Sets" },
  { slug: "rakhi-hampers", label: "Rakhi Hampers" },
] as const;

export type BlogShowMoreProduct = {
  slug: string;
  name: string;
  image: string;
  categorySlug: string;
  categoryLabel: string;
};

function productHasImage(product: Product): boolean {
  return Boolean(product.images?.some((url) => Boolean(url?.trim())));
}

function productInCategory(product: Product, categorySlug: string): boolean {
  if (product.categorySlug === categorySlug) return true;
  return product.additionalCategorySlugs?.includes(categorySlug) ?? false;
}

/** Load 2 image-ready products from each Rakhi category for blog pages. */
export async function loadBlogShowMoreProducts(): Promise<BlogShowMoreProduct[]> {
  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }

  for (const category of BLOG_SHOW_MORE_CATEGORIES) {
    products = mergeProductsPreferExisting(
      products,
      getCatalogProductsByCategory(category.slug)
    );
  }

  const used = new Set<string>();
  const selected: BlogShowMoreProduct[] = [];

  for (const category of BLOG_SHOW_MORE_CATEGORIES) {
    let count = 0;
    for (const product of products) {
      if (count >= 2) break;
      if (used.has(product.slug)) continue;
      if (product.published === false) continue;
      if (!productInCategory(product, category.slug)) continue;
      if (!productHasImage(product)) continue;

      const image = resolveImageUrl(product.images[0]);
      if (!image) continue;

      used.add(product.slug);
      selected.push({
        slug: product.slug,
        name: product.name,
        image,
        categorySlug: category.slug,
        categoryLabel: category.label,
      });
      count += 1;
    }
  }

  return selected;
}
