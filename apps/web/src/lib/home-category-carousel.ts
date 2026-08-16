import type { Category, Product } from "@blossompot/shared";
import { categoryHref } from "./category-urls";
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
    fallback: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=480&q=75",
    alt: "Fresh mixed flowers",
  },
  {
    slug: "flower-bouquets",
    label: "Bouquets",
    fallback: "https://images.unsplash.com/photo-1455659817273-f093b0cdc19e?auto=format&fit=crop&w=480&q=75",
    alt: "Hand-tied flower bouquet",
  },
  {
    slug: "birthday-gifts",
    label: "Birthday",
    fallback: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=480&q=75",
    alt: "Birthday flowers and gifts",
  },
  {
    slug: "anniversary-gifts",
    label: "Anniversary",
    fallback: "https://images.unsplash.com/photo-1518621012118-4d0d512fdd5b?auto=format&fit=crop&w=480&q=75",
    alt: "Anniversary rose bouquet",
  },
  {
    slug: "valentines-day-gifts",
    label: "Valentine's",
    fallback: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=480&q=75",
    alt: "Valentine's Day roses",
  },
  {
    slug: "mothers-day-gifts",
    label: "Mother's Day",
    fallback: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=480&q=75",
    alt: "Mother's Day flowers",
  },
  {
    slug: "wedding-gifts",
    label: "Wedding",
    fallback: "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=480&q=75",
    alt: "Wedding flowers",
  },
  {
    slug: "cakes",
    label: "Cakes",
    fallback: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=480&q=75",
    alt: "Celebration cake",
  },
  {
    slug: "gift-hampers",
    label: "Hampers",
    fallback: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=480&q=75",
    alt: "Curated gift hamper",
  },
  {
    slug: "same-day-gifts",
    label: "Same-Day",
    fallback: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=480&q=75",
    alt: "Same-day flower delivery",
  },
  {
    slug: "plants",
    label: "Plants",
    fallback: "https://images.unsplash.com/photo-1566938064504-a380d867ac89?auto=format&fit=crop&w=480&q=75",
    alt: "Indoor gift plant",
  },
  {
    slug: "personalized-gifts",
    label: "Personalized",
    fallback: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=480&q=75",
    alt: "Personalized gift box",
  },
  {
    slug: "celebration-gifts",
    label: "Celebration",
    fallback: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=480&q=75",
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
