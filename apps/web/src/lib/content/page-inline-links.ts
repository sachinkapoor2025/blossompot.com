import { categoryHref } from "@/lib/category-urls";

/** Homepage SEO inline links for BlossomPot gifting copy. */
export const homepageInlineLinks = [
  { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  { phrase: "same-day", href: categoryHref("same-day-gifts") },
] as const;

export const categoryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  flowers: [
    { phrase: "flower bouquets", href: categoryHref("flower-bouquets") },
    { phrase: "anniversary gifts", href: categoryHref("anniversary-gifts") },
  ],
  "flower-bouquets": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "Valentine's Day", href: categoryHref("valentines-day-gifts") },
  ],
  cakes: [
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  ],
  "birthday-gifts": [
    { phrase: "cakes", href: categoryHref("cakes") },
    { phrase: "flowers", href: categoryHref("flowers") },
  ],
  "anniversary-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "gift hampers", href: categoryHref("gift-hampers") },
  ],
  "valentines-day-gifts": [{ phrase: "flower bouquets", href: categoryHref("flower-bouquets") }],
  "mothers-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "plants", href: categoryHref("plants") },
  ],
  "wedding-gifts": [{ phrase: "gift hampers", href: categoryHref("gift-hampers") }],
  "personalized-gifts": [{ phrase: "gift hampers", href: categoryHref("gift-hampers") }],
  "gift-hampers": [
    { phrase: "birthday gifts", href: categoryHref("birthday-gifts") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  plants: [{ phrase: "Mother's Day", href: categoryHref("mothers-day-gifts") }],
  "same-day-gifts": [
    { phrase: "flowers", href: categoryHref("flowers") },
    { phrase: "cakes", href: categoryHref("cakes") },
  ],
  "celebration-gifts": [{ phrase: "gift hampers", href: categoryHref("gift-hampers") }],
};

export const cityPageInlineLinks = [
  { phrase: "flowers", href: categoryHref("flowers") },
  { phrase: "cakes", href: categoryHref("cakes") },
] as const;
