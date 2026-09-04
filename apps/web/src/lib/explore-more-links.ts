import { locationPublicPath } from "@/lib/content/seo-data";
import { categoryHref } from "@/lib/category-urls";
import { exploreGeoLinksForProduct } from "@/lib/content/geo/locations";

/** Deterministic PDP city links from nationwide geo SoT (stable per product slug). */
export function exploreCityLinksForProduct(productSlug: string) {
  return exploreGeoLinksForProduct(productSlug, 8);
}

/** Default static list for non-PDP Explore More. */
export const exploreCityLinks = exploreGeoLinksForProduct("default", 12);

type ExploreLink = { label: string; href: string };

export function exploreMoreLinksForProduct(productSlug?: string, categorySlug?: string, occasion?: string) {
  const cityLinks = productSlug ? exploreCityLinksForProduct(productSlug) : exploreCityLinks;
  const firstCity = cityLinks[0];
  const normalizedOccasion = occasion?.toLowerCase() ?? "";

  const byCategory: Record<string, ExploreLink[]> = {
    flowers: [
      { label: "Flower bouquets", href: categoryHref("flower-bouquets") },
      { label: "Anniversary gifts", href: categoryHref("anniversary-gifts") },
      { label: "Flower delivery in the USA", href: "/flower-delivery-usa" },
    ],
    "flower-bouquets": [
      { label: "Fresh flowers", href: categoryHref("flowers") },
      { label: "Valentine's Day gifts", href: categoryHref("valentines-day-gifts") },
      { label: "Same-day delivery", href: categoryHref("same-day-gifts") },
    ],
    cakes: [
      { label: "Birthday gifts", href: categoryHref("birthday-gifts") },
      { label: "Gift hampers", href: categoryHref("gift-hampers") },
      { label: "Same-day delivery", href: categoryHref("same-day-gifts") },
    ],
    "gift-hampers": [
      { label: "Birthday gifts", href: categoryHref("birthday-gifts") },
      { label: "Corporate gifting", href: "/corporate-gifting" },
      { label: "Flower delivery in the USA", href: "/flower-delivery-usa" },
    ],
    "birthday-gifts": [
      { label: "Celebration cakes", href: categoryHref("cakes") },
      { label: "Fresh flowers", href: categoryHref("flowers") },
      { label: "Same-day delivery", href: categoryHref("same-day-gifts") },
    ],
    "anniversary-gifts": [
      { label: "Flower bouquets", href: categoryHref("flower-bouquets") },
      { label: "Celebration cakes", href: categoryHref("cakes") },
      { label: "Romantic flower guide", href: "/blog/anniversary-flowers-and-cake-combo" },
    ],
    "valentines-day-gifts": [
      { label: "Flower bouquets", href: categoryHref("flower-bouquets") },
      { label: "Fresh flowers", href: categoryHref("flowers") },
      { label: "Valentine's flower guide", href: "/blog/valentines-day-flowers-delivery" },
    ],
    "mothers-day-gifts": [
      { label: "Plants", href: categoryHref("plants") },
      { label: "Flower bouquets", href: categoryHref("flower-bouquets") },
      { label: "Mother's Day flower guide", href: "/blog/send-mothers-day-flowers-to-mom" },
    ],
    "same-day-gifts": [
      { label: "Flowers", href: categoryHref("flowers") },
      { label: "Cakes", href: categoryHref("cakes") },
      { label: "Delivery locations", href: "/delivery-locations" },
    ],
  };

  const byOccasion: ExploreLink[] = normalizedOccasion.includes("birthday")
    ? [{ label: "Birthday gifts", href: categoryHref("birthday-gifts") }]
    : normalizedOccasion.includes("anniversary")
      ? [{ label: "Anniversary gifts", href: categoryHref("anniversary-gifts") }]
      : normalizedOccasion.includes("mother")
        ? [{ label: "Mother's Day gifts", href: categoryHref("mothers-day-gifts") }]
        : normalizedOccasion.includes("valentine")
          ? [{ label: "Valentine's Day gifts", href: categoryHref("valentines-day-gifts") }]
          : [];

  const links = [
    ...(byCategory[categorySlug ?? ""] ?? []),
    ...byOccasion,
    ...(firstCity ? [{ label: `Gifts to ${firstCity.label}`, href: firstCity.href }] : []),
    { label: "Shipping and delivery", href: "/shipping" },
  ];

  const unique: ExploreLink[] = [];
  const seen = new Set<string>();
  for (const link of links) {
    if (!link?.href || seen.has(link.href)) continue;
    seen.add(link.href);
    unique.push(link);
    if (unique.length === 4) break;
  }
  return unique;
}

export const exploreMoreGroups = exploreMoreLinksForProduct();

/** @deprecated Use exploreMoreLinksForProduct */
export const EXPLORE_MORE_GROUPS = exploreMoreGroups;

// keep path helper available for callers that imported it historically
void locationPublicPath;
