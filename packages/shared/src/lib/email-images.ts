/**
 * Verified images for marketing email HTML only.
 *
 * Storefront product photos still go through `cdnUploadUrl()` and
 * `resolveProductImageUrl()`. This module is the allowlist those email
 * builders may use. Every URL here is a JPEG or PNG that loads without
 * credentials. Email clients such as Outlook do not render WebP, so
 * `.jpg` URLs that actually return `image/webp` are not allowed.
 *
 * Orange County hamper photos are served from the site origin. The same
 * paths on the product CDN return 403, so email HTML must not use them.
 *
 * Display height is the intrinsic ratio at the layout width, so Outlook
 * can reserve the right box while other clients keep `height:auto`.
 *
 * Previously saved campaign rows are not rewritten. In Admin → Compose,
 * reselect the template to copy the corrected HTML into that campaign.
 * Premium Gifts USA stores its own content fields and keeps those until
 * an admin updates the image fields or the template is created again.
 */

import { cdnUploadUrl } from "./image-url";

export const EMAIL_SITE = "https://www.blossompot.com";

export type EmailImageAsset = {
  url: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
};

function siteImage(path: string, intrinsicWidth: number, intrinsicHeight: number): EmailImageAsset {
  return {
    url: `${EMAIL_SITE}/${path.replace(/^\/+/, "")}`,
    intrinsicWidth,
    intrinsicHeight,
  };
}

function cdnImage(uploadsPath: string, intrinsicWidth: number, intrinsicHeight: number): EmailImageAsset {
  return {
    url: cdnUploadUrl(uploadsPath),
    intrinsicWidth,
    intrinsicHeight,
  };
}

/** Live assets. Intrinsic pixels were measured from the files themselves. */
export const EMAIL_IMAGES = {
  logo: siteImage("logo.png", 863, 615),
  facebook: siteImage("email-templates/icons/facebook.png", 80, 80),
  instagram: siteImage("email-templates/icons/instagram.png", 80, 80),
  birthdayBanner: siteImage("banners/home-banner-birthday.jpg", 1024, 512),
  birthdayExtra: siteImage("banners/home-banner-birthday-extra-special.jpg", 1024, 512),
  flowers: siteImage("banners/home-banner-flowers.jpg", 1024, 512),
  freshFlowers: siteImage("banners/home-banner-fresh-flowers.jpg", 1024, 512),
  gourmet: siteImage("banners/home-banner-gourmet.jpg", 1024, 512),
  gourmetGifts: siteImage("banners/home-banner-gourmet-gifts.jpg", 1024, 512),
  independenceHero: siteImage("banners/banner-independence-day-2026.png", 1024, 584),
  shopMoreHero: siteImage("email-templates/shop-more-save-more-hero-1046.png", 1024, 681),
  cakes: cdnImage("editorial/tile-cakes.jpg", 828, 643),
  anniversary: cdnImage("editorial/tile-anniversary.jpg", 1800, 1671),
  bouquets: cdnImage("editorial/tile-bouquets.jpg", 1920, 1357),
  hampersEditorial: cdnImage("editorial/tile-hampers.jpg", 2560, 1920),
  /** Same-origin JPEGs. The CDN copies of these files return 403. */
  hamperNutsLove: siteImage("uploads/orange-county/TFUSA003/TFUSA003.jpg", 1400, 1400),
  hamperDryFruit: siteImage("uploads/orange-county/TFUSRH2026-3/TFUSRH2026-3.jpg", 1500, 1500),
  hamperGrand: siteImage("uploads/orange-county/TFUSRH2026-8/TFUSRH2026-8b.jpg", 1024, 859),
  hamperFestive: siteImage("uploads/orange-county/TFUSRH2026-24/TFUSRH2026-24.jpg", 1500, 1500),
  hamperKaju: siteImage("uploads/orange-county/TFUSRH2026-38/TFUSRH2026-38.jpg", 1500, 1500),
  hamperThinkOfMe: siteImage("uploads/orange-county/TFCOM009/TFCOM009.jpg", 1400, 1400),
} as const satisfies Record<string, EmailImageAsset>;

export const EMAIL_IMAGE_ALLOWLIST: readonly string[] = Object.values(EMAIL_IMAGES).map((image) => image.url);

const EMAIL_IMAGE_BY_URL = new Map<string, EmailImageAsset>(
  Object.values(EMAIL_IMAGES).map((image) => [image.url, image])
);

export function emailDisplayHeight(image: EmailImageAsset, displayWidth: number): number {
  return Math.round((displayWidth * image.intrinsicHeight) / image.intrinsicWidth);
}

/** `imageUrl` + display height for a 260px campaign card, or another layout width. */
export function emailCardImage(
  image: EmailImageAsset,
  displayWidth = 260
): { imageUrl: string; imageHeight: number } {
  return {
    imageUrl: image.url,
    imageHeight: emailDisplayHeight(image, displayWidth),
  };
}

/**
 * Width, and height when the URL is on the allowlist.
 * Unknown URLs keep width only so a custom admin image is not stretched.
 */
export function emailImgAttributes(url: string, displayWidth: number): string {
  const image = EMAIL_IMAGE_BY_URL.get(url);
  if (!image) return `width="${displayWidth}"`;
  return `width="${displayWidth}" height="${emailDisplayHeight(image, displayWidth)}" border="0"`;
}
