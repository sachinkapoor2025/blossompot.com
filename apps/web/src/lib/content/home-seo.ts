import { categoryHref } from "@/lib/category-urls";
import { locationPublicPath } from "@/lib/content/seo-data";
import { cityMenuForCountry } from "@/lib/city-menu-for-location";
import { countryDisplayName, localizeCopyForCountry } from "@/lib/location-seo-urls";
import { cityNavHref } from "@/lib/site";

/** SEO-rich homepage copy — flowers, cakes & gifts. */
export const homeSeoContent = {
  intro: {
    heading: "Send Flowers, Cakes & Gifts Online — Worldwide Delivery",
    paragraphs: [
      "BlossomPot is an online gifting destination for flowers, bouquets, cakes, plants, and thoughtful gift hampers. Whether you are celebrating a birthday, anniversary, Valentine’s Day, Mother’s Day, or a simple thank-you, shop premium gifts with worldwide delivery.",
      "Browse florist-quality roses and mixed bouquets, celebration cakes, personalized boxes, and curated hampers — all in one marketplace-style experience designed for modern worldwide gifting.",
      "From same-day eligible gifts in select areas to worldwide delivery options, BlossomPot helps you send something beautiful without the guesswork.",
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
    intro:
      "Delivering to all 50 states, DC and Puerto Rico — start with a state hub or browse the full index.",
    links: [
      { label: "Gifts to California", href: locationPublicPath("california") },
      { label: "Gifts to Texas", href: locationPublicPath("texas") },
      { label: "Gifts to Florida", href: locationPublicPath("florida") },
      { label: "Gifts to New York", href: locationPublicPath("new-york") },
      { label: "Gifts to Illinois", href: locationPublicPath("illinois") },
      { label: "Gifts to Pennsylvania", href: locationPublicPath("pennsylvania") },
      { label: "Gifts to Georgia", href: locationPublicPath("georgia") },
      { label: "All delivery locations", href: "/delivery-locations" },
      { label: "International locations", href: "/locations" },
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

export function homeSeoContentForCountry(countryIso: string) {
  const iso = countryIso.trim().toUpperCase() || "US";
  if (iso === "US") return homeSeoContent;

  const country = countryDisplayName(iso);
  const cities = cityMenuForCountry(iso);
  const cityLinks = cities.links.slice(0, 8).map((city) => ({
    label: city.menuLabel ?? city.label,
    href: city.href ?? cityNavHref(city),
  }));

  return {
    ...homeSeoContent,
    intro: {
      heading: localizeCopyForCountry(homeSeoContent.intro.heading, iso),
      paragraphs: homeSeoContent.intro.paragraphs.map((para) => localizeCopyForCountry(para, iso)),
    },
    delivery: {
      heading: `Gift Delivery in ${country}`,
      paragraphs: [
        `BlossomPot delivers flowers, cakes, and gift hampers to ${country}. Shop gifts available for this destination and enter the recipient address at checkout.`,
        "Looking for urgency? Check delivery guidance on each product page before you order — timing depends on the destination.",
      ],
    },
    cities: {
      heading: `Popular Gift Delivery Destinations in ${country}`,
      intro: `Start with a ${country} city page or browse the full location list for this country.`,
      links: [
        ...cityLinks,
        { label: cities.allLabel, href: cities.allHref },
      ],
    },
  };
}
