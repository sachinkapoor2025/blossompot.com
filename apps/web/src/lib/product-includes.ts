import type { Product } from "@blossompot/shared";
import { looksLikeHtml, stripHtml } from "./html-text";

type ProductLike = Pick<Product, "name" | "description" | "categorySlug" | "tags"> & {
  slug?: string;
  additionalCategorySlugs?: string[];
};

function hasChocolateSignal(text: string): boolean {
  return /chocolate|ferrero|hershey|lindor|lindt|kitkat|dairy\s*milk|snicker/i.test(text);
}

const EATABLE_SIGNAL =
  /chocolate|ferrero|hershey|lindor|lindt|kitkat|dairy\s*milk|snicker|kaju\s*katli|dry\s*fruit|mithai|sweet|eatable|edible|cookie|biscuit|candy|toffee/i;

/**
 * True when the product includes chocolates, sweets, dry fruits, or other eatables.
 * Used to show food-care Instructions on the product page.
 */
export function productHasEatables(product: ProductLike): boolean {
  const blob = [product.name, product.description, product.slug ?? "", ...(product.tags ?? [])].join(" ");
  const plain = looksLikeHtml(blob) ? stripHtml(blob) : blob;
  if (EATABLE_SIGNAL.test(plain)) return true;
  return Boolean(parseChocolateInclude(plain));
}

/** @deprecated use productHasEatables */
export const productHasEatablesWithRakhi = productHasEatables;

/** Parse explicit chocolate include lines from name/description. */
export function parseChocolateInclude(text: string): string | null {
  const patterns: { re: RegExp; label: (n: string) => string }[] = [
    {
      re: /includes\s+(\d+)\s+ferrero\s*rocher\s+chocolates?/i,
      label: (n) => `${n} Ferrero Rocher Chocolates`,
    },
    {
      re: /includes\s+(\d+)\s+(?:small\s+)?hershey'?s?\s+chocolates?/i,
      label: (n) => `${n} small Hershey's chocolates`,
    },
    {
      re: /includes\s+(\d+)\s+lind(?:or|t(?:\s+lindor)?)\s+chocolates?/i,
      label: (n) => `${n} Lindor Chocolates`,
    },
    {
      re: /includes\s+\d+\s+assorted\s+chocolates?/i,
      label: () => "Assorted Chocolates",
    },
    {
      re: /includes\s+\d+\s+chocolates?/i,
      label: () => "Assorted Chocolates",
    },
    {
      re: /with\s+(\d+)\s+(?:small\s+)?hershey'?s?\s+chocolates?/i,
      label: (n) => `${n} small Hershey's chocolates`,
    },
    {
      re: /with\s+(\d+)\s+ferrero\s*rocher\s+chocolates?/i,
      label: (n) => `${n} Ferrero Rocher Chocolates`,
    },
    {
      re: /with\s+(\d+)\s+lind(?:or|t)\s+chocolates?/i,
      label: (n) => `${n} Lindor Chocolates`,
    },
    {
      re: /with\s+\d+\s+assorted\s+chocolates?/i,
      label: () => "Assorted Chocolates",
    },
    {
      re: /with\s+\d+\s+chocolates?/i,
      label: () => "Assorted Chocolates",
    },
  ];

  for (const { re, label } of patterns) {
    const m = text.match(re);
    if (m) return label(m[1] ?? "");
  }

  if (!hasChocolateSignal(text)) return null;
  if (/ferrero/i.test(text)) return "3 Ferrero Rocher Chocolates";
  if (/hershey/i.test(text)) return "2 small Hershey's chocolates";
  if (/lindor|lindt/i.test(text)) return "5 Lindor Chocolates";
  return "Assorted Chocolates";
}

function shippingIncludeLines(): string[] {
  return [
    "Ships from our California warehouse",
    "No delays due to global affairs",
    "Best quality at the most competitive rates",
  ];
}

function fromHtmlList(description: string): string[] {
  return [...description.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripHtml(m[1]!))
    .filter(Boolean);
}

function isMarketingHamperLine(line: string): boolean {
  return /clear what'?s-included|domestic usa shipping|festive packaging|secure checkout|no international customs|stripe|razorpay/i.test(
    line
  );
}

/** Normalize a single include bullet; drop ritual Roli/Chawal lines. */
export function normalizeHamperIncludeLine(line: string): string[] {
  let t = line.replace(/\.$/, "").replace(/\s+/g, " ").trim();
  if (!t || isMarketingHamperLine(t)) return [];
  if (/\broli\b|\bchawal\b|\btikka\b|\brakhi\b/i.test(t)) return [];

  t = t
    .replace(/\b(\d+)\s*g\s*kk\b/gi, "$1 g Kaju Katli")
    .replace(/\b(\d+)\s*gms?\s*kk\b/gi, "$1 g Kaju Katli")
    .replace(/\bkk\b/gi, "Kaju Katli")
    .replace(/\bKaju Katli Katli\b/g, "Kaju Katli");

  return [t];
}

function hamperIncludeLines(description: string): string[] {
  const afterHeading = description.split(/What'?s included in this hamper:?/i)[1];
  const section = afterHeading
    ? afterHeading.split(/Why sisters choose|Looking for more options|SKU:/i)[0] ?? afterHeading
    : description;
  return fromHtmlList(section).flatMap(normalizeHamperIncludeLine);
}

function giftDefaultLines(categorySlug: string, name: string): string[] {
  switch (categorySlug) {
    case "flowers":
    case "flower-bouquets":
      return [
        name.trim() || "Premium flower arrangement",
        "Florist-style presentation",
        "Care card with freshness tips",
      ];
    case "cakes":
      return [
        name.trim() || "Celebration cake",
        "Ready-to-serve presentation",
        "Occasion message option at checkout",
      ];
    case "plants":
      return ["Live plant as shown", "Basic care instructions", "Gift-ready packaging"];
    case "gift-hampers":
      return ["Curated gift selection", "Premium packaging", "Gift message option"];
    case "personalized-gifts":
      return ["Personalized gift item", "Custom message option", "Gift-ready packaging"];
    default:
      return [
        name.trim() || "Gift item as shown",
        "Premium packaging",
        "Gift message option at checkout",
      ];
  }
}

/** Customer-facing "What's included" lines — never inject Rakhi/Roli/Chawal defaults. */
export function getProductIncludes(product: ProductLike): string[] {
  const { description, name, categorySlug, tags } = product;

  if (categorySlug === "gift-hampers") {
    const hamper = hamperIncludeLines(description);
    if (hamper.length > 0) return [...hamper, ...shippingIncludeLines()];
  }

  if (looksLikeHtml(description) && /<li[\s>]/i.test(description)) {
    const fromHtml = fromHtmlList(description).flatMap(normalizeHamperIncludeLine);
    if (fromHtml.length > 0) return [...fromHtml, ...shippingIncludeLines()];
  }

  const blob = [name, description, ...(tags ?? [])].join(" ");
  const plain = looksLikeHtml(blob) ? stripHtml(blob) : blob;
  const items = [...giftDefaultLines(categorySlug, name)];
  const chocolate = parseChocolateInclude(plain);
  if (chocolate) items.push(chocolate);
  return [...items, ...shippingIncludeLines()];
}
