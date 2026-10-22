import { cdnUploadUrl, DEFAULT_PRODUCT_CDN } from "@blossompot/shared";
import type { FlowerImage } from "./types";

const HOSTED_LICENSE = "Hosted on BlossomPot CDN";

export function flowerGuideCdnUrl(filename: string): string {
  return cdnUploadUrl(`flower-guide/${filename.replace(/^\/+/, "")}`);
}

export function hostedFlowerImage(
  filename: string,
  alt: string,
  attribution = "Wikimedia Commons",
  role: FlowerImage["role"] = "hero",
  width = 1600,
  height = 1067
): FlowerImage {
  return {
    src: flowerGuideCdnUrl(filename),
    alt,
    width,
    height,
    filename,
    attribution,
    license: HOSTED_LICENSE,
    role,
  };
}

/**
 * Legacy helper kept so published guides stay unchanged.
 * `photoId` is ignored at render time — images are served from CloudFront.
 */
export function unsplashImage(
  _photoId: string,
  alt: string,
  filename: string,
  photographer: string,
  role: FlowerImage["role"] = "hero",
  width = 1600,
  height = 1067
): FlowerImage {
  return hostedFlowerImage(filename, alt, `${photographer} / hosted by BlossomPot`, role, width, height);
}

const HUB_HERO_FILE = "flower-guide/flower-guide-hero-mixed-blooms.jpg";

/** This file is on the production media host. The dev host returns Access Denied for it. */
export const HUB_HERO = {
  ...hostedFlowerImage(
    "flower-guide-hero-mixed-blooms.jpg",
    "Mixed garden flowers in soft daylight",
    "Wikimedia Commons"
  ),
  src: `${DEFAULT_PRODUCT_CDN}/uploads/${HUB_HERO_FILE}`,
};
