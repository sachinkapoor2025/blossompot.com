import type { FlowerImage } from "./types";

/** Unsplash License: free to use, including commercially. Attribution stored for transparency. */
const UNSPLASH = "Unsplash License";

export function unsplashImage(
  photoId: string,
  alt: string,
  filename: string,
  photographer: string,
  role: FlowerImage["role"] = "hero",
  width = 1600,
  height = 1067
): FlowerImage {
  return {
    src: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=75`,
    alt,
    width,
    height,
    filename,
    attribution: `${photographer} / Unsplash`,
    license: UNSPLASH,
    role,
  };
}

export const HUB_HERO = unsplashImage(
  "photo-1490750967868-88aa4486c946",
  "Mixed garden flowers in soft daylight",
  "flower-guide-hero-mixed-blooms.jpg",
  "Jennifer Loomis"
);
