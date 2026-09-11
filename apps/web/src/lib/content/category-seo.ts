/** Title, meta description, and H1 for public category landing pages. */
export const categoryPageSeo: Record<
  string,
  { title: string; description: string; h1: string }
> = {
  flowers: {
    title: "Send Flowers Online Worldwide | Fresh Arrangements | BlossomPot",
    description:
      "Order fresh flowers for worldwide delivery. Birthdays, anniversaries, thank-yous, and everyday celebrations with premium packaging and clear shipping.",
    h1: "Send Flowers Online — Worldwide Delivery",
  },
  "flower-bouquets": {
    title: "Flower Bouquets Worldwide Delivery | Signature Arrangements | BlossomPot",
    description:
      "Shop signature flower bouquets for doorstep surprises worldwide. Elegant presentation and gift-message options.",
    h1: "Flower Bouquets for Worldwide Delivery",
  },
  cakes: {
    title: "Order Cakes Online Worldwide | Birthday & Celebration Cakes | BlossomPot",
    description:
      "Order celebration cakes online for birthdays, anniversaries, and parties. Chocolate, red velvet, designer cakes with worldwide delivery.",
    h1: "Celebration Cakes — Worldwide Delivery",
  },
  "birthday-gifts": {
    title: "Birthday Gifts Worldwide | Flowers, Cakes & Combos | BlossomPot",
    description:
      "Birthday gifts that feel complete — flowers, cakes, hampers, and combos curated for joyful celebrations worldwide.",
    h1: "Birthday Gifts for Worldwide Delivery",
  },
  "anniversary-gifts": {
    title: "Anniversary Gifts Worldwide | Roses, Cakes & More | BlossomPot",
    description:
      "Romantic anniversary gifts including roses, cakes, and curated boxes for couples celebrating worldwide.",
    h1: "Anniversary Gifts — Worldwide Delivery",
  },
  "valentines-day-gifts": {
    title: "Valentine's Day Gifts Worldwide | Flowers & Chocolates | BlossomPot",
    description:
      "Valentine's Day flowers, chocolates, and romantic gift sets designed for memorable February celebrations.",
    h1: "Valentine's Day Gifts — Worldwide Delivery",
  },
  "mothers-day-gifts": {
    title: "Mother's Day Gifts Worldwide | Flowers & Plants | BlossomPot",
    description:
      "Mother's Day flowers, plants, and thoughtful gifts to show appreciation with elegance and warmth.",
    h1: "Mother's Day Gifts — Worldwide Delivery",
  },
  "wedding-gifts": {
    title: "Wedding Gifts Worldwide | Florals, Cakes & Hampers | BlossomPot",
    description:
      "Wedding and engagement gifting — elegant florals, celebration cakes, and premium hampers for couples.",
    h1: "Wedding Gifts — Worldwide Delivery",
  },
  "gift-hampers": {
    title: "Gift Hampers Worldwide Delivery | Curated Boxes | BlossomPot",
    description:
      "Order curated gift hampers online with sweets, treats, and thoughtful extras. Premium packaging and worldwide delivery.",
    h1: "Gift Hampers — Worldwide Delivery",
  },
  "personalized-gifts": {
    title: "Personalized Gifts Worldwide | Custom Messages | BlossomPot",
    description:
      "Personalized gifts with custom messages for birthdays, anniversaries, and thank-yous — delivered worldwide.",
    h1: "Personalized Gifts — Worldwide Delivery",
  },
  "same-day-gifts": {
    title: "Same-Day Gifts | Select Cities | BlossomPot",
    description:
      "Same-day gift options in select US cities when you order before the local cut-off. Flowers, cakes, and more.",
    h1: "Same-Day Gifts — Select Cities",
  },
  plants: {
    title: "Plants Delivery Worldwide | Green Gifts | BlossomPot",
    description:
      "Send plants as thoughtful green gifts worldwide — perfect for thank-yous, housewarmings, and Mother's Day.",
    h1: "Plants for Worldwide Delivery",
  },
  "celebration-gifts": {
    title: "Celebration Gifts Worldwide | Congrats & Thank You | BlossomPot",
    description:
      "Celebration gifts for promotions, housewarmings, congratulations, and every reason to send something special.",
    h1: "Celebration Gifts — Worldwide Delivery",
  },
};

export function getCategoryPageSeo(slug: string) {
  return categoryPageSeo[slug];
}
