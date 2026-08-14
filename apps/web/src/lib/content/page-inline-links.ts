import { categoryHref } from "@/lib/category-urls";

/** Homepage: keep "send rakhi to USA" / "buy rakhi online USA from India" as plain text (no category deep-links). */
export const homepageInlineLinks = [
  { phrase: "rakhi gift hamper", href: categoryHref("rakhi-hampers") },
] as const;

export const categoryPageInlineLinks: Record<string, readonly { phrase: string; href: string }[]> = {
  "single-rakhi": [{ phrase: "buy designer rakhi online usa", href: categoryHref("lumba-rakhi") }],
  "bhaiya-bhabhi-rakhi": [{ phrase: "send rakhi to USA", href: "/" }],
  "kids-rakhi": [{ phrase: "sending rakhi to USA from India", href: "/" }],
  "lumba-rakhi": [{ phrase: "buy rakhi online USA", href: "/" }],
  "rakhi-combo": [{ phrase: "rakhi gift hamper", href: categoryHref("rakhi-hampers") }],
  "rakhi-hampers": [
    { phrase: "Rakhi Combos", href: categoryHref("rakhi-combo") },
    { phrase: "Single Rakhi", href: categoryHref("single-rakhi") },
    { phrase: "Kids Rakhi", href: categoryHref("kids-rakhi") },
  ],
  "2-set-rakhi": [
    { phrase: "Set of 3 Rakhis", href: categoryHref("3-set-rakhi") },
    { phrase: "Set of 4 Rakhis", href: categoryHref("4-set-rakhi") },
  ],
  "3-set-rakhi": [
    { phrase: "Set of 2 Rakhis", href: categoryHref("2-set-rakhi") },
    { phrase: "Set of 4 Rakhis", href: categoryHref("4-set-rakhi") },
  ],
  "4-set-rakhi": [
    { phrase: "Set of 2 Rakhis", href: categoryHref("2-set-rakhi") },
    { phrase: "Set of 3 Rakhis", href: categoryHref("3-set-rakhi") },
  ],
};

export const rakshaBandhanInlineLinks = [
  { phrase: "sending a Rakhi to USA", href: "/shop" },
] as const;
