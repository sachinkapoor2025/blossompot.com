/** SEO + LLM-friendly copy for USA city/state gift delivery landing pages. */

import { categoryHref } from "@/lib/category-urls";

export interface CityPageContent {
  slug: string;
  label: string;
  region: "state" | "city";
  state?: string;
  headline: string;
  metaExtra: string;
  intro: string[];
  delivery: { heading: string; paragraphs: string[] };
  areas: { heading: string; items: string[] };
  whyUs: { heading: string; bullets: string[] };
  howTo: { heading: string; steps: string[] };
  faqs: { q: string; a: string }[];
  relatedCategories: { label: string; href: string; text: string }[];
}

const sharedCategories = [
  {
    label: "Flowers",
    href: categoryHref("flowers"),
    text: "Fresh arrangements for birthdays, thank-yous, and everyday celebrations.",
  },
  {
    label: "Flower Bouquets",
    href: categoryHref("flower-bouquets"),
    text: "Signature bouquets designed for doorstep surprises.",
  },
  {
    label: "Cakes",
    href: categoryHref("cakes"),
    text: "Chocolate, red velvet, and designer celebration cakes.",
  },
  {
    label: "Gift Hampers",
    href: categoryHref("gift-hampers"),
    text: "Curated boxes with treats, sweets, and thoughtful extras.",
  },
  {
    label: "Birthday Gifts",
    href: categoryHref("birthday-gifts"),
    text: "Flowers, cakes, and combos made for birthday moments.",
  },
] as const;

function stateContent(
  slug: string,
  label: string,
  areas: string[],
  extraIntro?: string
): CityPageContent {
  return {
    slug,
    label,
    region: "state",
    headline: `Send Gifts to ${label}, USA — Flowers, Cakes & More`,
    metaExtra: `Premium flower, cake, and gift delivery to ${label}. Order online for USA delivery.`,
    intro: [
      `Looking to send flowers, cakes, or thoughtful gifts to ${label}? BlossomPot delivers celebration-ready gifts across every city and town in ${label} — from major metros to suburban neighborhoods.`,
      `Choose fresh flowers, signature bouquets, celebration cakes, gift hampers, and occasion collections. Most products support a personal gift message at checkout. ${extraIntro ?? ""}`.trim(),
    ],
    delivery: {
      heading: `Gift Delivery Across ${label}`,
      paragraphs: [
        `BlossomPot ships to homes, apartments, offices, and university addresses across ${label}. Nationwide delivery covers all ZIP codes; faster windows may be available to major metros.`,
        `You'll receive order confirmation by email, and our support team can help with address verification or delivery questions before the celebration.`,
      ],
    },
    areas: {
      heading: `Popular ${label} Areas We Serve`,
      items: areas,
    },
    whyUs: {
      heading: `Why Customers Choose BlossomPot for ${label} Delivery`,
      bullets: [
        "Flowers, cakes, and hampers in one marketplace",
        "Clear USA delivery expectations",
        "Pay in USD (Stripe) or INR (Razorpay) from anywhere",
        "Gift messages and occasion-ready packaging",
        "WhatsApp and email support for order help",
        "Trusted for birthday, anniversary, and everyday gifting",
      ],
    },
    howTo: {
      heading: `How to Send a Gift to Someone in ${label}`,
      steps: [
        "Browse gifts above or shop by category — Flowers, Cakes, Bouquets, Hampers.",
        "Add to cart and enter the recipient's full US address in " + label + " at checkout.",
        "Pay securely with Stripe (USD) or Razorpay (INR).",
        "We pack carefully and ship for USA delivery.",
        "Your recipient receives a beautifully presented gift ready to celebrate.",
      ],
    },
    faqs: [
      {
        q: `How long does gift delivery take in ${label}?`,
        a: `Most orders reach ${label} addresses within standard nationwide windows after dispatch. Same-day options may be available in select cities when you order before the local cut-off.`,
      },
      {
        q: `Can I send gifts to ${label} from outside the USA?`,
        a: `Yes. Enter the recipient's ${label} shipping address at checkout. We accept orders worldwide and deliver within the United States.`,
      },
      {
        q: `Do you deliver to all cities in ${label}?`,
        a: `Yes. We deliver to every city, town, and ZIP code in ${label} as part of our all-50-states USA coverage.`,
      },
      {
        q: `Can I add a gift message?`,
        a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
      },
    ],
    relatedCategories: [...sharedCategories],
  };
}

const cityPages: CityPageContent[] = [
  stateContent(
    "california",
    "California",
    [
      "Los Angeles",
      "San Francisco Bay Area",
      "San Diego",
      "San Jose",
      "Sacramento",
      "Fresno",
      "Irvine",
      "Oakland",
      "Long Beach",
      "Silicon Valley",
    ],
    "California is one of our most popular delivery states — perfect for sending flowers and cakes to LA, the Bay Area, or San Diego."
  ),
  stateContent(
    "new-york",
    "New York",
    [
      "New York City (Manhattan, Brooklyn, Queens)",
      "Buffalo",
      "Rochester",
      "Albany",
      "Syracuse",
      "Yonkers",
      "Long Island",
      "Westchester",
    ],
    "From NYC boroughs to upstate communities, we deliver gifts across New York State."
  ),
  stateContent(
    "texas",
    "Texas",
    ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "Plano", "Irving", "Arlington"],
    "Send flowers, cakes, and hampers to Houston, Dallas, Austin, and beyond."
  ),
  stateContent("florida", "Florida", [
    "Miami",
    "Orlando",
    "Tampa",
    "Jacksonville",
    "Fort Lauderdale",
    "West Palm Beach",
    "Tallahassee",
  ]),
  stateContent(
    "new-jersey",
    "New Jersey",
    ["Newark", "Jersey City", "Edison", "Princeton", "Hoboken", "Woodbridge", "Iselin", "Fort Lee"],
    "Popular delivery areas include Edison, Jersey City, and Hoboken."
  ),
  {
    slug: "los-angeles",
    label: "Los Angeles",
    region: "city",
    state: "California",
    headline: "Send Gifts to Los Angeles, California — Flowers & Cakes",
    metaExtra: "Send flowers, cakes, and gifts to LA, Hollywood, Pasadena, Irvine & Los Angeles County.",
    intro: [
      "Los Angeles celebrations deserve beautiful gifts. If your recipient lives in LA — Downtown, the San Fernando Valley, West LA, or nearby Orange County — BlossomPot makes flower and cake delivery easy.",
      "Order from anywhere in the world. We fulfill for USA delivery to Los Angeles addresses with careful packaging and clear tracking.",
    ],
    delivery: {
      heading: "Gift Delivery in Los Angeles & Southern California",
      paragraphs: [
        "We deliver to Los Angeles neighborhoods, LA County cities, and nearby Southern California areas. Same-day options may appear when you order before the local cut-off.",
        "Whether the destination is an apartment near UCLA, a home in Pasadena, or an office in Downtown LA, enter the complete US address at checkout.",
      ],
    },
    areas: {
      heading: "LA Areas We Frequently Deliver To",
      items: [
        "Downtown LA & Hollywood",
        "Santa Monica & West LA",
        "Pasadena & San Gabriel Valley",
        "Torrance & South Bay",
        "Woodland Hills & San Fernando Valley",
        "Irvine & Orange County (nearby)",
      ],
    },
    whyUs: {
      heading: "Why LA Customers Trust BlossomPot",
      bullets: [
        "Flowers, cakes, and gift hampers for every occasion",
        "Clear delivery messaging for Southern California",
        "Gift messages on most products",
        "USD or INR checkout",
        "Dedicated WhatsApp support",
      ],
    },
    howTo: {
      heading: "Send a Gift to Los Angeles in 5 Easy Steps",
      steps: [
        "Pick flowers, cakes, or a hamper from the collection above.",
        "Add to cart and enter the Los Angeles delivery address.",
        "Choose USD or INR payment at checkout.",
        "We pack carefully for a premium unboxing.",
        "Recipient receives the gift ready to celebrate.",
      ],
    },
    faqs: [
      {
        q: "Do you deliver gifts to Los Angeles from outside the USA?",
        a: "Yes. Order on BlossomPot.com, enter the LA delivery address, and pay in USD or INR. We fulfill for delivery inside America.",
      },
      {
        q: "How fast is gift delivery to LA?",
        a: "Nationwide windows apply after dispatch; same-day options may be available in select LA areas when ordered before cut-off.",
      },
      {
        q: "Can I send flowers with cakes to Los Angeles?",
        a: "Yes. Browse flowers, cakes, and combo-style gifts to build a complete celebration package.",
      },
    ],
    relatedCategories: [...sharedCategories],
  },
  {
    slug: "san-francisco",
    label: "San Francisco",
    region: "city",
    state: "California",
    headline: "Send Gifts to San Francisco & Bay Area — USA Delivery",
    metaExtra: "Flower, cake, and gift delivery to San Francisco, Oakland, San Jose & Bay Area.",
    intro: [
      "The San Francisco Bay Area — including San Francisco, Oakland, San Jose, and Silicon Valley — is a popular destination for celebration gifts. BlossomPot helps you send flowers and cakes with premium presentation.",
      "Order from anywhere worldwide. We fulfill for United States delivery so Bay Area recipients get a smooth domestic experience.",
    ],
    delivery: {
      heading: "Bay Area Gift Delivery",
      paragraphs: [
        "We deliver to San Francisco city, the Peninsula, East Bay (Oakland, Fremont), and South Bay (San Jose, Sunnyvale).",
        "Professionals and students in the Bay Area often receive birthday and thank-you gifts — we pack orders carefully for a premium unboxing.",
      ],
    },
    areas: {
      heading: "Bay Area Locations We Serve",
      items: ["San Francisco", "Oakland", "San Jose", "Fremont", "Sunnyvale", "Palo Alto", "Berkeley", "Mountain View"],
    },
    whyUs: {
      heading: "Why Choose BlossomPot for San Francisco Delivery",
      bullets: [
        "Bay Area coverage with clear delivery expectations",
        "Premium flowers, bouquets, and cakes",
        "Combos with chocolates and curated hampers",
        "INR and USD checkout",
        "Email and WhatsApp order support",
      ],
    },
    howTo: {
      heading: "How to Send a Gift to San Francisco",
      steps: [
        "Select flowers, cakes, or a gift set from our shop.",
        "Enter the Bay Area US address at checkout.",
        "Pay with Stripe or Razorpay.",
        "We fulfill for USA delivery.",
        "Recipient enjoys a celebration-ready gift.",
      ],
    },
    faqs: [
      {
        q: "Do you deliver to Silicon Valley?",
        a: "Yes. We deliver to San Jose, Sunnyvale, Mountain View, Palo Alto, and all Bay Area cities.",
      },
      {
        q: "Can I order gifts for someone in SF from abroad?",
        a: "Yes. BlossomPot accepts orders worldwide with delivery to San Francisco addresses.",
      },
    ],
    relatedCategories: [...sharedCategories],
  },
  {
    slug: "chicago",
    label: "Chicago",
    region: "city",
    state: "Illinois",
    headline: "Send Gifts to Chicago, Illinois — Flowers & Cakes Online",
    metaExtra: "Send flowers, cakes, and gifts to Chicago, Naperville, Schaumburg & Chicagoland.",
    intro: [
      "Chicago and greater Chicagoland — including Naperville, Schaumburg, and Evanston — are popular gift destinations. Send flowers, cakes, and hampers with BlossomPot.",
      "Customers across the USA and abroad order here for birthdays and anniversaries. We deliver to Illinois addresses with careful packaging.",
    ],
    delivery: {
      heading: "Chicago & Illinois Gift Delivery",
      paragraphs: [
        "We ship to Chicago proper, suburban Cook County, DuPage County, and greater Illinois.",
        "Your gift arrives beautifully packed and ready for the celebration — add a personal message at checkout.",
      ],
    },
    areas: {
      heading: "Chicagoland Areas We Serve",
      items: ["Downtown Chicago", "Naperville", "Schaumburg", "Evanston", "Skokie", "Aurora", "Oak Brook"],
    },
    whyUs: {
      heading: "Why Chicago Families Choose BlossomPot",
      bullets: [
        "Illinois delivery with clear expectations",
        "Wide range of flowers, cakes, and gift combos",
        "Order from the USA or abroad with ease",
        "Secure online payment",
        "Celebration-ready packaging",
      ],
    },
    howTo: {
      heading: "Send a Gift to Chicago",
      steps: [
        "Browse and add gifts to cart.",
        "Enter Chicago-area US address.",
        "Checkout with USD or INR.",
        "Tracked USA delivery.",
        "Recipient receives a celebration-ready gift.",
      ],
    },
    faqs: [
      {
        q: "How long to deliver gifts to Chicago?",
        a: "Standard nationwide windows apply after dispatch to Chicago and most Illinois addresses.",
      },
      {
        q: "Do you deliver to Chicago suburbs?",
        a: "Yes. Naperville, Schaumburg, Evanston, and all Chicagoland suburbs are covered.",
      },
    ],
    relatedCategories: [...sharedCategories],
  },
  {
    slug: "houston",
    label: "Houston",
    region: "city",
    state: "Texas",
    headline: "Send Gifts to Houston, Texas — Flowers & Cakes",
    metaExtra: "Flower, cake, and gift delivery to Houston, Sugar Land, Katy & Greater Houston.",
    intro: [
      "Houston is one of Texas's busiest celebration cities. Whether your recipient lives in Sugar Land, Katy, the Energy Corridor, or central Houston, BlossomPot delivers flowers and cakes with dependable USA shipping.",
      "Order from anywhere — we fulfill for delivery inside America to Houston addresses.",
    ],
    delivery: {
      heading: "Houston & Greater Texas Delivery",
      paragraphs: [
        "We deliver throughout Houston, Harris County, and nearby Texas communities with email confirmation.",
        "Popular for birthdays, anniversaries, and thank-you gifts to Houston's tech, medical, and energy communities.",
      ],
    },
    areas: {
      heading: "Houston Areas We Serve",
      items: ["Downtown Houston", "Sugar Land", "Katy", "Pearland", "The Woodlands", "Cypress", "Memorial"],
    },
    whyUs: {
      heading: "Why Houston Orders BlossomPot",
      bullets: [
        "Texas delivery with clear timelines",
        "Flowers, cakes, and gift hampers",
        "Gift messages on most products",
        "INR payment for international shoppers",
        "Responsive customer support",
      ],
    },
    howTo: {
      heading: "How to Send a Gift to Houston",
      steps: [
        "Choose flowers, cakes, or a hamper.",
        "Enter Houston US address at checkout.",
        "Pay securely online.",
        "We fulfill for USA delivery.",
        "Recipient enjoys a celebration-ready gift.",
      ],
    },
    faqs: [
      {
        q: "Do you deliver to Sugar Land and Katy?",
        a: "Yes. We deliver to all Houston suburbs including Sugar Land, Katy, Pearland, and The Woodlands.",
      },
      {
        q: "Can I send gifts from abroad to Houston?",
        a: "Yes. Order on BlossomPot.com, enter the Houston address, and pay in USD or INR.",
      },
    ],
    relatedCategories: [...sharedCategories],
  },
];

const cityMap = new Map(cityPages.map((c) => [c.slug, c]));

export function getCityContent(slug: string): CityPageContent | undefined {
  return cityMap.get(slug);
}

export function allCityContent(): CityPageContent[] {
  return cityPages;
}
