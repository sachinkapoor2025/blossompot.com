import {
  getUnitsSold,
  isFastSelling,
  productMatchesRakhiSetCategory,
  type Product,
} from "@blossompot/shared";

export type CollectionDefinition = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  /** Optional intro copy under the H1. */
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
  // Storefront list prices are USD-first; INR SKUs still use numeric price for band filters.
  return product.price;
}

function byUnitsSoldDesc(a: Product, b: Product): number {
  return getUnitsSold(b) - getUnitsSold(a);
}

function byUpdatedDesc(a: Product, b: Product): number {
  return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
}

function matchesAnyKeyword(product: Product, keywords: string[]): boolean {
  const blob = textBlob(product);
  return keywords.some((kw) => blob.includes(kw));
}

/** SEO collection landings used by PDP Explore More (and future nav). */
export const COLLECTIONS: CollectionDefinition[] = [
  {
    slug: "rakhi-sets",
    title: "Rakhi Sets USA — Multi-Piece Designer Rakhi Packs",
    h1: "Rakhi Sets for USA Delivery",
    description:
      "Shop multi-piece Rakhi sets and combo packs for brothers in the USA. Set of 2, 3, and 4 designer rakhis with domestic shipping.",
    intro:
      "Send a curated Rakhi set to your brother in America — multi-piece packs and chocolate combos with roli chawal on most orders.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "rakhi-combo") ||
          productMatchesRakhiSetCategory(p, "2-set-rakhi") ||
          productMatchesRakhiSetCategory(p, "3-set-rakhi") ||
          productMatchesRakhiSetCategory(p, "4-set-rakhi")
      ),
  },
  {
    slug: "personalized-rakhi",
    title: "Personalized Rakhi USA — Custom Name & Photo Styles",
    h1: "Personalized Rakhi to USA",
    description:
      "Browse personalized and name-style Rakhis for brothers in the USA. Unique Raksha Bandhan gifts with domestic delivery.",
    intro:
      "Looking for a more personal touch? Explore name, custom, and keepsake-style Rakhis perfect for brothers across America.",
    filter: (products) =>
      products.filter((p) =>
        matchesAnyKeyword(p, ["personal", "name rakhi", "custom", "brother name"])
      ),
  },
  {
    slug: "premium-rakhi",
    title: "Premium Rakhi USA — Luxury Designer Rakhis & Hampers",
    h1: "Premium Rakhi Collection",
    description:
      "Shop premium designer Rakhis and gift hampers for USA delivery. Elevated styles for a memorable Raksha Bandhan.",
    intro:
      "Premium designer rakhis, gift sets, and hampers curated for sisters who want a standout USA delivery gift.",
    filter: (products) =>
      products
        .filter(
          (p) =>
            usdPrice(p) >= 20 ||
            inCategory(p, "rakhi-hampers") ||
            matchesAnyKeyword(p, ["premium", "luxury", "designer gift"])
        )
        .sort((a, b) => usdPrice(b) - usdPrice(a)),
  },
  {
    slug: "rakhi-for-brother",
    title: "Rakhi for Brother USA — Send Rakhi Online",
    h1: "Rakhi for Brother",
    description:
      "Shop Rakhi for brother with USA delivery. Single rakhis, combos, and hampers shipped domestically across America.",
    intro:
      "Classic and designer Rakhis chosen for brothers — traditional threads, Om styles, chocolate combos, and gift hampers.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "single-rakhi") ||
          inCategory(p, "rakhi-combo") ||
          inCategory(p, "rakhi-hampers") ||
          matchesAnyKeyword(p, ["brother", "bhai"])
      ),
  },
  {
    slug: "rakhi-for-bhaiya",
    title: "Rakhi for Bhaiya USA — Bhaiya & Matching Sets",
    h1: "Rakhi for Bhaiya",
    description:
      "Send Rakhi for Bhaiya to the USA. Designer single rakhis and Bhaiya Bhabhi matching sets with fast domestic shipping.",
    intro: "Celebrate your Bhaiya with elegant designer rakhis and matching Bhaiya–Bhabhi sets delivered in the USA.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "bhaiya-bhabhi-rakhi") ||
          inCategory(p, "single-rakhi") ||
          matchesAnyKeyword(p, ["bhaiya", "bhai"])
      ),
  },
  {
    slug: "rakhi-for-bhabhi",
    title: "Rakhi for Bhabhi USA — Lumba & Matching Sets",
    h1: "Rakhi for Bhabhi",
    description:
      "Shop Lumba Rakhi and Bhaiya Bhabhi sets for Bhabhi in the USA. Elegant bracelet-style rakhis with domestic delivery.",
    intro: "Honor your Bhabhi with Lumba rakhis and matching Bhaiya Bhabhi sets — perfect for Raksha Bandhan in America.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "lumba-rakhi") ||
          inCategory(p, "bhaiya-bhabhi-rakhi") ||
          matchesAnyKeyword(p, ["bhabhi", "lumba", "sister-in-law"])
      ),
  },
  {
    slug: "rakhi-for-cousin-brother",
    title: "Rakhi for Cousin Brother USA — Gift Ideas",
    h1: "Rakhi for Cousin Brother",
    description:
      "Send Rakhi to your cousin brother in the USA. Stylish single rakhis, kids options, and chocolate combos with domestic shipping.",
    intro:
      "Thoughtful Rakhi picks for cousin brothers — from classic designer threads to fun kids styles and combo packs.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "single-rakhi") ||
          inCategory(p, "kids-rakhi") ||
          inCategory(p, "rakhi-combo") ||
          matchesAnyKeyword(p, ["cousin", "brother"])
      ),
  },
  {
    slug: "rakhi-under-10",
    title: "Rakhi Under $10 USA — Affordable Rakhi Delivery",
    h1: "Rakhi Under $10",
    description:
      "Shop affordable Rakhis under $10 with USA delivery. Budget-friendly designer styles for Raksha Bandhan.",
    intro: "Great-value Rakhis under $10 — ideal when you want a beautiful thread without stretching the budget.",
    filter: (products) => products.filter((p) => usdPrice(p) > 0 && usdPrice(p) <= 10).sort((a, b) => usdPrice(a) - usdPrice(b)),
  },
  {
    slug: "rakhi-under-20",
    title: "Rakhi Under $20 USA — Value Designer Rakhis",
    h1: "Rakhi Under $20",
    description:
      "Browse Rakhis under $20 for USA delivery. Designer singles, kids styles, and value combos shipped domestically.",
    intro: "Explore popular Rakhis under $20 — designer singles, kids rakhis, and value gift combos.",
    filter: (products) => products.filter((p) => usdPrice(p) > 0 && usdPrice(p) <= 20).sort((a, b) => usdPrice(a) - usdPrice(b)),
  },
  {
    slug: "rakhi-under-30",
    title: "Rakhi Under $30 USA — Mid-Range Gift Picks",
    h1: "Rakhi Under $30",
    description:
      "Shop Rakhis under $30 for USA delivery. Combos, sets, and gift-ready options for brothers across America.",
    intro: "Mid-range Rakhi gifts under $30 — chocolate combos, multi-piece sets, and elevated designer styles.",
    filter: (products) => products.filter((p) => usdPrice(p) > 0 && usdPrice(p) <= 30).sort((a, b) => usdPrice(a) - usdPrice(b)),
  },
  {
    slug: "best-selling-rakhis",
    title: "Best Selling Rakhis USA — Customer Favorites",
    h1: "Best Selling Rakhis",
    description:
      "Shop best selling Rakhis for USA delivery. Top customer favorites for Raksha Bandhan with domestic shipping.",
    intro: "Our most-loved Rakhis — ranked by popularity so you can order proven favorites for brothers in the USA.",
    filter: (products) => [...products].sort(byUnitsSoldDesc).slice(0, 48),
  },
  {
    slug: "new-arrivals",
    title: "New Arrival Rakhis USA — Latest Designs",
    h1: "New Arrivals",
    description:
      "Discover new Rakhi arrivals for USA delivery. Fresh designer styles for Raksha Bandhan 2026.",
    intro: "Just added to the BlossomPot collection — browse the latest designs for brothers across America.",
    filter: (products) => [...products].sort(byUpdatedDesc).slice(0, 48),
  },
  {
    slug: "trending-rakhis",
    title: "Trending Rakhis USA — Popular Right Now",
    h1: "Trending Rakhis",
    description:
      "Shop trending Rakhis for USA delivery. Fast-selling designer styles and combos sisters are ordering now.",
    intro: "See what’s trending for Raksha Bandhan — fast-selling rakhis and gift sets shipping across the USA.",
    filter: (products) => {
      const trending = products.filter((p) => isFastSelling(p) || getUnitsSold(p) > 0);
      const pool = trending.length > 0 ? trending : products;
      return [...pool].sort(byUnitsSoldDesc).slice(0, 48);
    },
  },
  {
    slug: "designer-rakhis",
    title: "Designer Rakhis USA — Premium Styles Online",
    h1: "Designer Rakhis",
    description:
      "Shop designer Rakhis for USA delivery. Pearl, stone, Om, and festive styles with roli chawal on most orders.",
    intro: "Designer Rakhi styles with ornate beads, pearls, stones, and festive detailing — ready for USA delivery.",
    filter: (products) =>
      products.filter((p) => matchesAnyKeyword(p, ["designer", "pearl", "stone", "kundan", "zardosi", "meenakari"])),
  },
  {
    slug: "festival-special-rakhis",
    title: "Festival Special Rakhis USA — Raksha Bandhan Gifts",
    h1: "Festival Special Rakhis",
    description:
      "Shop festival special Rakhis and gift sets for Raksha Bandhan USA delivery. Combos, hampers, and festive packs.",
    intro:
      "Festival-ready Rakhi gifts — chocolate combos, hampers, and celebratory sets for Raksha Bandhan in the USA.",
    filter: (products) =>
      products.filter(
        (p) =>
          inCategory(p, "rakhi-combo") ||
          inCategory(p, "rakhi-hampers") ||
          matchesAnyKeyword(p, ["festive", "festival", "raksha", "chocolate", "gift set", "hamper"])
      ),
  },
];

const bySlug = new Map(COLLECTIONS.map((c) => [c.slug, c]));

export function getCollection(slug: string): CollectionDefinition | undefined {
  return bySlug.get(slug);
}

export function allCollectionSlugs(): string[] {
  return COLLECTIONS.map((c) => c.slug);
}
