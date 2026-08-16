import type { InternationalLocation } from "./types";

const market = "canada";
const country = "canada";

export const CANADA_LOCATIONS: InternationalLocation[] = [
  {
    kind: "region",
    slug: "ontario",
    name: "Ontario",
    label: "Ontario",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Eastern Time",
    title: "Send Gifts from Ontario to the USA | BlossomPot",
    description:
      "Ontario shoppers can order flowers, cakes, and hampers for US delivery. Toronto and Ottawa ordering notes, Eastern Time cut-offs, and honest coverage.",
    h1: "Send flowers and gifts from Ontario to the USA",
    intro:
      "Ontario is the largest Canadian origin market for BlossomPot because so many families split time between the Golden Horseshoe and US cities. If you are ordering from Toronto, Mississauga, Ottawa, or elsewhere in the province, you are shopping as a Canadian sender, not booking a local Ontario florist van. Enter the recipient’s United States ZIP. Eastern Time in Ontario lines up with New York, Pennsylvania, and much of Florida, which makes same-day-eligible US ZIPs easier to hit than they are from the West Coast — provided you still check the destination cut-off. This hub links Toronto and Ottawa city guides and explains the difference between a Canadian billing address and a US delivery address so checkout does not fail on postal format.",
    howItWorks:
      "Browse the catalog, add a message, and type a US city/state/ZIP. Ontario senders on Eastern Time can treat a 1:00 PM New York cut-off as the same clock. Do not paste a K or M Canadian postal code into the delivery field.",
    availability:
      "Origin ordering from Ontario to the USA is live. Destination delivery inside Ontario is not published.",
    localNotes:
      "Common US destinations from Ontario include New York, New Jersey, Michigan, Florida, and California. March break and US Thanksgiving weeks are busy for cross-border gifting. Open Toronto or Ottawa for city-specific notes.",
    faqs: [
      {
        q: "Does Eastern Time in Ontario match US East Coast cut-offs?",
        a: "Usually yes, including daylight-saving changes that generally align with New York. Always confirm the destination page clock if the ZIP is in a different US zone.",
      },
      {
        q: "Can I send a cake to an Ontario apartment?",
        a: "Not as a listed destination service. Use this page to send into the United States.",
      },
      {
        q: "Which Ontario cities have guides?",
        a: "Toronto and Ottawa are published because they have distinct ordering context. More cities can be added when we have unique, useful copy.",
      },
    ],
    childSlugs: ["toronto", "ottawa"],
    relatedSlugs: ["quebec", "manitoba", "new-york"],
  },
  {
    kind: "city",
    slug: "toronto",
    name: "Toronto",
    label: "Toronto, ON",
    parents: { market, country, region: "ontario" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Eastern Time",
    title: "Send Flowers & Gifts from Toronto to the USA | BlossomPot",
    description:
      "Order from Toronto to send flowers, cakes, and gifts to a US address. Eastern Time checkout tips — not a fake Toronto florist listing.",
    h1: "Send flowers, cakes & gifts from Toronto to the USA",
    intro:
      "Toronto senders use BlossomPot when the celebration is happening in the United States — a parent in New Jersey, a colleague in Chicago, a partner who moved to Los Angeles. This page is for that workflow. We do not list same-day bouquet routes through downtown Toronto, North York, or Scarborough, and we do not publish a fake Queen Street West shop address. You check out with a US delivery ZIP. Because Toronto sits on Eastern Time, a late-morning order can still clear a 1:00 PM cut-off in New York or Miami; a California same-day window stays open later in your afternoon. Keep the gift message short enough for the card, and double-check apartment numbers on the US address — they are a common cause of carrier delays, not customs issues, since the parcel is fulfilled domestically in America.",
    howItWorks:
      "Shop on blossompot.com, pay with a Canadian-issued card if your bank allows USD/INR e-commerce, and enter only the US recipient address. Save the order confirmation. If the occasion is tonight on the US East Coast, order before that city’s published local cut-off, not before a Toronto florist closing time we do not have.",
    availability:
      "Live origin service from Toronto to US destinations. No indexed Toronto destination florist coverage.",
    localNotes:
      "Pearson-area travelers often order ahead for someone they just left in the US. Popular destinations: New York, New Jersey, Florida, California, Illinois. Related Ontario guide: Ottawa. Related province: Quebec for Montreal senders.",
    faqs: [
      {
        q: "Can BlossomPot deliver flowers to a Toronto address?",
        a: "We do not publish destination coverage for Toronto. This page helps you send gifts to the United States.",
      },
      {
        q: "What if my card is billed in CAD?",
        a: "Your bank converts the Stripe USD (or Razorpay INR) charge. The storefront does not invent a separate Toronto price list.",
      },
      {
        q: "Which US city pages should I open from Toronto?",
        a: "Start with the recipient’s state hub — /gifts-to-new-york, /gifts-to-california, /gifts-to-florida — then the city page if one exists.",
      },
    ],
    relatedSlugs: ["ottawa", "montreal", "ontario"],
  },
  {
    kind: "city",
    slug: "ottawa",
    name: "Ottawa",
    label: "Ottawa, ON",
    parents: { market, country, region: "ontario" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Eastern Time",
    title: "Send Gifts from Ottawa to the USA | BlossomPot",
    description:
      "Ottawa shoppers can send flowers and gifts to US addresses. Public-service travel calendars and Eastern Time cut-offs — no fake local shop.",
    h1: "Send flowers and gifts from Ottawa to the USA",
    intro:
      "Ottawa’s gifting pattern is different from Toronto’s: more government and embassy travel, more weekends when someone is in Washington, D.C. or Boston, and a bilingual household mix that still checks out in English on this storefront. Use BlossomPot to send flowers, cakes, or a hamper to a US ZIP, not to a Kanata or Gatineau door. We will not invent an Ottawa warehouse. Eastern Time keeps you aligned with the US capital region, which is useful for same-day-eligible destinations around D.C., Maryland, and Virginia — always verify the destination page. If the recipient is in a western US state, your evening is still their afternoon, so you have more clock than you think.",
    howItWorks:
      "Add the gift, write the note, and enter the US address. Parliamentary or civic holidays in Ottawa do not close US fulfillment; US federal holidays can delay the destination carrier even if you ordered on a quiet Friday in Ottawa.",
    availability: "Origin ordering from Ottawa to the USA is live. No Ottawa destination listing.",
    localNotes:
      "Frequent US destinations from Ottawa include Washington, New York, Boston, and Florida. Cross-link to Toronto for Greater Toronto senders and to Montreal for Quebec-side families.",
    faqs: [
      {
        q: "Do you deliver in Ottawa or Gatineau?",
        a: "No published destination service. Enter a United States delivery address.",
      },
      {
        q: "Does a US federal holiday affect my Ottawa order?",
        a: "It can delay the US carrier after dispatch. Your ability to place the order from Ottawa is unchanged.",
      },
      {
        q: "Can I write the card in French?",
        a: "Yes. The gift message is printed as you type it. The website UI remains English.",
      },
    ],
    relatedSlugs: ["toronto", "montreal", "ontario"],
  },
  {
    kind: "region",
    slug: "british-columbia",
    name: "British Columbia",
    label: "British Columbia",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Pacific Time",
    title: "Send Gifts from British Columbia to the USA | BlossomPot",
    description:
      "BC shoppers send flowers and gifts to the USA on Pacific Time. Vancouver guide, West Coast destinations, honest origin-only coverage.",
    h1: "Send gifts from British Columbia to the USA",
    intro:
      "British Columbia sits on Pacific Time with Washington, Oregon, and California, which is the useful fact for anyone in Vancouver or Victoria sending a last-minute gift south of the border. BlossomPot fulfills to US addresses; we do not run a published destination network through Vancouver neighbourhoods. A 10 a.m. order in BC can still meet a late-morning California same-day cut-off when that ZIP is eligible, and it is already early afternoon in New York — so East Coast same-day windows may already be closed while you are finishing breakfast. This hub exists so BC senders do not copy Ontario advice that assumes Eastern Time.",
    howItWorks:
      "Shop, enter a US ZIP, and convert cut-offs using Pacific Time. If the recipient is in New York or Florida, treat same-day as unlikely unless you order the previous evening.",
    availability: "Origin service from BC to the USA is live. No BC destination florist claim.",
    localNotes:
      "Seattle, Portland, San Francisco, Los Angeles, and Las Vegas are common destinations from BC. See the Vancouver city guide. Alberta is the inland neighbour hub.",
    faqs: [
      {
        q: "Is Pacific Time in BC the same as California?",
        a: "Yes for most of the year, including shared daylight-saving practice. Arizona is the usual US exception — check that destination page.",
      },
      {
        q: "Can I send flowers to a Vancouver address?",
        a: "Not as a published destination. This page is for sending into the United States.",
      },
      {
        q: "Why might an East Coast same-day option be gone?",
        a: "Those cut-offs are already in the afternoon while it is still morning in British Columbia.",
      },
    ],
    childSlugs: ["vancouver"],
    relatedSlugs: ["alberta", "washington"],
  },
  {
    kind: "city",
    slug: "vancouver",
    name: "Vancouver",
    label: "Vancouver, BC",
    parents: { market, country, region: "british-columbia" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Pacific Time",
    title: "Send Flowers & Gifts from Vancouver to the USA | BlossomPot",
    description:
      "Order from Vancouver to send gifts to US addresses. Pacific Time vs East Coast cut-offs — not a fake Vancouver florist page.",
    h1: "Send flowers and gifts from Vancouver to the USA",
    intro:
      "Vancouver senders often need a gift in Seattle, the Bay Area, or Los Angeles after a weekend trip, or in New York for family who left the West Coast. BlossomPot covers the US destination side. We do not advertise Kitsilano or Downtown Vancouver courier runs, and we do not publish a fake Gastown pickup desk. Place the order with a US ZIP. Pacific Time is your friend for California same-day eligibility and your enemy for a 1:00 PM Eastern cut-off — that window is already 10:00 a.m. in Vancouver, which is tighter than it looks if you start shopping at lunch. Write the card before you enter the address so you are not rushing the ZIP field.",
    howItWorks:
      "Checkout with the US recipient address only. If you are sending to Washington or California, open that /gifts-to-* hub for the local clock. For New York or Florida, order the day before when the occasion is date-sensitive.",
    availability: "Origin ordering from Vancouver is live. No Vancouver destination coverage.",
    localNotes:
      "Related: British Columbia hub, Calgary for Alberta senders, Seattle and California destination pages on the US site.",
    faqs: [
      {
        q: "Do you deliver in Vancouver or Burnaby?",
        a: "No published destination service. Use a United States delivery address.",
      },
      {
        q: "Can I make a same-day US order from Vancouver in the afternoon?",
        a: "Only if the destination ZIP is still before its local cut-off — more realistic for Pacific US cities than for New York.",
      },
      {
        q: "Is this a Vancouver florist?",
        a: "No. BlossomPot is a US-delivery gifting store. This page is an origin guide for Vancouver shoppers.",
      },
    ],
    relatedSlugs: ["british-columbia", "calgary", "seattle"],
  },
  {
    kind: "region",
    slug: "alberta",
    name: "Alberta",
    label: "Alberta",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Mountain Time",
    title: "Send Gifts from Alberta to the USA | BlossomPot",
    description:
      "Calgary and Edmonton shoppers can send flowers and gifts to the USA. Mountain Time guidance — no fake Alberta florist network.",
    h1: "Send gifts from Alberta to the USA",
    intro:
      "Alberta senders sit on Mountain Time, one hour ahead of Vancouver and one hour behind Ontario. That single hour changes whether a Denver or Phoenix same-day window is still open and whether a New York cut-off has already passed. BlossomPot delivers to US addresses; we do not publish destination florist coverage for Calgary, Edmonton, or Banff. Energy-sector travel and winter snowbird routes toward Arizona, Nevada, and Texas show up often in Alberta gifting. Use this hub plus the Calgary and Edmonton city guides instead of copying Toronto’s Eastern Time advice.",
    howItWorks:
      "Enter a US ZIP at checkout. Convert the destination cut-off from Mountain Time. Arizona may stay on standard time year-round — read that destination page instead of assuming Alberta’s clock matches Phoenix in summer.",
    availability: "Origin service from Alberta to the USA is live. No Alberta destination claim.",
    localNotes:
      "Common destinations: Texas, Colorado, Arizona, Nevada, California. City guides: Calgary, Edmonton. Neighbour hubs: British Columbia and Saskatchewan.",
    faqs: [
      {
        q: "Why is Arizona different from Alberta time in summer?",
        a: "Much of Arizona does not observe daylight saving. Do not assume Calgary and Phoenix stay one hour apart all year.",
      },
      {
        q: "Can you deliver a hamper in Calgary?",
        a: "Not as a published destination. Send to a United States address instead.",
      },
      {
        q: "Which city pages exist in Alberta?",
        a: "Calgary and Edmonton, each with unique ordering notes.",
      },
    ],
    childSlugs: ["calgary", "edmonton"],
    relatedSlugs: ["british-columbia", "saskatchewan"],
  },
  {
    kind: "city",
    slug: "calgary",
    name: "Calgary",
    label: "Calgary, AB",
    parents: { market, country, region: "alberta" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Mountain Time",
    title: "Send Gifts from Calgary to the USA | BlossomPot",
    description:
      "Order from Calgary to send flowers and gifts to the USA. Mountain Time and snowbird destinations — not a fake Calgary shop.",
    h1: "Send flowers and gifts from Calgary to the USA",
    intro:
      "Calgary shoppers often send gifts toward Texas energy cities, Colorado, and Arizona winter addresses. BlossomPot fulfills those US destinations. We do not operate a listed Beltline or Kensington florist counter. Place the order with a US ZIP and use Mountain Time when you read a same-day cut-off. A noon Calgary order is already 2:00 p.m. in New York, so East Coast same-day is frequently closed; it may still be morning in California. Stampede week and US Thanksgiving are poor times to assume leftover same-day inventory — order earlier.",
    howItWorks:
      "Shop, add the message, enter the US address. If the recipient is in Denver, the clocks usually match. If they are in Phoenix, verify the seasonal offset.",
    availability: "Origin ordering from Calgary is live. No Calgary destination coverage.",
    localNotes: "Related: Edmonton, Alberta hub, Texas and Arizona US destination pages.",
    faqs: [
      {
        q: "Do you deliver in Calgary?",
        a: "No published destination service. This page is for US delivery from Calgary senders.",
      },
      {
        q: "What is the usual time gap to New York?",
        a: "Two hours (Mountain vs Eastern). A 1:00 PM Eastern cut-off is 11:00 a.m. in Calgary.",
      },
      {
        q: "Can I pay from a Canadian bank account?",
        a: "Use a card or method your bank allows on Stripe/Razorpay. We do not offer Interac e-Transfer checkout.",
      },
    ],
    relatedSlugs: ["edmonton", "alberta", "vancouver"],
  },
  {
    kind: "city",
    slug: "edmonton",
    name: "Edmonton",
    label: "Edmonton, AB",
    parents: { market, country, region: "alberta" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Mountain Time",
    title: "Send Gifts from Edmonton to the USA | BlossomPot",
    description:
      "Edmonton senders can order flowers and gifts for US addresses. Mountain Time notes distinct from Calgary travel patterns.",
    h1: "Send gifts from Edmonton to the USA",
    intro:
      "Edmonton’s cross-border gifting is less “weekend in Seattle” and more long-haul family in Texas, Minnesota, and California, plus university ties. Use BlossomPot for the US destination, not for a Whyte Avenue delivery we do not offer. Mountain Time still applies, same as Calgary, but winter storms that delay your own travel do not delay a US domestic fulfillment once the order is paid — the gift is not flying with you. Order from home before you drive south. Check the destination ZIP cut-off rather than assuming an Edmonton business-day close.",
    howItWorks:
      "Checkout with a US address. Edmonton and Calgary share Mountain Time, so cut-off math matches Alberta’s hub. Open the recipient’s US city page for product timing.",
    availability: "Origin ordering from Edmonton is live. No Edmonton destination listing.",
    localNotes: "Related: Calgary, Alberta, Saskatchewan. US hubs: Texas, Minnesota, California.",
    faqs: [
      {
        q: "Is Edmonton destination delivery available?",
        a: "No. Enter a United States ZIP.",
      },
      {
        q: "Does a local storm stop the gift?",
        a: "US fulfillment is independent of Edmonton weather after you place the order.",
      },
      {
        q: "How is this different from the Calgary page?",
        a: "Same timezone, different typical destinations and travel patterns. Content is not a city-name swap.",
      },
    ],
    relatedSlugs: ["calgary", "alberta", "winnipeg"],
  },
  {
    kind: "region",
    slug: "quebec",
    name: "Quebec",
    label: "Quebec",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Eastern Time",
    title: "Send Gifts from Quebec to the USA | BlossomPot",
    description:
      "Quebec shoppers can send flowers and gifts to the USA. Montreal guide, English storefront, Eastern Time — no fake local shops.",
    h1: "Send gifts from Quebec to the USA",
    intro:
      "Quebec senders get an English-first BlossomPot storefront today; we will not auto-translate this page into low-quality French just to chase keywords. You can still write the gift card in French. Fulfillment is to a US address, not to a Montreal plateau walk-up. Eastern Time matches Ontario and the US East Coast, which helps for New York and Boston occasions. This hub is for province-level context; Montreal has its own page because the city’s US ties (New England, Florida snowbirds, New York weekends) are specific. We do not claim a florist licence on Sainte-Catherine Street.",
    howItWorks:
      "Shop in English, write the card in any language, enter a US ZIP. Do not use a Quebec postal code as the ship-to field.",
    availability: "Origin service from Quebec to the USA is live. No Quebec destination coverage.",
    localNotes:
      "City guide: Montreal. Neighbour: Ontario. Frequent US destinations: New York, Massachusetts, Florida, California.",
    faqs: [
      {
        q: "Is the site available in French?",
        a: "Not as a localized storefront yet. Gift messages can be French. We will not publish machine-translated doorway pages.",
      },
      {
        q: "Can you deliver in Montreal or Quebec City?",
        a: "Not as a published destination service.",
      },
      {
        q: "Does Eastern Time apply in Quebec?",
        a: "Yes for Montreal and most of the populated south. Confirm if you are ordering from a far-eastern community and the recipient ZIP uses another US zone.",
      },
    ],
    childSlugs: ["montreal"],
    relatedSlugs: ["ontario", "toronto"],
  },
  {
    kind: "city",
    slug: "montreal",
    name: "Montreal",
    label: "Montreal, QC",
    parents: { market, country, region: "quebec" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Eastern Time",
    title: "Send Gifts from Montreal to the USA | BlossomPot",
    description:
      "Order from Montreal to send flowers and gifts to the USA. French card messages, New England destinations — not a fake Montreal florist.",
    h1: "Send flowers and gifts from Montreal to the USA",
    intro:
      "Montreal senders often need a gift in Boston, New York, or Florida after a weekend trip or for family who winter in the US. BlossomPot handles the US destination. We do not list Plateau or Downtown Montreal delivery zones. Eastern Time keeps you aligned with New England cut-offs. Write the enclosure card in French or English — it prints as typed. Checkout fields and product titles stay English. If the recipient is in California, your late afternoon is still their late morning, which is the opposite problem Vancouver has with New York.",
    howItWorks:
      "Add the gift, write the bilingual-friendly message, enter the US address. Open /gifts-to-massachusetts or /gifts-to-new-york when those are the destinations.",
    availability: "Origin ordering from Montreal is live. No Montreal destination coverage.",
    localNotes: "Related: Quebec hub, Ottawa, Toronto. US: New York, Massachusetts, Florida.",
    faqs: [
      {
        q: "Do you deliver flowers in Montreal?",
        a: "No published destination service. This page is for sending to the United States.",
      },
      {
        q: "Can the card be in French?",
        a: "Yes. Type the message exactly as you want it printed.",
      },
      {
        q: "Is this page just the Toronto text with a different city?",
        a: "No. Montreal notes focus on New England destinations, French messages, and Quebec’s English-first storefront decision.",
      },
    ],
    relatedSlugs: ["quebec", "ottawa", "toronto"],
  },
  {
    kind: "region",
    slug: "manitoba",
    name: "Manitoba",
    label: "Manitoba",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Central Time",
    title: "Send Gifts from Manitoba to the USA | BlossomPot",
    description:
      "Manitoba shoppers can send flowers and gifts to the USA. Central Time and Winnipeg notes — no fake local coverage.",
    h1: "Send gifts from Manitoba to the USA",
    intro:
      "Manitoba sits on Central Time with Chicago, Dallas, and much of the US Plains. That is the practical reason this province has its own hub instead of borrowing Ontario’s Eastern Time copy. Winnipeg senders use BlossomPot to reach US recipients, not to book a local Exchange District florist we do not operate. A late-morning order in Winnipeg can still meet a Chicago same-day cut-off when the ZIP is eligible; New York is already an hour ahead. Winter road closures that keep you home do not block a paid US fulfillment.",
    howItWorks:
      "Checkout with a US ZIP. Treat Central Time as the conversion base. Open the Winnipeg city guide for city-level notes.",
    availability: "Origin service from Manitoba to the USA is live. No Manitoba destination claim.",
    localNotes: "City: Winnipeg. Neighbours: Saskatchewan, Ontario. US hubs: Illinois, Minnesota, Texas.",
    faqs: [
      {
        q: "Do you deliver in Winnipeg?",
        a: "Not as a published destination. Send to a US address.",
      },
      {
        q: "What timezone should I use for cut-offs?",
        a: "Central Time in Manitoba, then the destination page’s local clock.",
      },
      {
        q: "Why not fold Manitoba into a generic Canada page?",
        a: "Central Time and Minneapolis/Chicago destination patterns are not the same as Toronto’s.",
      },
    ],
    childSlugs: ["winnipeg"],
    relatedSlugs: ["saskatchewan", "ontario"],
  },
  {
    kind: "city",
    slug: "winnipeg",
    name: "Winnipeg",
    label: "Winnipeg, MB",
    parents: { market, country, region: "manitoba" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Central Time",
    title: "Send Gifts from Winnipeg to the USA | BlossomPot",
    description:
      "Order from Winnipeg to send gifts to the USA. Central Time and Upper Midwest destinations — not a fake Winnipeg shop.",
    h1: "Send gifts from Winnipeg to the USA",
    intro:
      "Winnipeg’s closest major US gifting pattern is the Upper Midwest — Minnesota, Illinois, the Dakotas — plus family who moved to Texas or California. BlossomPot delivers to those US ZIPs. We do not publish destination coverage for Winnipeg neighbourhoods. Central Time matches Chicago, which is the cut-off clock to use when the recipient is there. Extreme cold that delays your own errands does not delay a US domestic shipment after checkout. If you are driving to the US, still place the order from home so the gift is not sitting in a car overnight.",
    howItWorks:
      "Enter the US address, pay, and keep the confirmation. Open /gifts-to-illinois or /gifts-to-minnesota when relevant.",
    availability: "Origin ordering from Winnipeg is live. No Winnipeg destination listing.",
    localNotes: "Related: Manitoba, Saskatchewan, Edmonton. US: Illinois, Minnesota, Texas.",
    faqs: [
      {
        q: "Can you deliver in Winnipeg?",
        a: "No published destination service.",
      },
      {
        q: "Does Central Time match Chicago?",
        a: "Yes in normal conditions. Use the destination page if the ZIP is outside Central Time.",
      },
      {
        q: "Is this a thin city swap of the Toronto page?",
        a: "No. Winnipeg content is Central Time and Upper Midwest destinations, not Eastern Time and New York.",
      },
    ],
    relatedSlugs: ["manitoba", "edmonton", "calgary"],
  },
  {
    kind: "region",
    slug: "saskatchewan",
    name: "Saskatchewan",
    label: "Saskatchewan",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Central Time (Saskatchewan)",
    title: "Send Gifts from Saskatchewan to the USA | BlossomPot",
    description:
      "Saskatchewan shoppers can send gifts to the USA. Note on provincial time rules versus Alberta — no fake local florist pages.",
    h1: "Send gifts from Saskatchewan to the USA",
    intro:
      "Saskatchewan does not follow the same daylight-saving pattern as Alberta, which is why this province is not a copy of the Calgary hub. Most of the populated south stays on Central standard time year-round. That changes the offset to Denver and Phoenix through the year and is easy to get wrong if you reuse Alberta math. BlossomPot still fulfills only to US addresses. We do not list Saskatoon or Regina destination florist coverage. Use this page when you are sending from the province to a US ZIP and need clock guidance that is actually about Saskatchewan.",
    howItWorks:
      "Enter a US ZIP. In summer, Saskatchewan is often aligned with Central Daylight destinations (Chicago) and two hours behind Eastern Daylight. Confirm rather than memorizing Alberta’s offset.",
    availability: "Origin service from Saskatchewan to the USA is live. No provincial destination claim.",
    localNotes:
      "Neighbours: Alberta, Manitoba. US: North Dakota, Minnesota, Texas. City pages can be added when unique content exists; none are forced live as empty shells.",
    faqs: [
      {
        q: "Why is Saskatchewan’s clock different from Alberta?",
        a: "Most of Saskatchewan does not switch for daylight saving the way Alberta does. Offsets to US Mountain Time change by season.",
      },
      {
        q: "Do you deliver in Saskatoon or Regina?",
        a: "Not as published destination pages.",
      },
      {
        q: "Should I use the Alberta cut-off advice?",
        a: "No. Use this hub and the recipient’s US destination page.",
      },
    ],
    relatedSlugs: ["alberta", "manitoba"],
  },
  {
    kind: "region",
    slug: "nova-scotia",
    name: "Nova Scotia",
    label: "Nova Scotia",
    parents: { market, country },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Atlantic Time",
    title: "Send Gifts from Nova Scotia to the USA | BlossomPot",
    description:
      "Nova Scotia and Halifax senders can order gifts for the USA. Atlantic Time is one hour ahead of Eastern — not a fake local shop.",
    h1: "Send gifts from Nova Scotia to the USA",
    intro:
      "Nova Scotia is on Atlantic Time, one hour ahead of Toronto and New York. That is the entire reason this hub exists: a 1:00 PM Eastern same-day cut-off is already 2:00 p.m. in Halifax. If you copy Ontario advice you will miss the window. BlossomPot sends to US addresses. We do not publish destination florist coverage for Halifax or the South Shore. New England and Florida are common destinations for Atlantic Canadian families. Open the Halifax city guide for port-city travel notes.",
    howItWorks:
      "Shop, enter a US ZIP, and subtract one hour when you read an Eastern Time cut-off. For Central or Pacific US destinations you have even less same-day margin from Atlantic Time.",
    availability: "Origin service from Nova Scotia to the USA is live. No Nova Scotia destination claim.",
    localNotes: "City: Halifax. US: Massachusetts, New York, Florida. Other Atlantic provinces can be added with unique copy later.",
    faqs: [
      {
        q: "How far ahead is Halifax of New York?",
        a: "One hour (Atlantic vs Eastern) in normal conditions.",
      },
      {
        q: "Do you deliver in Halifax?",
        a: "Not as a published destination service.",
      },
      {
        q: "Can I use the Toronto page instead?",
        a: "You can shop the same catalog, but Toronto cut-off math is wrong for Atlantic Time.",
      },
    ],
    childSlugs: ["halifax"],
    relatedSlugs: ["ontario"],
  },
  {
    kind: "city",
    slug: "halifax",
    name: "Halifax",
    label: "Halifax, NS",
    parents: { market, country, region: "nova-scotia" },
    status: "published",
    serviceMode: "origin",
    isoCountry: "CA",
    currency: "CAD",
    language: "en",
    locale: "en-CA",
    timezoneLabel: "Atlantic Time",
    title: "Send Gifts from Halifax to the USA | BlossomPot",
    description:
      "Order from Halifax to send gifts to the USA. Atlantic Time cut-offs and New England destinations — no fake Halifax florist.",
    h1: "Send gifts from Halifax to the USA",
    intro:
      "Halifax senders are an hour closer to Europe than Toronto is, which is a fun geography fact and a bad way to plan a New York same-day gift. Atlantic Time means Eastern cut-offs expire earlier on your clock. Use BlossomPot to deliver in the United States. We do not list downtown Halifax or Dartmouth florist zones. Flights to Boston and New York are common; order the gift before you board if the occasion is the same day — the parcel is fulfilled in the US, not in your overhead bin.",
    howItWorks:
      "Enter the US address. If the destination is Boston or New York, remember you are one hour ahead. Open /gifts-to-massachusetts or /gifts-to-new-york for the local cut-off.",
    availability: "Origin ordering from Halifax is live. No Halifax destination coverage.",
    localNotes: "Related: Nova Scotia hub. US: Massachusetts, New York, Florida.",
    faqs: [
      {
        q: "Do you deliver in Halifax?",
        a: "No published destination service.",
      },
      {
        q: "Why order before a Boston flight?",
        a: "The gift ships from US fulfillment, not with you. Same-day US cut-offs can close while you are still in the airport.",
      },
      {
        q: "Is Atlantic Time always one hour ahead of Eastern?",
        a: "In standard seasonal practice yes. Confirm around DST change weekends if the occasion is that day.",
      },
    ],
    relatedSlugs: ["nova-scotia", "montreal", "boston"],
  },
];
