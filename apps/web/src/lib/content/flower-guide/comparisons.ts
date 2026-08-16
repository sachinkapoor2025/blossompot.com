export type ComparisonRow = { label: string; a: string; b: string };

export type FlowerComparison = {
  slug: string;
  a: string;
  b: string;
  title: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  rows: ComparisonRow[];
  verdict: string;
};

export const flowerComparisons: FlowerComparison[] = [
  {
    slug: "roses-vs-peonies",
    a: "rose",
    b: "peony",
    title: "Roses vs Peonies",
    h1: "Roses vs Peonies: Season, Look and When to Choose Each",
    seoTitle: "Roses vs Peonies | BlossomPot",
    seoDescription: "Compare roses and peonies on season, vase life, meaning, price and wedding use.",
    intro: "Roses are the year-round romantic default. Peonies are a short-season luxury with a lusher, garden look. Choose peonies when the date falls in their window; choose roses when you need reliability.",
    rows: [
      { label: "Appearance", a: "Bud-to-cup hybrid teas or looser garden forms", b: "Large, often globe-shaped, many-petalled heads" },
      { label: "Fragrance", a: "Varies from none to strong", b: "Light to moderate, cultivar-dependent" },
      { label: "Season", a: "Commercial cuts year-round", b: "Short natural late-spring window; imports cost more" },
      { label: "Meaning", a: "Strong colour conventions, especially red", b: "Romance, honour, prosperity in several traditions" },
      { label: "Longevity", a: "Often several days to about a week", b: "Often about five to seven days once open" },
      { label: "Best occasions", a: "Valentine's, anniversaries, everyday romance", b: "Weddings and late-spring luxury gifts" },
      { label: "Price considerations", a: "Rises around holidays", b: "Usually higher; scarcity is part of the price" },
      { label: "Care", a: "Clean water, recut stems, cool room", b: "Space for opening heads; clean water" },
      { label: "Availability", a: "Predictable in shops", b: "Seasonal locally; imported off-season" },
    ],
    verdict: "If the gift must arrive in January looking romantic, send roses. If the wedding is in June in the northern US or UK, peonies are worth asking for.",
  },
  {
    slug: "roses-vs-tulips",
    a: "rose",
    b: "tulip",
    title: "Roses vs Tulips",
    h1: "Roses vs Tulips: Formal Romance or Spring Ease",
    seoTitle: "Roses vs Tulips | BlossomPot",
    seoDescription: "Roses vs tulips — formality, season, pet safety and the right occasion for each.",
    intro: "Roses read as classic and often romantic. Tulips read as seasonal and lighter. Tulips also keep growing in the vase and are toxic to pets.",
    rows: [
      { label: "Appearance", a: "Woody stems, layered petals", b: "Smooth stems, cup or parrot forms" },
      { label: "Fragrance", a: "Variable", b: "Usually light" },
      { label: "Season", a: "Year-round commercially", b: "Late winter–spring in the north" },
      { label: "Meaning", a: "Colour-coded romance in Western gifting", b: "Affection and spring, looser coding" },
      { label: "Longevity", a: "Several days to a week-plus", b: "Often five to ten days; stems elongate" },
      { label: "Best occasions", a: "Romance, formal thanks", b: "Birthdays, spring Mother's Day, just-because" },
      { label: "Price considerations", a: "Holiday spikes", b: "Usually kinder in core spring" },
      { label: "Care", a: "Standard recut and clean water", b: "Deep vase, cool room, watch daffodil mix" },
      { label: "Availability", a: "Always in the wholesale chain", b: "Thins in northern summer" },
    ],
    verdict: "Send tulips when you want spring without a formal love letter. Send roses when the message should be unmistakable.",
  },
  {
    slug: "lilies-vs-roses",
    a: "lily",
    b: "rose",
    title: "Lilies vs Roses",
    h1: "Lilies vs Roses: Scent, Sympathy and Pet Safety",
    seoTitle: "Lilies vs Roses | BlossomPot",
    seoDescription: "Compare lilies and roses for sympathy, celebrations and homes with cats.",
    intro: "Roses are the romantic staple. True lilies are statement stems used in sympathy, Easter and big mixed bouquets. The decisive difference in many homes is that Lilium is dangerous to cats.",
    rows: [
      { label: "Appearance", a: "Large six-tepal flowers, often spotted", b: "Layered buds and cups" },
      { label: "Fragrance", a: "Orientals often strong; Asiatics usually not", b: "Variable" },
      { label: "Season", a: "Wide commercial availability; Easter peak for longiflorum", b: "Year-round" },
      { label: "Meaning", a: "Purity and remembrance for white types", b: "Love and celebration by colour" },
      { label: "Longevity", a: "Stems last as buds open in sequence", b: "Several days to a week-plus" },
      { label: "Best occasions", a: "Sympathy, Easter, formal mixed", b: "Romance, birthdays, weddings" },
      { label: "Price considerations", a: "Statement stems, fewer per bunch", b: "Sold by the stem or dozen" },
      { label: "Care", a: "Remove anthers; cat safety", b: "Standard vase care" },
      { label: "Availability", a: "Generally good", b: "Excellent" },
    ],
    verdict: "If there is a cat in the house, do not send true lilies. Choose roses or another non-Lilium flower.",
  },
  {
    slug: "peonies-vs-ranunculus",
    a: "peony",
    b: "ranunculus",
    title: "Peonies vs Ranunculus",
    h1: "Peonies vs Ranunculus: Two Lush Spring Looks",
    seoTitle: "Peonies vs Ranunculus | BlossomPot",
    seoDescription: "Peonies vs ranunculus for weddings — season, scale and vase life.",
    intro: "Both flowers give a many-petalled, romantic look. Peonies are larger and later. Ranunculus are smaller, earlier, and a common peony stand-in for late-winter weddings.",
    rows: [
      { label: "Appearance", a: "Larger, heavier heads", b: "Smaller, paper-swirl petals" },
      { label: "Fragrance", a: "Often noticeable", b: "Light" },
      { label: "Season", a: "Late spring–early summer locally", b: "Late winter–spring" },
      { label: "Meaning", a: "Romance and prosperity traditions", b: "Modern 'charm' lists" },
      { label: "Longevity", a: "Moderate once open", b: "Moderate if kept cool" },
      { label: "Best occasions", a: "Peak-season weddings", b: "Earlier spring weddings and posies" },
      { label: "Price considerations", a: "High in peak demand", b: "High but often more available earlier" },
      { label: "Care", a: "Space and clean water", b: "Hollow stems, keep cool" },
      { label: "Availability", a: "Short local window", b: "Cool-season window" },
    ],
    verdict: "Ask for peonies in their month. Ask for ranunculus when you want the look earlier in the year.",
  },
  {
    slug: "orchids-vs-roses",
    a: "orchid",
    b: "rose",
    title: "Orchids vs Roses",
    h1: "Orchids vs Roses: Plant Gift or Cut Romance",
    seoTitle: "Orchids vs Roses | BlossomPot",
    seoDescription: "Choose a long-lasting orchid plant or a classic cut-rose bouquet — different jobs, both gifts.",
    intro: "A moth orchid is usually a living plant that flowers for weeks. A rose bouquet is a cut-flower moment. They solve different gifting jobs.",
    rows: [
      { label: "Appearance", a: "Architectural sprays or potted plant", b: "Classic cut bunch" },
      { label: "Fragrance", a: "Many Phalaenopsis unscented", b: "Variable" },
      { label: "Season", a: "Year-round greenhouse plants", b: "Year-round cuts" },
      { label: "Meaning", a: "Refinement and respect", b: "Romance by colour" },
      { label: "Longevity", a: "Weeks in bloom as a plant", b: "Days as a cut bunch" },
      { label: "Best occasions", a: "Housewarming, corporate, congratulations", b: "Romance, birthdays, weddings" },
      { label: "Price considerations", a: "One plant vs many stems", b: "Priced by stem count and holiday" },
      { label: "Care", a: "Indirect light, careful watering", b: "Vase care" },
      { label: "Availability", a: "Excellent as plants", b: "Excellent as cuts" },
    ],
    verdict: "Send roses for romance this weekend. Send an orchid when you want the gift still looking considered in three weeks.",
  },
  {
    slug: "sunflowers-vs-gerberas",
    a: "sunflower",
    b: "gerbera",
    title: "Sunflowers vs Gerberas",
    h1: "Sunflowers vs Gerberas: Two Cheerful Daisies",
    seoTitle: "Sunflowers vs Gerberas | BlossomPot",
    seoDescription: "Compare sunflowers and gerberas for birthdays, scale and season.",
    intro: "Both are daisy-family cheer. Sunflowers are large and seasonal. Gerberas are colourful year-round greenhouse cuts with hollow stems.",
    rows: [
      { label: "Appearance", a: "Large heads, thick stems", b: "Clean daisy heads, hollow stems" },
      { label: "Fragrance", a: "Little", b: "Little" },
      { label: "Season", a: "Summer–early autumn character", b: "Year-round" },
      { label: "Meaning", a: "Loyalty and warmth", b: "Cheerfulness" },
      { label: "Longevity", a: "About a week if hydrated", b: "Several days to a week; necks can bend" },
      { label: "Best occasions", a: "Informal birthdays, thanks", b: "Get-well, kids' birthdays, colour blocking" },
      { label: "Price considerations", a: "Seasonal field pricing", b: "Stable greenhouse crop" },
      { label: "Care", a: "Heavy vase, frequent water changes", b: "Very clean water, neck support" },
      { label: "Availability", a: "Best in the warm season", b: "Predictable all year" },
    ],
    verdict: "Pick sunflowers when you want a seasonal statement. Pick gerberas when you want a specific colour any month.",
  },
  {
    slug: "hydrangeas-vs-peonies",
    a: "hydrangea",
    b: "peony",
    title: "Hydrangeas vs Peonies",
    h1: "Hydrangeas vs Peonies: Volume or Lush Individual Blooms",
    seoTitle: "Hydrangeas vs Peonies | BlossomPot",
    seoDescription: "Hydrangeas vs peonies for weddings — volume, season and hydration.",
    intro: "Hydrangeas give volume per stem. Peonies give individual lush blooms. Both are wedding favourites; hydrangeas wilt faster if thirsty, peonies are more season-bound.",
    rows: [
      { label: "Appearance", a: "One stem fills a lot of space", b: "Individual show blooms" },
      { label: "Fragrance", a: "Usually none", b: "Often present" },
      { label: "Season", a: "Summer garden flush; commercial cuts wider", b: "Short late-spring peak" },
      { label: "Meaning", a: "Gratitude in modern lists", b: "Romance and honour traditions" },
      { label: "Longevity", a: "Variable; hydration-sensitive", b: "Moderate once open" },
      { label: "Best occasions", a: "Weddings, thank-yous, housewarmings", b: "Weddings, late-spring romance" },
      { label: "Price considerations", a: "Efficient for large installs", b: "Higher per bloom" },
      { label: "Care", a: "Deep water, revive limp heads", b: "Space and clean water" },
      { label: "Availability", a: "Broader than peonies", b: "Narrower locally" },
    ],
    verdict: "Use hydrangeas when the design needs mass. Use peonies when each flower should be the hero.",
  },
];

export function getComparison(slug: string): FlowerComparison | undefined {
  return flowerComparisons.find((c) => c.slug === slug);
}
