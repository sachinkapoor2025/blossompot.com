/** Virtual storefront categories for multi-piece brother rakhi sets. */
export const RAKHI_SET_SIZE_CATEGORIES = ["2-set-rakhi", "3-set-rakhi", "4-set-rakhi"] as const;

export type RakhiSetSizeCategory = (typeof RAKHI_SET_SIZE_CATEGORIES)[number];
export type RakhiSetSize = 2 | 3 | 4;

const SET_SIZE_BY_CATEGORY: Record<RakhiSetSizeCategory, RakhiSetSize> = {
  "2-set-rakhi": 2,
  "3-set-rakhi": 3,
  "4-set-rakhi": 4,
};

const SET_CATEGORY_LABELS: Record<RakhiSetSizeCategory, string> = {
  "2-set-rakhi": "Set of 2 Rakhis",
  "3-set-rakhi": "Set of 3 Rakhis",
  "4-set-rakhi": "Set of 4 Rakhis",
};

export function isRakhiSetSizeCategory(slug: string): slug is RakhiSetSizeCategory {
  return (RAKHI_SET_SIZE_CATEGORIES as readonly string[]).includes(slug);
}

export function rakhiSetSizeFromCategory(slug: string): RakhiSetSize | null {
  return isRakhiSetSizeCategory(slug) ? SET_SIZE_BY_CATEGORY[slug] : null;
}

export function rakhiSetCategoryLabel(slug: string): string | null {
  return isRakhiSetSizeCategory(slug) ? SET_CATEGORY_LABELS[slug] : null;
}

type ProductLike = {
  name: string;
  slug?: string;
  description?: string;
  categorySlug?: string;
  tags?: string[];
};

function isExcludedFromSetMenus(product: ProductLike): boolean {
  const category = product.categorySlug ?? "";
  if (category === "bhaiya-bhabhi-rakhi" || category === "lumba-rakhi" || category === "kids-rakhi") {
    return true;
  }
  const identity = `${product.name} ${product.slug ?? ""}`.toLowerCase();
  return /bhaiya|bhabhi|lumba/.test(identity);
}

function matchSetSize(text: string): RakhiSetSize | null {
  const patterns: RegExp[] = [
    /set\s+of\s+([234])\s*(?:designer\s+)?rakhis?\b/i,
    /set-of-([234])(?:-|$|\b)/i,
    /\brakhi\s+set\s+of\s+([234])\b/i,
    /\b([234])[- ]pack\s+(?:delight|rakhi|festive)?/i,
    /\bfestive\s+rakhi\s+([234])[- ]pack\b/i,
    /\brakhi\s+([234])-in-1\b/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (n === 2 || n === 3 || n === 4) return n;
    }
  }
  return null;
}

/**
 * Detect whether a product is a 2/3/4-piece brother rakhi set.
 * Prefers name/slug/tags, then explicit "Set of N" list items in descriptions.
 */
export function detectRakhiSetSize(product: ProductLike): RakhiSetSize | null {
  if (isExcludedFromSetMenus(product)) return null;

  const primary = [product.name, product.slug ?? "", ...(product.tags ?? [])].join(" ");
  const fromPrimary = matchSetSize(primary);
  if (fromPrimary) return fromPrimary;

  const description = product.description ?? "";
  const listMatches = [...description.matchAll(/<li[^>]*>\s*([^<]*?)<\/li>/gi)];
  for (const match of listMatches) {
    const line = match[1] ?? "";
    if (/set\s+of\s+([234])\b/i.test(line) && /rakhi/i.test(line)) {
      const n = Number(line.match(/set\s+of\s+([234])\b/i)?.[1]);
      if (n === 2 || n === 3 || n === 4) return n;
    }
  }

  return matchSetSize(description);
}

export function productMatchesRakhiSetCategory(product: ProductLike, categorySlug: string): boolean {
  const size = rakhiSetSizeFromCategory(categorySlug);
  if (!size) return false;
  return detectRakhiSetSize(product) === size;
}
