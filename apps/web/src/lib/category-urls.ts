/**
 * Public SEO category URLs (root-level, no /categories/ prefix).
 * Internal API slugs stay unchanged; only storefront paths differ.
 */
export const CATEGORY_PUBLIC_SLUG: Record<string, string> = {
  "single-rakhi": "single-rakhi-to-usa",
  "2-set-rakhi": "2-set-rakhi-to-usa",
  "3-set-rakhi": "3-set-rakhi-to-usa",
  "4-set-rakhi": "4-set-rakhi-to-usa",
  "kids-rakhi": "kids-rakhi-to-usa",
  "rakhi-combo": "rakhi-combo-to-usa",
  "lumba-rakhi": "lumba-rakhi-to-usa",
  "bhaiya-bhabhi-rakhi": "bhaiya-bhabhi-rakhi-to-usa",
  "rakhi-hampers": "rakhi-hampers-to-usa",
};

const PUBLIC_TO_INTERNAL = Object.fromEntries(
  Object.entries(CATEGORY_PUBLIC_SLUG).map(([internal, pub]) => [pub, internal])
) as Record<string, string>;

/** Storefront path for a category API slug, e.g. `/single-rakhi-to-usa`. */
export function categoryHref(slug: string): string {
  const pub = CATEGORY_PUBLIC_SLUG[slug];
  return pub ? `/${pub}` : `/${slug}-to-usa`;
}

/** Resolve API slug from a public path segment (no slashes). */
export function categorySlugFromPublicSlug(publicSlug: string): string | undefined {
  if (PUBLIC_TO_INTERNAL[publicSlug]) return PUBLIC_TO_INTERNAL[publicSlug];
  if (publicSlug.endsWith("-to-usa")) {
    const candidate = publicSlug.slice(0, -"-to-usa".length);
    if (candidate in CATEGORY_PUBLIC_SLUG) return candidate;
  }
  return undefined;
}

/** Categories whose public URL does not end with `-to-usa`. */
export function categoriesMissingToUsaSuffix(): string[] {
  return Object.entries(CATEGORY_PUBLIC_SLUG)
    .filter(([, pub]) => !pub.endsWith("-to-usa"))
    .map(([internal, pub]) => `${internal} → /${pub}/`);
}

/** Next.js 301 redirects from legacy paths to SEO URLs (statusCode 301, not 308). */
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
    // Legacy bare slug without -to-usa (e.g. /bhaiya-bhabhi-rakhi → /bhaiya-bhabhi-rakhi-to-usa)
    if (internal !== pub) {
      rules.push({ source: `/${internal}`, destination: dest, statusCode: 301 });
      rules.push({ source: `/${internal}/`, destination: dest, statusCode: 301 });
    }
  }

  return rules;
}

/** Rewrite public SEO URLs to the internal category page handler. */
export function categoryRewriteRules(): { source: string; destination: string }[] {
  return Object.entries(CATEGORY_PUBLIC_SLUG).flatMap(([, pub]) => [
    { source: `/${pub}`, destination: `/categories/${PUBLIC_TO_INTERNAL[pub]}` },
    { source: `/${pub}/`, destination: `/categories/${PUBLIC_TO_INTERNAL[pub]}` },
  ]);
}
