/**
 * Home-page-only curated product lists (names + preferred slugs).
 * Does not affect category pages, shop, search, or PDP.
 */
import type { Product } from "@blossompot/shared";
import { homeCategoryOrder } from "@/lib/site";

type HomeCategorySlug = (typeof homeCategoryOrder)[number];

type HomeProductRef = {
  /** Display / catalog name from the curation list. */
  name: string;
  /** Preferred slug when multiple products share a name or names differ slightly. */
  slug?: string;
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

function significantWords(name: string): string[] {
  const stop = new Set([
    "a",
    "an",
    "and",
    "for",
    "the",
    "with",
    "to",
    "of",
    "set",
    "rakhi",
    "rakhis",
    "gift",
    "hamper",
    "premium",
    "designer",
    "brother",
    "usa",
  ]);
  return normalizeProductLabel(name)
    .split(" ")
    .filter((w) => w.length > 2 && !stop.has(w));
}

/**
 * Curated home section products in display order.
 * Prefer slug matches when provided; otherwise match by product name.
 */
export const HOME_CATEGORY_PRODUCTS: Record<HomeCategorySlug, HomeProductRef[]> = {
  "single-rakhi": [
    { name: "Blue Sapphire Pearl Single Rakhi", slug: "blue-sapphire-pearl-single-rakhi" },
    { name: "Classic Maroon Designer Single Rakhi", slug: "classic-maroon-designer-single-rakhi" },
    { name: "Blue Beads Pearl Single", slug: "blue-beads-pearl-single-rakhi" },
    { name: "Festive Ruby Designer Single Rakhi", slug: "festive-ruby-designer-single-rakhi" },
    { name: "Shree Rakhi for Brother with Roli Chawal", slug: "shree-rakhi-for-brother-with-roli-chawal" },
    { name: "Royal Blue Stone Designer Single Rakhi", slug: "royal-blue-stone-designer-single-rakhi" },
    { name: "Silver Bead Traditional Single Rakhi", slug: "silver-bead-traditional-single-rakhi" },
    {
      name: "Single Rakhi with Roli Chawal for Brother",
      slug: "single-rakhi-with-roli-chawal-for-brother-to-usa",
    },
    {
      name: "Single Rakhi with Roli Chawal for Brother",
      slug: "single-rakhi-with-roli-chawal-for-brother",
    },
    { name: "Pearl Single Rakhi", slug: "pearl-single-rakhi" },
  ],
  "bhaiya-bhabhi-rakhi": [
    { name: "Bhai & Bhabhi Lumba Rakhi Set", slug: "bhai-bhabhi-lumba-rakhi-set" },
    { name: "Bhaiya Bhabhi Rakhi Set", slug: "bhaiya-bhabhi-rakhi-set" },
    { name: "Blue Beaded Rakhi for Bhaiya and Bhabhi", slug: "blue-beaded-rakhi-for-bhaiya-and-bhabhi" },
    {
      name: "Multicolor Stone Rakhi & Peach Designer Lumba Rakhi Combo with 5 Chocolates",
    },
  ],
  "kids-rakhi": [
    { name: "BRO Kids Rakhi for Little Brother", slug: "bro-kids-rakhi-for-little-brother" },
    { name: "Cartoon Kids Rakhi with Chocolates", slug: "cartoon-kids-rakhi-with-chocolates" },
    {
      name: "Chhota Bheem Rakhi for Kids with Roli Chawal",
      slug: "chhota-bheem-rakhi-for-kids-with-roli-chawal",
    },
    {
      name: "Doremon Kids Rakhi with Lindor Chocolates",
      slug: "doremon-kids-rakhi-with-lindor-chocolates",
    },
  ],
  "lumba-rakhi": [
    { name: "Designer Peach Lumba Rakhi for Bhabhi", slug: "designer-peach-lumba-rakhi-for-bhabhi" },
    { name: "Elegant Rakhi with Decorative Tassels", slug: "elegant-rakhi-with-decorative-tassels" },
    { name: "Unique Pink Lumba Rakhi for Bhabhi", slug: "unique-pink-lumba-rakhi" },
    {
      name: "Peach Lumba Rakhi with HERSHEY'S Milk Chocolates",
      slug: "peach-lumba-rakhi-with-hersheys-milk-chocolates",
    },
  ],
  "rakhi-combo": [
    {
      name: "Om Rakhi & Pearl Single Rakhi Combo",
      slug: "om-pearl-single-rakhi-combo",
    },
    {
      name: "Blue Beads Pearl Gold & Crystal Rakhi Set of 4 | Premium Designer Rakhi for Brother",
    },
    {
      name: "Blue Sapphire Pearl & Ek Omkar Rakhi Set of 4 | Spiritual Designer Rakhi",
    },
    {
      name: "Classic Maroon Designer Single Rakhi Set of 5 – Style 17",
      slug: "classic-maroon-designer-single-rakhi-style-17",
    },
    {
      name: "Crystal Drop Designer Single Rakhi Set of 2",
      slug: "crystal-drop-designer-single-rakhi",
    },
    {
      name: "Elegant Pearl Designer Single Rakhi Set of 3 – Style 13",
      slug: "elegant-pearl-designer-single-rakhi-style-13",
    },
    {
      name: "Festive Om Shree Rakhi & Chocolate Gift Set",
      slug: "festive-om-shree-rakhi-chocolate-gift-set",
    },
    {
      name: "Men Rakhi Set of 2 with Chocolates Combo",
      slug: "men-rakhi-set-of-2-with-chocolates-combo",
    },
    { name: "Multiple Designer Rakhi Set of 4 | Premium Rakhi Collection" },
    {
      name: "Premium Designer Rakhi Gift Set of 5 for Brother",
      slug: "premium-designer-rakhi-gift-set-of-5-for-brother",
    },
    {
      name: "Rakhi Set of 2 with Chocolates Combo Pack",
      slug: "rakhi-set-of-2-with-chocolates-combo-pack",
    },
  ],
  "rakhi-hampers": [
    {
      name: "Evil Eyes Rakhi with Dairy Milk Chocolate",
      slug: "evil-eyes-rakhi-with-dairy-milk-chocolate",
    },
    {
      name: "Designer Beaded Rakhi with Kaju Katli, Almonds & Chocolate Gift Hamper for Brother | Premium Raksha Bandhan Gift",
    },
    {
      name: "Set of 2 Ganesh Designer Rakhis with Kaju Katli, Almonds & Kesar Petha Gift Hamper for Brother | Premium Raksha Bandhan Gift Set",
    },
    {
      name: "Set of 3 Spiritual Rudraksha & Om Designer Rakhis for Brother | Premium Raksha Bandhan Rakhi Gift Set",
    },
    {
      name: "Set of 3 Rudraksha Designer Rakhis with Colorful Beads for Brother | Premium Raksha Bandhan Rakhi Gift Set",
    },
    {
      name: "Set of 4 Kids Designer Rakhis with Kaju Katli, Cashews & Pistachios Gift Hamper for Brother | Premium Raksha Bandhan Gift Set",
    },
    {
      name: "Set of 2 Designer Pearl Rakhis with Almonds, Cashews & Kesar Petha Gift Hamper for Brother | Premium Raksha Bandhan Gift Set",
    },
    {
      name: "Set of 5 Rudraksha, Pearl & Designer Beaded Rakhis with Kaju Katli, Almonds, Cashews & Pistachios Gift Hamper for Brother | Premium Raksha Bandhan Gift Set",
    },
    {
      name: "Set of 2 Personalized Brother Name Rakhis with Kaju Katli, Ferrero Rocher & Almonds Gift Hamper",
    },
    {
      name: "Set of 2 Traditional Rudraksha Rakhis with Almonds, Cashews & Pistachios Gift Hamper",
    },
  ],
};

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
  const exact = products.find((p) => unused.has(p.slug) && normalizeProductLabel(p.name) === target);
  if (exact) return exact;

  // Allow minor catalog naming differences (punctuation, Style spacing, apostrophes).
  const words = significantWords(ref.name);
  if (words.length >= 3) {
    const fuzzy = products.find((p) => {
      if (!unused.has(p.slug)) return false;
      const hay = normalizeProductLabel(p.name);
      return words.every((w) => hay.includes(w));
    });
    if (fuzzy) return fuzzy;
  }

  return undefined;
}

/** Pick curated products for a home category section, preserving curation order. */
export function pickHomeCategoryProducts(products: Product[], categorySlug: string): Product[] {
  const refs = HOME_CATEGORY_PRODUCTS[categorySlug as HomeCategorySlug];
  if (!refs?.length) return [];

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
