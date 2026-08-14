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
 * True when the product pairs Rakhi with chocolates, sweets, dry fruits, or other eatables.
 * Used to show food-care Instructions on the product page.
 */
export function productHasEatablesWithRakhi(product: ProductLike): boolean {
  const categories = [product.categorySlug, ...(product.additionalCategorySlugs ?? [])];
  if (categories.some((c) => c === "rakhi-combo" || c === "rakhi-hampers")) return true;

  const blob = [product.name, product.description, product.slug ?? "", ...(product.tags ?? [])].join(" ");
  const plain = looksLikeHtml(blob) ? stripHtml(blob) : blob;
  if (EATABLE_SIGNAL.test(plain)) return true;
  if (product.slug === "bhai-bhabhi-lumba-rakhi-set") return true;
  return Boolean(parseChocolateInclude(plain));
}

/** Parse explicit "Includes N … chocolates" or "with N Brand" from name/description. */
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

  // Brand defaults when qty is not stated (standard BlossomPot pack sizes).
  if (/ferrero/i.test(text)) return "3 Ferrero Rocher Chocolates";
  if (/hershey/i.test(text)) return "2 small Hershey's chocolates";
  if (/lindor|lindt/i.test(text)) return "5 Lindor Chocolates";
  return "Assorted Chocolates";
}

function rakhiLines(categorySlug: string): string[] {
  switch (categorySlug) {
    case "bhaiya-bhabhi-rakhi":
      return ["1 Bhaiya Rakhi", "1 Lumba Rakhi for Bhabhi"];
    case "lumba-rakhi":
      return ["1 Designer Lumba Rakhi"];
    case "kids-rakhi":
      return ["1 Kids Designer Rakhi"];
    case "rakhi-combo":
      return ["1 Designer Rakhi"];
    case "single-rakhi":
      return ["1 Designer Rakhi"];
    default:
      return ["1 Designer Rakhi"];
  }
}

function ritualPackets(): string[] {
  return ["Small packet of Roli", "Small packet of Chawal (Rice)"];
}

/** Shown on every product's What's included checklist. */
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

/** Marketing / benefit bullets that must not appear in hamper "What's included". */
function isMarketingHamperLine(line: string): boolean {
  return /clear what'?s-included|domestic usa shipping|festive packaging|secure checkout|no international customs|stripe|razorpay/i.test(
    line
  );
}

/** Expand abbreviations and split combined Roli/Chawal lines into separate checklist items. */
export function normalizeHamperIncludeLine(line: string): string[] {
  let t = line.replace(/\.$/, "").replace(/\s+/g, " ").trim();
  if (!t || isMarketingHamperLine(t)) return [];

  t = t
    .replace(/\b(\d+)\s*g\s*kk\b/gi, "$1 g Kaju Katli")
    .replace(/\b(\d+)\s*gms?\s*kk\b/gi, "$1 g Kaju Katli")
    .replace(/\bkk\b/gi, "Kaju Katli")
    .replace(/\bKaju Katli Katli\b/g, "Kaju Katli");

  if (/^complimentary\s+roli\s*(?:&|and|-)?\s*chawal\b/i.test(t)) {
    return ["Complimentary Roli", "Complimentary Chawal (Rice)"];
  }

  if (/^roli\s*(?:&|and|-)?\s*chawal\s+dibbi$/i.test(t)) {
    return ["Small Roli box", "Small Chawal box"];
  }
  if (/^roli\s+dibbi$/i.test(t)) return ["Small Roli box"];
  if (/^chawal\s+dibbi$/i.test(t)) return ["Small Chawal box"];
  t = t
    .replace(/\broli\s+chawal\s+dibbi\b/gi, "Small Roli box & Small Chawal box")
    .replace(/\broli\s+dibbi\b/gi, "Small Roli box")
    .replace(/\bchawal\s+dibbi\b/gi, "Small Chawal box");

  // Combined or already-split tikka lines → Roli + Chawal + Designer tikka set
  // Skip lone "Chawal … Tikka" when a paired "Roli … Tikka" line already expands.
  if (/^chawal\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t)) {
    return [];
  }
  if (
    /^roli\s*(?:&|and|-)?\s*chawal\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t) ||
    /^roli\s+(?:designer\s+)?tikka(?:\s+set)?$/i.test(t)
  ) {
    return ["Roli", "Chawal", "Designer tikka set"];
  }

  if (/^roli\s*(?:&|and|-)?\s*chawal$/i.test(t)) {
    return ["Roli", "Chawal (Rice)"];
  }

  const combined = t.match(/^roli\s*(?:&|and|-)?\s*chawal\s+(.+)$/i);
  if (combined?.[1]) {
    const rest = combined[1].trim();
    if (/(?:designer\s+)?tikka/i.test(rest)) {
      return ["Roli", "Chawal", "Designer tikka set"];
    }
    return [`Roli ${rest}`, `Chawal ${rest}`];
  }

  return [t];
}

/** Prefer the "What's included in this hamper" list; ignore "Why sisters choose…" bullets. */
function hamperIncludeLines(description: string): string[] {
  const afterHeading = description.split(/What'?s included in this hamper:?/i)[1];
  const section = afterHeading
    ? afterHeading.split(/Why sisters choose|Looking for more options|SKU:/i)[0] ?? afterHeading
    : description;

  const raw = fromHtmlList(section);
  return raw.flatMap(normalizeHamperIncludeLine);
}

function isRakhiCategory(categorySlug: string): boolean {
  return (
    categorySlug === "single-rakhi" ||
    categorySlug === "2-set-rakhi" ||
    categorySlug === "3-set-rakhi" ||
    categorySlug === "4-set-rakhi" ||
    categorySlug === "rakhi-combo" ||
    categorySlug === "kids-rakhi" ||
    categorySlug === "bhaiya-bhabhi-rakhi" ||
    categorySlug === "lumba-rakhi" ||
    categorySlug === "rakhi-hampers" ||
    /rakhi/i.test(categorySlug)
  );
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

/**
 * Customer-facing "What's included" lines for product detail pages.
 * - Prefer explicit HTML list / per-product description bullets
 * - Rakhi categories keep ritual defaults
 * - Flower/cake/gift categories never inherit Rakhi/Roli/Chawal defaults
 */
export function getProductIncludes(product: ProductLike): string[] {
  const { description, name, categorySlug, tags } = product;

  if (categorySlug === "rakhi-hampers") {
    return [...hamperIncludeLines(description), ...shippingIncludeLines()];
  }

  if (looksLikeHtml(description) && /<li[\s>]/i.test(description)) {
    const fromHtml = fromHtmlList(description).flatMap(normalizeHamperIncludeLine);
    if (fromHtml.length > 0) return [...fromHtml, ...shippingIncludeLines()];
  }

  if (product.slug === "om-pearl-single-rakhi-combo") {
    return [
      "1 Om Rakhi for Brother",
      "1 Pearl Single Rakhi",
      ...ritualPackets(),
      ...shippingIncludeLines(),
    ];
  }

  const blob = [name, description, ...(tags ?? [])].join(" ");
  const plain = looksLikeHtml(blob) ? stripHtml(blob) : blob;

  if (!isRakhiCategory(categorySlug)) {
    const items = [...giftDefaultLines(categorySlug, name)];
    const chocolate = parseChocolateInclude(plain);
    if (chocolate) items.push(chocolate);
    return [...items, ...shippingIncludeLines()];
  }

  const items = [...rakhiLines(categorySlug), ...ritualPackets()];

  if (product.slug === "bhai-bhabhi-lumba-rakhi-set") {
    items.push("2 small Hershey's chocolates");
  } else {
    const chocolate = parseChocolateInclude(plain);
    if (chocolate) items.push(chocolate);
  }

  return [...items, ...shippingIncludeLines()];
}
