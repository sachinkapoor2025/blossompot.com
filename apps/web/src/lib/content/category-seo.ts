/** Title, meta description, and H1 for public category landing pages. */
export const categoryPageSeo: Record<
  string,
  { title: string; description: string; h1: string }
> = {
  flowers: {
    title: "Shop Flowers | BlossomPot",
    description:
      "Shop roses, mixed bouquets, and birthday flowers on BlossomPot. Choose a design and check delivery availability for the recipient’s address at checkout.",
    h1: "Flowers",
  },
  "flower-bouquets": {
    title: "Shop Flower Bouquets | BlossomPot",
    description:
      "Shop signature flower bouquets on BlossomPot. Choose a design and check delivery availability for the recipient’s address at checkout.",
    h1: "Flower Bouquets",
  },
  cakes: {
    title: "Shop Cakes | BlossomPot",
    description:
      "Shop chocolate, red velvet, and celebration cakes on BlossomPot. Choose a cake and check delivery availability for the recipient’s address at checkout.",
    h1: "Cakes",
  },
  "birthday-gifts": {
    title: "Shop Birthday Gifts | BlossomPot",
    description:
      "Shop birthday flowers, cakes, and gift hampers on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Birthday Gifts",
  },
  "anniversary-gifts": {
    title: "Shop Anniversary Gifts | BlossomPot",
    description:
      "Shop anniversary flowers, cakes, and gift boxes on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Anniversary Gifts",
  },
  "valentines-day-gifts": {
    title: "Shop Valentine’s Day Gifts | BlossomPot",
    description:
      "Shop Valentine’s Day flowers and gifts on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Valentine's Day Gifts",
  },
  "mothers-day-gifts": {
    title: "Shop Mother's Day Gifts | BlossomPot",
    description:
      "Shop Mother's Day flowers, plants, and gifts on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Mother's Day Gifts",
  },
  "wedding-gifts": {
    title: "Shop Wedding Gifts | BlossomPot",
    description:
      "Shop wedding flowers, cakes, and hampers on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Wedding Gifts",
  },
  "gift-hampers": {
    title: "Shop Gift Hampers | BlossomPot",
    description:
      "Shop curated gift hampers on BlossomPot. Choose a hamper and check delivery availability for the recipient’s address at checkout.",
    h1: "Gift Hampers",
  },
  "personalized-gifts": {
    title: "Shop Personalized Gifts | BlossomPot",
    description:
      "Shop gifts with a personal message on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Personalized Gifts",
  },
  plants: {
    title: "Shop Plants | BlossomPot",
    description:
      "Shop plants on BlossomPot. Choose a plant and check delivery availability for the recipient’s address at checkout.",
    h1: "Plants",
  },
  "celebration-gifts": {
    title: "Shop Celebration Gifts | BlossomPot",
    description:
      "Shop celebration gifts on BlossomPot. Choose a gift and check delivery availability for the recipient’s address at checkout.",
    h1: "Celebration Gifts",
  },
};

export function getCategoryPageSeo(slug: string) {
  return categoryPageSeo[slug];
}
