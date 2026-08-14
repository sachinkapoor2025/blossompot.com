import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";

export type ExploreMoreLink = {
  label: string;
  href: string;
};

export type ExploreMoreGroup = {
  heading: string;
  links: ExploreMoreLink[];
};

/** Major USA city / state doorways for PDP “Explore More” internal links. */
const CITY_LINKS: ExploreMoreLink[] = [
  { label: "Rakhi to New York", href: locationPublicPath("new-york") },
  { label: "Rakhi to California", href: locationPublicPath("california") },
  { label: "Rakhi to Texas", href: locationPublicPath("texas") },
  { label: "Rakhi to Florida", href: locationPublicPath("florida") },
  { label: "Rakhi to Chicago", href: locationPublicPath("chicago") },
  { label: "Rakhi to New Jersey", href: locationPublicPath("new-jersey") },
  { label: "Rakhi to Virginia", href: locationPublicPath("virginia") },
  { label: "Rakhi to Washington", href: locationPublicPath("washington") },
  { label: "Rakhi to Los Angeles", href: locationPublicPath("los-angeles") },
  { label: "Rakhi to Houston", href: locationPublicPath("houston") },
  { label: "Rakhi to Dallas", href: locationPublicPath("dallas") },
  { label: "Rakhi to Atlanta", href: locationPublicPath("atlanta") },
  { label: "Rakhi to Boston", href: locationPublicPath("boston") },
  { label: "Rakhi to Seattle", href: locationPublicPath("seattle") },
  { label: "Rakhi to Miami", href: locationPublicPath("miami") },
  { label: "Rakhi to San Francisco", href: locationPublicPath("san-francisco") },
  { label: "Rakhi to San Diego", href: locationPublicPath("san-diego") },
  { label: "Rakhi to Austin", href: locationPublicPath("austin") },
  { label: "Rakhi to Denver", href: locationPublicPath("denver") },
  { label: "Rakhi to Phoenix", href: locationPublicPath("phoenix") },
];

/**
 * FNP-style Explore More link groups for product pages.
 * Category links use public SEO paths; other groups use /collections/* landings.
 */
export const EXPLORE_MORE_GROUPS: ExploreMoreGroup[] = [
  {
    heading: "Rakhi by Cities",
    links: CITY_LINKS,
  },
  {
    heading: "Rakhi by Type",
    links: [
      { label: "Single Rakhi", href: categoryHref("single-rakhi") },
      { label: "Bhaiya Bhabhi Rakhi", href: categoryHref("bhaiya-bhabhi-rakhi") },
      { label: "Kids Rakhi", href: categoryHref("kids-rakhi") },
      { label: "Lumba Rakhi", href: categoryHref("lumba-rakhi") },
      { label: "Rakhi Sets", href: "/collections/rakhi-sets" },
      { label: "Rakhi Hampers", href: categoryHref("rakhi-hampers") },
      { label: "Personalized Rakhi", href: "/collections/personalized-rakhi" },
      { label: "Premium Rakhi", href: "/collections/premium-rakhi" },
    ],
  },
  {
    heading: "Rakhi by Recipient",
    links: [
      { label: "Rakhi for Brother", href: "/collections/rakhi-for-brother" },
      { label: "Rakhi for Bhaiya", href: "/collections/rakhi-for-bhaiya" },
      { label: "Rakhi for Bhabhi", href: "/collections/rakhi-for-bhabhi" },
      { label: "Rakhi for Kids", href: categoryHref("kids-rakhi") },
      { label: "Rakhi for Cousin Brother", href: "/collections/rakhi-for-cousin-brother" },
    ],
  },
  {
    heading: "Rakhi by Price",
    links: [
      { label: "Rakhi Under $10", href: "/collections/rakhi-under-10" },
      { label: "Under $20", href: "/collections/rakhi-under-20" },
      { label: "Under $30", href: "/collections/rakhi-under-30" },
      { label: "Premium Rakhi", href: "/collections/premium-rakhi" },
    ],
  },
  {
    heading: "Popular Collections",
    links: [
      { label: "Best Selling Rakhis", href: "/collections/best-selling-rakhis" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Trending Rakhis", href: "/collections/trending-rakhis" },
      { label: "Designer Rakhis", href: "/collections/designer-rakhis" },
      { label: "Festival Special Rakhis", href: "/collections/festival-special-rakhis" },
    ],
  },
];
