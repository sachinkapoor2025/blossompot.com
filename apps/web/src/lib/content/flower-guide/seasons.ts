export type SeasonPage = {
  slug: string;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  northern: string[];
  southern: string[];
  flowers: string[];
  bouquetIdeas: string[];
  care: string[];
  availability: string[];
};

export const seasonPages: SeasonPage[] = [
  {
    slug: "spring-flowers",
    name: "Spring Flowers",
    h1: "Spring Flowers: What Blooms, What Florists Sell",
    seoTitle: "Spring Flowers Guide: Tulips, Peonies & Seasonal Blooms | BlossomPot",
    seoDescription:
      "Learn which flowers define spring in the US, UK, Europe, Canada and Australia — and how florist supply differs from garden season.",
    intro:
      "Spring is when many people first think about seasonal flowers: tulips, ranunculus, lilacs and, later, peonies. The calendar is not the same everywhere. March–May is spring in the US, Canada, the UK and most of Europe. In Australia, spring is roughly September–November. Florist shops also force bulbs and import stems, so 'spring flowers' can appear a little before outdoor gardens catch up.",
    northern: [
      "Late winter into early spring: forced tulips, hyacinths, Dutch iris, anemones and ranunculus.",
      "Mid-spring: more garden-style tulips, lilac (short window), stock and sweet pea in cooler regions.",
      "Late spring: peonies begin in many temperate zones; garden roses start their first flush.",
    ],
    southern: [
      "Australian and other Southern Hemisphere spring sits in September–November.",
      "Local tulips, ranunculus and peonies follow that reversed calendar.",
      "Northern-grown imports can still appear, which is why a Sydney florist may offer 'spring' stems in different months than a London florist.",
    ],
    flowers: ["tulip", "ranunculus", "peony", "freesia", "iris", "rose", "lilac", "hyacinth", "daffodil"],
    bouquetIdeas: [
      "A monochrome tulip bunch for a birthday that should feel seasonal, not formal.",
      "Ranunculus and lisianthus for a spring wedding when peonies are not yet local.",
      "Freesia mixed with stock when fragrance is the brief.",
    ],
    care: [
      "Spring rooms can still be dry from heating. Keep vases away from radiators.",
      "Tulips and ranunculus prefer cool rooms.",
      "Change water often — spring mixed bunches often include sap-heavy bulbs.",
    ],
    availability: [
      "Local growing season is the garden story.",
      "Commercial availability includes forced bulbs and imports.",
      "Price is usually kinder in the core spring window than when a flower is shipped against its natural season.",
    ],
  },
  {
    slug: "summer-flowers",
    name: "Summer Flowers",
    h1: "Summer Flowers: Sunflowers, Dahlias & Heat-Wise Care",
    seoTitle: "Summer Flowers Guide: Sunflowers, Dahlias & Seasonal Care | BlossomPot",
    seoDescription:
      "Discover summer flowers for the US, UK, Europe, Canada and Australia, plus how heat changes vase life after delivery.",
    intro:
      "Summer is the season of sunflowers, dahlias, lavender, garden roses and many wilder textures. In the Northern Hemisphere that is roughly June–August; in Australia, December–February. Heat is the practical issue: the same flower that lasts a week in a cool room may fade in two days beside a sunny window.",
    northern: [
      "Early summer: garden roses, peonies at the tail in cooler climates, hydrangeas, lisianthus.",
      "High summer: sunflowers, lavender, zinnias, cosmos, gladiolus.",
      "Late summer: dahlias begin their long show into autumn.",
    ],
    southern: [
      "Australian summer is December–February. Local sunflowers and dahlias follow that heat.",
      "Indoor air-conditioning in the UAE and hot US cities can help vase life if the cold chain was respected before delivery.",
    ],
    flowers: ["sunflower", "dahlia", "lavender", "hydrangea", "rose", "lisianthus", "zinnia", "gladiolus"],
    bouquetIdeas: [
      "Sunflowers for an informal birthday.",
      "Dahlias and garden roses for a late-summer wedding.",
      "Hydrangea-heavy designs when you need volume.",
    ],
    care: [
      "Use more water than you think and recut stems on arrival.",
      "Keep arrangements out of direct sun and away from fruit bowls.",
      "Hydrangeas and sunflowers are especially thirsty in heat.",
    ],
    availability: [
      "Field flowers are plentiful in the local summer.",
      "Imported peonies or ranunculus in high summer are off-season luxuries in the north.",
    ],
  },
  {
    slug: "autumn-flowers",
    name: "Autumn Flowers",
    h1: "Autumn Flowers: Chrysanthemums, Dahlias & Harvest Palettes",
    seoTitle: "Autumn Flowers Guide: Chrysanthemums, Dahlias & Seasonal Colour | BlossomPot",
    seoDescription:
      "See which flowers define autumn in different countries, including Australian Mother's Day mums and harvest palettes.",
    intro:
      "Autumn (fall) brings chrysanthemums, late dahlias, richer rose colours and harvest foliage. Northern autumn is September–November. In Australia, autumn is March–May — which is why chrysanthemums are a traditional Australian Mother's Day flower.",
    northern: [
      "Chrysanthemums, late dahlias, sedum, and garden roses in deeper tones.",
      "Sunflowers continue into early autumn in many US regions.",
    ],
    southern: [
      "Australian autumn includes May Mother's Day, when mums are seasonally correct.",
      "Northern 'fall wedding' flowers may be spring flowers in Sydney.",
    ],
    flowers: ["chrysanthemum", "dahlia", "sunflower", "rose", "hydrangea"],
    bouquetIdeas: [
      "Bronze and yellow mums for a harvest table — unless the recipient's culture treats white chrysanthemums as funeral flowers.",
      "Late dahlias for an autumn wedding in the north.",
    ],
    care: [
      "Indoor heating may start; keep vases off radiators.",
      "Woody mum stems need a fresh cut.",
    ],
    availability: [
      "Garden hardy mums are autumn plants; florist mums are also produced year-round.",
      "Dahlias end with frost in cold climates.",
    ],
  },
  {
    slug: "winter-flowers",
    name: "Winter Flowers",
    h1: "Winter Flowers: What Is Actually Available",
    seoTitle: "Winter Flowers Guide: Amaryllis, Forced Bulbs & Year-Round Roses | BlossomPot",
    seoDescription:
      "Understand winter florist flowers versus garden dormancy — including imported roses, orchids and forced bulbs.",
    intro:
      "Outdoor gardens in cold climates are mostly dormant in winter, but florist shops are not empty. Roses, carnations, chrysanthemums, orchids and forced bulbs (amaryllis, paperwhites, hyacinths, early tulips) fill December–February in the north. Australian winter is June–August and has its own local list.",
    northern: [
      "Greenhouse and imported roses remain the default romantic flower — Valentine's Day sits in this window.",
      "Forced bulbs and orchids make thoughtful living gifts when outdoor gardens are frozen.",
      "Amaryllis is a classic winter pot plant.",
    ],
    southern: [
      "Australian winter can still offer camellias and other cool-climate blooms locally.",
      "Valentine's Day in Australia is winter, so rose demand is import-and-greenhouse driven just as in the north.",
    ],
    flowers: ["rose", "orchid", "tulip", "amaryllis", "hyacinth", "carnation", "anemone"],
    bouquetIdeas: [
      "A rose bouquet for Valentine's Day — expect higher prices, not a lack of flowers.",
      "A potted orchid when you want a gift that outlasts a winter bouquet.",
    ],
    care: [
      "Keep flowers away from cold drafts at the door and from heating vents.",
      "Let very cold boxes warm slightly before arranging so stems are not brittle.",
    ],
    availability: [
      "Winter is not 'no flowers'. It is 'different flowers, more greenhouse and import'.",
      "Local garden season and commercial availability diverge most in winter.",
    ],
  },
];

export const monthlyCalendar: {
  month: string;
  north: string;
  australia: string;
  notes: string;
}[] = [
  { month: "January", north: "Forced tulips, amaryllis, greenhouse roses, orchids", australia: "Peak summer: sunflowers, dahlias, garden roses", notes: "US/UK winter vs Australian high summer." },
  { month: "February", north: "Valentine roses, ranunculus, anemones, early tulips", australia: "Late summer garden flowers; imported Valentine roses", notes: "Rose prices rise worldwide around Valentine's Day." },
  { month: "March", north: "Tulips, iris, freesia; UK Mothering Sunday demand", australia: "Early autumn; mums begin to feel seasonal", notes: "UK Mother's Day is in March, not May." },
  { month: "April", north: "Tulips, ranunculus, stock; Easter lilies in Christian markets", australia: "Autumn textures", notes: "Easter timing moves; longiflorum lilies follow the holiday." },
  { month: "May", north: "Peonies begin, garden roses, US Mother's Day", australia: "Australian Mother's Day — chrysanthemums are traditional", notes: "Same holiday, opposite season and different signature flowers." },
  { month: "June", north: "Peonies (late), roses, hydrangeas, early summer mixes", australia: "Early winter greenhouse and import mix", notes: "Northern wedding peak begins." },
  { month: "July", north: "Garden roses, sunflowers, lavender, lisianthus", australia: "Winter; camellias and imports", notes: "Heat-care matters for northern deliveries." },
  { month: "August", north: "Sunflowers, dahlias, late summer garden style", australia: "Late winter into early forced spring bulbs", notes: "Dahlia season opens in many northern gardens." },
  { month: "September", north: "Dahlias, early mums, richer rose tones", australia: "Spring begins: tulips and ranunculus locally", notes: "Seasons cross: northern autumn, Australian spring." },
  { month: "October", north: "Chrysanthemums, late dahlias, harvest palettes", australia: "Spring peonies and garden roses in cooler regions", notes: "Northern Halloween/harvest colour." },
  { month: "November", north: "Mums, greenhouse roses, orchids", australia: "Late spring into early summer locals", notes: "US Thanksgiving tables often use mums and roses." },
  { month: "December", north: "Amaryllis, roses, orchids, forced bulbs", australia: "High summer entertaining flowers", notes: "Holiday demand is global; local stems differ." },
];

export const seasonalHub = {
  slug: "seasonal-flowers",
  h1: "Seasonal Flowers: A Practical Calendar",
  seoTitle: "Seasonal Flowers & Monthly Flower Calendar | BlossomPot",
  seoDescription:
    "A seasonal flower guide that separates local garden season from florist and imported availability in the US, UK, Europe, Canada, Australia and the UAE.",
  intro:
    "A flower can be 'in season' in a garden, available from a greenhouse, or imported from the opposite hemisphere. BlossomPot treats those as three different facts. This hub explains the difference, then points to spring, summer, autumn and winter guides and a month-by-month calendar.",
};
