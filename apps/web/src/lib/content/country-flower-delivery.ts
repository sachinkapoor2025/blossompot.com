import type { Metadata } from "next";
import { categoryHref } from "@/lib/category-urls";
import { pageMetadata } from "@/lib/seo";
import { countriesMenu } from "@/lib/site";
import { locationPublicPath } from "@/lib/content/seo-data";

export type CountryFlowerDeliverySlug = (typeof countriesMenu.items)[number]["slug"];

export type CountryFlowerFaq = { q: string; a: string };

export type CountryFlowerSection = {
  h3: string;
  text: string;
};

export type CountryFlowerLink = {
  label: string;
  href: string;
};

export type CountryFlowerDeliveryContent = {
  slug: CountryFlowerDeliverySlug;
  href: string;
  menuLabel: string;
  countryName: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  availability: string;
  howItWorksHeading: string;
  howItWorks: string;
  categoriesHeading: string;
  categoriesIntro: string;
  categories: CountryFlowerLink[];
  occasionsHeading: string;
  occasions: CountryFlowerSection[];
  citiesHeading: string;
  citiesIntro: string;
  cityLinks: CountryFlowerLink[];
  whyHeading: string;
  whyPoints: string[];
  ctaHeading: string;
  ctaText: string;
  primaryCta: CountryFlowerLink;
  secondaryCta: CountryFlowerLink;
  faqs: CountryFlowerFaq[];
  relatedHubs: CountryFlowerLink[];
  locale: string;
  serviceMode: "destination" | "origin";
};

const flowers = { label: "Fresh flowers", href: categoryHref("flowers") };
const bouquets = { label: "Flower bouquets", href: categoryHref("flower-bouquets") };
const cakes = { label: "Celebration cakes", href: categoryHref("cakes") };
const hampers = { label: "Gift hampers", href: categoryHref("gift-hampers") };
const birthday = { label: "Birthday gifts", href: categoryHref("birthday-gifts") };
const anniversary = { label: "Anniversary gifts", href: categoryHref("anniversary-gifts") };
const valentines = { label: "Valentine's gifts", href: categoryHref("valentines-day-gifts") };
const mothers = { label: "Mother's Day gifts", href: categoryHref("mothers-day-gifts") };
const sameDay = { label: "Same-day delivery", href: categoryHref("same-day-gifts") };
const wedding = { label: "Wedding gifts", href: categoryHref("wedding-gifts") };
const celebration = { label: "Celebration gifts", href: categoryHref("celebration-gifts") };

const PAGES: Record<CountryFlowerDeliverySlug, CountryFlowerDeliveryContent> = {
  usa: {
    slug: "usa",
    href: "/flower-delivery-usa",
    menuLabel: "Flower Delivery in USA",
    countryName: "United States",
    title: "Flower Delivery in USA | Fresh Flowers Nationwide | BlossomPot",
    description:
      "Order flower delivery in the USA. Fresh bouquets, same-day options in select cities, cakes and gift hampers with nationwide shipping to all 50 states.",
    h1: "Flower Delivery in the USA",
    intro:
      "BlossomPot delivers flowers, bouquets, cakes, and curated gift hampers across the United States. Recipients in all 50 states, the District of Columbia, and Puerto Rico can receive a gift from our catalog — whether you are ordering from the same city or from another country. This USA flower delivery page is the destination hub: ZIP-level timing, same-day windows where coverage allows, and the collections people actually send for birthdays, anniversaries, Valentine’s Day, and Mother’s Day. We pack from within America so stems and celebration cakes travel on a domestic path, not an invented network of local florist storefronts in every town.",
    availability:
      "Nationwide USA destination coverage is live. Same-day flower delivery depends on the recipient ZIP and the local cut-off — it is not a promise for every address. Standard nationwide windows typically take several business days with tracking.",
    howItWorksHeading: "How USA flower delivery works",
    howItWorks:
      "Choose an arrangement or gift, add a personal message, and enter the recipient’s US street, city, state, and ZIP at checkout. Stripe accepts USD cards; Razorpay is available for INR when enabled. After payment you receive confirmation and can follow order status. For a specific city, open that location page — for example gifts to California, New York, Texas, or Florida — to see timezone-aware cut-offs instead of a single national clock.",
    categoriesHeading: "Flowers and gifts to send in the USA",
    categoriesIntro:
      "Start with fresh flowers or a signature bouquet, then add a cake or hamper when you want the gift to feel complete. Same-day collections appear only for eligible destinations before cut-off.",
    categories: [flowers, bouquets, cakes, hampers, birthday, valentines, mothers, sameDay],
    occasionsHeading: "USA occasions people send flowers for",
    occasions: [
      {
        h3: "Birthdays and thank-yous across all 50 states",
        text: "A mixed bouquet or rose dozen still leads US birthday orders. Pair flowers with a celebration cake when the recipient is hosting at home. Nationwide shipping covers college towns and suburbs that rarely have same-day florist vans — those addresses use the standard window.",
      },
      {
        h3: "Valentine’s Day and Mother’s Day peaks",
        text: "US Valentine’s Day (February 14) and Mother’s Day (second Sunday in May) are the two largest flower weeks. Order early in peak weeks; same-day inventory is ZIP-limited. Red roses, mixed pastels, and gift hampers with chocolates are the usual catalog starting points.",
      },
      {
        h3: "Thanksgiving, graduations, and sympathy",
        text: "Autumn centerpieces and graduation bouquets follow the US school and holiday calendar. Sympathy and thank-you sends use calmer palettes. Check the destination city page if a US federal holiday might shift carrier pickup.",
      },
    ],
    citiesHeading: "Popular USA flower delivery cities",
    citiesIntro:
      "These destination pages stay the canonical city and state URLs. Use them for cut-offs and local FAQs rather than duplicating coverage here.",
    cityLinks: [
      { label: "California", href: locationPublicPath("california") },
      { label: "New York", href: locationPublicPath("new-york") },
      { label: "Texas", href: locationPublicPath("texas") },
      { label: "Florida", href: locationPublicPath("florida") },
      { label: "Los Angeles", href: locationPublicPath("los-angeles") },
      { label: "Chicago", href: locationPublicPath("chicago") },
      { label: "Houston", href: locationPublicPath("houston") },
      { label: "Miami", href: locationPublicPath("miami") },
    ],
    whyHeading: "Why order USA flower delivery with BlossomPot",
    whyPoints: [
      "Live destination coverage in all 50 states, DC, and Puerto Rico.",
      "Same-day options only where the ZIP and clock actually allow them.",
      "Secure checkout with Stripe (USD) or Razorpay (INR) and a personal gift message.",
      "City and state pages that already exist — this country page does not replace /gifts-to-* URLs.",
    ],
    ctaHeading: "Send flowers in the United States today",
    ctaText:
      "Browse fresh arrangements, or open the nationwide location index if you still need to confirm a city.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "All USA locations", href: "/delivery-locations" },
    faqs: [
      {
        q: "Does BlossomPot deliver flowers to every US state?",
        a: "Yes. Destination flower delivery includes all 50 states, DC, and Puerto Rico. Timing still depends on the recipient ZIP and product type.",
      },
      {
        q: "Can I get same-day flower delivery in the USA?",
        a: "Same-day is available for eligible ZIP codes before the local cut-off. Open the recipient’s city page or the same-day collection to check whether that address qualifies.",
      },
      {
        q: "Can someone outside the USA order flowers for a US recipient?",
        a: "Yes. Shoppers can pay on this site and enter a United States delivery address for gifts in the USA catalog.",
      },
      {
        q: "Where should I go for a specific city?",
        a: "Use the /gifts-to-{city-or-state} pages or the delivery locations index. Those remain the canonical URLs for local cut-offs.",
      },
    ],
    relatedHubs: [
      { label: "USA country hub", href: "/locations/united-states" },
      { label: "Delivery locations index", href: "/delivery-locations" },
      { label: "Same-day delivery", href: "/same-day-delivery" },
      { label: "Shipping & delivery", href: "/shipping" },
    ],
    locale: "en-US",
    serviceMode: "destination",
  },
  uk: {
    slug: "uk",
    href: "/flower-delivery-uk",
    menuLabel: "Flower Delivery in UK",
    countryName: "United Kingdom",
    title: "Flower Delivery in UK | Flowers to England, Scotland, Wales & NI | BlossomPot",
    description:
      "Order flower delivery in the UK. Shop bouquets, cakes and gift hampers for England, Scotland, Wales and Northern Ireland — London, Manchester and nationwide UK delivery.",
    h1: "Flower Delivery in the UK",
    intro:
      "BlossomPot delivers flowers, bouquets, cakes, and gift hampers to addresses across the United Kingdom. Shop the UK catalog, add a gift message, and enter the recipient’s UK street, city, and postcode at checkout. This page is the UK destination hub — London, Manchester, and the rest of Britain — with collections for birthdays, anniversaries, Mothering Sunday, and everyday thank-yous.",
    availability:
      "UK destination coverage is live for gifts in the United Kingdom catalog. Timing depends on the recipient postcode and product. Same-day options appear only where coverage and the local cut-off allow.",
    howItWorksHeading: "How flower delivery works in the UK",
    howItWorks:
      "Choose an arrangement or gift from the UK catalog, add a personal message, and enter the recipient’s United Kingdom address at checkout. Pay securely, then follow order status after confirmation. For London or Manchester notes, open those city pages. Use a UK postcode for the recipient — not an overseas ZIP.",
    categoriesHeading: "Flowers and gifts to send in the UK",
    categoriesIntro:
      "Roses and mixed bouquets lead UK birthday and thank-you orders. Cakes and hampers suit hosts at home, and anniversary collections cover milestone dates on the UK calendar.",
    categories: [flowers, bouquets, anniversary, birthday, cakes, hampers, valentines, mothers],
    occasionsHeading: "UK dates that change how you order",
    occasions: [
      {
        h3: "Mothering Sunday",
        text: "UK Mothering Sunday falls three weeks before Easter, usually in March. Order early in that week and enter the recipient’s UK postcode to see available windows.",
      },
      {
        h3: "Christmas, Boxing Day, and bank holidays",
        text: "UK bank holidays and Boxing Day can shift carrier pickup. Leave an extra business day around Christmas Eve and New Year for UK addresses.",
      },
      {
        h3: "Birthdays and thank-yous",
        text: "A bouquet plus a short gift message is the usual combination for UK birthdays. Add a hamper when you want the box to feel fuller.",
      },
    ],
    citiesHeading: "Popular UK flower delivery cities",
    citiesIntro:
      "Start with London or Manchester, or browse the UK location hub for more cities and regions.",
    cityLinks: [
      { label: "London", href: "/locations/europe/united-kingdom/london" },
      { label: "Manchester", href: "/locations/europe/united-kingdom/manchester" },
    ],
    whyHeading: "Why order UK flower delivery with BlossomPot",
    whyPoints: [
      "UK catalog gifts chosen for delivery inside the United Kingdom.",
      "English-first checkout and gift messages.",
      "City pages for London and Manchester ordering notes.",
      "Secure payment and a personal gift message on most products.",
    ],
    ctaHeading: "Send flowers in the UK today",
    ctaText:
      "Pick a bouquet from the UK catalog, then enter the recipient’s UK postcode at checkout.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "UK locations", href: "/locations/europe/united-kingdom" },
    faqs: [
      {
        q: "Do you deliver flowers to UK addresses?",
        a: "Yes. This UK flower delivery page is for gifts deliverable to the United Kingdom. Enter the recipient’s UK postcode at checkout.",
      },
      {
        q: "What address do I enter at checkout?",
        a: "The recipient’s UK street, city, and postcode.",
      },
      {
        q: "Do you offer same-day flower delivery in the UK?",
        a: "Same-day options appear only where coverage and the local cut-off allow. Check the product page and checkout guidance for that postcode.",
      },
      {
        q: "Can I pay with a UK card?",
        a: "Yes. Checkout accepts major cards via Stripe. Catalog prices may be shown in USD or your selected display currency.",
      },
    ],
    relatedHubs: [
      { label: "United Kingdom hub", href: "/locations/europe/united-kingdom" },
      { label: "Shop flowers", href: categoryHref("flowers") },
      { label: "Shipping & delivery", href: "/shipping" },
      { label: "Contact us", href: "/contact" },
    ],
    locale: "en-GB",
    serviceMode: "destination",
  },
  canada: {
    slug: "canada",
    href: "/flower-delivery-canada",
    menuLabel: "Flower Delivery in Canada",
    countryName: "Canada",
    title: "Flower Delivery in Canada | Flowers to Ontario, BC, Alberta & Quebec | BlossomPot",
    description:
      "Order flower delivery in Canada. Shop bouquets, cakes and gift hampers for Ontario, British Columbia, Alberta, Quebec and nationwide Canadian delivery.",
    h1: "Flower Delivery in Canada",
    intro:
      "BlossomPot delivers flowers, bouquets, cakes, and gift hampers to addresses across Canada. Shop the Canada catalog, add a gift message, and enter the recipient’s Canadian street, city, province, and postal code at checkout. This page is the Canada destination hub for Toronto, Vancouver, Montreal, Calgary, and the rest of the country.",
    availability:
      "Canada destination coverage is live for gifts in the Canadian catalog. Timing depends on the recipient postal code and product. Same-day options appear only where coverage and the local cut-off allow.",
    howItWorksHeading: "How flower delivery works in Canada",
    howItWorks:
      "Choose a gift from the Canada catalog, add a personal message, and enter the recipient’s Canadian address at checkout. Pay securely, then follow order status after confirmation. Open Ontario, British Columbia, Alberta, or Quebec pages for regional notes. Use a Canadian postal code for the recipient.",
    categoriesHeading: "Flowers and gifts to send in Canada",
    categoriesIntro:
      "Birthday and thank-you orders often start with mixed flowers or a rose bouquet. Hampers travel well when you want snacks and treats alongside blooms.",
    categories: [flowers, bouquets, hampers, birthday, cakes, anniversary, sameDay, mothers],
    occasionsHeading: "Canadian dates that change how you order",
    occasions: [
      {
        h3: "Canadian Thanksgiving",
        text: "Canada celebrates Thanksgiving on the second Monday of October. Order early that week and enter the recipient’s Canadian postal code for available windows.",
      },
      {
        h3: "Victoria Day and Canada Day",
        text: "Victoria Day and Canada Day can shift when shoppers remember to order and when carriers pick up. Leave an extra business day around those long weekends.",
      },
      {
        h3: "Birthdays across the provinces",
        text: "A bouquet plus a short gift message is the usual combination. Add a cake or hamper when the recipient is hosting at home.",
      },
    ],
    citiesHeading: "Popular Canadian cities and provinces",
    citiesIntro:
      "Start with Ontario, British Columbia, Alberta, or Quebec, or browse the Canada hub for more locations.",
    cityLinks: [
      { label: "Ontario", href: "/locations/canada/ontario" },
      { label: "British Columbia", href: "/locations/canada/british-columbia" },
      { label: "Alberta", href: "/locations/canada/alberta" },
      { label: "Quebec", href: "/locations/canada/quebec" },
    ],
    whyHeading: "Why order Canada flower delivery with BlossomPot",
    whyPoints: [
      "Canada catalog gifts chosen for delivery inside Canada.",
      "Province pages for Ontario, BC, Alberta, and Quebec.",
      "English checkout and gift messages.",
      "Secure payment and tracking after dispatch.",
    ],
    ctaHeading: "Send flowers in Canada today",
    ctaText:
      "Choose a bouquet from the Canada catalog, then enter the recipient’s Canadian postal code at checkout.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Canada locations", href: "/locations/canada" },
    faqs: [
      {
        q: "Can I deliver flowers to a Canadian address?",
        a: "Yes. This page is for gifts deliverable in Canada. Enter the recipient’s Canadian postal code at checkout.",
      },
      {
        q: "What address do I enter at checkout?",
        a: "The recipient’s Canadian street, city, province, and postal code.",
      },
      {
        q: "Do you offer same-day delivery in Canada?",
        a: "Same-day options appear only where coverage and the local cut-off allow. Check the product page for that postal code.",
      },
      {
        q: "Can I pay with a Canadian card?",
        a: "Yes. Checkout accepts major cards via Stripe. Catalog prices may be shown in USD or your selected display currency.",
      },
    ],
    relatedHubs: [
      { label: "Canada hub", href: "/locations/canada" },
      { label: "Shop flowers", href: categoryHref("flowers") },
      { label: "Shipping", href: "/shipping" },
      { label: "Contact us", href: "/contact" },
    ],
    locale: "en-CA",
    serviceMode: "destination",
  },
  australia: {
    slug: "australia",
    href: "/flower-delivery-australia",
    menuLabel: "Flower Delivery in Australia",
    countryName: "Australia",
    title: "Flower Delivery in Australia | Flowers to NSW, Victoria, QLD & WA | BlossomPot",
    description:
      "Order flower delivery in Australia. Shop bouquets, cakes and gift hampers for New South Wales, Victoria, Queensland, Western Australia and nationwide Australian delivery.",
    h1: "Flower Delivery in Australia",
    intro:
      "BlossomPot delivers flowers, bouquets, cakes, and gift hampers to addresses across Australia. Shop the Australia catalog, add a gift message, and enter the recipient’s Australian street, suburb, state, and postcode at checkout. This page is the Australia destination hub for Sydney, Melbourne, Brisbane, Perth, and the rest of the country.",
    availability:
      "Australia destination coverage is live for gifts in the Australian catalog. Timing depends on the recipient postcode and product. Same-day options appear only where coverage and the local cut-off allow.",
    howItWorksHeading: "How flower delivery works in Australia",
    howItWorks:
      "Choose a gift from the Australia catalog, add a personal message, and enter the recipient’s Australian address at checkout. Pay securely, then follow order status after confirmation. Open New South Wales, Victoria, Queensland, or Western Australia pages for state notes.",
    categoriesHeading: "Flowers and gifts to send in Australia",
    categoriesIntro:
      "Garden-style mixed bouquets and roses are the usual start. Cakes and hampers suit birthdays and thank-yous when the recipient is hosting at home.",
    categories: [flowers, bouquets, mothers, birthday, hampers, cakes, anniversary, valentines],
    occasionsHeading: "Australian dates that change how you order",
    occasions: [
      {
        h3: "Father’s Day in September",
        text: "Australian Father’s Day is the first Sunday in September. Order early that week and enter the recipient’s Australian postcode.",
      },
      {
        h3: "Valentine’s Day in summer",
        text: "February 14 is high summer in Australia. Order early in that week for popular rose and mixed bouquets.",
      },
      {
        h3: "Christmas in summer",
        text: "Leave extra time around Christmas Eve and New Year for Australian addresses, especially when a public holiday falls mid-week.",
      },
    ],
    citiesHeading: "Popular Australian states",
    citiesIntro:
      "Start with New South Wales, Victoria, Queensland, or Western Australia, or browse the Australia hub.",
    cityLinks: [
      { label: "New South Wales", href: "/locations/australia/new-south-wales" },
      { label: "Victoria", href: "/locations/australia/victoria" },
      { label: "Queensland", href: "/locations/australia/queensland" },
      { label: "Western Australia", href: "/locations/australia/western-australia" },
    ],
    whyHeading: "Why order Australia flower delivery with BlossomPot",
    whyPoints: [
      "Australia catalog gifts chosen for delivery inside Australia.",
      "State pages for NSW, Victoria, Queensland, and Western Australia.",
      "English checkout and gift messages.",
      "Secure payment and tracking after dispatch.",
    ],
    ctaHeading: "Send flowers in Australia today",
    ctaText:
      "Choose an arrangement from the Australia catalog, then enter the recipient’s Australian postcode at checkout.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Australia locations", href: "/locations/australia" },
    faqs: [
      {
        q: "Do you deliver flowers to Sydney or Melbourne addresses?",
        a: "Yes. This page is for gifts deliverable in Australia, including major cities and states in the Australia catalog.",
      },
      {
        q: "What address do I enter at checkout?",
        a: "The recipient’s Australian street, suburb, state, and postcode.",
      },
      {
        q: "Do you offer same-day delivery in Australia?",
        a: "Same-day options appear only where coverage and the local cut-off allow. Check the product page for that postcode.",
      },
      {
        q: "Can I pay with an Australian card?",
        a: "Yes. Checkout accepts major cards via Stripe. Catalog prices may be shown in USD or your selected display currency.",
      },
    ],
    relatedHubs: [
      { label: "Australia hub", href: "/locations/australia" },
      { label: "Shop flowers", href: categoryHref("flowers") },
      { label: "Flower guide", href: "/flower-guide" },
      { label: "Shipping", href: "/shipping" },
    ],
    locale: "en-AU",
    serviceMode: "destination",
  },
  uae: {
    slug: "uae",
    href: "/flower-delivery-uae",
    menuLabel: "Flower Delivery in UAE",
    countryName: "United Arab Emirates",
    title: "Flower Delivery in UAE | Flowers to Dubai, Abu Dhabi & Sharjah | BlossomPot",
    description:
      "Order flower delivery in the UAE. Shop bouquets, cakes and gift hampers for Dubai, Abu Dhabi, Sharjah and nationwide UAE delivery.",
    h1: "Flower Delivery in the UAE",
    intro:
      "BlossomPot delivers flowers, bouquets, cakes, and gift hampers to addresses in the United Arab Emirates. Shop the UAE catalog, add a gift message, and enter the recipient’s UAE street, city, and emirate at checkout. This page is the UAE destination hub for Dubai, Abu Dhabi, Sharjah, and the other emirates.",
    availability:
      "UAE destination coverage is live for gifts in the UAE catalog. Timing depends on the recipient city and product. Same-day options appear only where coverage and the local cut-off allow.",
    howItWorksHeading: "How flower delivery works in the UAE",
    howItWorks:
      "Choose a gift from the UAE catalog, add a personal message, and enter the recipient’s UAE address at checkout. Pay securely, then follow order status after confirmation. Dubai, Abu Dhabi, and Sharjah are the usual destination cities.",
    categoriesHeading: "Flowers and gifts to send in the UAE",
    categoriesIntro:
      "Premium rose bouquets and mixed luxury arrangements are common starting points. Celebration gifts and hampers suit Eid, graduations, and housewarmings.",
    categories: [flowers, bouquets, celebration, hampers, anniversary, birthday, cakes, valentines],
    occasionsHeading: "UAE occasions that change how you order",
    occasions: [
      {
        h3: "Ramadan and Eid gifting",
        text: "Ramadan and Eid al-Fitr / Eid al-Adha follow the lunar calendar, so dates move each year. Order early for Eid week and enter the recipient’s UAE city at checkout.",
      },
      {
        h3: "UAE National Day and New Year",
        text: "UAE National Day (2 December) and the Dubai New Year period are busy. Leave extra time around those dates for popular bouquets.",
      },
      {
        h3: "Heat and vase life",
        text: "Choose sturdy catalog arrangements and keep indoor delivery in mind. Check product guidance for the destination city.",
      },
    ],
    citiesHeading: "Popular UAE cities",
    citiesIntro: "Start with Dubai, Abu Dhabi, or Sharjah — the usual destination cities in the UAE catalog.",
    cityLinks: [
      { label: "Dubai", href: "/flower-delivery-uae" },
      { label: "Abu Dhabi", href: "/flower-delivery-uae" },
      { label: "Sharjah", href: "/flower-delivery-uae" },
    ],
    whyHeading: "Why order UAE flower delivery with BlossomPot",
    whyPoints: [
      "UAE catalog gifts chosen for delivery inside the United Arab Emirates.",
      "English catalog and gift messages.",
      "City notes for Dubai, Abu Dhabi, and Sharjah.",
      "Secure payment and tracking after dispatch.",
    ],
    ctaHeading: "Send flowers in the UAE today",
    ctaText:
      "Choose a bouquet from the UAE catalog, then enter the recipient’s UAE address at checkout.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Contact us", href: "/contact" },
    faqs: [
      {
        q: "Do you deliver flowers to Dubai or Abu Dhabi addresses?",
        a: "Yes. This UAE page is for gifts deliverable in the United Arab Emirates. Enter the recipient’s UAE city and address at checkout.",
      },
      {
        q: "What address should I enter at checkout?",
        a: "The recipient’s UAE street, city, and emirate.",
      },
      {
        q: "Do you offer same-day delivery in the UAE?",
        a: "Same-day options appear only where coverage and the local cut-off allow. Check the product page for that city.",
      },
      {
        q: "Can I pay with a UAE card?",
        a: "Yes. Checkout accepts major cards via Stripe. Catalog prices may be shown in USD or your selected display currency.",
      },
    ],
    relatedHubs: [
      { label: "Shop flowers", href: categoryHref("flowers") },
      { label: "Flower guide", href: "/flower-guide" },
      { label: "Shipping", href: "/shipping" },
      { label: "Contact us", href: "/contact" },
    ],
    locale: "en-AE",
    serviceMode: "destination",
  },
};

export const countryFlowerDeliveryPages: CountryFlowerDeliveryContent[] =
  countriesMenu.items.map((item) => PAGES[item.slug]);

export function flowerDeliveryCountryIso(slug: CountryFlowerDeliverySlug): string {
  const map: Record<CountryFlowerDeliverySlug, string> = {
    usa: "US",
    uk: "GB",
    canada: "CA",
    australia: "AU",
    uae: "AE",
  };
  return map[slug];
}

export function flowerDeliverySlugForIso(countryIso: string): CountryFlowerDeliverySlug | null {
  const iso = countryIso.trim().toUpperCase();
  const found = (Object.keys(PAGES) as CountryFlowerDeliverySlug[]).find(
    (slug) => flowerDeliveryCountryIso(slug) === iso
  );
  return found ?? null;
}

export function getCountryFlowerDelivery(
  slug: CountryFlowerDeliverySlug
): CountryFlowerDeliveryContent {
  return PAGES[slug];
}

export function countryFlowerDeliveryMetadata(slug: CountryFlowerDeliverySlug): Metadata {
  const page = PAGES[slug];
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: page.href,
    absoluteTitle: true,
  });
}

export function otherCountryFlowerDeliveryLinks(
  slug: CountryFlowerDeliverySlug
): CountryFlowerLink[] {
  return countryFlowerDeliveryPages
    .filter((page) => page.slug !== slug)
    .map((page) => ({ label: page.menuLabel, href: page.href }));
}
