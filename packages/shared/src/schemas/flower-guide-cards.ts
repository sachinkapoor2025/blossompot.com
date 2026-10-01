import { z } from "zod";
import { isSafeHomepageTileImage } from "./homepage-catalog";

/** Same 45-second window as the storefront catalog fetch and the homepage derived cache. */
export const FLOWER_GUIDE_CARDS_TTL_SECONDS = 45;

export const FLOWER_GUIDE_SLUGS = ["usa", "uk", "canada", "australia", "uae"] as const;
export type FlowerGuideSlug = (typeof FLOWER_GUIDE_SLUGS)[number];

export const FLOWER_GUIDE_ISO: Record<FlowerGuideSlug, string> = {
  usa: "US",
  uk: "GB",
  canada: "CA",
  australia: "AU",
  uae: "AE",
};

/** USA keeps up to 24 selected cards. Every other guide keeps up to 10. */
export function flowerGuideCardLimit(slug: FlowerGuideSlug): number {
  return slug === "usa" ? 24 : 10;
}

const flowerGuideCardSchema = z
  .object({
    slug: z.string().min(1).max(200),
    name: z.string().min(1).max(300),
    price: z.number().positive().max(1_000_000),
    compareAtPrice: z.number().positive().max(1_000_000).optional(),
    currency: z.enum(["USD", "INR"]),
    categorySlug: z.string().min(1).max(80),
    images: z.array(z.string().min(1).max(800)).max(12),
    inventory: z.number().int().min(0).max(1_000_000),
    unitsSold: z.number().int().min(0).max(10_000_000).optional(),
    published: z.literal(true),
  })
  .strict();

export const flowerGuideCardsSchema = z
  .object({
    country: z.string().regex(/^[A-Z]{2}$/),
    slug: z.enum(FLOWER_GUIDE_SLUGS),
    products: z.array(flowerGuideCardSchema).min(1).max(24),
  })
  .superRefine((data, ctx) => {
    if (FLOWER_GUIDE_ISO[data.slug] !== data.country) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["country"],
        message: "Flower guide country does not match the guide",
      });
    }
    if (data.products.length > flowerGuideCardLimit(data.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["products"],
        message: "Flower guide card count exceeds the guide limit",
      });
    }
    data.products.forEach((product, index) => {
      product.images.forEach((image, imageIndex) => {
        if (!isSafeHomepageTileImage(image)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", index, "images", imageIndex],
            message: "Flower guide image must be an https URL or a same-origin path",
          });
        }
      });
    });
  });

export type FlowerGuideCard = z.infer<typeof flowerGuideCardSchema>;
export type FlowerGuideCardsData = z.infer<typeof flowerGuideCardsSchema>;

/** True when a stored record is still inside the 45-second flower-guide window. */
export function isFlowerGuideCardsFresh(cachedAt: string, nowMs = Date.now()): boolean {
  const at = Date.parse(cachedAt);
  if (!Number.isFinite(at)) return false;
  const ageMs = nowMs - at;
  return ageMs >= -5_000 && ageMs < FLOWER_GUIDE_CARDS_TTL_SECONDS * 1000;
}
