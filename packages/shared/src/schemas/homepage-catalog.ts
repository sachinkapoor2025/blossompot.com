import { z } from "zod";

/** Same freshness window as the storefront catalog fetch. Not a global catalog TTL. */
export const HOMEPAGE_CATALOG_TTL_SECONDS = 45;

/**
 * Fixed homepage carousel identity. Labels and hrefs are part of the page, not catalog data.
 * Image and alt are the only fields filled from categories and products.
 */
export const HOMEPAGE_TILE_IDENTITY = [
  { slug: "flowers", label: "Flowers", href: "/flowers" },
  { slug: "flower-bouquets", label: "Bouquets", href: "/bouquets" },
  { slug: "birthday-gifts", label: "Birthday", href: "/birthday-gifts" },
  { slug: "anniversary-gifts", label: "Anniversary", href: "/anniversary-gifts" },
  { slug: "valentines-day-gifts", label: "Valentine's", href: "/valentines-day-gifts" },
  { slug: "mothers-day-gifts", label: "Mother's Day", href: "/mothers-day-gifts" },
  { slug: "wedding-gifts", label: "Wedding", href: "/wedding-gifts" },
  { slug: "cakes", label: "Cakes", href: "/cakes" },
  { slug: "gift-hampers", label: "Hampers", href: "/gift-hampers" },
  { slug: "plants", label: "Plants", href: "/plants" },
  { slug: "personalized-gifts", label: "Personalized", href: "/personalized-gifts" },
  { slug: "celebration-gifts", label: "Celebration", href: "/celebration-gifts" },
] as const;

const tileSchema = z.object({
  slug: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(120),
  image: z.string().min(1).max(800),
  alt: z.string().min(1).max(300),
});

export const homepageCatalogDataSchema = z
  .object({
    country: z.string().regex(/^[A-Z]{2}$/),
    giftCount: z.number().int().nonnegative().max(100_000),
    categoryCount: z.number().int().nonnegative().max(10_000),
    tiles: z.array(tileSchema).length(HOMEPAGE_TILE_IDENTITY.length),
  })
  .superRefine((data, ctx) => {
    data.tiles.forEach((tile, index) => {
      const expected = HOMEPAGE_TILE_IDENTITY[index];
      if (!expected) return;
      if (tile.slug !== expected.slug || tile.label !== expected.label || tile.href !== expected.href) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiles", index],
          message: "Homepage tile identity does not match the current carousel",
        });
      }
      if (!isSafeHomepageTileImage(tile.image)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tiles", index, "image"],
          message: "Homepage tile image must be an https URL or a same-origin path",
        });
      }
    });
  });

export type HomepageCatalogData = z.infer<typeof homepageCatalogDataSchema>;

export function isSafeHomepageTileImage(image: string): boolean {
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\") && !image.includes("..")) {
    return true;
  }
  try {
    return new URL(image).protocol === "https:";
  } catch {
    return false;
  }
}

/** True when a stored record is still inside the 45-second homepage window. */
export function isHomepageCatalogFresh(cachedAt: string, nowMs = Date.now()): boolean {
  const at = Date.parse(cachedAt);
  if (!Number.isFinite(at)) return false;
  const ageMs = nowMs - at;
  return ageMs >= -5_000 && ageMs < HOMEPAGE_CATALOG_TTL_SECONDS * 1000;
}
