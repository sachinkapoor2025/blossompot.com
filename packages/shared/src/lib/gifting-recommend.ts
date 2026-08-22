import type { GiftHistoryEntry, GiftRecipient, GiftRecommendation, GiftingGiftCategory } from "../schemas/gifting";

export interface RecommendableProduct {
  slug: string;
  name: string;
  price: number;
  currency?: string;
  categorySlug?: string;
  tags?: string[];
  images?: string[];
  published?: boolean;
  inventory?: number;
  unitsSold?: number;
  occasion?: string;
  recipient?: string;
  sameDayAvailable?: boolean;
  featured?: boolean;
  ratingAggregate?: {
    ratingValue?: number;
    reviewCount?: number;
    average?: number;
    count?: number;
  };
}

export interface RecommendationContext {
  recipient?: GiftRecipient;
  occasionType?: string;
  occasionTitle?: string;
  preferredCategory?: GiftingGiftCategory | "any";
  history?: GiftHistoryEntry[];
  emergency?: boolean;
  avoidSlugs?: string[];
  limit?: number;
}

const CATEGORY_HINTS: Record<string, string[]> = {
  flowers: ["flower", "bouquet", "rose", "lily", "orchid", "tulip", "carnation"],
  cake: ["cake", "bakery", "pastry"],
  chocolates: ["chocolate", "truffle", "cocoa", "dry-fruit", "dryfruit"],
  combo: ["combo", "hamper", "box", "gift-set", "giftset"],
};

function textBlob(product: RecommendableProduct): string {
  return [product.name, product.categorySlug, product.occasion, product.recipient, ...(product.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function budgetRange(recipient?: GiftRecipient): { min: number; max: number } | null {
  const min = recipient?.preferences?.budgetMin;
  const max = recipient?.preferences?.budgetMax;
  if (min == null && max == null) return null;
  return { min: min ?? 0, max: max ?? Number.POSITIVE_INFINITY };
}

function categoryFromAction(action?: string): GiftingGiftCategory | "any" {
  if (action === "surprise_me" || action === "surprise") return "surprise";
  if (action === "flowers" || action === "cake" || action === "chocolates" || action === "combo") {
    return action;
  }
  return "any";
}

export function scoreGiftProduct(
  product: RecommendableProduct,
  context: RecommendationContext
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 8;

  if (product.published === false) return { score: -1000, reasons: ["unpublished"] };
  if ((product.inventory ?? 1) <= 0) return { score: -1000, reasons: ["out of stock"] };
  if (context.avoidSlugs?.includes(product.slug)) {
    score -= 40;
    reasons.push("Recently sent — prefer something new");
  }

  const blob = textBlob(product);
  const prefs = context.recipient?.preferences;
  const category = context.preferredCategory ?? prefs?.preferredGiftCategory ?? "any";

  if (category && category !== "any" && category !== "surprise") {
    const hints = CATEGORY_HINTS[category] ?? [category];
    if (hints.some((h) => blob.includes(h) || product.categorySlug?.includes(h))) {
      score += 28;
      reasons.push(`Matches ${category} preference`);
    } else {
      score -= 12;
    }
  }

  if (prefs?.favouriteFlower) {
    const flower = prefs.favouriteFlower.toLowerCase();
    if (blob.includes(flower)) {
      score += 24;
      reasons.push(`Includes favourite flower: ${prefs.favouriteFlower}`);
    }
  }

  if (prefs?.favouriteColour) {
    const colour = prefs.favouriteColour.toLowerCase();
    if (blob.includes(colour)) {
      score += 14;
      reasons.push(`Matches favourite colour: ${prefs.favouriteColour}`);
    }
  }

  if (prefs?.favouriteCakeFlavour) {
    const flavour = prefs.favouriteCakeFlavour.toLowerCase();
    if (blob.includes(flavour) || blob.includes("cake")) {
      score += blob.includes(flavour) ? 18 : 4;
      if (blob.includes(flavour)) reasons.push(`Matches favourite flavour: ${prefs.favouriteCakeFlavour}`);
    }
  }

  const budget = budgetRange(context.recipient);
  if (budget) {
    if (product.price >= budget.min && product.price <= budget.max) {
      score += 20;
      reasons.push("Within gift budget");
    } else if (product.price < budget.min) {
      score += 4;
    } else {
      score -= 18;
      reasons.push("Above preferred budget");
    }
  }

  if (context.occasionType) {
    const occ = context.occasionType.replace(/_/g, " ");
    if (blob.includes(occ) || product.occasion?.toLowerCase().includes(occ)) {
      score += 16;
      reasons.push("Suited to this occasion");
    }
    if (context.occasionType === "anniversary" && (blob.includes("rose") || blob.includes("romantic"))) {
      score += 8;
    }
    if (context.occasionType === "birthday" && (blob.includes("birthday") || blob.includes("balloon"))) {
      score += 8;
    }
  }

  const relationship = context.recipient?.relationship;
  if (relationship) {
    if (product.recipient?.toLowerCase().includes(relationship) || blob.includes(relationship)) {
      score += 10;
      reasons.push(`Chosen for ${relationship}`);
    }
  }

  const disliked = (context.history ?? []).filter((h) => h.feedback === "not_suitable").map((h) => h.productSlug);
  if (disliked.includes(product.slug)) {
    score -= 50;
    reasons.push("Previously marked not suitable");
  }

  const loved = (context.history ?? []).filter((h) => h.feedback === "loved" || h.feedback === "perfect");
  for (const entry of loved) {
    const lovedName = entry.productName.toLowerCase();
    if (entry.productSlug === product.slug) {
      score += 6;
      reasons.push("They loved this before");
    } else if (lovedName.split(/\s+/).some((w) => w.length > 3 && blob.includes(w))) {
      score += 5;
    }
  }

  if (context.emergency && (product.sameDayAvailable || product.categorySlug?.includes("same-day"))) {
    score += 22;
    reasons.push("Available for last-minute delivery");
  } else if (context.emergency) {
    score -= 6;
  }

  const rating = product.ratingAggregate?.ratingValue ?? product.ratingAggregate?.average ?? 0;
  if (rating >= 4.5) {
    score += 10;
    reasons.push("Highly rated");
  } else if (rating >= 4) {
    score += 6;
  }

  if ((product.unitsSold ?? 0) >= 20) {
    score += 8;
    reasons.push("Popular with BlossomPot customers");
  } else if ((product.unitsSold ?? 0) >= 5) {
    score += 4;
  }

  if (product.featured) score += 4;

  return { score, reasons: reasons.slice(0, 4) };
}

export function recommendGifts(
  products: RecommendableProduct[],
  context: RecommendationContext
): GiftRecommendation[] {
  const preferred = categoryFromAction(context.preferredCategory);
  const scored = products
    .filter((p) => p.published !== false)
    .map((product) => {
      const { score, reasons } = scoreGiftProduct(product, { ...context, preferredCategory: preferred });
      return {
        slug: product.slug,
        name: product.name,
        price: product.price,
        currency: product.currency ?? "USD",
        image: product.images?.[0],
        categorySlug: product.categorySlug,
        score,
        reasons,
      } satisfies GiftRecommendation;
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.price - b.price);

  const limit = context.limit ?? 6;
  return scored.slice(0, limit);
}

export function pickSurpriseGift(
  products: RecommendableProduct[],
  context: RecommendationContext
): GiftRecommendation | null {
  const [top] = recommendGifts(products, { ...context, preferredCategory: context.preferredCategory ?? "surprise", limit: 1 });
  return top ?? null;
}
