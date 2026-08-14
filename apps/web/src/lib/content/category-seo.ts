/** Title, meta description, and H1 for public category landing pages (`/*-to-usa`). */
export const categoryPageSeo: Record<
  string,
  { title: string; description: string; h1: string }
> = {
  "lumba-rakhi": {
    title: "Send Lumba Rakhi to USA | Free Shipping | USA Rakhi",
    description:
      "Send Lumba Rakhi to USA with premium designer Lumba Rakhis for your bhabhi. Fast USA delivery, secure payment, and complimentary roli chawal included.",
    h1: "Send Lumba Rakhi to USA",
  },
  "bhaiya-bhabhi-rakhi": {
    title: "Send Bhaiya Bhabhi Rakhi to USA | Free Shipping | USA Rakhi",
    description:
      "Shop Bhaiya Bhabhi Rakhi to USA with elegant Rakhi pairs and premium designs. Fast delivery across the USA with secure online ordering.",
    h1: "Send Bhaiya Bhabhi Rakhi to USA",
  },
  "single-rakhi": {
    title: "Send Single Rakhi to USA | Free Shipping | USA Rakhi",
    description:
      "Buy Single Rakhi to USA from our exclusive collection of traditional and designer Rakhis. Fast USA delivery with festive packaging and roli chawal.",
    h1: "Send Single Rakhi to USA",
  },
  "2-set-rakhi": {
    title: "Send Set of 2 Rakhis to USA | Free Shipping | USA Rakhi",
    description:
      "Shop Set of 2 Rakhis to USA — two-piece designer rakhi sets for brothers. Fast USA delivery with festive packaging and roli chawal.",
    h1: "Send Set of 2 Rakhis to USA",
  },
  "3-set-rakhi": {
    title: "Send Set of 3 Rakhis to USA | Free Shipping | USA Rakhi",
    description:
      "Shop Set of 3 Rakhis to USA — three-piece designer rakhi sets for multiple brothers. Fast USA delivery with festive packaging.",
    h1: "Send Set of 3 Rakhis to USA",
  },
  "4-set-rakhi": {
    title: "Send Set of 4 Rakhis to USA | Free Shipping | USA Rakhi",
    description:
      "Shop Set of 4 Rakhis to USA — four-piece designer rakhi sets for larger families. Fast USA delivery with festive packaging.",
    h1: "Send Set of 4 Rakhis to USA",
  },
  "kids-rakhi": {
    title: "Send Kids Rakhi to USA | Free Shipping | USA Rakhi",
    description:
      "Send Kids Rakhi to USA featuring cartoon, superhero, and colorful Rakhi designs. Fast delivery across the USA with premium quality.",
    h1: "Send Kids Rakhi to USA",
  },
  "rakhi-combo": {
    title: "Send Rakhi Combo to USA | Free Shipping | USA Rakhi",
    description:
      "Order Rakhi with chocolates to USA with chocolates, sweets, dry fruits, and premium Rakhi sets. Fast USA delivery and secure online shopping.",
    h1: "Send Rakhi with Chocolates to USA",
  },
  "rakhi-hampers": {
    title: "Send Rakhi Hamper to USA | Free Shipping | USA Rakhi",
    description:
      "Order Rakhi hamper gift boxes to USA with designer rakhis, kaju katli, dry fruits, and festive sweets. Fast domestic USA delivery, clear what's-included lists, and secure online shopping.",
    h1: "Send Rakhi Hamper to USA",
  },
};

export function getCategoryPageSeo(slug: string) {
  return categoryPageSeo[slug];
}
