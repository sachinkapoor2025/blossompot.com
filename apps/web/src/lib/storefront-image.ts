/**
 * Display sizes for the Next.js image optimizer (`/_next/image`).
 * Widths are limited to Next's default `imageSizes` and `deviceSizes`.
 * The catalog URL is only the `url` parameter — no resize query is added to the CDN or upload path.
 */
const OPTIMIZER_WIDTHS = [128, 256, 384, 640, 828, 1080, 1200] as const;

export type StorefrontImageWidth = (typeof OPTIMIZER_WIDTHS)[number];

export const LISTING_CARD_SIZES = "(max-width: 639px) 45vw, (max-width: 1024px) 30vw, 240px";
export const COMBO_HALF_SIZES = "(max-width: 639px) 22vw, 120px";
export const GALLERY_MAIN_SIZES = "(max-width: 768px) 92vw, 560px";
export const GALLERY_THUMB_SIZES = "72px";

/** Width used to tell a real photo from a tiny vendor thumbnail without downloading the original. */
export const STOREFRONT_PROBE_WIDTH: StorefrontImageWidth = 384;

const CARD_WIDTHS: StorefrontImageWidth[] = [384, 640];
const COMBO_HALF_WIDTHS: StorefrontImageWidth[] = [256, 384];
const GALLERY_WIDTHS: StorefrontImageWidth[] = [640, 828, 1080];
const THUMB_WIDTHS: StorefrontImageWidth[] = [128, 256];

export type StorefrontImageAttrs = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

function canOptimize(src: string): boolean {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return false;
  const path = src.split("?")[0]?.split("#")[0]?.toLowerCase() ?? src;
  if (path.endsWith(".svg")) return false;
  return src.startsWith("/") || src.startsWith("https://") || src.startsWith("http://");
}

/** Optimizer URL for one width. Unsupported sources keep their original URL. */
export function optimizedImageUrl(src: string, width: StorefrontImageWidth): string {
  if (!canOptimize(src) || !OPTIMIZER_WIDTHS.includes(width)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

function sources(src: string, widths: readonly StorefrontImageWidth[], sizes: string): StorefrontImageAttrs {
  const optimized = widths.filter((width) => optimizedImageUrl(src, width) !== src);
  if (optimized.length === 0) return { src };
  const largest = optimized[optimized.length - 1];
  return {
    src: optimizedImageUrl(src, largest),
    srcSet: optimized.map((width) => `${optimizedImageUrl(src, width)} ${width}w`).join(", "),
    sizes,
  };
}

export function listingCardImage(src: string): StorefrontImageAttrs {
  return sources(src, CARD_WIDTHS, LISTING_CARD_SIZES);
}

export function comboHalfImage(src: string): StorefrontImageAttrs {
  return sources(src, COMBO_HALF_WIDTHS, COMBO_HALF_SIZES);
}

export function galleryMainImage(src: string): StorefrontImageAttrs {
  return sources(src, GALLERY_WIDTHS, GALLERY_MAIN_SIZES);
}

export function galleryThumbImage(src: string): StorefrontImageAttrs {
  return sources(src, THUMB_WIDTHS, GALLERY_THUMB_SIZES);
}

export function galleryZoomImage(src: string): string {
  return optimizedImageUrl(src, 1200);
}

/** Use after an optimizer response fails. Returns true when the element was pointed at the original. */
export function fallbackImageElement(img: HTMLImageElement): boolean {
  const original = img.dataset.original;
  if (!original || img.dataset.fellBack === "1") return false;
  if (!img.currentSrc.includes("/_next/image") && !img.src.includes("/_next/image")) return false;
  img.dataset.fellBack = "1";
  img.srcset = "";
  img.src = original;
  return true;
}
