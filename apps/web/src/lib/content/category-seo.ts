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
      "Order cakes online worldwide for birthdays, anniversaries and special celebrations. Shop chocolate, red velvet, designer and specialty cakes with global delivery.",
    h1: "Celebration Cakes — Worldwide Delivery",
  },
  "birthday-gifts": {
    title: "Birthday Gifts Worldwide | Flowers, Cakes & Combos | BlossomPot",
    description:
      "Send birthday gifts worldwide with BlossomPot. Shop fresh flowers, delicious cakes, gift hampers and combos for joyful birthday celebrations.",
    h1: "Birthday Gifts for Worldwide Delivery",
  },
  "anniversary-gifts": {
    title: "Anniversary Gifts Worldwide | Roses, Cakes & More | BlossomPot",
    description:
      "Send romantic anniversary gifts worldwide with BlossomPot. Discover roses, flowers, cakes and thoughtful gift boxes perfect for celebrating love.",
    h1: "Anniversary Gifts — Worldwide Delivery",
  },
  "valentines-day-gifts": {
    title: "Valentine’s Day Gifts Worldwide | Flowers & Chocolates | BlossomPot",
    description:
      "Send Valentine’s Day gifts worldwide with BlossomPot. Shop fresh flowers, chocolates and romantic gift sets for memorable celebrations.",
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
      "Shop gift hampers with worldwide delivery from BlossomPot. Discover curated gift boxes filled with thoughtful treats, perfect for every occasion.",
    h1: "Gift Hampers — Worldwide Delivery",
  },
  "personalized-gifts": {
    title: "Personalized Gifts Worldwide | Custom Messages | BlossomPot",
    description:
      "Personalized gifts with custom messages for birthdays, anniversaries, and thank-yous — delivered worldwide.",
    h1: "Personalized Gifts — Worldwide Delivery",
  },
  "same-day-gifts": {
    title: "Same-Day Gift Delivery | Flowers, Cakes & More | BlossomPot",
    description:
      "Send flowers, cakes and gifts with same-day delivery in select locations. Order before the local cut-off time for fast, thoughtful celebrations.",
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
