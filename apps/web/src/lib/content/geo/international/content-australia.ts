import type { InternationalLocation } from "./types";

const market = "australia";
const country = "australia";

export const AUSTRALIA_LOCATIONS: InternationalLocation[] = [
  {
    kind: "region",
    slug: "new-south-wales",
    name: "New South Wales",
    label: "New South Wales",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Gifts from New South Wales to the USA | BlossomPot",
    description:
      "NSW and Sydney shoppers can send flowers and gifts to the USA. Date-line and Eastern Australia time notes — no fake Sydney florist network.",
    h1: "Send gifts from New South Wales to the USA",
    intro:
      "New South Wales is usually the first Australian origin we see because Sydney’s US family ties are dense and the city sits on Australian Eastern Time. When it is Wednesday morning in Sydney it is still Tuesday in California. That date-line gap — not a local florist van — is what this hub is about. BlossomPot delivers to US ZIPs. We do not publish destination coverage for Sydney suburbs or Newcastle. If the occasion is a US calendar date, order on the Australian day before so the US business day still has room. Mother’s Day in Australia is a different date from the US holiday; confirm which one you mean before you pick a delivery window.",
    howItWorks:
      "Shop, enter a US address, and treat the US calendar date as the one that matters. Open the Sydney city guide for harbour-city travel notes.",
    availability: "Origin service from NSW to the USA is live. No NSW destination florist claim.",
    localNotes: "City: Sydney. Neighbours: Victoria, Australian Capital Territory. US: California, New York, Hawaii.",
    faqs: [
      {
        q: "Do you deliver flowers in Sydney?",
        a: "Not as a published destination. This page is for sending to the United States.",
      },
      {
        q: "Why is the US date sometimes yesterday?",
        a: "Australia is ahead of the US. A Wednesday Sydney order can still land on a Tuesday US fulfillment clock.",
      },
      {
        q: "Is Australian Mother’s Day the same as the US one?",
        a: "No. Confirm which country’s occasion you are targeting.",
      },
    ],
    childSlugs: ["sydney"],
    relatedSlugs: ["victoria", "australian-capital-territory"],
  },
  {
    kind: "city",
    slug: "sydney",
    name: "Sydney",
    label: "Sydney, NSW",
    parents: { market, country, region: "new-south-wales" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Flowers & Gifts from Sydney to the USA | BlossomPot",
    description:
      "Order from Sydney to send flowers and gifts to a US address. Date-line guidance — not a fake Sydney florist listing.",
    h1: "Send flowers and gifts from Sydney to the USA",
    intro:
      "Sydney senders are often buying for someone in Los Angeles, San Francisco, or New York after a long-haul flight or for parents who stayed in the US. BlossomPot fulfills the US side. We do not list Bondi, Surry Hills, or Parramatta delivery zones, and we do not publish a fake Circular Quay shop. Because Sydney is on the other side of the date line from California, “tomorrow morning in LA” can still be “this afternoon” on your clock — or already the next calendar day. Read the destination page’s local date, not only the time. If you are at the airport heading to the US, order before you board; the gift will not travel in the hold.",
    howItWorks:
      "Enter the US ZIP, pay, and keep confirmation. Open /gifts-to-california or /gifts-to-new-york for cut-offs. When the occasion is date-critical, order a full US business day early.",
    availability: "Origin ordering from Sydney is live. No Sydney destination coverage.",
    localNotes: "Related: New South Wales, Canberra, Melbourne. US: California, New York, Hawaii.",
    faqs: [
      {
        q: "Can BlossomPot deliver in Sydney?",
        a: "No published destination service. Use a United States address.",
      },
      {
        q: "Should I order before a LA-bound flight?",
        a: "Yes if the gift needs to arrive while you are in the air or just after landing. Fulfillment is US-domestic, not in your luggage.",
      },
      {
        q: "Why not reuse the Melbourne paragraph?",
        a: "Sydney content focuses on the date line versus California and long-haul US flights; Melbourne has different destination mix and AFL-weekend timing.",
      },
    ],
    relatedSlugs: ["new-south-wales", "melbourne", "canberra"],
  },
  {
    kind: "region",
    slug: "victoria",
    name: "Victoria",
    label: "Victoria",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Gifts from Victoria to the USA | BlossomPot",
    description:
      "Victoria and Melbourne shoppers can send gifts to the USA. Eastern Australia time and US destination notes — no fake local shops.",
    h1: "Send gifts from Victoria to the USA",
    intro:
      "Victoria shares Australian Eastern Time with New South Wales but not the same gifting mix. Melbourne senders more often mention Chicago, New York, and university cities than the California-heavy Sydney pattern. BlossomPot still only publishes US destination fulfillment. We do not run a listed Melbourne laneway florist. AFL grand final weekends and Cup Day change when people remember to order — they do not change US carrier holidays. Use the Melbourne city guide for lane-level honesty: no fake Fitzroy coverage, plenty of checkout guidance.",
    howItWorks:
      "Shop from Victoria, enter a US ZIP, and use the US calendar date. Same date-line caution as NSW, different typical destinations.",
    availability: "Origin service from Victoria to the USA is live. No Victorian destination claim.",
    localNotes: "City: Melbourne. Neighbours: NSW, South Australia. US: New York, Illinois, California.",
    faqs: [
      {
        q: "Do you deliver in Melbourne?",
        a: "Not as a published destination.",
      },
      {
        q: "Is Victoria on the same clock as Sydney?",
        a: "Usually yes (Australian Eastern Time). Destination math versus the US is still date-line driven.",
      },
      {
        q: "Do Australian public holidays stop US delivery?",
        a: "They do not close US fulfillment. US holidays can still delay the destination carrier.",
      },
    ],
    childSlugs: ["melbourne"],
    relatedSlugs: ["new-south-wales", "south-australia"],
  },
  {
    kind: "city",
    slug: "melbourne",
    name: "Melbourne",
    label: "Melbourne, VIC",
    parents: { market, country, region: "victoria" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Flowers & Gifts from Melbourne to the USA | BlossomPot",
    description:
      "Order from Melbourne to send gifts to the USA. Distinct from Sydney — Midwest and East Coast destinations, no fake florist listing.",
    h1: "Send flowers and gifts from Melbourne to the USA",
    intro:
      "Melbourne senders frequently shop for US East Coast and Midwest recipients — New York, Boston, Chicago — not only California. That destination mix plus Cup Week forgetfulness is why this page is not a Sydney clone. BlossomPot delivers to the US ZIP you enter. We do not advertise same-day runs through Carlton or St Kilda. When it is Thursday evening in Melbourne it is still Thursday morning in New York and Wednesday in California. If the cake needs to arrive on a US Saturday, do not wait until Saturday morning in Melbourne; that Saturday has not started in the US yet, but you may already have missed Friday US dispatch.",
    howItWorks:
      "Enter the US address and count US business days backward from the occasion. Open the matching /gifts-to-* hub. Related city: Sydney for date-line basics, Adelaide for Central Australia time.",
    availability: "Origin ordering from Melbourne is live. No Melbourne destination coverage.",
    localNotes: "Related: Victoria, Sydney, Adelaide. US: New York, Illinois, California.",
    faqs: [
      {
        q: "Do you deliver in Melbourne?",
        a: "No published destination service.",
      },
      {
        q: "How is this different from Sydney?",
        a: "More East Coast/Midwest destinations and different local holiday timing. Same catalog, different guidance.",
      },
      {
        q: "Can I pay in AUD?",
        a: "Checkout is USD or INR. Your Australian card issuer handles conversion.",
      },
    ],
    relatedSlugs: ["victoria", "sydney", "adelaide"],
  },
  {
    kind: "region",
    slug: "queensland",
    name: "Queensland",
    label: "Queensland",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Standard Time",
    title: "Send Gifts from Queensland to the USA | BlossomPot",
    description:
      "Queensland does not use daylight saving. Brisbane and Gold Coast senders get distinct US cut-off math — no fake local florist pages.",
    h1: "Send gifts from Queensland to the USA",
    intro:
      "Queensland stays on Australian Eastern Standard Time year-round, while New South Wales and Victoria spring forward. In the Australian summer your offset to the US East Coast is not the same as Sydney’s. That is the reason this state hub exists. BlossomPot fulfills US destinations only. We do not publish Brisbane or Gold Coast florist coverage. Snowbird-style US trips to Hawaii and California are common from Queensland; count the US date, not the beach-day vibe. Open Brisbane and Gold Coast city guides for airport and tourism-season notes.",
    howItWorks:
      "Do not reuse Sydney’s summer offset. Check Queensland local time against the destination page. Enter a US ZIP at checkout.",
    availability: "Origin service from Queensland to the USA is live. No Queensland destination claim.",
    localNotes: "Cities: Brisbane, Gold Coast. Neighbour: NSW. US: California, Hawaii, New York.",
    faqs: [
      {
        q: "Why is Queensland’s US offset different in summer?",
        a: "Queensland skips daylight saving; NSW and Victoria do not. The gap to US zones changes relative to Sydney from October to April.",
      },
      {
        q: "Do you deliver in Brisbane?",
        a: "Not as a published destination.",
      },
      {
        q: "Should Gold Coast senders use this hub?",
        a: "Yes, then the Gold Coast city page for tourism-season timing.",
      },
    ],
    childSlugs: ["brisbane", "gold-coast"],
    relatedSlugs: ["new-south-wales"],
  },
  {
    kind: "city",
    slug: "brisbane",
    name: "Brisbane",
    label: "Brisbane, QLD",
    parents: { market, country, region: "queensland" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Standard Time",
    title: "Send Gifts from Brisbane to the USA | BlossomPot",
    description:
      "Order from Brisbane to send gifts to the USA. No daylight saving — different summer math from Sydney. No fake florist listing.",
    h1: "Send gifts from Brisbane to the USA",
    intro:
      "Brisbane senders get the Queensland clock: no spring-forward, so in the Australian summer you are not on the same offset as Sydney. If you follow a Sydney blog post about “US Thursday morning,” you can be an hour off. BlossomPot still only delivers to US addresses. We do not list South Bank or Fortitude Valley coverage. Hawaii and California are frequent destinations from Brisbane because of flight paths; New York is a longer planning problem. Order on the US business day you actually need, converted from AEST.",
    howItWorks:
      "Enter the US ZIP. In Australian summer, re-check the offset instead of copying Sydney. Open /gifts-to-california or /gifts-to-hawaii when those are the destinations.",
    availability: "Origin ordering from Brisbane is live. No Brisbane destination coverage.",
    localNotes: "Related: Gold Coast, Queensland, Sydney. US: California, Hawaii.",
    faqs: [
      {
        q: "Do you deliver in Brisbane?",
        a: "No published destination service.",
      },
      {
        q: "Why mention daylight saving so much?",
        a: "It is the main way Brisbane senders miss US cut-offs if they copy Sydney advice.",
      },
      {
        q: "Is the Gold Coast on the same clock?",
        a: "Yes — both are Queensland. The Gold Coast page covers tourism-season ordering, not a different timezone.",
      },
    ],
    relatedSlugs: ["gold-coast", "queensland", "sydney"],
  },
  {
    kind: "city",
    slug: "gold-coast",
    name: "Gold Coast",
    label: "Gold Coast, QLD",
    parents: { market, country, region: "queensland" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Standard Time",
    title: "Send Gifts from the Gold Coast to the USA | BlossomPot",
    description:
      "Gold Coast senders can order US gift delivery. Tourism-season reminders and Queensland time — not a fake local florist page.",
    h1: "Send gifts from the Gold Coast to the USA",
    intro:
      "The Gold Coast mixes residents and visitors. If you are on holiday and suddenly need a gift to arrive in the United States, BlossomPot can take that US-destination order. We do not deliver beachside in Surfers Paradise. School-holiday crowds that slow a local errand do not slow US fulfillment after you pay. Queensland’s lack of daylight saving still applies — same clock as Brisbane, different reason people forget to order (holiday mode). Enter the US ZIP, not an Australian postcode.",
    howItWorks:
      "Order from your phone, use the US address, and convert from AEST. If you are a visitor, confirm the recipient ZIP before you lose hotel Wi-Fi.",
    availability: "Origin ordering from the Gold Coast is live. No Gold Coast destination coverage.",
    localNotes: "Related: Brisbane, Queensland. US: California, Hawaii, New York.",
    faqs: [
      {
        q: "Can you deliver to a Gold Coast hotel?",
        a: "No published destination service. Send to a United States address.",
      },
      {
        q: "I am only visiting — can I still order?",
        a: "Yes. Checkout cares about the US destination and your payment method, not a Queensland residential address.",
      },
      {
        q: "Is this the same as the Brisbane page?",
        a: "Same timezone, different context (tourism-season forgetfulness vs resident daylight-saving math).",
      },
    ],
    relatedSlugs: ["brisbane", "queensland"],
  },
  {
    kind: "region",
    slug: "western-australia",
    name: "Western Australia",
    label: "Western Australia",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Western Time",
    title: "Send Gifts from Western Australia to the USA | BlossomPot",
    description:
      "Perth is closer to the US clock than Sydney. WA senders get distinct cut-off math — no fake Perth florist network.",
    h1: "Send gifts from Western Australia to the USA",
    intro:
      "Perth is two to three hours behind Sydney depending on daylight saving in the east, which makes Western Australia the Australian origin closest to US business hours. A late evening in Perth can still be the same calendar morning in California. That is useful and easy to waste if you follow Sydney’s “order yesterday” mantra blindly. BlossomPot delivers to US ZIPs only. We do not publish Perth metro florist coverage. Mining-roster families sending gifts to Texas or Colorado should still verify the destination page rather than assuming Perth’s friendlier overlap covers every US zone.",
    howItWorks:
      "Enter a US ZIP. Compare Australian Western Time to the destination, not to Sydney. Open the Perth city guide.",
    availability: "Origin service from WA to the USA is live. No WA destination claim.",
    localNotes: "City: Perth. US: California, Texas, Colorado, Hawaii.",
    faqs: [
      {
        q: "Is Perth better aligned with California than Sydney is?",
        a: "Often yes — the gap is smaller. You can still miss a cut-off if you wait until Perth midnight.",
      },
      {
        q: "Do you deliver in Perth?",
        a: "Not as a published destination.",
      },
      {
        q: "Does WA use daylight saving?",
        a: "Western Australia does not currently observe daylight saving. Eastern states may, which changes the gap to Sydney, not necessarily to every US zone.",
      },
    ],
    childSlugs: ["perth"],
    relatedSlugs: ["south-australia"],
  },
  {
    kind: "city",
    slug: "perth",
    name: "Perth",
    label: "Perth, WA",
    parents: { market, country, region: "western-australia" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Western Time",
    title: "Send Flowers & Gifts from Perth to the USA | BlossomPot",
    description:
      "Order from Perth to send gifts to the USA. Closer overlap with US West Coast hours — not a fake Perth florist page.",
    h1: "Send flowers and gifts from Perth to the USA",
    intro:
      "Perth senders get more same-calendar overlap with California than Sydney does. That does not make us a Perth florist. BlossomPot fulfills US destinations. We do not list Fremantle or CBD delivery. If you finish work at 6 p.m. in Perth, it can still be late morning in Los Angeles — enough time to read a same-day cut-off on the California hub and decide. Texas and Colorado destinations are common for FIFO families; those US zones are further ahead and need earlier Perth action. Do not paste a WA postcode into the ship-to field.",
    howItWorks:
      "Shop, enter the US address, and convert from Australian Western Time. Open /gifts-to-california first when the recipient is on the US West Coast.",
    availability: "Origin ordering from Perth is live. No Perth destination coverage.",
    localNotes: "Related: Western Australia, Adelaide. US: California, Texas, Hawaii.",
    faqs: [
      {
        q: "Do you deliver in Perth?",
        a: "No published destination service.",
      },
      {
        q: "Can I still catch US same-day from a Perth evening?",
        a: "Sometimes for Pacific US ZIPs. Never assume it; read the destination cut-off.",
      },
      {
        q: "Why is this not a Sydney rewrite?",
        a: "Perth’s clock vs California is the point. Sydney’s date-line problem is harsher.",
      },
    ],
    relatedSlugs: ["western-australia", "adelaide", "sydney"],
  },
  {
    kind: "region",
    slug: "south-australia",
    name: "South Australia",
    label: "South Australia",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Central Time",
    title: "Send Gifts from South Australia to the USA | BlossomPot",
    description:
      "Adelaide uses a 30-minute offset. SA senders get unique US cut-off math — no fake local florist pages.",
    h1: "Send gifts from South Australia to the USA",
    intro:
      "Adelaide’s 30-minute offset is the classic way people miss a meeting; it is also a way to miss a US same-day cut-off if you round to Sydney time. South Australia has its own hub so we do not pretend the state is “basically Victoria.” BlossomPot delivers to US addresses only. We do not publish Adelaide metro florist coverage. Convert from Australian Central Time, including the half hour, then read the destination page. Wine-region visitors sending a thank-you to a US host should order before cellar-door hours eat the afternoon.",
    howItWorks:
      "Enter a US ZIP. Do not round Adelaide time to the nearest hour when the cut-off is close. Open the Adelaide city guide.",
    availability: "Origin service from SA to the USA is live. No SA destination claim.",
    localNotes: "City: Adelaide. Neighbours: Victoria, Western Australia. US: California, New York.",
    faqs: [
      {
        q: "Why does Adelaide need its own page?",
        a: "The 30-minute timezone offset is a real checkout mistake, not a keyword variant.",
      },
      {
        q: "Do you deliver in Adelaide?",
        a: "Not as a published destination.",
      },
      {
        q: "Is SA on daylight saving?",
        a: "South Australia observes daylight saving, unlike Queensland. Check the current offset before you order.",
      },
    ],
    childSlugs: ["adelaide"],
    relatedSlugs: ["victoria", "western-australia"],
  },
  {
    kind: "city",
    slug: "adelaide",
    name: "Adelaide",
    label: "Adelaide, SA",
    parents: { market, country, region: "south-australia" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Central Time",
    title: "Send Gifts from Adelaide to the USA | BlossomPot",
    description:
      "Order from Adelaide to send gifts to the USA. Remember the 30-minute offset — not a fake Adelaide florist listing.",
    h1: "Send gifts from Adelaide to the USA",
    intro:
      "Adelaide senders should treat the half-hour offset as a checklist item, not trivia. If a California cut-off is 11:00 a.m. Pacific, do not convert as if you were in Melbourne. BlossomPot fulfills the US destination. We do not list North Adelaide or Glenelg delivery. Festival season is when people remember birthdays late; US carriers do not extend cut-offs because Fringe is on. Enter the US ZIP and keep the confirmation email for the recipient’s apartment number. Wine-weekend visitors should order before cellar doors open if the US occasion is the same calendar day.",
    howItWorks:
      "Convert from Australian Central Time including :30, then follow the destination hub. Related: Melbourne for eastern-state context, Perth for western overlap.",
    availability: "Origin ordering from Adelaide is live. No Adelaide destination coverage.",
    localNotes: "Related: South Australia, Melbourne, Perth.",
    faqs: [
      {
        q: "Do you deliver in Adelaide?",
        a: "No published destination service.",
      },
      {
        q: "What is the usual mistake?",
        a: "Rounding Adelaide to Sydney or Melbourne time and missing a tight US cut-off by 30 minutes.",
      },
      {
        q: "Can I write a longer festival-season message?",
        a: "Keep the card short enough to print cleanly. Festival timing does not change card size.",
      },
    ],
    relatedSlugs: ["south-australia", "melbourne", "perth"],
  },
  {
    kind: "region",
    slug: "australian-capital-territory",
    name: "Australian Capital Territory",
    label: "Australian Capital Territory",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Gifts from Canberra to the USA | BlossomPot",
    description:
      "Canberra senders can order US gift delivery. Public-service travel calendars and Eastern Australia time — no fake local shop.",
    h1: "Send gifts from the ACT to the USA",
    intro:
      "The Australian Capital Territory’s pattern looks more like Ottawa than Sydney: public-service travel, embassy-adjacent US trips, and weekends when the recipient is in Washington, D.C. rather than Los Angeles. The ACT shares Australian Eastern Time with NSW, so the date-line math matches Sydney, but the destination mix does not. BlossomPot delivers to US ZIPs. We do not publish Canberra florist coverage. Sitting weeks and US federal holidays are the calendars that matter — one closes your office, the other can delay the US carrier.",
    howItWorks:
      "Enter a US address. If the destination is D.C., Maryland, or Virginia, open those US hubs. The Canberra city page repeats travel-specific notes without inventing a Civic shop.",
    availability: "Origin service from the ACT to the USA is live. No ACT destination claim.",
    localNotes: "City: Canberra. Neighbour: NSW. US: Washington region, New York, California.",
    faqs: [
      {
        q: "Do you deliver in Canberra?",
        a: "Not as a published destination.",
      },
      {
        q: "Is the clock the same as Sydney?",
        a: "Yes — Australian Eastern Time, including daylight saving with NSW.",
      },
      {
        q: "Why a separate ACT hub?",
        a: "Destination mix (US capital region) and sitting-week timing differ from Sydney’s California-heavy pattern.",
      },
    ],
    childSlugs: ["canberra"],
    relatedSlugs: ["new-south-wales", "sydney"],
  },
  {
    kind: "city",
    slug: "canberra",
    name: "Canberra",
    label: "Canberra, ACT",
    parents: { market, country, region: "australian-capital-territory" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "AU",
    currency: "AUD",
    language: "en",
    locale: "en-AU",
    timezoneLabel: "Australian Eastern Time",
    title: "Send Gifts from Canberra to the USA | BlossomPot",
    description:
      "Order from Canberra to send gifts to the USA. D.C. and East Coast destinations — not a fake Canberra florist page.",
    h1: "Send gifts from Canberra to the USA",
    intro:
      "Canberra senders often need a gift in Washington, D.C., New York, or California around official travel. BlossomPot handles the US destination. We do not list Civic or Kingston delivery. Use the same date-line caution as Sydney, but open US capital-region hubs first when that is where the recipient lives. A sitting week that keeps you in meetings does not pause US fulfillment — order between sessions rather than assuming a local courier can save the day. We will not invent one.",
    howItWorks:
      "Checkout with the US ZIP. Related: ACT hub, Sydney for date-line detail, Ottawa for a similar public-service origin story in Canada.",
    availability: "Origin ordering from Canberra is live. No Canberra destination coverage.",
    localNotes: "Related: ACT, Sydney. US: Washington region, New York.",
    faqs: [
      {
        q: "Do you deliver in Canberra?",
        a: "No published destination service.",
      },
      {
        q: "Which US pages should I read first?",
        a: "If the recipient is in the capital region, start with the relevant US state hub, not a generic California page.",
      },
      {
        q: "Is this a Sydney duplicate?",
        a: "No. Canberra content is about official travel and D.C.-heavy destinations.",
      },
    ],
    relatedSlugs: ["australian-capital-territory", "sydney", "ottawa"],
  },
];
