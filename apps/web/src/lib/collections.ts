import { orderProductsByVendor, sortStorefrontProducts, type Product } from "@blossompot/shared";

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

function limitVendorOrdered(products: Product[], limit: number): Product[] {
  return sortStorefrontProducts(products, "featured").slice(0, limit);
}

function limitVendorOrderedByUpdated(products: Product[], limit: number): Product[] {
  return orderProductsByVendor(products, [], (a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, limit);
}

function matchesAnyKeyword(product: Product, keywords: string[]): boolean {
  const blob = textBlob(product);
  return keywords.some((kw) => blob.includes(kw));
}

/** SEO collection landings — flowers, cakes, gifts only (no Rakhi). */
export const COLLECTIONS: CollectionDefinition[] = [
  {
    slug: "red-roses",
    title: "Red Roses Delivery Worldwide | BlossomPot",
    h1: "Red Rose Bouquets",
    description: "Shop classic red rose arrangements for worldwide delivery — birthdays, anniversaries, and romantic surprises.",
    intro: "Choose elegant red rose bouquets with clear worldwide shipping guidance on every product.",
    filter: (products) =>
      limitVendorOrdered(
        products.filter((p) => matchesAnyKeyword(p, ["red rose", "roses"]) || inCategory(p, "flowers")),
        36
      ),
  },
  {
    slug: "birthday-flowers",
    title: "Birthday Flowers Worldwide | BlossomPot",
    h1: "Birthday Flowers & Gifts",
    description: "Bright birthday flower arrangements and gift combos with worldwide delivery.",
    intro: "Celebrate with colorful blooms and celebration-ready gifts shipped worldwide.",
    filter: (products) =>
      limitVendorOrdered(
        products.filter((p) => inCategory(p, "birthday-gifts") || matchesAnyKeyword(p, ["birthday"])),
        36
      ),
  },
  {
    slug: "anniversary-roses",
    title: "Anniversary Roses & Gifts Worldwide | BlossomPot",
    h1: "Anniversary Roses & Romantic Gifts",
    description: "Romantic anniversary flowers, roses, and gift sets for worldwide delivery.",
    intro: "Mark milestones with roses, mixed bouquets, and dessert pairings.",
    filter: (products) =>
      limitVendorOrdered(
        products.filter((p) => inCategory(p, "anniversary-gifts") || matchesAnyKeyword(p, ["anniversary", "rose"])),
        36
      ),
  },
  {
    slug: "gift-hampers",
    title: "Gift Hampers Worldwide | BlossomPot",
    h1: "Curated Gift Hampers",
    description: "Curated gift hampers and celebration boxes with worldwide delivery.",
    intro: "Thoughtful hampers for thank-yous, birthdays, and corporate gestures.",
    filter: (products) => limitVendorOrdered(products.filter((p) => inCategory(p, "gift-hampers")), 36),
  },
  {
    slug: "under-50",
    title: "Gifts Under $50 Worldwide | BlossomPot",
    h1: "Gifts Under $50",
    description: "Flowers, cakes, and gifts under $50 with worldwide delivery options.",
    intro: "Budget-friendly picks that still feel polished and ready to gift.",
    filter: (products) => limitVendorOrderedByUpdated(products.filter((p) => usdPrice(p) <= 50), 36),
  },
  {
    slug: "under-100",
    title: "Gifts Under $100 Worldwide | BlossomPot",
    h1: "Gifts Under $100",
    description: "Premium flowers, cakes, and gift sets under $100 for worldwide delivery.",
    intro: "A wider selection for celebrations when you want more presence without overspending.",
    filter: (products) => limitVendorOrderedByUpdated(products.filter((p) => usdPrice(p) <= 100), 36),
  },
  {
    slug: "cakes",
    title: "Celebration Cakes Worldwide | BlossomPot",
    h1: "Celebration Cakes",
    description: "Birthday and celebration cakes with worldwide delivery guidance.",
    intro: "Pair cakes with flowers or send dessert on its own for birthdays and thank-yous.",
    filter: (products) => limitVendorOrdered(products.filter((p) => inCategory(p, "cakes")), 36),
  },
];

export function getCollection(slug: string): CollectionDefinition | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function allCollectionSlugs(): string[] {
  return COLLECTIONS.map((c) => c.slug);
}
