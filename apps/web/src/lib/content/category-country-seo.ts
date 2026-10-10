import { countryDisplayName, parseLocationShopPath } from "../location-seo-urls";
import { getCategoryPageSeo } from "./category-seo";
import {
  countrySeoContent,
  hasApprovedCountrySeo,
  type CountrySeoContent,
  type CountrySeoPage,
} from "./country-seo-registry";

const APPROVED_CATEGORY_PAGE: Partial<Record<string, CountrySeoPage>> = {
  flowers: "flowers",
};

export type ResolvedCategorySeo = {
  source: "approved" | "neutral";
  title: string;
  description: string;
  h1: string;
  article: CountrySeoContent | null;
};

function categoryLabel(slug: string): string {
  return getCategoryPageSeo(slug)?.h1 ?? slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Category SEO follows the public route.
 * Approved registry copy is used only for that category and country.
 * Every other route gets neutral copy. The shopper cookie does not change it.
 */
export function resolveCategoryPageSeo(slug: string, seoPath: string): ResolvedCategorySeo {
  const parsed = parseLocationShopPath(seoPath);
  const page = APPROVED_CATEGORY_PAGE[slug];
  if (
    parsed?.kind === "category" &&
    parsed.internalSlug === slug &&
    page &&
    hasApprovedCountrySeo(parsed.countryIso, page)
  ) {
    const article = countrySeoContent(parsed.countryIso, page);
    return {
      source: "approved",
      title: article.title,
      description: article.description,
      h1: article.heading,
      article,
    };
  }

  const base = getCategoryPageSeo(slug);
  const label = categoryLabel(slug);
  if (parsed?.countryIso) {
    const country = countryDisplayName(parsed.countryIso);
    return {
      source: "neutral",
      title: `${label} for ${country} | BlossomPot`,
      description: `Shop ${label.toLowerCase()} on BlossomPot for a recipient in ${country}. Choose a product and check delivery availability for their address at checkout.`,
      h1: `${label} for ${country}`,
      article: null,
    };
  }

  return {
    source: "neutral",
    title: base?.title ?? `${label} | BlossomPot`,
    description:
      base?.description ??
      `Shop ${label.toLowerCase()} on BlossomPot. Choose a product and check delivery availability for the recipient’s address at checkout.`,
    h1: label,
    article: null,
  };
}

/** Catalog copy for `/products` and `/gifts-to-{country}`. No worldwide delivery promise. */
export function catalogShopSeo(seoPath: string): { title: string; description: string; intro: string } {
  const parsed = parseLocationShopPath(seoPath);
  if (parsed?.countryIso) {
    const country = countryDisplayName(parsed.countryIso);
    return {
      title: `Shop Flowers, Cakes & Gifts for ${country} | BlossomPot`,
      description: `Browse flowers, cakes, and gifts on BlossomPot for a recipient in ${country}. Check delivery availability for their address at checkout.`,
      intro: `Flowers, bouquets, cakes, and curated gifts. Enter the recipient’s address in ${country} at checkout to review the products and dates available for that order.`,
    };
  }
  return {
    title: "Shop Flowers, Cakes & Gifts | BlossomPot",
    description:
      "Browse flowers, bouquets, cakes, and curated gift hampers. Choose a product and check delivery availability for the recipient’s address at checkout.",
    intro:
      "Flowers, bouquets, cakes, and curated gifts for birthdays, anniversaries, and everyday thank-yous. Enter the recipient’s address at checkout to review available products and dates.",
  };
}
