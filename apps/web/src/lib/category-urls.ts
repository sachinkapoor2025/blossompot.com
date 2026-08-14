/**
 * Public SEO category URLs for BlossomPot (root-level, no /categories/ prefix).
 */
export const CATEGORY_PUBLIC_SLUG: Record<string, string> = {
  flowers: "flowers",
  "flower-bouquets": "bouquets",
  cakes: "cakes",
  "birthday-gifts": "birthday-gifts",
  "anniversary-gifts": "anniversary-gifts",
  "valentines-day-gifts": "valentines-day-gifts",
  "mothers-day-gifts": "mothers-day-gifts",
  "wedding-gifts": "wedding-gifts",
  "personalized-gifts": "personalized-gifts",
  "gift-hampers": "gift-hampers",
  plants: "plants",
  "same-day-gifts": "same-day-delivery",
  "celebration-gifts": "celebration-gifts",
};

const PUBLIC_TO_INTERNAL = Object.fromEntries(
  Object.entries(CATEGORY_PUBLIC_SLUG).map(([internal, pub]) => [pub, internal])
) as Record<string, string>;

export function categoryHref(slug: string): string {
  const pub = CATEGORY_PUBLIC_SLUG[slug];
  return pub ? `/${pub}` : `/categories/${slug}`;
}

export function categorySlugFromPublicSlug(publicSlug: string): string | undefined {
  if (PUBLIC_TO_INTERNAL[publicSlug]) return PUBLIC_TO_INTERNAL[publicSlug];
  if (publicSlug in CATEGORY_PUBLIC_SLUG) return publicSlug;
  return undefined;
}

export function categoriesMissingToUsaSuffix(): string[] {
  return [];
}

export function categoryRedirectRules(): {
  source: string;
  destination: string;
  statusCode: 301;
}[] {
  const rules: { source: string; destination: string; statusCode: 301 }[] = [];
  for (const [internal, pub] of Object.entries(CATEGORY_PUBLIC_SLUG)) {
    const dest = `/${pub}`;
    for (const prefix of ["/categories", "/product-category"]) {
      rules.push({ source: `${prefix}/${internal}`, destination: dest, statusCode: 301 });
      rules.push({ source: `${prefix}/${internal}/`, destination: dest, statusCode: 301 });
    }
    if (internal !== pub) {
      rules.push({ source: `/${internal}`, destination: dest, statusCode: 301 });
      rules.push({ source: `/${internal}/`, destination: dest, statusCode: 301 });
    }
  }
  return rules;
}

export function categoryRewriteRules(): { source: string; destination: string }[] {
  return Object.entries(CATEGORY_PUBLIC_SLUG).flatMap(([internal, pub]) => [
    { source: `/${pub}`, destination: `/categories/${internal}` },
    { source: `/${pub}/`, destination: `/categories/${internal}` },
  ]);
}
