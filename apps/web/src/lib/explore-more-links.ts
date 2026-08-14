import { locationPublicPath } from "@/lib/content/seo-data";
import { categoryHref } from "@/lib/category-urls";

/** Gift-city links for PDP Explore More (not Rakhi URLs). */
export const exploreCityLinks = [
  { label: "Gifts to New York", href: locationPublicPath("new-york") },
  { label: "Gifts to California", href: locationPublicPath("california") },
  { label: "Gifts to Texas", href: locationPublicPath("texas") },
  { label: "Gifts to Florida", href: locationPublicPath("florida") },
  { label: "Gifts to Chicago", href: locationPublicPath("chicago") },
  { label: "Gifts to New Jersey", href: locationPublicPath("new-jersey") },
  { label: "Gifts to Los Angeles", href: locationPublicPath("los-angeles") },
  { label: "Gifts to Houston", href: locationPublicPath("houston") },
  { label: "Gifts to Dallas", href: locationPublicPath("dallas") },
  { label: "Gifts to Atlanta", href: locationPublicPath("atlanta") },
  { label: "Gifts to Boston", href: locationPublicPath("boston") },
  { label: "Gifts to Seattle", href: locationPublicPath("seattle") },
  { label: "Gifts to Miami", href: locationPublicPath("miami") },
  { label: "Gifts to San Francisco", href: locationPublicPath("san-francisco") },
  { label: "Gifts to San Diego", href: locationPublicPath("san-diego") },
  { label: "Gifts to Austin", href: locationPublicPath("austin") },
  { label: "Gifts to Denver", href: locationPublicPath("denver") },
  { label: "Gifts to Phoenix", href: locationPublicPath("phoenix") },
] as const;

export const exploreMoreGroups = [
  {
    heading: "Gifts by City",
    links: exploreCityLinks.slice(0, 12),
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
      { label: "Flowers", href: "/flowers" },
      { label: "Cakes", href: "/cakes" },
      { label: "Gift Hampers", href: "/gift-hampers" },
    ],
  },
] as const;

/** @deprecated Use exploreMoreGroups */
export const EXPLORE_MORE_GROUPS = exploreMoreGroups;
