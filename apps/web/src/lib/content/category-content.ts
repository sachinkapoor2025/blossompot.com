/** Extended SEO content per category — shown below product listings. */
export interface CategoryContent {
  /** Extra paragraphs appended after the API category description. */
  extraParagraphs: string[];
  /** Optional sub-sections with headings. */
  sections?: { heading: string; paragraphs: string[] }[];
}

export const categoryContent: Record<string, CategoryContent> = {
  flowers: {
    extraParagraphs: [
      "Shop fresh flowers for birthdays, anniversaries, thank-yous, and everyday celebrations. BlossomPot arrangements are styled for premium gifting with clear delivery expectations across the USA.",
      "Choose classic roses, mixed blooms, or elegant white arrangements — then add a personal message at checkout.",
    ],
    sections: [
      {
        heading: "Popular flower picks",
        paragraphs: [
          "Classic red roses for romance and anniversaries.",
          "Pink and mixed bouquets for birthdays and congratulations.",
          "White roses and soft pastels for elegant occasions.",
        ],
      },
    ],
  },
  "flower-bouquets": {
    extraParagraphs: [
      "Signature flower bouquets designed for gifting moments that deserve a wow presentation. Ideal for doorstep surprises, office celebrations, and romantic evenings.",
    ],
    sections: [
      {
        heading: "Bouquet styles",
        paragraphs: [
          "Luxury premium bouquets for statement gifting.",
          "Mixed seasonal arrangements for colorful celebrations.",
          "Elegant white and blush designs for refined occasions.",
        ],
      },
    ],
  },
  cakes: {
    extraParagraphs: [
      "Order celebration cakes online for birthdays, anniversaries, and parties. From chocolate truffle to red velvet and designer birthday cakes, BlossomPot makes sweet moments easy to send.",
    ],
    sections: [
      {
        heading: "Cake favorites",
        paragraphs: [
          "Chocolate truffle and black forest classics.",
          "Red velvet and strawberry cream for festive tables.",
          "Designer birthday cakes with room for a custom message.",
        ],
      },
    ],
  },
  "birthday-gifts": {
    extraParagraphs: [
      "Birthday gifts that feel complete — flowers, cakes, hampers, and combos curated for joyful celebrations across the USA.",
    ],
  },
  "anniversary-gifts": {
    extraParagraphs: [
      "Romantic anniversary gifts including roses, cakes, and curated boxes for couples celebrating another year together.",
    ],
  },
  "valentines-day-gifts": {
    extraParagraphs: [
      "Valentine's Day flowers, chocolates, and romantic gift sets designed for memorable February celebrations.",
    ],
  },
  "mothers-day-gifts": {
    extraParagraphs: [
      "Mother’s Day flowers, plants, and thoughtful gifts to show appreciation with elegance and warmth.",
    ],
  },
  "wedding-gifts": {
    extraParagraphs: [
      "Wedding and engagement gifting — elegant florals, celebration cakes, and premium hampers for couples.",
    ],
  },
  "personalized-gifts": {
    extraParagraphs: [
      "Add a personal touch with customizable gift boxes, messages, and curated keepsakes paired with flowers or treats.",
    ],
  },
  "gift-hampers": {
    extraParagraphs: [
      "Luxury gift hampers packed with gourmet treats, blooms, and celebration essentials — ideal for birthdays, thank-yous, and corporate gestures.",
    ],
  },
  plants: {
    extraParagraphs: [
      "Living plant gifts that last beyond the celebration — perfect for new homes, desks, and thoughtful thank-yous.",
    ],
  },
  "same-day-gifts": {
    extraParagraphs: [
      "When timing matters, browse same-day eligible gifts and confirm delivery guidance on the product page before checkout.",
    ],
  },
  "celebration-gifts": {
    extraParagraphs: [
      "Celebration gifts for promotions, housewarmings, congratulations, and every reason to send something special.",
    ],
  },
};

export function getCategoryContent(slug: string): CategoryContent | undefined {
  return categoryContent[slug];
}
