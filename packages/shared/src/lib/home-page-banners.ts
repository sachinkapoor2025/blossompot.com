/**
 * Homepage hero banner assets shared by the storefront and marketing emails.
 * Keep paths in sync — emails use absolute URLs; the web app uses relative `/banners/…`.
 */

export const SITE_ORIGIN = "https://www.blossompot.com";

export const HOME_PAGE_BANNER_PATHS = {
  flowers: "/banners/home-banner-flowers.jpg",
  birthday: "/banners/home-banner-birthday.jpg",
  gourmet: "/banners/home-banner-gourmet.jpg",
} as const;

export function homePageBannerUrl(key: keyof typeof HOME_PAGE_BANNER_PATHS): string {
  return `${SITE_ORIGIN}${HOME_PAGE_BANNER_PATHS[key]}`;
}

/** Relative public path of the Independence Day homepage hero (first carousel slide while active). */
export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_PATH =
  "/banners/banner-independence-day-2026.png" as const;

/** Absolute URL for the same banner (email clients require absolute image src). */
export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_URL = `${SITE_ORIGIN}${HOME_PAGE_INDEPENDENCE_DAY_BANNER_PATH}`;

export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_ALT =
  "Celebration Sale — Flowers, Cakes & Gifts | BlossomPot" as const;

/**
 * First homepage banner image for marketing emails.
 * Matches the flowers slide on the storefront carousel.
 */
export function getFirstHomePageBannerForEmail(): {
  src: string;
  alt: string;
  href: string;
} {
  return {
    src: homePageBannerUrl("flowers"),
    alt: "Fresh flowers from blossompot.com — roses, mixed bouquets, and same-day delivery",
    href: `${SITE_ORIGIN}/flowers`,
  };
}
