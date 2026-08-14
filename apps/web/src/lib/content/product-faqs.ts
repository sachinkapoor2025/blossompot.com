/** PDP FAQ sets by product category — visible copy must match FAQPage schema. */

export type ProductFaq = { q: string; a: string };

const SHARED_PAYMENT: ProductFaq = {
  q: "What payment methods do you accept?",
  a: "We accept Stripe (USD) and Razorpay (INR). All payments are encrypted and we never store card details.",
};

const SHARED_DAMAGE: ProductFaq = {
  q: "What if my gift arrives damaged?",
  a: "Contact us within 48 hours of delivery with photos. We offer replacements or refunds for damaged or incorrect items — see our Returns & Guarantee policy.",
};

const SHARED_DELIVERY: ProductFaq = {
  q: "How long does delivery take in the USA?",
  a: "Most gifts ship with an estimated 5–7 business day USA window after dispatch. Same-day options are available in select cities when you order before the local cut-off — see the product page delivery estimate for your order.",
};

const FLOWERS: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "How fresh are the flowers?",
    a: "Arrangements are prepared for gifting with care instructions included. Open the box promptly, trim stems, and place in clean water for best vase life.",
  },
  {
    q: "Can I add a personal message?",
    a: "Yes. Add a gift message at checkout so it arrives with your flowers.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

const CAKES: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "How should the cake be stored?",
    a: "Keep refrigerated until serving. Allow a short time at room temperature before cutting for best taste and texture.",
  },
  {
    q: "Can I request a custom cake message?",
    a: "Yes — add your message at checkout when the product supports personalized icing or a gift note.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

const PLANTS: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "Will the plant arrive healthy?",
    a: "Plants are packed for transit with basic care tips. Place in appropriate light and water according to the care card after arrival.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

const HAMPERS: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "What is inside the hamper?",
    a: "Each hamper lists exact contents under What’s included on the product page. Contents may vary slightly by season while keeping equal or greater value.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

const PERSONALIZED: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "How does personalization work?",
    a: "Enter your custom text at checkout. Personalized items may need a little extra preparation time before dispatch.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

const COMBOS: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "Can I send flowers and cake together?",
    a: "Yes — combo and celebration gifts are curated to arrive as a complete gesture. Check What’s included for the exact bundle.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];


const DEFAULT_GIFT: ProductFaq[] = [
  SHARED_DELIVERY,
  {
    q: "Can I include a gift message?",
    a: "Yes. Add a personal note at checkout so your gift arrives with your words.",
  },
  SHARED_PAYMENT,
  SHARED_DAMAGE,
];

/** Standard FAQs shown on every product page (legacy export — prefer productFaqsForCategory). */
export const productPageFaqs = DEFAULT_GIFT;

export function productFaqsForCategory(categorySlug: string): ProductFaq[] {
  switch (categorySlug) {
    case "flowers":
    case "flower-bouquets":
      return FLOWERS;
    case "cakes":
      return CAKES;
    case "plants":
      return PLANTS;
    case "gift-hampers":
      return HAMPERS;
    case "personalized-gifts":
      return PERSONALIZED;
    case "birthday-gifts":
    case "anniversary-gifts":
    case "valentines-day-gifts":
    case "celebration-gifts":
    case "same-day-gifts":
      return COMBOS;
    default:
      return DEFAULT_GIFT;
  }
}
