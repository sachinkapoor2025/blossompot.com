/** Rich SEO layout content for category pages (mirrors city page structure). */

import { categoryHref } from "@/lib/category-urls";

export interface CategoryRichContent {
  slug: string;
  headline: string;
  intro: string[];
  delivery: { heading: string; paragraphs: string[] };
  highlights: {
    heading: string;
    /** Checklist bullets (omit when using paragraphs instead). */
    items: string[];
    /** Prose alternative to keyword-stuffed style lists. */
    paragraphs?: string[];
  };
  tradition?: { heading: string; paragraphs: string[] };
  whyUs: { heading: string; bullets: string[] };
  howTo: { heading: string; steps: string[] };
  faqs: { q: string; a: string }[];
  relatedCategories: { label: string; href: string; text: string }[];
}

const relatedAll = [
  { slug: "flowers", label: "Flowers", text: "Fresh arrangements for every celebration." },
  { slug: "flower-bouquets", label: "Flower Bouquets", text: "Signature bouquets for doorstep surprises." },
  { slug: "cakes", label: "Cakes", text: "Birthday, anniversary, and designer cakes." },
  { slug: "gift-hampers", label: "Gift Hampers", text: "Curated boxes with treats and extras." },
  { slug: "birthday-gifts", label: "Birthday Gifts", text: "Flowers, cakes, and combos for birthdays." },
  { slug: "anniversary-gifts", label: "Anniversary Gifts", text: "Romantic roses, cakes, and gift sets." },
  { slug: "same-day-gifts", label: "Same-Day Gifts", text: "Faster options in select US cities." },
].map((c) => ({ ...c, href: categoryHref(c.slug) }));

function relatedExcept(slug: string) {
  return relatedAll.filter((c) => c.slug !== slug);
}

function giftCategory(
  slug: string,
  headline: string,
  intro: string[],
  highlightHeading: string,
  highlightItems: string[],
  traditionHeading: string,
  traditionParagraphs: string[]
): CategoryRichContent {
  return {
    slug,
    headline,
    intro,
    delivery: {
      heading: "USA Delivery",
      paragraphs: [
        "BlossomPot delivers across all 50 US states with clear shipping expectations. Same-day options appear in select cities when you order before the local cut-off.",
        "Enter the recipient address at checkout to see available delivery windows. Most products support a personal gift message.",
      ],
    },
    highlights: {
      heading: highlightHeading,
      items: highlightItems,
    },
    tradition: {
      heading: traditionHeading,
      paragraphs: traditionParagraphs,
    },
    whyUs: {
      heading: "Why Order from BlossomPot",
      bullets: [
        "Premium flowers, cakes, and curated gifts in one place",
        "Clear USA delivery messaging",
        "Gift messages on most products",
        "Secure Stripe (USD) and Razorpay (INR) checkout",
        "WhatsApp and email support",
      ],
    },
    howTo: {
      heading: "How to Order",
      steps: [
        "Choose a design from the collection above.",
        "Add to cart and enter the USA delivery address.",
        "Add a gift message if desired.",
        "Pay securely with Stripe or Razorpay.",
        "We pack carefully and ship for USA delivery.",
      ],
    },
    faqs: [
      {
        q: "Do you deliver nationwide?",
        a: "Yes. BlossomPot delivers gifts across all 50 US states. Same-day options are available in select cities when ordered before cut-off.",
      },
      {
        q: "Can I order from outside the USA?",
        a: "Yes. Enter a US recipient address at checkout. We accept orders worldwide with Stripe (USD) or Razorpay (INR).",
      },
      {
        q: "Can I add a gift message?",
        a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
      },
    ],
    relatedCategories: relatedExcept(slug),
  };
}

export const categoryRichContent: Record<string, CategoryRichContent> = {
  flowers: giftCategory(
    "flowers",
    "Fresh Flowers for USA Delivery — Birthdays & Everyday Celebrations",
    [
      "Shop fresh flowers for birthdays, anniversaries, thank-yous, and everyday celebrations. BlossomPot arrangements are styled for premium gifting with clear delivery expectations across the USA.",
      "Choose classic roses, mixed blooms, or elegant white arrangements — then add a personal message at checkout.",
    ],
    "Popular Flower Styles",
    [
      "Classic red roses for romance and anniversaries",
      "Pink and mixed bouquets for birthdays and congratulations",
      "White roses and soft pastels for elegant occasions",
    ],
    "Why Flowers Still Matter",
    [
      "A thoughtfully chosen bouquet turns an ordinary day into a celebration. Whether you are nearby or miles away, flowers remain one of the most personal ways to say you care.",
    ]
  ),
  "flower-bouquets": giftCategory(
    "flower-bouquets",
    "Signature Flower Bouquets — USA Doorstep Delivery",
    [
      "Signature flower bouquets designed for gifting moments that deserve a wow presentation. Ideal for doorstep surprises, office celebrations, and romantic evenings.",
    ],
    "Bouquet Styles",
    [
      "Luxury premium bouquets for statement gifting",
      "Mixed seasonal arrangements for colorful celebrations",
      "Elegant white and blush designs for refined occasions",
    ],
    "Bouquet Gifting Tips",
    [
      "Pair a signature bouquet with a short handwritten-style gift message for a more personal unboxing. For big milestones, consider adding a cake or hamper.",
    ]
  ),
  cakes: giftCategory(
    "cakes",
    "Celebration Cakes for USA Delivery",
    [
      "Order celebration cakes online for birthdays, anniversaries, and parties. From chocolate truffle to red velvet and designer birthday cakes, BlossomPot makes sweet moments easy to send.",
    ],
    "Cake Favorites",
    [
      "Chocolate truffle and black forest classics",
      "Red velvet and strawberry cream for festive tables",
      "Designer birthday cakes with room for a custom message",
    ],
    "Sweet Celebrations",
    [
      "A cake arrives as a shared moment — cut it together on a video call, or surprise someone at the office with a celebration they did not see coming.",
    ]
  ),
  "birthday-gifts": giftCategory(
    "birthday-gifts",
    "Birthday Gifts — Flowers, Cakes & Combos",
    [
      "Birthday gifts that feel complete — flowers, cakes, hampers, and combos curated for joyful celebrations across the USA.",
    ],
    "Birthday Gift Ideas",
    [
      "Flower bouquets for a colorful surprise",
      "Celebration cakes with a personal message",
      "Hampers that combine treats and thoughtful extras",
    ],
    "Make Birthdays Feel Close",
    [
      "Even when you cannot be there in person, a well-chosen birthday gift creates a shared celebration across miles.",
    ]
  ),
  "anniversary-gifts": giftCategory(
    "anniversary-gifts",
    "Anniversary Gifts — Roses, Cakes & Romantic Sets",
    [
      "Romantic anniversary gifts including roses, cakes, and curated boxes for couples celebrating another year together.",
    ],
    "Anniversary Favorites",
    [
      "Classic red rose arrangements",
      "Cake and flower pairings",
      "Curated romantic gift boxes",
    ],
    "Celebrate Another Year",
    [
      "Anniversary gifting is about the feeling as much as the product. Choose something elegant, add a short message, and let the delivery do the rest.",
    ]
  ),
  "gift-hampers": giftCategory(
    "gift-hampers",
    "Gift Hampers for USA Delivery",
    [
      "Curated gift hampers with sweets, treats, and thoughtful extras — perfect when you want one complete celebration package.",
    ],
    "What's Inside",
    [
      "Assorted treats and celebration sweets",
      "Premium packaging ready for gifting",
      "Options that pair well with flowers or cakes",
    ],
    "When a Hamper Wins",
    [
      "Hampers are ideal when you want variety in one box — great for thank-yous, housewarmings, and corporate-friendly celebrations.",
    ]
  ),
  "same-day-gifts": giftCategory(
    "same-day-gifts",
    "Same-Day Gifts in Select US Cities",
    [
      "Need something today? Same-day gift options are available in select US cities when you order before the local cut-off.",
    ],
    "Same-Day Tips",
    [
      "Order before the local cut-off shown at checkout",
      "Confirm the recipient address carefully",
      "Add a gift message for a more personal touch",
    ],
    "Last-Minute, Still Thoughtful",
    [
      "Same-day does not have to feel rushed. Choose a clean bouquet or classic cake and let careful packaging carry the moment.",
    ]
  ),
};

/**
 * Returns rich category SEO content when available.
 * Unknown or legacy rakhi slugs return undefined so pages fall back safely.
 */
export function getCategoryRichContent(slug: string): CategoryRichContent | undefined {
  return categoryRichContent[slug];
}
