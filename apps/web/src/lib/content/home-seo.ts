import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";

/** SEO-rich homepage copy — flowers, cakes & gifts. */
export const homeSeoContent = {
  intro: {
    heading: "Send Flowers, Cakes & Gifts Online — BlossomPot USA Delivery",
    paragraphs: [
      "BlossomPot is an online gifting destination for flowers, bouquets, cakes, plants, and thoughtful gift hampers. Whether you are celebrating a birthday, anniversary, Valentine’s Day, Mother’s Day, or a simple thank-you, shop premium gifts with clear delivery expectations across the United States.",
      "Browse florist-quality roses and mixed bouquets, celebration cakes, personalized boxes, and curated hampers — all in one marketplace-style experience designed for modern US gifting.",
      "From same-day eligible gifts in select areas to nationwide delivery options, BlossomPot helps you send something beautiful without the guesswork.",
    ],
  },
  categories: {
    heading: "Shop Gifts by Category",
    intro:
      "Explore curated collections for every celebration — fresh flowers, designer bouquets, cakes, occasion gifts, and premium hampers.",
    links: [
      {
        label: "Flowers",
        href: categoryHref("flowers"),
        text: "Classic roses, mixed blooms, and elegant floral arrangements.",
      },
      {
        label: "Flower Bouquets",
        href: categoryHref("flower-bouquets"),
        text: "Signature bouquets designed for birthdays, romance, and celebrations.",
      },
      {
        label: "Cakes",
        href: categoryHref("cakes"),
        text: "Chocolate, red velvet, black forest, and designer birthday cakes.",
      },
      {
        label: "Birthday Gifts",
        href: categoryHref("birthday-gifts"),
        text: "Hampers, combos, and festive gifts made for birthday joy.",
      },
      {
        label: "Anniversary Gifts",
        href: categoryHref("anniversary-gifts"),
        text: "Romantic flowers, cakes, and keepsake gift boxes.",
      },
      {
        label: "Gift Hampers",
        href: categoryHref("gift-hampers"),
        text: "Luxury curated boxes with treats, blooms, and thoughtful extras.",
      },
    ],
  },
  delivery: {
    heading: "Gift Delivery Across the USA",
    paragraphs: [
      "BlossomPot supports nationwide gift delivery messaging with faster windows to major metros when available. Choose flowers, cakes, or hampers and enter the recipient’s US address at checkout.",
      "Looking for urgency? Shop same-day eligible gifts and check delivery guidance on each product page before you order.",
    ],
  },
  howItWorks: {
    heading: "How to Send a Gift with BlossomPot",
    steps: [
      {
        title: "1. Pick an occasion",
        text: "Start with flowers, cakes, birthday, anniversary, Valentine’s, or hampers.",
      },
      {
        title: "2. Choose your gift",
        text: "Select size, flavor, or add-ons where available, then add a gift message.",
      },
      {
        title: "3. Enter delivery details",
        text: "Add the recipient address and preferred delivery timing at checkout.",
      },
      {
        title: "4. Checkout securely",
        text: "Pay with Stripe (USD) or Razorpay (INR) and track your order updates.",
      },
    ],
  },
  cities: {
    heading: "Popular Gift Delivery Destinations",
    intro: "Send flowers and gifts to major US cities and metro areas.",
    links: [
      { label: "California", href: locationPublicPath("california") },
      { label: "New York", href: locationPublicPath("new-york") },
      { label: "Texas", href: locationPublicPath("texas") },
      { label: "Florida", href: locationPublicPath("florida") },
      { label: "New Jersey", href: locationPublicPath("new-jersey") },
      { label: "Los Angeles", href: locationPublicPath("los-angeles") },
      { label: "Chicago", href: locationPublicPath("chicago") },
      { label: "Houston", href: locationPublicPath("houston") },
    ],
  },
  faqs: {
    heading: "BlossomPot FAQ",
    items: [
      {
        q: "What can I order on BlossomPot?",
        a: "Flowers, bouquets, cakes, plants, personalized gifts, celebration gifts, and gift hampers for birthdays, anniversaries, and more.",
      },
      {
        q: "Do you offer same-day delivery?",
        a: "Same-day options may be available for eligible gifts in select areas. Check the product page and checkout delivery guidance.",
      },
      {
        q: "Can I add a gift message?",
        a: "Yes — most gifts support a personalized message during checkout or on the product page.",
      },
    ],
  },
} as const;
