/**
 * Permanent redirects from retired CMS URL shapes so inbound links are not lost.
 * See also categoryRedirectRules() for category slug migrations.
 */
export function legacyRedirectRules(): {
  source: string;
  destination: string;
  statusCode: 301;
}[] {
  const home = "/";
  const rules: { source: string; destination: string; statusCode: 301 }[] = [];

  const toHome = (source: string) => rules.push({ source, destination: home, statusCode: 301 });

  // Retired catalog tag paths
  toHome("/product-tag/:path*");
  toHome("/tag/:path*");

  // Old single-segment product URLs → /products/:slug
  rules.push({ source: "/product/:slug", destination: "/products/:slug", statusCode: 301 });

  // Retired CMS / account paths (no longer served)
  toHome("/wp-admin/:path*");
  toHome("/wp-content/:path*");
  toHome("/wp-includes/:path*");
  toHome("/feed");
  toHome("/feed/:path*");
  toHome("/author/:path*");
  toHome("/page/:path*");
  toHome("/comments/:path*");
  toHome("/my-account/:path*");

  // Do not redirect /cart or /checkout — those are live app routes.

  rules.push({ source: "/shop", destination: "/products", statusCode: 301 });
  rules.push({ source: "/shop/:path*", destination: "/products", statusCode: 301 });

  // Hamper URLs previously appended SKU (e.g. …-tfusrh2026-16) — redirect to name-only slug.
  for (const [from, to] of HAMPER_SKU_SLUG_REDIRECTS) {
    rules.push({
      source: `/products/${from}`,
      destination: `/products/${to}`,
      statusCode: 301,
    });
  }

  return rules;
}

/** Old slug (name-sku) → new slug (name only). */
const HAMPER_SKU_SLUG_REDIRECTS: readonly [string, string][] = [
  ["rakhi-dry-fruit-celebration-combo-tfusrh2026-3", "rakhi-dry-fruit-celebration-combo"],
  ["grand-rakhi-dry-fruit-indulgence-box-tfusrh2026-8", "grand-rakhi-dry-fruit-indulgence-box"],
  ["rakhi-mithaas-crunch-box-tfusrh2026-11", "rakhi-mithaas-crunch-box"],
  ["rakhi-double-celebration-box-tfusrh2026-15", "rakhi-double-celebration-box"],
  ["classic-rakhi-double-delight-box-tfusrh2026-16", "classic-rakhi-double-delight-box"],
  ["festive-rakhi-duo-delight-tfusrh2026-18", "festive-rakhi-duo-delight"],
  ["twin-rakhi-soan-papdi-combo-tfusrh2026-21", "twin-rakhi-soan-papdi-combo"],
  ["rakhi-3-in-1-festive-hamper-tfusrh2026-24", "rakhi-3-in-1-festive-hamper"],
  ["rakhi-triple-joy-box-tfusrh2026-25", "rakhi-triple-joy-box"],
  ["grand-rakhi-trio-choco-delight-tfusrh2026-27", "grand-rakhi-trio-choco-delight"],
  ["family-trio-rakhi-celebration-pack-tfusrh2026-28", "family-trio-rakhi-celebration-pack"],
  ["festive-rakhi-4-pack-delight-tfusrh2026-31", "festive-rakhi-4-pack-delight"],
  ["rakhi-5-in-1-grand-festive-combo-tfusrh2026-33", "rakhi-5-in-1-grand-festive-combo"],
  ["elegant-rakhi-gift-box-tfusrh2026-34", "elegant-rakhi-gift-box"],
  ["divine-rakhi-gift-set-tfusrh2026-35", "divine-rakhi-gift-set"],
  ["divine-ritual-rakhi-pack-tfusrh2026-36", "divine-ritual-rakhi-pack"],
  ["kaju-katli-elegance-hamper-tfusrh2026-38", "kaju-katli-elegance-hamper"],
  ["think-of-me-rakhi-hamper-tfcom009", "think-of-me-rakhi-hamper"],
  ["nuts-love-rakhi-hamper-tfusa003", "nuts-love-rakhi-hamper"],
  ["rakhi-bliss-essentials-tfusa004", "rakhi-bliss-essentials"],
];
