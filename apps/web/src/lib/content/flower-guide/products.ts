import type { Product } from "@blossompot/shared";
import { publishedFlowerGuides } from "./published";
import type { FlowerGuide } from "./types";

function haystack(product: Product): string {
  return [
    product.name,
    product.slug,
    product.description,
    product.subcategory,
    product.occasion,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function flowerGuideForProduct(product: Product): FlowerGuide | undefined {
  const hay = haystack(product);
  const matches = publishedFlowerGuides.filter((g) => {
    const names = [g.name, g.slug, ...g.commonNames].map((n) => n.toLowerCase());
    return names.some((n) => n.length > 3 && hay.includes(n));
  });
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.name.length - a.name.length);
  return matches[0];
}

export function productsForFlower(products: Product[], guide: FlowerGuide, limit = 8): Product[] {
  const needles = [guide.name, guide.slug, guide.shopQuery, ...guide.commonNames]
    .map((n) => n.toLowerCase())
    .filter((n) => n.length > 2);
  const scored = products
    .filter((p) => p.published !== false)
    .map((p) => {
      const hay = haystack(p);
      const score = needles.reduce((sum, n) => sum + (hay.includes(n) ? n.length : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
  return scored.slice(0, limit);
}
