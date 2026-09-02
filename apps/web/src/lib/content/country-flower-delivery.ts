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
        a: "Yes. Shoppers in the UK, Canada, Australia, the UAE, and elsewhere can pay on this site and enter a United States delivery address.",
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
    title: "Flower Delivery in UK | Send Flowers from Britain | BlossomPot",
    description:
      "Flower delivery in the UK for shoppers sending bouquets, cakes and gifts to the USA. London and Manchester ordering notes, Mothering Sunday, and checkout guidance.",
    h1: "Flower Delivery in the UK",
    intro:
      "Flower delivery in the UK with BlossomPot means a reliable way for people in England, Scotland, Wales, and Northern Ireland to send fresh flowers, cakes, and gift hampers to someone who lives in the United States. Shared language and dense family ties to the US East Coast make Britain our primary European origin market. This page is not a claim that we run florist vans through every UK postcode. You shop the same catalog, pay securely, and enter a US city, state, and ZIP for the recipient. London and Manchester have their own ordering guides because a City worker sending to New York is not the same checkout problem as a Manchester sender targeting Chicago or Texas.",
    availability:
      "Live service: order from the United Kingdom for delivery to a US address. Destination florist coverage inside UK postcodes is not published. If that ever changes, the UK hub will say so in plain language.",
    howItWorksHeading: "How flower delivery works from the UK",
    howItWorks:
      "Open blossompot.com from the UK, choose flowers or a gift, write the card message, and enter the recipient’s United States address — not a UK postcode. London is typically five hours ahead of New York (four during British Summer Time). A 4 p.m. order in Britain can already be past a US same-day cut-off. When the occasion is tight, order the previous UK calendar morning. Stripe charges in USD; UK-issued cards usually work for international e-commerce. Tracking follows the US fulfillment path after dispatch.",
    categoriesHeading: "What UK shoppers send most often",
    categoriesIntro:
      "Roses and mixed bouquets lead UK-to-USA orders. Cakes and hampers are popular when the recipient is hosting, and anniversary collections cover milestone dates that fall on US time.",
    categories: [flowers, bouquets, anniversary, birthday, cakes, hampers, valentines, mothers],
    occasionsHeading: "UK dates that change how you order",
    occasions: [
      {
        h3: "Mothering Sunday is not US Mother’s Day",
        text: "UK Mothering Sunday falls three weeks before Easter, usually in March. US Mother’s Day is the second Sunday in May. Confirm which country’s occasion you mean before you pick a delivery window, then check the recipient’s US city cut-off.",
      },
      {
        h3: "Christmas, Boxing Day, and bank holidays",
        text: "UK bank holidays and Boxing Day do not move US carrier calendars. If you are sending for a US Christmas Eve arrival, convert from GMT/BST to the destination timezone and leave an extra business day around US federal holidays.",
      },
      {
        h3: "Birthdays and transatlantic thank-yous",
        text: "Many UK orders are birthday flowers for relatives in New York, New Jersey, Massachusetts, California, and Florida. A bouquet plus a short gift message is the usual combination; add a hamper when you want the box to feel fuller.",
      },
    ],
    citiesHeading: "UK ordering cities and US destinations",
    citiesIntro:
      "Use the United Kingdom hub for London and Manchester notes. Popular US destinations for British senders are listed on those pages and on the USA flower delivery hub.",
    cityLinks: [
      { label: "United Kingdom hub", href: "/locations/europe/united-kingdom" },
      { label: "London", href: "/locations/europe/united-kingdom/london" },
      { label: "Manchester", href: "/locations/europe/united-kingdom/manchester" },
      { label: "Europe markets", href: "/locations/europe" },
      { label: "Gifts to New York", href: locationPublicPath("new-york") },
      { label: "Gifts to California", href: locationPublicPath("california") },
    ],
    whyHeading: "Why UK shoppers use BlossomPot",
    whyPoints: [
      "English-first checkout and gift messages without a scraped UK florist directory.",
      "Clear time-zone math versus US same-day cut-offs — especially the London-to-New-York gap.",
      "Honest coverage: we do not invent a florist on every high street.",
      "Secure payment with a UK-issued card via Stripe in USD when your issuer allows it.",
    ],
    ctaHeading: "Send flowers from the UK today",
    ctaText:
      "Pick a bouquet, then enter the US delivery address at checkout. Open the UK hub if you need London or Manchester ordering notes.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "UK ordering hub", href: "/locations/europe/united-kingdom" },
    faqs: [
      {
        q: "Do you deliver flowers to UK addresses?",
        a: "Not as a published destination service. This UK flower delivery page helps you send flowers and gifts into the United States from Britain.",
      },
      {
        q: "What address do I enter at checkout?",
        a: "The recipient’s US street, city, state, and ZIP. Do not enter a UK postcode as the delivery address unless a future destination page says that city is live.",
      },
      {
        q: "How do I avoid missing a US same-day window from London?",
        a: "New York is five hours behind GMT (four behind BST). Order in the UK morning, or the previous calendar day, and confirm the cut-off on the recipient’s US city page.",
      },
      {
        q: "Can I pay with a UK card?",
        a: "Yes, via Stripe in USD when your card issuer allows international e-commerce. Catalog prices are not automatically converted to GBP on every page.",
      },
    ],
    relatedHubs: [
      { label: "United Kingdom hub", href: "/locations/europe/united-kingdom" },
      { label: "Europe markets", href: "/locations/europe" },
      { label: "USA flower delivery", href: "/flower-delivery-usa" },
      { label: "All locations", href: "/locations" },
    ],
    locale: "en-GB",
    serviceMode: "origin",
  },
  canada: {
    slug: "canada",
    href: "/flower-delivery-canada",
    menuLabel: "Flower Delivery in Canada",
    countryName: "Canada",
    title: "Flower Delivery in Canada | Send Flowers to the USA | BlossomPot",
    description:
      "Flower delivery in Canada for shoppers sending bouquets, cakes and gifts to the USA. Time zones, GST/HST notes, and guides for Ontario, BC, Alberta and Quebec.",
    h1: "Flower Delivery in Canada",
    intro:
      "Flower delivery in Canada with BlossomPot is built for people in Toronto, Vancouver, Montreal, Calgary, and the rest of the country who need to send flowers, cakes, and gift hampers to family and friends in the United States. Canada is an origin market: you browse the catalog, pay securely, and enter a US city, state, and ZIP. We do not publish florist coverage for Canadian postal codes, and we will not list fake same-day van routes across Toronto or Vancouver. The distinction matters in winter especially — a Vancouver 9 a.m. order is already midday in New York, which can decide whether a US same-day cut-off is still open.",
    availability:
      "Live service: send gifts from Canada to US addresses. Destination delivery inside Canada is not claimed on this page. Province hubs exist to help Canadian shoppers order correctly.",
    howItWorksHeading: "How flower delivery works from Canada",
    howItWorks:
      "Shop from Canada on blossompot.com, add a gift message, and type the recipient’s United States address. Canadian postal codes are not delivery destinations today. Checkout shows USD on Stripe or INR on Razorpay when that rail is enabled — your card-issuing country can still be Canada. GST/HST on a card statement depends on the processor and is separate from any US sales tax on the destination order. After payment, tracking follows the US fulfillment path.",
    categoriesHeading: "Flowers and gifts Canadian shoppers choose",
    categoriesIntro:
      "Cross-border birthday and thank-you orders often start with mixed flowers or a rose bouquet. Hampers travel well when you want snacks and treats alongside blooms, and same-day US collections apply only to the recipient ZIP.",
    categories: [flowers, bouquets, hampers, birthday, cakes, anniversary, sameDay, mothers],
    occasionsHeading: "Canadian calendar notes for US flower delivery",
    occasions: [
      {
        h3: "Canadian Thanksgiving is in October",
        text: "Canada celebrates Thanksgiving on the second Monday of October — weeks before the US holiday. If you are sending “Thanksgiving flowers,” confirm which country’s date you mean so the arrangement does not arrive for the wrong weekend.",
      },
      {
        h3: "Victoria Day, Canada Day, and US holidays",
        text: "Victoria Day and Canada Day change when Canadian shoppers remember to order; they do not move US carrier holidays. Convert from your province clock to the recipient ZIP before relying on same-day.",
      },
      {
        h3: "Birthdays for relatives in California, New York, and Florida",
        text: "Those three US hubs come up often because of family ties and winter travel. Open the matching /gifts-to-* page for cut-offs, then send flowers, a cake, or both.",
      },
    ],
    citiesHeading: "Canadian provinces and popular US destinations",
    citiesIntro:
      "Province and city guides explain ordering from Ontario, British Columbia, Alberta, and Quebec — not local florist coverage.",
    cityLinks: [
      { label: "Canada hub", href: "/locations/canada" },
      { label: "Ontario", href: "/locations/canada/ontario" },
      { label: "British Columbia", href: "/locations/canada/british-columbia" },
      { label: "Alberta", href: "/locations/canada/alberta" },
      { label: "Quebec", href: "/locations/canada/quebec" },
      { label: "Gifts to Washington", href: locationPublicPath("washington") },
      { label: "Gifts to New York", href: locationPublicPath("new-york") },
      { label: "Gifts to California", href: locationPublicPath("california") },
    ],
    whyHeading: "Why Canadian shoppers choose BlossomPot",
    whyPoints: [
      "Clear origin-market messaging — no fake Toronto or Vancouver florist listings.",
      "Time-zone coverage from Atlantic through Pacific so you can judge US cut-offs.",
      "Canadian-issued cards can pay in USD via Stripe when the issuer allows it.",
      "Direct links to the US destination pages your relatives actually live in.",
    ],
    ctaHeading: "Send flowers from Canada today",
    ctaText:
      "Choose a bouquet, then enter the US delivery ZIP. Open the Canada hub if you need province-level ordering notes.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Canada ordering hub", href: "/locations/canada" },
    faqs: [
      {
        q: "Can I deliver flowers to a Canadian address?",
        a: "Not as a published destination service. This page helps you send flowers into the United States. We will not list fake Toronto or Vancouver coverage.",
      },
      {
        q: "What if I enter a Canadian postal code at checkout?",
        a: "US ZIPs are the live delivery destinations. Use the recipient’s United States street, city, state, and ZIP unless a future destination page says a Canadian city is live.",
      },
      {
        q: "Which US destinations do Canadian shoppers use most?",
        a: "California, New York, Texas, Florida, and Washington come up often. Open those gift-to pages for local cut-offs.",
      },
      {
        q: "Will I be charged GST/HST?",
        a: "Tax on your card statement depends on the payment processor. It is separate from US sales tax that may apply on the destination order.",
      },
    ],
    relatedHubs: [
      { label: "Canada hub", href: "/locations/canada" },
      { label: "USA flower delivery", href: "/flower-delivery-usa" },
      { label: "All locations", href: "/locations" },
      { label: "Shipping", href: "/shipping" },
    ],
    locale: "en-CA",
    serviceMode: "origin",
  },
  australia: {
    slug: "australia",
    href: "/flower-delivery-australia",
    menuLabel: "Flower Delivery in Australia",
    countryName: "Australia",
    title: "Flower Delivery in Australia | Send Flowers to the USA | BlossomPot",
    description:
      "Flower delivery in Australia for shoppers sending bouquets and gifts to the USA. Time-zone and date-line guidance for Sydney, Melbourne, Brisbane and Perth.",
    h1: "Flower Delivery in Australia",
    intro:
      "Flower delivery in Australia with BlossomPot exists because sending a gift from Sydney or Melbourne to someone in the United States is a time-zone problem first and a florist problem second. When it is Tuesday evening in Sydney it is still Tuesday morning in California and already afternoon on the US East Coast. You shop the US catalog, pay securely, and type a United States delivery address. We do not advertise same-day rose delivery across Sydney postcodes or a Melbourne warehouse we do not operate. State hubs for New South Wales, Victoria, Queensland, and Western Australia add local ordering context — public holidays, typical US destinations, and how to avoid missing a US same-day cut-off while Australia is a calendar day ahead.",
    availability:
      "Live: origin ordering from Australia to US destinations. Not live: destination florist coverage inside Australian cities. Expanding destination service will only be indexed when fulfillment is real.",
    howItWorksHeading: "How flower delivery works from Australia",
    howItWorks:
      "Open blossompot.com from Australia, pick the gift, write the card message, and enter the US destination ZIP. Australia is roughly 14–19 hours ahead of the US depending on season and state, so order a calendar day early if the occasion is tight. Payment is Stripe (USD) or Razorpay (INR). Australian-issued cards usually work for international checkout. Tracking follows the US carrier path after dispatch.",
    categoriesHeading: "What Australian shoppers send to the USA",
    categoriesIntro:
      "Garden-style mixed bouquets and roses are the usual start. Because seasons are reversed, a US spring arrangement may not match what is blooming in Australia that week — order from the catalog for the recipient’s climate, not yours.",
    categories: [flowers, bouquets, mothers, birthday, hampers, cakes, anniversary, valentines],
    occasionsHeading: "Australian dates versus the US flower calendar",
    occasions: [
      {
        h3: "Father’s Day is in September in Australia",
        text: "Australian Father’s Day is the first Sunday in September. US Father’s Day is the third Sunday in June. If you are sending “Father’s Day flowers” to America, use the US date and the recipient’s ZIP cut-off.",
      },
      {
        h3: "Valentine’s Day falls in Australian summer",
        text: "February 14 is high summer in Australia and still winter for most US destinations. Rose demand on the US side is greenhouse- and import-driven. Order early in that week and do not assume Sydney heat has anything to do with a Boston delivery window.",
      },
      {
        h3: "Christmas in summer, US holidays in winter",
        text: "Australian Christmas is hot; US Christmas flower and hamper sends still follow northern winter carrier schedules. Leave extra time around US Thanksgiving and Christmas Eve rather than around Boxing Day in Australia.",
      },
    ],
    citiesHeading: "Australian states and frequent US destinations",
    citiesIntro:
      "State pages explain ordering from NSW, Victoria, Queensland, and Western Australia. California, New York, Texas, and Hawaii are common US destinations for Australian families.",
    cityLinks: [
      { label: "Australia hub", href: "/locations/australia" },
      { label: "New South Wales", href: "/locations/australia/new-south-wales" },
      { label: "Victoria", href: "/locations/australia/victoria" },
      { label: "Queensland", href: "/locations/australia/queensland" },
      { label: "Western Australia", href: "/locations/australia/western-australia" },
      { label: "Gifts to California", href: locationPublicPath("california") },
      { label: "Gifts to Hawaii", href: locationPublicPath("hawaii") },
      { label: "Gifts to New York", href: locationPublicPath("new-york") },
    ],
    whyHeading: "Why Australian shoppers use BlossomPot",
    whyPoints: [
      "Date-line guidance so a Wednesday Sydney order is not silently too late for a US Tuesday cut-off.",
      "No fake Sydney or Melbourne florist network in the titles or the copy.",
      "Season-aware notes: order for the recipient’s US climate, not Australian garden season.",
      "AUD-issued cards can pay in USD via Stripe when the issuer allows international e-commerce.",
    ],
    ctaHeading: "Send flowers from Australia today",
    ctaText:
      "Choose an arrangement, then enter the US ZIP. If the date is close, order a calendar day early from Australian Eastern Time.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Australia ordering hub", href: "/locations/australia" },
    faqs: [
      {
        q: "Do you deliver flowers to Sydney or Melbourne addresses?",
        a: "No published destination coverage. Australia flower delivery pages explain how to send gifts to the United States from those cities.",
      },
      {
        q: "How do I avoid missing a US same-day window?",
        a: "Check the recipient’s city page cut-off in their local time, then convert from your Australian state. When unsure, order the previous calendar day.",
      },
      {
        q: "Can I pay with an Australian card?",
        a: "Yes, via Stripe in USD when your card issuer allows international e-commerce. Catalog prices are not automatically converted to AUD on every page.",
      },
      {
        q: "Is Australian Mother’s Day the same as the US one?",
        a: "Both are observed on the second Sunday in May, but the date-line can still split the calendar day. Confirm the US delivery date on the recipient’s page.",
      },
    ],
    relatedHubs: [
      { label: "Australia hub", href: "/locations/australia" },
      { label: "USA flower delivery", href: "/flower-delivery-usa" },
      { label: "Flower guide", href: "/flower-guide" },
      { label: "All locations", href: "/locations" },
    ],
    locale: "en-AU",
    serviceMode: "origin",
  },
  uae: {
    slug: "uae",
    href: "/flower-delivery-uae",
    menuLabel: "Flower Delivery in UAE",
    countryName: "United Arab Emirates",
    title: "Flower Delivery in UAE | Send Flowers from Dubai & Abu Dhabi | BlossomPot",
    description:
      "Flower delivery in the UAE for shoppers in Dubai, Abu Dhabi and Sharjah sending bouquets, cakes and gifts to the USA. Time-zone, Eid and checkout guidance.",
    h1: "Flower Delivery in the UAE",
    intro:
      "Flower delivery in the UAE with BlossomPot is for residents and visitors in Dubai, Abu Dhabi, Sharjah, and the other emirates who want to send flowers, cakes, and gift hampers to someone in the United States. Gulf families, university ties, and US travel make this a natural origin market. We do not operate destination florist coverage inside UAE communities, and we will not invent same-day van routes across Dubai Marina or Abu Dhabi corniche addresses. You shop the catalog in English, pay securely, and enter a United States ZIP. Gulf Standard Time (UTC+4) sits nine hours ahead of US Eastern Time for much of the year — an evening order in Dubai can already be a missed morning cut-off in New York.",
    availability:
      "Live service: order from the United Arab Emirates for delivery to a US address. Destination florist coverage inside the UAE is not published. Heat and vase-life notes on this page refer to the US recipient’s conditions after delivery, not a local UAE cold chain we do not operate.",
    howItWorksHeading: "How flower delivery works from the UAE",
    howItWorks:
      "Browse blossompot.com from the UAE, choose flowers or a celebration gift, add a message, and enter the recipient’s US street, city, state, and ZIP. Do not enter a UAE PO Box or emirate as the delivery address. Stripe charges in USD; UAE-issued cards typically work for international e-commerce. VAT on your statement depends on the processor. Because Dubai is nine hours ahead of New York, order in the UAE morning — or the previous calendar day — when a US same-day window matters. After payment, fulfillment and tracking stay on the US path.",
    categoriesHeading: "Gifts UAE shoppers send to the United States",
    categoriesIntro:
      "Premium rose bouquets and mixed luxury arrangements are common starting points. Celebration gifts and hampers suit Eid, graduations, and housewarmings for relatives living in the US.",
    categories: [flowers, bouquets, celebration, hampers, anniversary, birthday, cakes, valentines],
    occasionsHeading: "UAE occasions and US delivery timing",
    occasions: [
      {
        h3: "Ramadan and Eid gifting",
        text: "Ramadan and Eid al-Fitr / Eid al-Adha follow the lunar calendar, so dates move each year. If you are sending an Eid bouquet to a US household, convert the Eid date to the recipient’s US timezone and avoid assuming a UAE evening order still catches a US morning cut-off.",
      },
      {
        h3: "UAE National Day and New Year travel",
        text: "UAE National Day (2 December) and the Dubai New Year period are busy for senders, not for US carriers. US Thanksgiving and Christmas still govern destination timing. Leave extra US business days around those holidays.",
      },
      {
        h3: "Heat, air-conditioning, and vase life",
        text: "The UAE climate is not the delivery climate. Once flowers arrive at a US address, indoor air-conditioning in hot US cities can help vase life if the cold chain was respected in transit. Choose sturdy catalog arrangements rather than assuming a desert-to-door UAE florist service.",
      },
    ],
    citiesHeading: "UAE senders and frequent US destinations",
    citiesIntro:
      "Dubai, Abu Dhabi, and Sharjah are the usual origin cities we hear from. Popular US destinations include New York, California, Texas, and Florida. Use those USA pages for cut-offs; there is no separate UAE location hub yet.",
    cityLinks: [
      { label: "USA flower delivery", href: "/flower-delivery-usa" },
      { label: "Gifts to New York", href: locationPublicPath("new-york") },
      { label: "Gifts to California", href: locationPublicPath("california") },
      { label: "Gifts to Texas", href: locationPublicPath("texas") },
      { label: "Gifts to Florida", href: locationPublicPath("florida") },
      { label: "All locations", href: "/locations" },
      { label: "Flower care guide", href: "/flower-guide" },
      { label: "Contact support", href: "/contact" },
    ],
    whyHeading: "Why UAE shoppers use BlossomPot",
    whyPoints: [
      "English catalog and gift messages without a fake Dubai florist directory.",
      "UTC+4 versus US cut-off guidance so evening Dubai orders are not silently too late.",
      "Eid and National Day notes that still respect US carrier holidays.",
      "UAE-issued cards can pay in USD via Stripe when the issuer allows international checkout.",
    ],
    ctaHeading: "Send flowers from the UAE today",
    ctaText:
      "Choose a bouquet, then enter the US delivery address. For order questions, contact support before the US cut-off rather than after.",
    primaryCta: { label: "Shop flowers", href: categoryHref("flowers") },
    secondaryCta: { label: "Contact us", href: "/contact" },
    faqs: [
      {
        q: "Do you deliver flowers to Dubai or Abu Dhabi addresses?",
        a: "Not as a published destination service. This UAE page helps you send flowers and gifts to a United States address from the emirates.",
      },
      {
        q: "What address should I enter at checkout?",
        a: "The recipient’s US street, city, state, and ZIP. Do not use a UAE PO Box or emirate as the delivery address.",
      },
      {
        q: "How far ahead is Dubai compared with New York?",
        a: "Gulf Standard Time is UTC+4, typically nine hours ahead of US Eastern Time. Order in the UAE morning when a US same-day window matters.",
      },
      {
        q: "Can I pay with a UAE card?",
        a: "Yes, via Stripe in USD when your card issuer allows international e-commerce. Catalog prices are shown in USD or INR at checkout, not automatically in AED.",
      },
    ],
    relatedHubs: [
      { label: "USA flower delivery", href: "/flower-delivery-usa" },
      { label: "All locations", href: "/locations" },
      { label: "Flower guide", href: "/flower-guide" },
      { label: "Shipping", href: "/shipping" },
    ],
    locale: "en-AE",
    serviceMode: "origin",
  },
};

export const countryFlowerDeliveryPages: CountryFlowerDeliveryContent[] =
  countriesMenu.items.map((item) => PAGES[item.slug]);

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
