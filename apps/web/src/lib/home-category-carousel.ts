import type { Category, Product } from "@blossompot/shared";
import { categoryHref } from "./category-urls";
import { editorialCdnUrl } from "./editorial-cdn";
import { pickHomeCategoryProducts } from "./home-category-products";
import { resolveImageUrl } from "./images";

export type HomeCategoryTile = {
  slug: string;
  label: string;
  href: string;
  image: string;
  alt: string;
};

const TILES: { slug: string; label: string; fallback: string; alt: string }[] = [
  {
    slug: "flowers",
    label: "Flowers",
    fallback: editorialCdnUrl("tile-flowers.jpg"),
    alt: "Fresh mixed flowers",
  },
  {
    slug: "flower-bouquets",
    label: "Bouquets",
    fallback: editorialCdnUrl("tile-bouquets.jpg"),
    alt: "Hand-tied flower bouquet",
  },
  {
    slug: "birthday-gifts",
    label: "Birthday",
    fallback: editorialCdnUrl("tile-birthday.jpg"),
    alt: "Birthday flowers and gifts",
  },
  {
    slug: "anniversary-gifts",
    label: "Anniversary",
    fallback: editorialCdnUrl("tile-anniversary.jpg"),
    alt: "Anniversary rose bouquet",
  },
  {
    slug: "valentines-day-gifts",
    label: "Valentine's",
    fallback: editorialCdnUrl("tile-valentines.jpg"),
    alt: "Valentine's Day roses",
  },
  {
    slug: "mothers-day-gifts",
    label: "Mother's Day",
    fallback: editorialCdnUrl("tile-mothers-day.jpg"),
    alt: "Mother's Day flowers",
  },
  {
    slug: "wedding-gifts",
    label: "Wedding",
    fallback: editorialCdnUrl("tile-wedding.jpg"),
    alt: "Wedding flowers",
  },
  {
    slug: "cakes",
    label: "Cakes",
    fallback: editorialCdnUrl("tile-cakes.jpg"),
    alt: "Celebration cake",
  },
  {
    slug: "gift-hampers",
    label: "Hampers",
    fallback: editorialCdnUrl("tile-hampers.jpg"),
    alt: "Curated gift hamper",
  },
  {
    slug: "same-day-gifts",
    label: "Same-Day",
    fallback: editorialCdnUrl("tile-same-day.jpg"),
    alt: "Same-day flower delivery",
  },
  {
    slug: "plants",
    label: "Plants",
    fallback: editorialCdnUrl("tile-plants.jpg"),
    alt: "Indoor gift plant",
  },
  {
    slug: "personalized-gifts",
    label: "Personalized",
    fallback: editorialCdnUrl("tile-personalized.jpg"),
    alt: "Personalized gift box",
  },
  {
    slug: "celebration-gifts",
    label: "Celebration",
    fallback: editorialCdnUrl("tile-celebration.jpg"),
    alt: "Celebration gifts",
  },
];

function productMatchesCategory(product: Product, slug: string): boolean {
  if (product.published === false) return false;
  if (product.categorySlug === slug) return true;
  return product.additionalCategorySlugs?.includes(slug) ?? false;
}

function firstProductImage(products: Product[], slug: string): string | undefined {
  const curated = pickHomeCategoryProducts(products, slug)[0];
  const curatedImage = resolveImageUrl(curated?.images?.[0]);
  if (curatedImage) return curatedImage;

  const match = products.find((p) => productMatchesCategory(p, slug) && p.images?.[0]);
  return resolveImageUrl(match?.images?.[0]) || undefined;
}

export function buildHomeCategoryTiles(
  products: Product[],
  categories: Category[] = []
): HomeCategoryTile[] {
  return TILES.map((tile) => {
    const category = categories.find((c) => c.slug === tile.slug);
    const fromCategory = resolveImageUrl(category?.image);
    const fromProduct = firstProductImage(products, tile.slug);
    const image = fromCategory || fromProduct || tile.fallback;
    return {
      slug: tile.slug,
      label: tile.label,
      href: categoryHref(tile.slug),
      image,
      alt: category?.name ? `${category.name} — BlossomPot` : tile.alt,
    };
  });
}
