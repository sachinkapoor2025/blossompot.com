/**
 * Homepage hero banner assets shared by the storefront and marketing emails.
 * Keep paths in sync — emails use absolute URLs; the web app uses relative `/banners/…`.
 */

export const SITE_ORIGIN = "https://www.blossompot.com";

/** Relative public path of the Independence Day homepage hero (first carousel slide while active). */
export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_PATH =
  "/banners/banner-independence-day-2026.png" as const;

/** Absolute URL for the same banner (email clients require absolute image src). */
export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_URL = `${SITE_ORIGIN}${HOME_PAGE_INDEPENDENCE_DAY_BANNER_PATH}`;

export const HOME_PAGE_INDEPENDENCE_DAY_BANNER_ALT =
  "Celebration Sale — Flowers, Cakes & Gifts | BlossomPot" as const;

/**
 * First homepage banner image for marketing emails.
 * Matches the Independence Day slide prepended by `getHomeBanners()` on the storefront.
 */
export function getFirstHomePageBannerForEmail(): {
  src: string;
  alt: string;
  href: string;
} {
  return {
    src: HOME_PAGE_INDEPENDENCE_DAY_BANNER_URL,
    alt: HOME_PAGE_INDEPENDENCE_DAY_BANNER_ALT,
    href: `${SITE_ORIGIN}/products`,
  };
}
