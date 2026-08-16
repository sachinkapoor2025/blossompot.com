import type { InternationalLocation } from "./types";

const market = "europe";

function countryBase(
  slug: string,
  name: string,
  iso: string,
  currency: string,
  locale: string,
  timezoneLabel: string
): Pick<
  InternationalLocation,
  | "kind"
  | "slug"
  | "name"
  | "label"
  | "parents"
  | "isoCountry"
  | "currency"
  | "language"
  | "locale"
  | "timezoneLabel"
  | "serviceMode"
> {
  return {
    kind: "country",
    slug,
    name,
    label: name,
    parents: { market },
    isoCountry: iso,
    currency,
    language: "en",
    locale,
    timezoneLabel,
    serviceMode: "origin",
  };
}

export const EUROPE_LOCATIONS: InternationalLocation[] = [
  {
    ...countryBase("united-kingdom", "United Kingdom", "GB", "GBP", "en-GB", "UK time"),
    status: "published",
    title: "Send Flowers & Gifts from the UK to the USA | BlossomPot",
    description:
      "Order from the United Kingdom to send flowers, cakes, and gifts to a US address. London and Manchester guides — no fake UK florist network.",
    h1: "Send flowers, cakes & gifts from the UK to the USA",
    intro:
      "The United Kingdom is BlossomPot’s primary European origin: shared language, dense family ties to the US East Coast, and a five-hour gap to New York that people still get wrong at 4 p.m. in London. This country hub is not a claim that we run florist vans through every UK postcode. You shop the catalog, pay securely, and enter a United States ZIP. London and Manchester have their own guides because a City worker sending to New York is not the same checkout problem as a Manchester sender targeting Chicago or Texas. We publish English content only — no scraped UK florist directories. If destination fulfillment inside the UK is ever live, that will be stated as a service change, not implied by a city name in a title.",
    howItWorks:
      "Browse blossompot.com, add a gift message, and type the US address. UK time is usually five hours ahead of Eastern and eight ahead of Pacific. A 1:00 PM New York cut-off is 6:00 p.m. in London. Stripe charges in USD; your UK card issuer converts from GBP.",
    availability:
      "Origin ordering from the UK to the USA is live. No published UK destination florist coverage.",
    localNotes:
      "Cities: London, Manchester. Frequent US destinations: New York, New Jersey, Massachusetts, California, Florida. Related markets: Ireland, Canada.",
    faqs: [
      {
        q: "Can you deliver flowers to a UK address?",
        a: "Not as a published destination service. UK pages help you send gifts into the United States.",
      },
      {
        q: "What is the usual time gap to New York?",
        a: "Five hours (UK time ahead of Eastern), including shared daylight-saving practice most of the year. Confirm around the two DST change weekends.",
      },
      {
        q: "Do I enter a UK postcode at checkout?",
        a: "Not in the delivery field. Enter the recipient’s US ZIP.",
      },
    ],
    childSlugs: ["london", "manchester"],
    relatedSlugs: ["ireland", "canada", "united-states"],
  },
  {
    kind: "city",
    slug: "london",
    name: "London",
    label: "London, UK",
    parents: { market, country: "united-kingdom" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "GB",
    currency: "GBP",
    language: "en",
    locale: "en-GB",
    timezoneLabel: "UK time",
    title: "Send Flowers & Gifts from London to the USA | BlossomPot",
    description:
      "Order from London to send flowers and gifts to the USA. Five-hour East Coast gap — not a fake London florist listing.",
    h1: "Send flowers and gifts from London to the USA",
    intro:
      "London senders treat BlossomPot as a way to reach a US recipient after a transatlantic week or for family who stayed in New York, Boston, or Los Angeles. We do not list delivery zones for Shoreditch, Chelsea, or Canary Wharf, and we do not publish a fake Mayfair shop. The useful number is five hours to Eastern Time: if you start shopping after work, the New York same-day window is often already closed. Pacific US destinations stay open longer on your clock. Heathrow and City Airport trips are a reason people forget to order — the gift fulfills in the United States, not in the overhead locker. Enter the US ZIP only.",
    howItWorks:
      "Checkout with the US address. If the recipient is in New York or New Jersey, order before late afternoon UK time when same-day matters. Open /gifts-to-new-york or /gifts-to-california.",
    availability: "Origin ordering from London is live. No London destination coverage.",
    localNotes: "Related: United Kingdom, Manchester, Dublin. US: New York, California, Florida.",
    faqs: [
      {
        q: "Do you deliver flowers in London?",
        a: "No published destination service. This page is for US delivery.",
      },
      {
        q: "Can I still hit a New York same-day cut-off after 5 p.m. in London?",
        a: "Usually no — that is already midday or later in New York. Check the destination page instead of assuming.",
      },
      {
        q: "Is this a florist in London?",
        a: "No. BlossomPot is a US-delivery gifting store. This is an origin guide for London shoppers.",
      },
    ],
    relatedSlugs: ["united-kingdom", "manchester", "dublin"],
  },
  {
    kind: "city",
    slug: "manchester",
    name: "Manchester",
    label: "Manchester, UK",
    parents: { market, country: "united-kingdom" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "GB",
    currency: "GBP",
    language: "en",
    locale: "en-GB",
    timezoneLabel: "UK time",
    title: "Send Gifts from Manchester to the USA | BlossomPot",
    description:
      "Manchester senders can order US gift delivery. Same UK clock as London, different US destination mix — no fake local shop.",
    h1: "Send gifts from Manchester to the USA",
    intro:
      "Manchester shares UK time with London but not the same destination story. Senders here more often mention Chicago, Texas, and university towns than a Canary Wharf-to-Manhattan pattern. BlossomPot still only fulfills US ZIPs. We do not publish Northern Quarter florist coverage. Direct US flights make it tempting to “bring the gift” — do not; order the US delivery before you go through security. The five-hour Eastern gap still applies. If you copy a London page that assumes a New York recipient, you may open the wrong US hub.",
    howItWorks:
      "Enter the US address. Open Illinois, Texas, or New York destination hubs as needed. Related: London for East Coast office-hour math, Dublin for another English-language origin.",
    availability: "Origin ordering from Manchester is live. No Manchester destination coverage.",
    localNotes: "Related: United Kingdom, London. US: Illinois, Texas, New York.",
    faqs: [
      {
        q: "Do you deliver in Manchester?",
        a: "No published destination service.",
      },
      {
        q: "Is the timezone different from London?",
        a: "No. The difference is typical US destinations, not the clock.",
      },
      {
        q: "Should I carry the gift on a US flight?",
        a: "No. Use checkout so fulfillment stays domestic in the United States.",
      },
    ],
    relatedSlugs: ["united-kingdom", "london", "dublin"],
  },
  {
    ...countryBase("ireland", "Ireland", "IE", "EUR", "en-IE", "Irish time"),
    status: "published",
    title: "Send Gifts from Ireland to the USA | BlossomPot",
    description:
      "Order from Ireland to send flowers and gifts to the USA. Dublin guide and US destination notes — no fake Irish florist network.",
    h1: "Send gifts from Ireland to the USA",
    intro:
      "Ireland’s US gifting is family-heavy: Boston, New York, Chicago, and a long list of smaller cities where relatives settled. Irish time usually matches the UK, so the five-hour Eastern gap is the same trap as London, but the destination mix is not a London clone. BlossomPot delivers to US addresses. We do not publish Dublin or Cork destination florist coverage. St Patrick’s week is a bad time to assume leftover same-day US inventory — order earlier. You can write the card in English or Irish; the storefront stays English.",
    howItWorks:
      "Shop, enter a US ZIP, and convert from Irish time. Open the Dublin city guide. Stripe USD conversion from a EUR card is handled by your bank.",
    availability: "Origin service from Ireland to the USA is live. No Ireland destination claim.",
    localNotes: "City: Dublin. Related: United Kingdom. US: Massachusetts, New York, Illinois.",
    faqs: [
      {
        q: "Do you deliver in Ireland?",
        a: "Not as a published destination service.",
      },
      {
        q: "Is Irish time the same as London?",
        a: "Usually yes. Use the destination page if you are ordering around a DST change weekend.",
      },
      {
        q: "Which US hubs should Irish senders open first?",
        a: "Massachusetts, New York, and Illinois are the common starting points.",
      },
    ],
    childSlugs: ["dublin"],
    relatedSlugs: ["united-kingdom", "united-states"],
  },
  {
    kind: "city",
    slug: "dublin",
    name: "Dublin",
    label: "Dublin, Ireland",
    parents: { market, country: "ireland" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "IE",
    currency: "EUR",
    language: "en",
    locale: "en-IE",
    timezoneLabel: "Irish time",
    title: "Send Gifts from Dublin to the USA | BlossomPot",
    description:
      "Order from Dublin to send gifts to the USA. Boston and New York destinations — not a fake Dublin florist page.",
    h1: "Send gifts from Dublin to the USA",
    intro:
      "Dublin senders often need a gift in Boston or New York the same week they fly. BlossomPot fulfills the US side. We do not list Temple Bar or Docklands delivery. Irish time versus Eastern Time is the same five-hour story as London, but the first hub you should open is often Massachusetts, not California. Write the card before you enter the ZIP so apartment numbers do not get rushed. Eircode does not belong in the delivery field. If you are already in the airport queue, order on your phone — the parcel ships inside the United States, not in the hold.",
    howItWorks:
      "Enter the US address. Open /gifts-to-massachusetts or /gifts-to-new-york. Related: Ireland hub, London.",
    availability: "Origin ordering from Dublin is live. No Dublin destination coverage.",
    localNotes: "Related: Ireland, London. US: Massachusetts, New York, Illinois.",
    faqs: [
      {
        q: "Do you deliver in Dublin?",
        a: "No published destination service.",
      },
      {
        q: "Can I use an Eircode?",
        a: "Not as the ship-to address. Use the recipient’s US ZIP.",
      },
      {
        q: "Why isn’t this a London copy?",
        a: "Dublin content starts from Boston/New York family patterns, not a generic UK office-hour essay.",
      },
    ],
    relatedSlugs: ["ireland", "london", "united-kingdom"],
  },
  {
    ...countryBase("germany", "Germany", "DE", "EUR", "en-DE", "Central European Time"),
    status: "published",
    title: "Send Gifts from Germany to the USA | BlossomPot",
    description:
      "Order from Germany to send flowers and gifts to the USA. Berlin guide, CET vs US cut-offs — English storefront, no fake local shops.",
    h1: "Send gifts from Germany to the USA",
    intro:
      "Germany is a high-intent European origin for BlossomPot because of corporate travel and family in US tech and Midwest cities. The storefront is English; you may write the gift card in German. We will not publish a machine-translated German doorway site. Fulfillment is to a US ZIP, not to a Berlin Kiez or a Munich courtyard. Central European Time is usually six hours ahead of Eastern, which closes New York same-day windows even earlier than in London. Berlin has its own page for that city’s destination mix. We do not claim a Gewerbe florist licence we do not hold.",
    howItWorks:
      "Shop in English, write the card as you like, enter the US address. CET to Eastern is typically six hours. Open the Berlin guide when you are sending from that city.",
    availability: "Origin service from Germany to the USA is live. No German destination claim.",
    localNotes: "City: Berlin. Related: Netherlands, Austria, Switzerland. US: New York, California, Illinois, Texas.",
    faqs: [
      {
        q: "Do you deliver in Germany?",
        a: "Not as a published destination service.",
      },
      {
        q: "Is there a German-language shop?",
        a: "Not yet. We will not auto-translate this page. Gift messages can be German.",
      },
      {
        q: "What is the usual gap to New York?",
        a: "Six hours (CET ahead of Eastern) most of the year.",
      },
    ],
    childSlugs: ["berlin"],
    relatedSlugs: ["netherlands", "austria", "switzerland"],
  },
  {
    kind: "city",
    slug: "berlin",
    name: "Berlin",
    label: "Berlin, Germany",
    parents: { market, country: "germany" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "DE",
    currency: "EUR",
    language: "en",
    locale: "en-DE",
    timezoneLabel: "Central European Time",
    title: "Send Gifts from Berlin to the USA | BlossomPot",
    description:
      "Order from Berlin to send gifts to the USA. CET cut-offs and US tech-city destinations — not a fake Berlin florist.",
    h1: "Send gifts from Berlin to the USA",
    intro:
      "Berlin senders often shop for San Francisco, New York, and Austin rather than a single East Coast corridor. BlossomPot fulfills those US ZIPs. We do not list Mitte or Kreuzberg delivery. CET means a 1:00 PM Eastern cut-off is already 7:00 p.m. in Berlin — treat US same-day as a morning task. You can write the card in German. Do not enter a German PLZ as the ship-to code. Late-night ordering after a show is fine for standard US delivery and usually too late for Eastern same-day.",
    howItWorks:
      "Enter the US address. Open California, New York, or Texas hubs as needed. Related: Germany hub, Amsterdam for another CET origin.",
    availability: "Origin ordering from Berlin is live. No Berlin destination coverage.",
    localNotes: "Related: Germany, Amsterdam. US: California, New York, Texas.",
    faqs: [
      {
        q: "Do you deliver in Berlin?",
        a: "No published destination service.",
      },
      {
        q: "Can the card be in German?",
        a: "Yes. Type it exactly as you want it printed.",
      },
      {
        q: "When should I order for a New York same-day ZIP?",
        a: "In the Berlin morning. Evening orders are usually too late for Eastern cut-offs.",
      },
    ],
    relatedSlugs: ["germany", "amsterdam", "paris"],
  },
  {
    ...countryBase("france", "France", "FR", "EUR", "en-FR", "Central European Time"),
    status: "published",
    title: "Send Gifts from France to the USA | BlossomPot",
    description:
      "Order from France to send flowers and gifts to the USA. Paris guide, English storefront — no fake Paris florist network.",
    h1: "Send gifts from France to the USA",
    intro:
      "France is an origin market with a different occasion mix: more anniversary and thank-you gifts toward New York and California, fewer “I just landed in Boston” patterns than Ireland. The storefront stays English; the card can be French. We will not ship a poor machine translation as a fr-FR site. BlossomPot delivers to US addresses, not to arrondissements. CET vs Eastern Time is the same six-hour gap as Germany, but August fermeture culture is the local way people forget to order — US carriers do not pause because Paris is on holiday. Open the Paris city guide for tourist-versus-resident notes.",
    howItWorks:
      "Shop in English, write the card in French if you want, enter a US ZIP. Convert from CET. Do not use a French postal code in the delivery field.",
    availability: "Origin service from France to the USA is live. No France destination claim.",
    localNotes: "City: Paris. Related: Belgium, Switzerland. US: New York, California, Florida.",
    faqs: [
      {
        q: "Do you deliver in France?",
        a: "Not as a published destination service.",
      },
      {
        q: "Will you auto-translate this page?",
        a: "No. English storefront, optional French gift message.",
      },
      {
        q: "Does August in France delay the gift?",
        a: "It can delay you placing the order. US fulfillment still follows the destination calendar.",
      },
    ],
    childSlugs: ["paris"],
    relatedSlugs: ["belgium", "switzerland", "united-kingdom"],
  },
  {
    kind: "city",
    slug: "paris",
    name: "Paris",
    label: "Paris, France",
    parents: { market, country: "france" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "FR",
    currency: "EUR",
    language: "en",
    locale: "en-FR",
    timezoneLabel: "Central European Time",
    title: "Send Gifts from Paris to the USA | BlossomPot",
    description:
      "Order from Paris to send gifts to the USA. French card messages, CET cut-offs — not a fake Paris florist listing.",
    h1: "Send gifts from Paris to the USA",
    intro:
      "Paris senders include residents and visitors who suddenly need a gift to arrive in the United States. BlossomPot can take that US-destination order. We do not deliver to a Left Bank hotel and we do not publish a fake rue florist. Write the card in French. CET makes Eastern same-day a morning job. If you are a visitor, confirm the US ZIP before museum day eats the clock. Related city pages (London, Berlin) share the transatlantic problem but not the language-on-the-card habit.",
    howItWorks:
      "Enter the US address only. Open /gifts-to-new-york or /gifts-to-california. Keep the confirmation for apartment numbers.",
    availability: "Origin ordering from Paris is live. No Paris destination coverage.",
    localNotes: "Related: France, London, Berlin. US: New York, California.",
    faqs: [
      {
        q: "Do you deliver flowers in Paris?",
        a: "No published destination service.",
      },
      {
        q: "Can I order as a tourist?",
        a: "Yes. Payment and the US destination matter, not a French residential address.",
      },
      {
        q: "Can the card be in French?",
        a: "Yes. The website remains English.",
      },
    ],
    relatedSlugs: ["france", "london", "berlin"],
  },
  {
    ...countryBase("netherlands", "Netherlands", "NL", "EUR", "en-NL", "Central European Time"),
    status: "published",
    title: "Send Gifts from the Netherlands to the USA | BlossomPot",
    description:
      "Order from the Netherlands to send gifts to the USA. Amsterdam guide, CET vs US — no fake Dutch florist network.",
    h1: "Send gifts from the Netherlands to the USA",
    intro:
      "The Netherlands is used to excellent local florists at home; this page is not competing with that. BlossomPot is for the US destination when the recipient lives in America. We do not publish Amsterdam canal-belt delivery. CET vs Eastern Time is six hours, same as Germany, but Schiphol connections to US hubs mean people try to carry gifts through security — order the US delivery instead. English storefront, optional Dutch card message. Open the Amsterdam city guide for airport-specific reminders.",
    howItWorks:
      "Enter a US ZIP. Convert from CET. Do not use a Dutch postcode as the ship-to field.",
    availability: "Origin service from the Netherlands to the USA is live. No Dutch destination claim.",
    localNotes: "City: Amsterdam. Related: Belgium, Germany. US: New York, California, Illinois.",
    faqs: [
      {
        q: "Do you deliver in the Netherlands?",
        a: "Not as a published destination service.",
      },
      {
        q: "Should I take flowers through Schiphol?",
        a: "No. Place a US-destination order so fulfillment stays domestic in America.",
      },
      {
        q: "Can the card be in Dutch?",
        a: "Yes. Type it as you want it printed.",
      },
    ],
    childSlugs: ["amsterdam"],
    relatedSlugs: ["belgium", "germany"],
  },
  {
    kind: "city",
    slug: "amsterdam",
    name: "Amsterdam",
    label: "Amsterdam, Netherlands",
    parents: { market, country: "netherlands" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "NL",
    currency: "EUR",
    language: "en",
    locale: "en-NL",
    timezoneLabel: "Central European Time",
    title: "Send Gifts from Amsterdam to the USA | BlossomPot",
    description:
      "Order from Amsterdam to send gifts to the USA. Schiphol reminder and CET cut-offs — not a fake Amsterdam florist.",
    h1: "Send gifts from Amsterdam to the USA",
    intro:
      "Amsterdam senders and Schiphol passengers use this page to reach a US recipient without packing stems in a suitcase. BlossomPot fulfills US ZIPs. We do not list Jordaan or De Pijp delivery. CET closes Eastern same-day windows by evening. If you are changing planes, order on wifi before the long-haul leg; the gift will not meet you at JFK. English UI, Dutch or English card. Keep the US apartment or suite number in the confirmation — that is the usual delay, not Dutch customs, because fulfillment is domestic in America.",
    howItWorks:
      "Checkout with the US address. Open the matching US hub. Related: Netherlands, Berlin, London.",
    availability: "Origin ordering from Amsterdam is live. No Amsterdam destination coverage.",
    localNotes: "Related: Netherlands, Berlin, Brussels. US: New York, California.",
    faqs: [
      {
        q: "Do you deliver in Amsterdam?",
        a: "No published destination service.",
      },
      {
        q: "Can I order during a layover?",
        a: "Yes, if you have the US ZIP and a working payment card.",
      },
      {
        q: "Is this a canal-belt florist?",
        a: "No. It is an origin guide for US delivery.",
      },
    ],
    relatedSlugs: ["netherlands", "berlin", "brussels"],
  },
  {
    ...countryBase("italy", "Italy", "IT", "EUR", "en-IT", "Central European Time"),
    status: "published",
    title: "Send Gifts from Italy to the USA | BlossomPot",
    description:
      "Order from Italy to send gifts to the USA. English storefront, CET cut-offs — no fake Rome or Milan florist network.",
    h1: "Send gifts from Italy to the USA",
    intro:
      "Italy is in the architecture as a real origin market: families sending to New York, New Jersey, and California, plus visitors who need a gift to arrive in the US while they are still in Rome or Milan. We publish a country hub with unique guidance, not a thin doorway. Destination florist coverage inside Italy is not claimed. The storefront is English; the card can be Italian. CET vs Eastern Time is six hours. Ferragosto is when Italians remember occasions late — US carriers do not extend cut-offs for 15 August. City pages for Rome or Milan can be added when we have more than a name swap to say.",
    howItWorks:
      "Enter a US ZIP. Write the card in Italian if you want. Convert from CET. Do not use a CAP code as the delivery postcode.",
    availability: "Origin service from Italy to the USA is live. No Italian destination claim. Extra city pages stay unpublished until they are useful.",
    localNotes: "Related: Switzerland, France. US: New York, New Jersey, California.",
    faqs: [
      {
        q: "Do you deliver in Rome or Milan?",
        a: "Not as published destination pages.",
      },
      {
        q: "Can the card be in Italian?",
        a: "Yes. The website remains English.",
      },
      {
        q: "Will you add city pages later?",
        a: "Yes, when each city has unique, accurate ordering notes — not as mass-generated clones.",
      },
    ],
    relatedSlugs: ["switzerland", "france"],
  },
  {
    ...countryBase("spain", "Spain", "ES", "EUR", "en-ES", "Central European Time"),
    status: "published",
    title: "Send Gifts from Spain to the USA | BlossomPot",
    description:
      "Order from Spain to send gifts to the USA. CET and later Spanish evenings — no fake Madrid florist network.",
    h1: "Send gifts from Spain to the USA",
    intro:
      "Spain shares CET with France and Germany but social clocks run later, which is how people miss a US morning cut-off: a 9 p.m. Madrid order is already mid-afternoon in New York. This hub exists to say that out loud. BlossomPot delivers to US ZIPs, not to Madrid or Barcelona neighbourhoods. English storefront, optional Spanish card. Florida and New York show up often because of family and winter travel. City pages will be added when they are more than a title change.",
    howItWorks:
      "Order earlier in the Spanish day if the US ZIP is same-day eligible. Enter the US address, not a código postal.",
    availability: "Origin service from Spain to the USA is live. No Spanish destination claim.",
    localNotes: "Related: France, Portugal can be added later. US: Florida, New York, California.",
    faqs: [
      {
        q: "Do you deliver in Spain?",
        a: "Not as a published destination service.",
      },
      {
        q: "Why mention late evenings?",
        a: "A normal Spanish dinner time is already past many US East Coast same-day cut-offs.",
      },
      {
        q: "Can the card be in Spanish?",
        a: "Yes. The storefront stays English.",
      },
    ],
    relatedSlugs: ["france", "italy"],
  },
  {
    ...countryBase("switzerland", "Switzerland", "CH", "CHF", "en-CH", "Central European Time"),
    status: "published",
    title: "Send Gifts from Switzerland to the USA | BlossomPot",
    description:
      "Order from Switzerland to send gifts to the USA. CHF cards, CET, English storefront — no fake Zurich florist listing.",
    h1: "Send gifts from Switzerland to the USA",
    intro:
      "Swiss senders often pay with CHF cards while the storefront charges USD — your bank converts. That is a Switzerland-specific checkout note, not a recycled Germany paragraph. BlossomPot fulfills US destinations. We do not publish Zurich or Geneva florist coverage. CET vs Eastern Time is six hours. Multilingual households can write the card in German, French, Italian, or English; the UI stays English. We will not generate four thin translated clones. If you are ordering from a canton that feels “almost Germany,” still use this hub: the currency question is different.",
    howItWorks:
      "Enter a US ZIP. Expect USD on Stripe. Convert from CET. Do not use a Swiss PLZ as the ship-to code.",
    availability: "Origin service from Switzerland to the USA is live. No Swiss destination claim.",
    localNotes: "Related: Germany, France, Austria, Italy. US: New York, California.",
    faqs: [
      {
        q: "Do you deliver in Switzerland?",
        a: "Not as a published destination service.",
      },
      {
        q: "Why is currency called out here?",
        a: "CHF cards converting to USD is a common Swiss checkout question, unlike EUR-only neighbours.",
      },
      {
        q: "Can I write the card in German or French?",
        a: "Yes. We will not auto-translate the whole page.",
      },
    ],
    relatedSlugs: ["germany", "france", "austria"],
  },
  {
    ...countryBase("austria", "Austria", "AT", "EUR", "en-AT", "Central European Time"),
    status: "published",
    title: "Send Gifts from Austria to the USA | BlossomPot",
    description:
      "Order from Austria to send gifts to the USA. CET and English storefront — no fake Vienna florist network.",
    h1: "Send gifts from Austria to the USA",
    intro:
      "Austria is a smaller origin volume than Germany but the same CET math and a different destination mix — more New York and Chicago family ties, fewer Bay Area corporate loops. BlossomPot delivers to US ZIPs. We do not publish Vienna florist coverage. English storefront, optional German card. December markets make people remember US relatives late; US peak shipping is already busy then, so order earlier than you would for a local Austrian gift. A Vienna city page will wait until it can say more than this paragraph with a different heading.",
    howItWorks:
      "Enter the US address. Convert from CET. Open US East Coast or Midwest hubs as needed.",
    availability: "Origin service from Austria to the USA is live. No Austrian destination claim.",
    localNotes: "Related: Germany, Switzerland. US: New York, Illinois.",
    faqs: [
      {
        q: "Do you deliver in Vienna?",
        a: "Not as a published destination service.",
      },
      {
        q: "Is this a copy of the Germany page?",
        a: "No. Austria notes focus on December peak timing and a different US city mix.",
      },
      {
        q: "Can the card be in German?",
        a: "Yes.",
      },
    ],
    relatedSlugs: ["germany", "switzerland"],
  },
  {
    ...countryBase("belgium", "Belgium", "BE", "EUR", "en-BE", "Central European Time"),
    status: "published",
    title: "Send Gifts from Belgium to the USA | BlossomPot",
    description:
      "Order from Belgium to send gifts to the USA. Brussels notes, CET, English storefront — no fake local florist network.",
    h1: "Send gifts from Belgium to the USA",
    intro:
      "Belgium sits between Dutch and French origin patterns: EU-quarter travel to Washington, D.C. and New York, plus family in the US Midwest. The storefront is English; cards can be French or Dutch. We will not publish two thin translated sites. BlossomPot fulfills US ZIPs, not Brussels communes. CET vs Eastern is six hours. Related city: Amsterdam for Schiphol-style airport notes; Paris for French-language cards. A Brussels city page can be added when it is more than this paragraph with a different H1.",
    howItWorks:
      "Enter a US ZIP. Convert from CET. Do not use a Belgian postcode as the delivery code.",
    availability: "Origin service from Belgium to the USA is live. No Belgian destination claim.",
    localNotes: "Related: Netherlands, France. US: New York, Washington region, Illinois.",
    faqs: [
      {
        q: "Do you deliver in Brussels?",
        a: "Not as a published destination service.",
      },
      {
        q: "French or Dutch storefront?",
        a: "English UI. Cards may be French or Dutch.",
      },
      {
        q: "Which US hubs are common?",
        a: "New York and the Washington, D.C. region for work travel; Illinois for family.",
      },
    ],
    childSlugs: ["brussels"],
    relatedSlugs: ["netherlands", "france"],
  },
  {
    kind: "city",
    slug: "brussels",
    name: "Brussels",
    label: "Brussels, Belgium",
    parents: { market, country: "belgium" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "BE",
    currency: "EUR",
    language: "en",
    locale: "en-BE",
    timezoneLabel: "Central European Time",
    title: "Send Gifts from Brussels to the USA | BlossomPot",
    description:
      "Order from Brussels to send gifts to the USA. EU-travel destinations and CET — not a fake Brussels florist.",
    h1: "Send gifts from Brussels to the USA",
    intro:
      "Brussels senders often need a gift in Washington, D.C. or New York around institutional travel. That destination pair is why this city page exists instead of ending at the Belgium hub. BlossomPot fulfills US addresses. We do not list Ixelles or European Quarter delivery. CET makes Eastern same-day a morning task. Write the card in French, Dutch, or English. Related: Amsterdam and Paris for neighbouring origin cities. If the recipient is on the US West Coast, your evening still overlaps their afternoon — read that destination hub instead of assuming New York hours.",
    howItWorks:
      "Enter the US ZIP. Open Washington-region or New York destination hubs. Related: Belgium, Amsterdam, Paris.",
    availability: "Origin ordering from Brussels is live. No Brussels destination coverage.",
    localNotes: "Related: Belgium, Amsterdam, Paris.",
    faqs: [
      {
        q: "Do you deliver in Brussels?",
        a: "No published destination service.",
      },
      {
        q: "Why a city page if Belgium already exists?",
        a: "Brussels has a specific D.C./New York travel pattern that is not the whole country’s story.",
      },
      {
        q: "Can I write the card in French or Dutch?",
        a: "Yes.",
      },
    ],
    relatedSlugs: ["belgium", "amsterdam", "paris"],
  },
  {
    ...countryBase("sweden", "Sweden", "SE", "SEK", "en-SE", "Central European Time"),
    status: "published",
    title: "Send Gifts from Sweden to the USA | BlossomPot",
    description:
      "Order from Sweden to send gifts to the USA. SEK cards, CET, English storefront — no fake Stockholm florist network.",
    h1: "Send gifts from Sweden to the USA",
    intro:
      "Shoppers in Sweden pay with SEK cards more often than EUR, so conversion to USD is the local checkout question. Midsummer and the long July holiday are when people remember US birthdays late. BlossomPot delivers to US ZIPs, not to Stockholm neighbourhoods. CET vs Eastern Time is six hours, but summer daylight makes it feel earlier than it is — the cut-off is still the destination clock. English storefront, optional Swedish card. We will not publish a thin translated .se doorway.",
    howItWorks:
      "Enter a US ZIP. Expect USD on Stripe. Convert from CET, not from how bright the evening looks.",
    availability: "Origin service from Sweden to the USA is live. No Swedish destination claim.",
    localNotes: "Related: Denmark, Norway, Finland. US: New York, California, Minnesota.",
    faqs: [
      {
        q: "Do you deliver in Stockholm?",
        a: "Not as a published destination service.",
      },
      {
        q: "Why mention SEK?",
        a: "Swedish cards converting to USD is a common question and is not the same as EUR neighbours.",
      },
      {
        q: "Does Midsummer close US delivery?",
        a: "No. It only delays you placing the order. US holidays can still affect the carrier.",
      },
    ],
    relatedSlugs: ["denmark", "norway", "finland"],
  },
  {
    ...countryBase("denmark", "Denmark", "DK", "DKK", "en-DK", "Central European Time"),
    status: "published",
    title: "Send Gifts from Denmark to the USA | BlossomPot",
    description:
      "Order from Denmark to send gifts to the USA. DKK cards and CET — no fake Copenhagen florist network.",
    h1: "Send gifts from Denmark to the USA",
    intro:
      "Denmark is a compact origin market with DKK card conversion and strong US Midwest family ties (Minnesota, Illinois) plus New York. That mix is not Sweden’s Midsummer essay and not Germany’s corporate-travel essay. BlossomPot fulfills US destinations. We do not publish Copenhagen florist coverage. CET vs Eastern is six hours. English storefront, optional Danish card. City pages stay unpublished until they add more than a name. Order before a US long weekend if the recipient is in Minnesota — carrier calendars follow the destination, not a Danish holiday.",
    howItWorks:
      "Enter a US ZIP. Expect USD checkout. Convert from CET. Do not use a Danish postcode as the ship-to field.",
    availability: "Origin service from Denmark to the USA is live. No Danish destination claim.",
    localNotes: "Related: Sweden, Norway, Germany. US: Minnesota, Illinois, New York.",
    faqs: [
      {
        q: "Do you deliver in Copenhagen?",
        a: "Not as a published destination service.",
      },
      {
        q: "DKK or EUR?",
        a: "Denmark uses DKK. Your bank converts to the USD charge.",
      },
      {
        q: "Which US hubs are common?",
        a: "Minnesota, Illinois, and New York come up more than a generic California-only story.",
      },
    ],
    relatedSlugs: ["sweden", "norway", "germany"],
  },
  {
    ...countryBase("norway", "Norway", "NO", "NOK", "en-NO", "Central European Time"),
    status: "published",
    title: "Send Gifts from Norway to the USA | BlossomPot",
    description:
      "Order from Norway to send gifts to the USA. NOK cards, CET, English storefront — no fake Oslo florist network.",
    h1: "Send gifts from Norway to the USA",
    intro:
      "Shoppers in Norway combine NOK conversion with oil-and-tech travel to Texas and the US West Coast, which is a different destination map from Denmark’s Midwest pattern. BlossomPot delivers to US ZIPs. We do not publish Oslo florist coverage. CET vs Eastern is six hours; summer daylight in the north is not extra checkout time. English storefront, optional Norwegian card. We will not invent a fjord-side shop. If you are on a roster rotation, place the order before you lose connectivity — US fulfillment does not need you to be in Oslo when the carrier arrives.",
    howItWorks:
      "Enter a US ZIP. Expect USD on Stripe from a NOK card. Convert from CET. Open Texas or California hubs when those are the destinations.",
    availability: "Origin service from Norway to the USA is live. No Norwegian destination claim.",
    localNotes: "Related: Sweden, Denmark. US: Texas, California, New York.",
    faqs: [
      {
        q: "Do you deliver in Oslo?",
        a: "Not as a published destination service.",
      },
      {
        q: "Why is Texas mentioned?",
        a: "It is a common US destination from Norway and is not copied from the Denmark page.",
      },
      {
        q: "Can the card be in Norwegian?",
        a: "Yes. The website remains English.",
      },
    ],
    relatedSlugs: ["sweden", "denmark"],
  },
  {
    ...countryBase("finland", "Finland", "FI", "EUR", "en-FI", "Eastern European Time"),
    status: "published",
    title: "Send Gifts from Finland to the USA | BlossomPot",
    description:
      "Finland is on Eastern European Time — one hour ahead of Stockholm. Order US gift delivery with the correct offset. No fake Helsinki florist.",
    h1: "Send gifts from Finland to the USA",
    intro:
      "Finland is not “another Nordic CET page.” Most of the country uses Eastern European Time, one hour ahead of Sweden and Germany. A 1:00 PM Eastern cut-off is already 8:00 p.m. in Helsinki. That single hour is why Finland has its own hub. BlossomPot fulfills US ZIPs. We do not publish Helsinki florist coverage. English storefront, optional Finnish or Swedish card. Midsummer timing resembles Sweden; the clock does not. Minnesota and New York remain the usual first US hubs to open from Helsinki.",
    howItWorks:
      "Convert from Eastern European Time, not from Stockholm. Enter a US ZIP. EUR cards convert to USD at checkout.",
    availability: "Origin service from Finland to the USA is live. No Finnish destination claim.",
    localNotes: "Related: Sweden, Estonia can be added later. US: New York, Minnesota, California.",
    faqs: [
      {
        q: "Do you deliver in Helsinki?",
        a: "Not as a published destination service.",
      },
      {
        q: "Is Finland on the same clock as Sweden?",
        a: "No. Finland is typically one hour ahead (EET vs CET).",
      },
      {
        q: "Can the card be in Finnish?",
        a: "Yes. The storefront stays English.",
      },
    ],
    relatedSlugs: ["sweden", "denmark"],
  },
];
