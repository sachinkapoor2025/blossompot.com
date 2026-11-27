/**
 * Menu categories such as Birthday and Christmas have no products of their own.
 * Flowers, flower bouquets, and cakes are matched onto those pages by name so
 * each menu category lists similar gifts.
 */

const STOCKED_MENU_SOURCES = new Set(["flowers", "flower-bouquets", "cakes"]);

export const MENU_CATEGORY_FILL_SLUGS = [
  "birthday-gifts",
  "anniversary-gifts",
  "christmas",
  "new-year",
  "valentines-day-gifts",
  "gift-hampers",
] as const;

export type MenuCategoryFillSlug = (typeof MENU_CATEGORY_FILL_SLUGS)[number];

export function isMenuCategoryFillSlug(slug: string): slug is MenuCategoryFillSlug {
  return (MENU_CATEGORY_FILL_SLUGS as readonly string[]).includes(slug);
}

type MenuProductText = {
  name?: string | null;
  description?: string | null;
  tags?: readonly string[] | null;
  categorySlug?: string | null;
  additionalCategorySlugs?: readonly string[] | null;
};

function menuText(product: MenuProductText): string {
  return [product.name, product.description, ...(product.tags ?? [])]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

const OTHER_HOLIDAY =
  /\b(anniversary|valentines?|easter|christmas|diwali|rakhi|sympathy|condolence|funeral|thank you|congrats)\b/;
const BIRTHDAY_SIGNAL = /\b(birthday|balloons?|best wishes)\b/;
const PARTY_CAKE =
  /\b(funfetti|hello kitty|mickey|minnie|frozen theme|spider man|spiderman|superman|rainbow cakes|photo cake)\b/;
const CHEERFUL_BLOOM =
  /\b(be happy|brimming with joy|smiles|sunny smiles|bright and sunny|bright n sunny|rainbow|celebration|how sweet|simply sweet|sweeter than ever|pretty please|pink and pretty|colors abound|bursting yellow)\b/;
const NOT_ANNIVERSARY =
  /\b(birthday|balloons?|easter|valentines?|dad|father|hello kitty|mickey|minnie|frozen|spider|superman|thank you|congrats|hocus|funeral|sympathy)\b/;
const ROMANCE =
  /\b(anniversary|love|romantic|romance|heart|forever|eternal|eternally|devotion|sweetheart|roses?)\b/;
const NOT_VALENTINE =
  /\b(birthday|easter|anniversary|dad|father|hello kitty|mickey|minnie|frozen|spider|superman|thank you|congrats|hocus)\b/;
const VALENTINE = /\b(valentines?|heart|love|romantic|romance|sweetheart|red roses?)\b/;
const NOT_CHRISTMAS =
  /\b(birthday|valentines?|anniversary|easter|dad|hello kitty|mickey|minnie|frozen|spider|superman)\b/;
const CHRISTMAS =
  /\b(christmas|festive|eggnog|cardinal|holly|wreath|noel|pine|poinsettia|white roses?|red roses?|red and white|red and gold)\b/;
const NOT_NEW_YEAR = /\b(birthday|valentines?|easter|dad|hello kitty|mickey)\b/;
const NEW_YEAR =
  /\b(new year|champagnes?|sparkling|sparkles?|glitter|celebrations?|fizz|cheers|gold|golden|midnight|glorious day)\b/;
const HAMPER_GIFT = /\b(hampers?|gift boxes?|gift sets?|combos?|diyas?|truffles?|cabernet|chardonnay)\b/;
const HAMPER_PAIRING =
  /\b((with|and|n)\s+(red\s+|white\s+)?wines?|wines?\s+(and|n|with)|chocolates?\s+(and|n|with)|(and|with|n)\s+chocolates?)\b/;

function fitsBirthday(text: string, categorySlug: string): boolean {
  if (has(text, OTHER_HOLIDAY)) return false;
  if (has(text, BIRTHDAY_SIGNAL)) return true;
  if (categorySlug === "cakes" && has(text, PARTY_CAKE)) return true;
  return categorySlug !== "cakes" && has(text, CHEERFUL_BLOOM);
}

function fitsAnniversary(text: string): boolean {
  if (has(text, NOT_ANNIVERSARY)) return false;
  return has(text, ROMANCE);
}

function fitsValentine(text: string): boolean {
  if (has(text, NOT_VALENTINE)) return false;
  return has(text, VALENTINE);
}

function fitsChristmas(text: string): boolean {
  if (has(text, NOT_CHRISTMAS)) return false;
  return has(text, CHRISTMAS);
}

function fitsNewYear(text: string): boolean {
  if (has(text, NOT_NEW_YEAR)) return false;
  return has(text, NEW_YEAR);
}

function fitsHamper(text: string): boolean {
  return has(text, HAMPER_GIFT) || has(text, HAMPER_PAIRING);
}

function hasExplicitMenuCategory(product: MenuProductText): boolean {
  return (product.additionalCategorySlugs ?? []).some((slug) => isMenuCategoryFillSlug(slug));
}

/**
 * True when a flower, bouquet, or cake belongs on an empty menu category.
 * A product already tagged onto one of these menus stays on that assignment.
 */
export function productFitsMenuCategory(product: MenuProductText, categorySlug: string): boolean {
  const category = categorySlug.trim();
  if (!isMenuCategoryFillSlug(category)) return false;
  if (hasExplicitMenuCategory(product)) return false;
  const primary = (product.categorySlug ?? "").trim();
  if (!STOCKED_MENU_SOURCES.has(primary)) return false;
  const text = menuText(product);
  switch (category) {
    case "birthday-gifts":
      return fitsBirthday(text, primary);
    case "anniversary-gifts":
      return fitsAnniversary(text);
    case "valentines-day-gifts":
      return fitsValentine(text);
    case "christmas":
      return fitsChristmas(text);
    case "new-year":
      return fitsNewYear(text);
    case "gift-hampers":
      return fitsHamper(text);
    default:
      return false;
  }
}
