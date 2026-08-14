import type { Product } from "@blossompot/shared";

export type CollectionDefinition = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  filter: (products: Product[]) => Product[];
};

function textBlob(product: Product): string {
  return [product.name, product.description, ...(product.tags ?? [])].join(" ").toLowerCase();
}

function inCategory(product: Product, slug: string): boolean {
  if (product.categorySlug === slug) return true;
  return product.additionalCategorySlugs?.includes(slug) ?? false;
}

function usdPrice(product: Product): number {
  return product.price;
}

function byUpdatedDesc(a: Product, b: Product): number {
  return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
}

function matchesAnyKeyword(product: Product, keywords: string[]): boolean {
  const blob = textBlob(product);
  return keywords.some((kw) => blob.includes(kw));
}

/** SEO collection landings — flowers, cakes, gifts only (no Rakhi). */
export const COLLECTIONS: CollectionDefinition[] = [
  {
    slug: "red-roses",
    title: "Red Roses Delivery USA | BlossomPot",
    h1: "Red Rose Bouquets",
    description: "Shop classic red rose arrangements for USA delivery — birthdays, anniversaries, and romantic surprises.",
    intro: "Choose elegant red rose bouquets with clear USA shipping guidance on every product.",
    filter: (products) =>
      products.filter((p) => matchesAnyKeyword(p, ["red rose", "roses"]) || inCategory(p, "flowers")).slice(0, 36),
  },
  {
    slug: "birthday-flowers",
    title: "Birthday Flowers USA | BlossomPot",
    h1: "Birthday Flowers & Gifts",
    description: "Bright birthday flower arrangements and gift combos with USA delivery.",
    intro: "Celebrate with colorful blooms and celebration-ready gifts shipped across America.",
    filter: (products) =>
      products
        .filter((p) => inCategory(p, "birthday-gifts") || matchesAnyKeyword(p, ["birthday"]))
        .slice(0, 36),
  },
  {
    slug: "anniversary-roses",
    title: "Anniversary Roses & Gifts USA | BlossomPot",
    h1: "Anniversary Roses & Romantic Gifts",
    description: "Romantic anniversary flowers, roses, and gift sets for USA delivery.",
    intro: "Mark milestones with roses, mixed bouquets, and dessert pairings.",
    filter: (products) =>
      products
        .filter((p) => inCategory(p, "anniversary-gifts") || matchesAnyKeyword(p, ["anniversary", "rose"]))
        .slice(0, 36),
  },
  {
    slug: "gift-hampers",
    title: "Gift Hampers USA | BlossomPot",
    h1: "Curated Gift Hampers",
    description: "Curated gift hampers and celebration boxes with USA delivery.",
    intro: "Thoughtful hampers for thank-yous, birthdays, and corporate gestures.",
    filter: (products) => products.filter((p) => inCategory(p, "gift-hampers")).slice(0, 36),
  },
  {
    slug: "under-50",
    title: "Gifts Under $50 USA | BlossomPot",
    h1: "Gifts Under $50",
    description: "Flowers, cakes, and gifts under $50 with USA delivery options.",
    intro: "Budget-friendly picks that still feel polished and ready to gift.",
    filter: (products) =>
      products.filter((p) => usdPrice(p) <= 50).sort(byUpdatedDesc).slice(0, 36),
  },
  {
    slug: "under-100",
    title: "Gifts Under $100 USA | BlossomPot",
    h1: "Gifts Under $100",
    description: "Premium flowers, cakes, and gift sets under $100 for USA delivery.",
    intro: "A wider selection for celebrations when you want more presence without overspending.",
    filter: (products) =>
      products.filter((p) => usdPrice(p) <= 100).sort(byUpdatedDesc).slice(0, 36),
  },
  {
    slug: "same-day-gifts",
    title: "Same-Day Gift Ideas USA | BlossomPot",
    h1: "Same-Day Eligible Gifts",
    description: "Gifts that may qualify for same-day delivery in select ZIP codes.",
    intro: "Browse options that can support same-day windows where coverage allows.",
    filter: (products) =>
      products.filter((p) => inCategory(p, "same-day-gifts") || matchesAnyKeyword(p, ["same day", "same-day"])).slice(0, 36),
  },
  {
    slug: "cakes",
    title: "Celebration Cakes USA | BlossomPot",
    h1: "Celebration Cakes",
    description: "Birthday and celebration cakes with USA delivery guidance.",
    intro: "Pair cakes with flowers or send dessert on its own for birthdays and thank-yous.",
    filter: (products) => products.filter((p) => inCategory(p, "cakes")).slice(0, 36),
  },
];

export function getCollection(slug: string): CollectionDefinition | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function allCollectionSlugs(): string[] {
  return COLLECTIONS.map((c) => c.slug);
}
