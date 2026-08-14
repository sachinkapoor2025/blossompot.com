/** Dedicated country landing pages (UK / Canada) — separate from US city `/send-rakhi-to-*` pages. */

export type CountryRakhiPageId = "uk" | "canada";

export type CountryRakhiPage = {
  id: CountryRakhiPageId;
  /** Public path without trailing slash (canonical). */
  path: string;
  menuLabel: string;
  /** H1 */
  heading: string;
  /** Browser / SERP title (absoluteTitle). */
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  eyebrow: string;
  intro: string[];
  highlights: string[];
  howToHeading: string;
  howToSteps: string[];
  productSectionHeading: string;
  productSectionIntro: string;
  faqs: { q: string; a: string }[];
  whatsappPrefill: string;
  localeHints: Record<string, string>;
};

export const countryRakhiPages: Record<CountryRakhiPageId, CountryRakhiPage> = {
  uk: {
    id: "uk",
    path: "/rakhi-from-uk",
    menuLabel: "Rakhi from UK",
    heading: "Rakhi from UK — Send Rakhi Gifts to Loved Ones",
    metaTitle: "Rakhi from UK | Send Rakhi to UK | Rakhi Delivery to UK | BlossomPot",
    metaDescription:
      "Shop Rakhi from UK on BlossomPot. Send Rakhi to UK or arrange Rakhi Delivery to UK for Raksha Bandhan — premium rakhis, combos & hampers with secure checkout.",
    keywords:
      "Rakhi from UK, Rakhi Delivery to UK, Send Rakhi to UK, send rakhi from india to uk, rakhi gifts uk, raksha bandhan uk",
    eyebrow: "United Kingdom · Raksha Bandhan gifts",
    intro: [
      "Looking for Rakhi from UK options for Raksha Bandhan? BlossomPot makes it simple to browse premium rakhis, combos, and hampers online — whether you are arranging a gift from India for someone you love, or you need a clear path to Send Rakhi to UK with thoughtful packaging.",
      "Celebrate the sibling bond across miles with curated Rakhi Delivery to UK–ready gift ideas: Single Rakhi, Bhaiya Bhabhi sets, Kids Rakhi, Lumba Rakhi, chocolate combos, and festive hampers. Choose a design, add a note, and shop with secure USD or INR checkout.",
    ],
    highlights: [
      "Dedicated Rakhi from UK landing with curated catalog picks",
      "Send Rakhi to UK gift ideas — threads, combos & hampers",
      "Rakhi Delivery to UK messaging with clear shop CTAs",
      "Pay securely in USD (Stripe) or INR / UPI (Razorpay)",
      "Roli & chawal included on most rakhis for the tilak ritual",
      "WhatsApp support if you need help choosing a gift",
    ],
    howToHeading: "How to send Rakhi gifts for the UK",
    howToSteps: [
      "Browse the Rakhi from UK collection below and pick a Single Rakhi, combo, or hamper.",
      "Add the gift to cart and enter the recipient’s full delivery details at checkout.",
      "Pay securely online — sisters ordering from India can use INR / UPI via Razorpay.",
      "Share a personal message and track your order until it reaches your loved one.",
    ],
    productSectionHeading: "Shop Rakhi gifts — curated for UK shoppers",
    productSectionIntro:
      "Explore live catalog products with images, prices, and View Product links. Sort by price or name — currency follows your site preference.",
    faqs: [
      {
        q: "What is the Rakhi from UK page?",
        a: "It is a dedicated BlossomPot landing for customers searching Rakhi from UK, Send Rakhi to UK, and Rakhi Delivery to UK — with the full product catalog, sort controls, and secure checkout.",
      },
      {
        q: "Can I send Rakhi from India to someone in the UK?",
        a: "Yes — many sisters shop from India and arrange thoughtful Rakhi gifts for loved ones connected to the UK. Choose a design below, complete checkout, and use WhatsApp support if you need help with the order.",
      },
      {
        q: "What should I order for Send Rakhi to UK?",
        a: "A classic Single Rakhi works for a traditional ritual. For a fuller celebration, pick a Rakhi Combo (with chocolates) or a Rakhi Hamper with sweets and dry fruits.",
      },
      {
        q: "Do products show UK or India pricing?",
        a: "Product cards use the site currency toggle (USD / INR). At checkout you can pay with Stripe (USD) or Razorpay (INR / UPI).",
      },
    ],
    whatsappPrefill: "Hi BlossomPot, I want help with Rakhi from UK / Send Rakhi to UK.",
    localeHints: {
      "en-GB": "/rakhi-from-uk",
      en: "/rakhi-from-uk",
      "x-default": "/",
    },
  },
  canada: {
    id: "canada",
    path: "/rakhi-from-canada",
    menuLabel: "Rakhi from Canada",
    heading: "Rakhi from Canada — Send Rakhi Gifts to Loved Ones",
    metaTitle: "Rakhi from Canada | Send Rakhi to Canada | Rakhi Delivery to Canada | BlossomPot",
    metaDescription:
      "Shop Rakhi from Canada on BlossomPot. Send Rakhi to Canada or arrange Rakhi Delivery to Canada for Raksha Bandhan — premium rakhis, combos & hampers with secure checkout.",
    keywords:
      "Rakhi from Canada, Rakhi Delivery to Canada, Send Rakhi to Canada, send rakhi from india to canada, rakhi gifts canada, raksha bandhan canada",
    eyebrow: "Canada · Raksha Bandhan gifts",
    intro: [
      "Searching for Rakhi from Canada for Raksha Bandhan? BlossomPot brings together designer threads, combos, and hampers so you can Send Rakhi to Canada with a gift that feels personal — including when you are arranging something special from India for family abroad.",
      "From a simple Single Rakhi to Bhaiya Bhabhi sets, Kids Rakhi, Lumba styles, and festive hampers, this page highlights Rakhi Delivery to Canada–focused gift ideas with live prices, product photos, and easy checkout in USD or INR.",
    ],
    highlights: [
      "Dedicated Rakhi from Canada landing with live catalog products",
      "Send Rakhi to Canada ideas — classic threads to premium hampers",
      "Clear Rakhi Delivery to Canada shopping experience",
      "Secure checkout with Stripe (USD) or Razorpay (INR / UPI)",
      "Most rakhis include roli & chawal for the ceremony",
      "Friendly WhatsApp support for gift selection help",
    ],
    howToHeading: "How to send Rakhi gifts for Canada",
    howToSteps: [
      "Browse the Rakhi from Canada products below and choose a design your brother will love.",
      "Add to cart and enter accurate recipient details at checkout.",
      "Pay securely — customers ordering from India can select INR / UPI.",
      "Confirm your order and keep the tracking details handy for festival day.",
    ],
    productSectionHeading: "Shop Rakhi gifts — curated for Canada shoppers",
    productSectionIntro:
      "All products load from the live BlossomPot catalog. Use sort controls; prices follow your currency preference; each card links to the full product page.",
    faqs: [
      {
        q: "What is the Rakhi from Canada page?",
        a: "A country-specific BlossomPot landing for Rakhi from Canada, Send Rakhi to Canada, and Rakhi Delivery to Canada searches — with product grid, sorting, and the same trusted checkout as the rest of the site.",
      },
      {
        q: "Can I send Rakhi from India to someone in Canada?",
        a: "Yes. Sisters often shop from India to arrange meaningful Rakhi gifts for loved ones in Canada. Pick a product below and complete secure checkout, or message us on WhatsApp for guidance.",
      },
      {
        q: "Which gifts work best to Send Rakhi to Canada?",
        a: "Single Rakhi for a classic ritual, Rakhi Combos when you want chocolates included, and Rakhi Hampers when you want sweets, dry fruits, and a fuller festival package.",
      },
      {
        q: "Is currency in CAD?",
        a: "The storefront shows USD or INR via the site currency toggle. Checkout supports Stripe (USD) and Razorpay (INR).",
      },
    ],
    whatsappPrefill: "Hi BlossomPot, I want help with Rakhi from Canada / Send Rakhi to Canada.",
    localeHints: {
      "en-CA": "/rakhi-from-canada",
      en: "/rakhi-from-canada",
      "x-default": "/",
    },
  },
};

export function getCountryRakhiPage(id: CountryRakhiPageId): CountryRakhiPage {
  return countryRakhiPages[id];
}
