import { isFlowerGuideIndexable } from "@blossompot/shared";
import { flowerDirectory, directoryByLetter, directoryBySlug, publishedDirectory } from "./catalog";
import { publishedFlowerGuides, getPublishedGuide } from "./published";
import type { FlowerDirectoryEntry, FlowerGuide, FlowerGuideNavItem } from "./types";

export * from "./types";
export * from "./catalog";
export * from "./images";
export * from "./published";
export * from "./seasons";
export * from "./occasions";
export * from "./colors";
export * from "./care";
export * from "./comparisons";
export * from "./glossary";
export * from "./search";
export * from "./products";
export * from "./locations";

export const FLOWER_GUIDE_PATH = "/flower-guide";

export const flowerGuideNav: FlowerGuideNavItem[] = [
  { label: "Flowers A–Z", href: "/flower-guide/flowers-a-z", description: "Directory of flower names" },
  { label: "Flower Meanings", href: "/flower-guide/flower-meanings", description: "Symbolism and colour associations" },
  { label: "Flower Colours", href: "/flower-guide/flowers-by-colour", description: "Browse by colour" },
  { label: "Seasonal Flowers", href: "/flower-guide/seasonal-flowers", description: "Seasons and monthly calendar" },
  { label: "Flowers by Occasion", href: "/flower-guide/flowers-by-occasion", description: "Birthdays, weddings, sympathy" },
  { label: "Flower Care", href: "/flower-guide/flower-care", description: "How to keep flowers fresh" },
  { label: "Comparisons", href: "/flower-guide/flower-comparisons", description: "Roses vs peonies and more" },
  { label: "Glossary", href: "/flower-guide/flower-glossary", description: "Bouquet terms explained" },
  { label: "Identify", href: "/flower-guide/identify", description: "Browse by colour, season and form" },
];

export const exploreCategories: { slug: string; label: string; href: string; description: string }[] = [
  { slug: "a-z", label: "Flowers A–Z", href: "/flower-guide/flowers-a-z", description: "Every flower in the directory" },
  { slug: "popular", label: "Popular Flowers", href: "/flower-guide/flowers-a-z?category=popular", description: "The flowers people ask for most" },
  { slug: "romantic", label: "Romantic Flowers", href: "/flower-guide/flowers-by-occasion/romantic", description: "Roses, peonies and softer romance" },
  { slug: "wedding", label: "Wedding Flowers", href: "/flower-guide/flowers-by-occasion/wedding", description: "Season-first bridal choices" },
  { slug: "birthday", label: "Birthday Flowers", href: "/flower-guide/flowers-by-occasion/birthday", description: "Cheerful, less formal bunches" },
  { slug: "sympathy", label: "Sympathy Flowers", href: "/flower-guide/flowers-by-occasion/sympathy", description: "Respectful choices by culture" },
  { slug: "seasonal", label: "Seasonal Flowers", href: "/flower-guide/seasonal-flowers", description: "What is in season where" },
  { slug: "spring", label: "Spring Flowers", href: "/flower-guide/spring-flowers", description: "Tulips, ranunculus, peonies" },
  { slug: "summer", label: "Summer Flowers", href: "/flower-guide/summer-flowers", description: "Sunflowers, dahlias, garden roses" },
  { slug: "autumn", label: "Autumn Flowers", href: "/flower-guide/autumn-flowers", description: "Mums, late dahlias, harvest colour" },
  { slug: "winter", label: "Winter Flowers", href: "/flower-guide/winter-flowers", description: "Forced bulbs, roses, orchids" },
  { slug: "fragrant", label: "Fragrant Flowers", href: "/flower-guide/flowers-a-z?fragrance=strong", description: "When scent is the brief" },
  { slug: "long-lasting", label: "Long-Lasting Flowers", href: "/flower-guide/flowers-a-z?longevity=long", description: "Stems that usually hold up" },
  { slug: "luxury", label: "Luxury Flowers", href: "/flower-guide/flowers-a-z?category=luxury", description: "Garden roses, peonies, orchids" },
  { slug: "exotic", label: "Exotic Flowers", href: "/flower-guide/flowers-a-z?category=exotic", description: "Orchids, anthurium, protea" },
  { slug: "wildflowers", label: "Wildflowers", href: "/flower-guide/flowers-a-z?category=wildflowers", description: "Meadow textures and fillers" },
  { slug: "indoor", label: "Indoor Flowers", href: "/flower-guide/flowers-a-z?category=indoor", description: "Gift plants that live indoors" },
  { slug: "pet-friendly", label: "Pet-Friendly Flowers", href: "/flower-guide/flowers-a-z?petFriendly=1", description: "Where reliable listings exist" },
  { slug: "low-pollen", label: "Low-Pollen Flowers", href: "/flower-guide/flowers-a-z?category=low-pollen", description: "When pollen is a concern" },
];

export function isGuidePublic(guide: FlowerGuide): boolean {
  return isFlowerGuideIndexable(guide.status);
}

export function publicFlowerGuides(): FlowerGuide[] {
  return publishedFlowerGuides.filter(isGuidePublic);
}

export function publicDirectoryEntries(): FlowerDirectoryEntry[] {
  return publishedDirectory();
}

export function flowerSitemapPaths(): { path: string; lastModified: string }[] {
  const now = "2026-08-16";
  const paths: { path: string; lastModified: string }[] = [
    { path: "/flower-guide", lastModified: now },
    { path: "/flower-guide/flowers-a-z", lastModified: now },
    { path: "/flower-guide/flower-meanings", lastModified: now },
    { path: "/flower-guide/flowers-by-colour", lastModified: now },
    { path: "/flower-guide/seasonal-flowers", lastModified: now },
    { path: "/flower-guide/spring-flowers", lastModified: now },
    { path: "/flower-guide/summer-flowers", lastModified: now },
    { path: "/flower-guide/autumn-flowers", lastModified: now },
    { path: "/flower-guide/winter-flowers", lastModified: now },
    { path: "/flower-guide/flowers-by-occasion", lastModified: now },
    { path: "/flower-guide/flower-care", lastModified: now },
    { path: "/flower-guide/flower-comparisons", lastModified: now },
    { path: "/flower-guide/flower-glossary", lastModified: now },
    { path: "/flower-guide/identify", lastModified: now },
  ];

  for (const g of publicFlowerGuides()) {
    paths.push({ path: `/flower-guide/${g.slug}`, lastModified: g.updatedAt });
  }
  for (const o of ["birthday", "anniversary", "valentines-day", "mothers-day", "wedding", "engagement", "congratulations", "thank-you", "get-well", "sympathy", "funeral", "new-baby", "housewarming", "apology", "romantic", "just-because", "graduation", "corporate"]) {
    paths.push({ path: `/flower-guide/flowers-by-occasion/${o}`, lastModified: now });
  }
  for (const c of ["red", "pink", "white", "yellow", "orange", "purple", "blue", "green", "peach", "mixed"]) {
    paths.push({ path: `/flower-guide/flowers-by-colour/${c}`, lastModified: now });
  }
  for (const a of [
    "how-to-make-cut-flowers-last-longer",
    "how-often-should-you-change-flower-water",
    "how-to-cut-flower-stems",
    "how-to-revive-wilting-flowers",
    "how-to-care-for-roses",
    "how-to-care-for-tulips",
    "how-to-care-for-lilies",
    "how-to-care-for-orchids",
    "how-to-care-for-peonies",
    "how-to-care-for-hydrangeas",
    "how-to-keep-flowers-fresh-in-summer",
    "how-to-care-for-flowers-during-delivery",
    "how-to-arrange-flowers-in-a-vase",
    "how-to-remove-pollen-from-lilies",
    "how-to-store-flowers-overnight",
  ]) {
    paths.push({ path: `/flower-guide/flower-care/${a}`, lastModified: now });
  }
  for (const cmp of [
    "roses-vs-peonies",
    "roses-vs-tulips",
    "lilies-vs-roses",
    "peonies-vs-ranunculus",
    "orchids-vs-roses",
    "sunflowers-vs-gerberas",
    "hydrangeas-vs-peonies",
  ]) {
    paths.push({ path: `/flower-guide/flower-comparisons/${cmp}`, lastModified: now });
  }
  return paths;
}

export { directoryByLetter, directoryBySlug, getPublishedGuide, flowerDirectory };
