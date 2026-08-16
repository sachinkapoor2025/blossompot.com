import type { InternationalLocation } from "./types";

export const HUB_LOCATIONS: InternationalLocation[] = [
  {
    kind: "country",
    slug: "united-states",
    name: "United States",
    label: "United States",
    parents: { market: "united-states" },
    status: "published",
    serviceMode: "destination",
    isoCountry: "US",
    iso3: "USA",
    currency: "USD",
    language: "en",
    locale: "en-US",
    timezoneLabel: "recipient local time",
    title: "Send Flowers, Cakes & Gifts Across the United States | BlossomPot",
    description:
      "BlossomPot delivers flowers, cakes, and gifts to all 50 US states, DC, and Puerto Rico. Browse state hubs, city pages, and same-day windows where coverage allows.",
    h1: "Gift delivery across the United States",
    intro:
      "The United States is BlossomPot’s live delivery destination. We send flowers, bouquets, cakes, and curated gift hampers to recipients in all 50 states, the District of Columbia, and Puerto Rico. Same-day options appear only for eligible ZIP codes before the local cut-off; other addresses use the standard nationwide window, typically several business days with tracking. Shoppers in India, Canada, the United Kingdom, Australia, and the rest of the world can check out here and enter a US delivery address — fulfillment is for addresses inside America, not a network of invented foreign storefronts. Open a state hub for city pages, timezone-aware cut-offs, and local FAQs, or start from the nationwide index if you are still choosing a destination. Hierarchical URLs under this country hub exist only as redirects so search engines keep a single canonical per state or city.",
    howItWorks:
      "Choose flowers, cakes, or a hamper, add a gift message, and enter the recipient’s US city, state, and ZIP at checkout. Stripe accepts USD cards; Razorpay is available for INR when enabled. After payment you receive confirmation and can follow order status. Destination pages under /gifts-to-{state-or-city} stay the canonical URLs for US locations already in search indexes.",
    availability:
      "Nationwide US destination coverage is live. Same-day is ZIP- and clock-dependent, not a promise for every address. We do not operate fake city storefronts or invented local florist offices.",
    localNotes:
      "California fulfillment supports careful packing for domestic US transit. Popular destination hubs include California, Texas, Florida, New York, Illinois, and Pennsylvania. Use the existing /gifts-to-* pages for state and city detail — this country hub is the international-architecture entry point and does not replace those URLs.",
    faqs: [
      {
        q: "Does BlossomPot deliver to every US state?",
        a: "Yes. Destination coverage includes all 50 states, DC, and Puerto Rico. Timing still depends on the recipient ZIP and product type.",
      },
      {
        q: "Are the old /gifts-to-california style URLs still valid?",
        a: "Yes. Those remain the canonical US location pages. Hierarchical /locations/united-states/... paths redirect to the matching /gifts-to-* URL so search equity is not split.",
      },
      {
        q: "Can someone outside the US place an order?",
        a: "Yes. International shoppers can pay and send gifts to a US address. We do not claim same-day florist delivery in foreign cities unless a destination page explicitly says coverage is live there.",
      },
    ],
    childSlugs: [],
    relatedSlugs: ["canada", "australia", "europe"],
  },
  {
    kind: "country",
    slug: "canada",
    name: "Canada",
    label: "Canada",
    parents: { market: "canada" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    iso3: "CAN",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "sender local time",
    title: "Send Flowers & Gifts from Canada to the USA | BlossomPot",
    description:
      "Order flowers, cakes, and gifts from Canada for delivery to a US address. Checkout guidance for Canadian shoppers, provinces, and popular US destinations.",
    h1: "Send flowers, cakes & gifts from Canada to the USA",
    intro:
      "BlossomPot is built for people in Canada who need a reliable way to send flowers, cakes, and gift hampers to family and friends in the United States. This is an origin-market guide, not a claim that we run a florist shop on every Canadian high street. You browse the same catalog, pay securely, and enter a US city, state, and ZIP for the recipient. That distinction matters: Toronto, Vancouver, and Montreal pages explain how ordering from those cities works, including time zones versus US destinations, not invented same-day van routes across Canadian postal codes. Popular reasons Canadians order include birthdays, anniversaries, Mother’s Day, and thank-yous for relatives in California, New York, Texas, and Florida. If we later add true destination fulfillment in a Canadian city, that page will say so in plain language and will not be published until the service is real.",
    howItWorks:
      "Shop from Canada on blossompot.com, choose the gift, add a message, and enter the recipient’s United States address. Checkout shows USD on Stripe or INR on Razorpay when that rail is enabled — card-issuing country can be Canada. Confirm the US ZIP carefully; Canadian postal codes are not delivery destinations today. After payment, tracking and status updates follow the US fulfillment path.",
    availability:
      "Live service: send gifts from Canada to US addresses. Destination delivery inside Canada is not claimed on these pages. Province and city guides exist to help Canadian shoppers order correctly, not to rank doorway pages.",
    localNotes:
      "Canada spans Atlantic through Pacific time. A 9 a.m. order in Vancouver is already midday in New York, which can matter when a US same-day cut-off is involved. GST/HST on your card statement depends on the processor and is separate from US sales tax on the destination order. Browse Ontario, British Columbia, Alberta, and Quebec hubs for city-level ordering notes.",
    faqs: [
      {
        q: "Can I deliver flowers to a Canadian address today?",
        a: "Not as a published destination service. These Canada pages help you send gifts into the United States. We will not list fake Toronto or Vancouver florist coverage.",
      },
      {
        q: "What address do I enter at checkout?",
        a: "The recipient’s US street, city, state, and ZIP. Do not enter a Canadian postal code as the delivery address unless a future destination page says that city is live.",
      },
      {
        q: "Which US destinations do Canadian shoppers use most?",
        a: "California, New York, Texas, Florida, and Washington come up often because of family ties and winter travel. Open those /gifts-to-* hubs for cut-offs.",
      },
    ],
    childSlugs: [
      "ontario",
      "british-columbia",
      "alberta",
      "quebec",
      "manitoba",
      "saskatchewan",
      "nova-scotia",
    ],
    relatedSlugs: ["united-states", "australia", "united-kingdom"],
  },
  {
    kind: "country",
    slug: "australia",
    name: "Australia",
    label: "Australia",
    parents: { market: "australia" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    iso3: "AUS",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "sender local time",
    title: "Send Flowers & Gifts from Australia to the USA | BlossomPot",
    description:
      "Order flowers, cakes, and gifts from Australia for USA delivery. Time-zone guidance, state hubs, and honest coverage — no fake local florist listings.",
    h1: "Send flowers, cakes & gifts from Australia to the USA",
    intro:
      "Australians sending a gift to someone in the United States face a hard time-zone gap: when it is Tuesday evening in Sydney, it is still Tuesday morning in California and already afternoon on the US East Coast. BlossomPot’s Australia pages exist so you can order flowers, cakes, and hampers for a US recipient without guessing that process. We do not advertise same-day rose delivery across Sydney postcodes or a Melbourne warehouse we do not operate. You shop the US catalog, pay securely, and type a United States delivery address. That is the live service. State hubs for New South Wales, Victoria, Queensland, and Western Australia add local ordering context — public holidays, typical US destinations for each state, and how to avoid missing a US same-day cut-off while you are ahead on the clock.",
    howItWorks:
      "Open blossompot.com from Australia, pick the gift, write the card message, and enter the US destination ZIP. Because Australia is 14–19 hours ahead of the US depending on season and state, order a calendar day early if the occasion is tight. Payment is Stripe (USD) or Razorpay (INR). Tracking follows the US carrier path after dispatch.",
    availability:
      "Live: origin ordering from Australia to US destinations. Not live: destination florist coverage inside Australian cities. Expanding destination service will only be indexed when fulfillment is real.",
    localNotes:
      "Australian senders often shop for family in California, New York, Texas, and Hawaii. Mother’s Day dates differ between Australia and the US — confirm which country’s occasion you are targeting. Use state pages for Sydney, Melbourne, Brisbane, and Perth notes rather than a generic “gifts in Australia” paragraph.",
    faqs: [
      {
        q: "Do you deliver flowers to Sydney or Melbourne addresses?",
        a: "No published destination coverage. Australia pages explain how to send gifts to the United States from those cities.",
      },
      {
        q: "How do I avoid missing a US same-day window?",
        a: "Check the recipient’s /gifts-to-* page cut-off in their local time, then convert from your Australian state. When unsure, order the previous calendar day.",
      },
      {
        q: "Can I pay with an Australian card?",
        a: "Yes, via Stripe in USD when your card issuer allows international e-commerce. The catalog prices are not automatically converted to AUD on every page.",
      },
    ],
    childSlugs: [
      "new-south-wales",
      "victoria",
      "queensland",
      "western-australia",
      "south-australia",
      "australian-capital-territory",
    ],
    relatedSlugs: ["united-states", "canada", "united-kingdom"],
  },
  {
    kind: "market",
    slug: "europe",
    name: "Europe",
    label: "Europe",
    parents: { market: "europe" },
    status: "published",
    serviceMode: "origin",
    currency: "EUR",
    language: "en",
    locale: "en-GB",
    timezoneLabel: "sender local time",
    title: "Send Flowers & Gifts from Europe to the USA | BlossomPot",
    description:
      "Order flowers, cakes, and gifts from Europe for USA delivery. Country hubs for the UK, Germany, France, and more — not a generic doorway page.",
    h1: "Send gifts from Europe to the United States",
    intro:
      "Europe is a customer-origin market for BlossomPot, not a single delivery zone and not a placeholder continent page. People in the United Kingdom, Germany, France, Ireland, the Netherlands, and neighbouring countries use this site to send flowers, cakes, and hampers to recipients who live in the United States. Each country has its own hub with currency notes, time-zone math versus US cut-offs, and city guides where we have something useful to say. We publish English-first content because we will not ship poor machine translations. We also will not invent a florist in every European capital. If you need a gift to arrive in Los Angeles, Chicago, or Miami, start from the country you are ordering from, then open the US destination page for timing. Country pages can be added later (Italy, Spain, the Nordics, and others are already in the architecture) without changing URLs for the markets that are live today.",
    howItWorks:
      "Choose your country hub, shop the catalog, and enter a US delivery address. Stripe charges in USD; Razorpay may appear for INR. VAT on your card is a bank/processor matter, not a BlossomPot storefront tax engine for every EU state. After payment, fulfillment and tracking are the US destination flow.",
    availability:
      "Live origin ordering from European countries we have published. No continent-wide same-day claim. Individual countries may be draft or noindex until they have unique, useful copy.",
    localNotes:
      "The UK is often the highest-volume European origin because of language and family ties to the US East Coast. Germany and the Netherlands frequently send to Midwest and tech-hub addresses. Open a country page instead of treating “Europe” as the only URL that matters.",
    faqs: [
      {
        q: "Is there one Europe delivery service?",
        a: "No. Europe is a market grouping. Service is “order from a European country, deliver to the USA,” described per country.",
      },
      {
        q: "Will you add more European countries?",
        a: "Yes. The URL pattern /locations/europe/{country}/{city} is stable. New countries get pages only when content and business relevance exist.",
      },
      {
        q: "Do you create local-language pages automatically?",
        a: "No. English is the current storefront language. Localized pages will be added as real translations, not auto-translated doorway copies.",
      },
    ],
    childSlugs: [
      "united-kingdom",
      "germany",
      "france",
      "ireland",
      "netherlands",
      "italy",
      "spain",
      "switzerland",
      "austria",
      "belgium",
      "sweden",
      "denmark",
      "norway",
      "finland",
    ],
    relatedSlugs: ["united-states", "canada", "australia"],
  },
];
