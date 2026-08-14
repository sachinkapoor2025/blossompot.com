/**
 * Home-page-only curated product lists (names + preferred slugs).
 */
import type { Product } from "@blossompot/shared";
import { homeCategoryOrder } from "@/lib/site";

type HomeCategorySlug = (typeof homeCategoryOrder)[number];

type HomeProductRef = {
  name: string;
  slug?: string;
};

export const HOME_CATEGORY_PRODUCTS: Record<HomeCategorySlug, HomeProductRef[]> = {
  flowers: [
    { name: "Classic Red Rose Bouquet", slug: "classic-red-rose-bouquet" },
    { name: "Premium Red Roses", slug: "premium-red-roses" },
    { name: "Pink Rose Bouquet", slug: "pink-rose-bouquet" },
    { name: "Elegant White Roses", slug: "elegant-white-roses" },
    { name: "Sunny Tulip Bunch", slug: "sunny-tulip-bunch" },
    { name: "Red Rose Dozen Plus", slug: "red-rose-dozen-plus" },
  ],
  "flower-bouquets": [
    { name: "Mixed Flower Bouquet", slug: "mixed-flower-bouquet" },
    { name: "Luxury Premium Bouquet", slug: "luxury-premium-bouquet" },
    { name: "Sunshine Sunflower Bouquet", slug: "sunshine-sunflower-bouquet" },
    { name: "Blush Bouquet Deluxe", slug: "blush-bouquet-deluxe" },
  ],
  cakes: [
    { name: "Chocolate Truffle Cake", slug: "chocolate-truffle-cake" },
    { name: "Red Velvet Cake", slug: "red-velvet-cake" },
    { name: "Vanilla Celebration Cake", slug: "vanilla-celebration-cake" },
    { name: "Black Forest Cake", slug: "black-forest-cake" },
    { name: "Strawberry Cream Cake", slug: "strawberry-cream-cake" },
    { name: "Designer Birthday Cake", slug: "designer-birthday-cake" },
  ],
  "birthday-gifts": [
    { name: "Birthday Gift Hamper", slug: "birthday-gift-hamper" },
    { name: "Teddy & Flower Combo", slug: "teddy-flower-combo" },
    { name: "Designer Birthday Cake", slug: "designer-birthday-cake" },
    { name: "Kids Birthday Fun Cake", slug: "kids-birthday-cake-fun" },
  ],
  "anniversary-gifts": [
    { name: "Anniversary Gift Box", slug: "anniversary-gift-box" },
    { name: "Anniversary Roses & Cake", slug: "anniversary-roses-and-cake" },
    { name: "Premium Red Roses", slug: "premium-red-roses" },
    { name: "Red Velvet Cake", slug: "red-velvet-cake" },
  ],
  "gift-hampers": [
    { name: "Luxury Gift Hamper", slug: "luxury-gift-hamper" },
    { name: "Birthday Gift Hamper", slug: "birthday-gift-hamper" },
    { name: "Gourmet Celebration Set", slug: "gourmet-wine-gift-set" },
  ],
  "personalized-gifts": [
    { name: "Personalized Gift Box", slug: "personalized-gift-box" },
    { name: "Anniversary Gift Box", slug: "anniversary-gift-box" },
  ],
  "same-day-gifts": [
    { name: "Same-Day Cheer Bouquet", slug: "same-day-cheer-bouquet" },
    { name: "Same-Day Chocolate Cake", slug: "same-day-chocolate-cake" },
    { name: "Classic Red Rose Bouquet", slug: "classic-red-rose-bouquet" },
  ],
};

function normalizeProductLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[''`′’]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[|–—−]/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findUnusedMatch(
  products: Product[],
  unused: Set<string>,
  ref: HomeProductRef
): Product | undefined {
  if (ref.slug) {
    const bySlug = products.find((p) => p.slug === ref.slug && unused.has(p.slug));
    if (bySlug) return bySlug;
  }
  const target = normalizeProductLabel(ref.name);
  return products.find((p) => unused.has(p.slug) && normalizeProductLabel(p.name) === target);
}

export function pickHomeCategoryProducts(products: Product[], categorySlug: string): Product[] {
  const refs = HOME_CATEGORY_PRODUCTS[categorySlug as HomeCategorySlug];
  if (!refs?.length) {
    return products.filter((p) => p.categorySlug === categorySlug).slice(0, 8);
  }
  const unused = new Set(products.map((p) => p.slug));
  const ordered: Product[] = [];
  for (const ref of refs) {
    const match = findUnusedMatch(products, unused, ref);
    if (!match) continue;
    ordered.push(match);
    unused.delete(match.slug);
  }
  return ordered;
}
