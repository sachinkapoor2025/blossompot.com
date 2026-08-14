/** Title, meta description, and H1 for public category landing pages. */
export const categoryPageSeo: Record<
  string,
  { title: string; description: string; h1: string }
> = {
  flowers: {
    title: "Send Flowers Online USA | Fresh Arrangements | BlossomPot",
    description:
      "Order fresh flowers for USA delivery. Birthdays, anniversaries, thank-yous, and everyday celebrations with premium packaging and clear shipping.",
    h1: "Send Flowers Online — USA Delivery",
  },
  "flower-bouquets": {
    title: "Flower Bouquets USA Delivery | Signature Arrangements | BlossomPot",
    description:
      "Shop signature flower bouquets for doorstep surprises across the USA. Elegant presentation and gift-message options.",
    h1: "Flower Bouquets for USA Delivery",
  },
  cakes: {
    title: "Order Cakes Online USA | Birthday & Celebration Cakes | BlossomPot",
    description:
      "Order celebration cakes online for birthdays, anniversaries, and parties. Chocolate, red velvet, designer cakes with USA delivery.",
    h1: "Celebration Cakes — USA Delivery",
  },
  "birthday-gifts": {
    title: "Birthday Gifts USA | Flowers, Cakes & Combos | BlossomPot",
    description:
      "Birthday gifts that feel complete — flowers, cakes, hampers, and combos curated for joyful celebrations across the USA.",
    h1: "Birthday Gifts for USA Delivery",
  },
  "anniversary-gifts": {
    title: "Anniversary Gifts USA | Roses, Cakes & More | BlossomPot",
    description:
      "Romantic anniversary gifts including roses, cakes, and curated boxes for couples celebrating across the USA.",
    h1: "Anniversary Gifts — USA Delivery",
  },
  "valentines-day-gifts": {
    title: "Valentine's Day Gifts USA | Flowers & Chocolates | BlossomPot",
    description:
      "Valentine's Day flowers, chocolates, and romantic gift sets designed for memorable February celebrations.",
    h1: "Valentine's Day Gifts — USA Delivery",
  },
  "mothers-day-gifts": {
    title: "Mother's Day Gifts USA | Flowers & Plants | BlossomPot",
    description:
      "Mother's Day flowers, plants, and thoughtful gifts to show appreciation with elegance and warmth.",
    h1: "Mother's Day Gifts — USA Delivery",
  },
  "wedding-gifts": {
    title: "Wedding Gifts USA | Florals, Cakes & Hampers | BlossomPot",
    description:
      "Wedding and engagement gifting — elegant florals, celebration cakes, and premium hampers for couples.",
    h1: "Wedding Gifts — USA Delivery",
  },
  "gift-hampers": {
    title: "Gift Hampers USA Delivery | Curated Boxes | BlossomPot",
    description:
      "Order curated gift hampers online with sweets, treats, and thoughtful extras. Premium packaging and USA delivery.",
    h1: "Gift Hampers — USA Delivery",
  },
  "personalized-gifts": {
    title: "Personalized Gifts USA | Custom Messages | BlossomPot",
    description:
      "Personalized gifts with custom messages for birthdays, anniversaries, and thank-yous — delivered across the USA.",
    h1: "Personalized Gifts — USA Delivery",
  },
  "same-day-gifts": {
    title: "Same-Day Gifts USA | Select Cities | BlossomPot",
    description:
      "Same-day gift options in select US cities when you order before the local cut-off. Flowers, cakes, and more.",
    h1: "Same-Day Gifts — Select Cities",
  },
  plants: {
    title: "Plants Delivery USA | Green Gifts | BlossomPot",
    description:
      "Send plants as thoughtful green gifts across the USA — perfect for thank-yous, housewarmings, and Mother's Day.",
    h1: "Plants for USA Delivery",
  },
  "celebration-gifts": {
    title: "Celebration Gifts USA | Congrats & Thank You | BlossomPot",
    description:
      "Celebration gifts for promotions, housewarmings, congratulations, and every reason to send something special.",
    h1: "Celebration Gifts — USA Delivery",
  },
};

export function getCategoryPageSeo(slug: string) {
  return categoryPageSeo[slug];
}
