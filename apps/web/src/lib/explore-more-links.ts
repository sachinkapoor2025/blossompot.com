import { locationPublicPath } from "@/lib/content/seo-data";
import { categoryHref } from "@/lib/category-urls";
import { exploreGeoLinksForProduct } from "@/lib/content/geo/locations";

/** Deterministic PDP city links from nationwide geo SoT (stable per product slug). */
export function exploreCityLinksForProduct(productSlug: string) {
  return exploreGeoLinksForProduct(productSlug, 8);
}

/** Default static list for non-PDP Explore More. */
export const exploreCityLinks = exploreGeoLinksForProduct("default", 12);

export function exploreMoreGroupsForProduct(productSlug?: string) {
  const cityLinks = productSlug
    ? exploreCityLinksForProduct(productSlug)
    : exploreCityLinks;
  return [
    {
      heading: "Flower delivery by country",
      links: [
        { label: "USA", href: "/flower-delivery-usa" },
        { label: "United Kingdom", href: "/flower-delivery-uk" },
        { label: "Canada", href: "/flower-delivery-canada" },
        { label: "Australia", href: "/flower-delivery-australia" },
        { label: "United Arab Emirates", href: "/flower-delivery-uae" },
      ],
    },
    {
      heading: "Gifts by Location",
      links: cityLinks,
    },
    {
      heading: "Shop by Category",
      links: [
        { label: "Flowers", href: categoryHref("flowers") },
        { label: "Bouquets", href: categoryHref("flower-bouquets") },
        { label: "Cakes", href: categoryHref("cakes") },
        { label: "Gift Hampers", href: categoryHref("gift-hampers") },
        { label: "Birthday Gifts", href: categoryHref("birthday-gifts") },
        { label: "Anniversary Gifts", href: categoryHref("anniversary-gifts") },
        { label: "Valentine's Gifts", href: categoryHref("valentines-day-gifts") },
        { label: "Same-Day Gifts", href: categoryHref("same-day-gifts") },
      ],
    },
    {
      heading: "Occasions",
      links: [
        { label: "Birthday", href: categoryHref("birthday-gifts") },
        { label: "Anniversary", href: categoryHref("anniversary-gifts") },
        { label: "Mother's Day", href: categoryHref("mothers-day-gifts") },
        { label: "Wedding", href: categoryHref("wedding-gifts") },
        { label: "Celebration Gifts", href: categoryHref("celebration-gifts") },
      ],
    },
    {
      heading: "Popular Collections",
      links: [
        { label: "Same-Day Delivery", href: "/same-day-delivery" },
        { label: "Delivery locations", href: "/delivery-locations" },
        { label: "Flowers", href: "/flowers" },
        { label: "Cakes", href: "/cakes" },
        { label: "Gift Hampers", href: "/gift-hampers" },
      ],
    },
  ] as const;
}

export const exploreMoreGroups = exploreMoreGroupsForProduct();

/** @deprecated Use exploreMoreGroups */
export const EXPLORE_MORE_GROUPS = exploreMoreGroups;

// keep path helper available for callers that imported it historically
void locationPublicPath;
