import type { FlowerColour } from "@blossompot/shared";

export type ColourGuide = {
  slug: FlowerColour;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  association: string;
  occasions: string;
  season: string;
  flowers: string[];
};

export const colourGuides: ColourGuide[] = [
  {
    slug: "red",
    name: "Red Flowers",
    h1: "Red Flowers: Romance, Energy and When to Choose Another Colour",
    seoTitle: "Red Flowers Guide: Roses, Meanings & Occasions | BlossomPot",
    seoDescription: "When red flowers signal romance — and when they simply mean celebration. Roses, tulips, gerberas and more.",
    intro: "Red is the most coded flower colour in Western gifting because of the red rose. Other red flowers — tulips, gerberas, carnations — do not automatically carry the same romantic weight. Use red when you want warmth or romance; choose mixed brights when you want a party.",
    association: "Traditionally associated with romantic love in roses; also energy and celebration in mixed designs.",
    occasions: "Valentine's Day, anniversaries, and bold congratulations. Less ideal as a first gift to a colleague.",
    season: "Red roses are sold year-round. Red tulips are a spring story. Red dahlias are late summer.",
    flowers: ["rose", "tulip", "gerbera", "carnation", "dahlia"],
  },
  {
    slug: "pink",
    name: "Pink Flowers",
    h1: "Pink Flowers: Affection, Thanks and Celebration",
    seoTitle: "Pink Flowers Guide: Peonies, Roses & Meanings | BlossomPot",
    seoDescription: "Explore pink flowers for birthdays, thank-yous and weddings — peonies, roses, lisianthus and tulips.",
    intro: "Pink is the most versatile florist colour. It can be romantic without the intensity of red, or simply pretty for a birthday. Peonies, pink roses, lisianthus and tulips cover most briefs.",
    association: "Often used for admiration, gratitude and gentler affection. Not a single universal meaning.",
    occasions: "Birthdays, Mother's Day, thank-yous, weddings.",
    season: "Pink peonies are late spring. Pink roses are year-round.",
    flowers: ["rose", "peony", "tulip", "lisianthus", "carnation", "ranunculus"],
  },
  {
    slug: "white",
    name: "White Flowers",
    h1: "White Flowers: Weddings, Formality and Remembrance",
    seoTitle: "White Flowers Guide: Meaning, Weddings & Sympathy | BlossomPot",
    seoDescription: "Understand white flowers for weddings and sympathy — and why chrysanthemums and lilies need cultural care.",
    intro: "White can mean a wedding, a formal thank-you, or a farewell. The flower type decides the reading more than the colour alone. White roses and lisianthus are wedding staples. White lilies and, in some countries, white chrysanthemums are mourning flowers.",
    association: "Purity, elegance, new beginnings or remembrance — context matters.",
    occasions: "Weddings, sympathy, formal congratulations.",
    season: "White roses and carnations are year-round. White peonies are seasonal.",
    flowers: ["rose", "lily", "calla-lily", "orchid", "babys-breath", "gardenia", "chrysanthemum"],
  },
  {
    slug: "yellow",
    name: "Yellow Flowers",
    h1: "Yellow Flowers: Friendship, Sunshine and Older Caveats",
    seoTitle: "Yellow Flowers Guide: Sunflowers, Tulips & Friendship | BlossomPot",
    seoDescription: "Yellow flowers for friendship and cheer — plus why older rose lists treated yellow differently.",
    intro: "Yellow usually reads as friendly and optimistic today: sunflowers, yellow tulips, gerberas. Older European rose lists sometimes linked yellow roses with jealousy. Modern recipients rarely use that reading unless they are flower-history enthusiasts.",
    association: "Friendship, joy and get-well wishes in contemporary use.",
    occasions: "Birthdays, congratulations, just-because.",
    season: "Sunflowers feel like summer. Yellow tulips are spring. Yellow roses are year-round.",
    flowers: ["sunflower", "tulip", "gerbera", "rose", "chrysanthemum"],
  },
  {
    slug: "orange",
    name: "Orange Flowers",
    h1: "Orange Flowers: Warmth Without Formal Romance",
    seoTitle: "Orange Flowers Guide | BlossomPot",
    seoDescription: "Orange gerberas, roses and bird of paradise — energetic flowers for congratulations and summer.",
    intro: "Orange is energetic and less romantically coded than red. Gerberas, orange roses and late-summer dahlias suit congratulations and informal birthdays.",
    association: "Enthusiasm and warmth.",
    occasions: "Congratulations, birthdays, just-because.",
    season: "Strong in summer palettes; orange roses available year-round.",
    flowers: ["gerbera", "rose", "dahlia", "alstroemeria", "bird-of-paradise"],
  },
  {
    slug: "purple",
    name: "Purple Flowers",
    h1: "Purple Flowers: Ceremony, Calm and Modern Luxury",
    seoTitle: "Purple Flowers Guide: Lavender, Iris & Orchids | BlossomPot",
    seoDescription: "Purple flower meanings and occasions — lavender, iris, lisianthus and orchids.",
    intro: "Purple ranges from rustic lavender to ceremonial iris and luxury orchids. It often feels considered rather than casual.",
    association: "Admiration, calm or ceremony depending on the flower.",
    occasions: "Thank-yous, sympathy (iris), luxury congratulations (orchid).",
    season: "Lavender is summer. Iris is spring. Orchids are year-round.",
    flowers: ["lavender", "iris", "lisianthus", "orchid", "hydrangea"],
  },
  {
    slug: "blue",
    name: "Blue Flowers",
    h1: "Blue Flowers: True Blues Are Rare",
    seoTitle: "Blue Flowers Guide: Hydrangeas & Iris | BlossomPot",
    seoDescription: "Why true blue flowers are uncommon, and which florist blues — hydrangeas, iris, delphinium — are real.",
    intro: "True blue pigment is uncommon in garden flowers. What florists sell as blue is often hydrangea, iris, delphinium, or a dyed carnation. Blue hydrangeas are a garden-chemistry story as well as a florist colour.",
    association: "Calm, apology or uniqueness in modern use.",
    occasions: "Thank-yous, weddings with a blue palette.",
    season: "Hydrangeas peak in summer. Dutch iris is spring. Dyed 'blue' carnations are year-round.",
    flowers: ["hydrangea", "iris", "delphinium", "carnation"],
  },
  {
    slug: "green",
    name: "Green Flowers",
    h1: "Green Flowers: Texture More Than Bloom",
    seoTitle: "Green Flowers Guide | BlossomPot",
    seoDescription: "Green hydrangeas, orchids and foliage-led designs for modern and housewarming gifts.",
    intro: "Green flowers are usually about texture: antique hydrangeas, green cymbidium orchids, bells of Ireland. They suit modern and housewarming designs.",
    association: "Renewal and a contemporary, less romantic look.",
    occasions: "Housewarmings, modern weddings, corporate.",
    season: "Antique hydrangeas often show green as they mature in late season.",
    flowers: ["hydrangea", "orchid", "anthurium"],
  },
  {
    slug: "peach",
    name: "Peach Flowers",
    h1: "Peach Flowers: Soft Romance and Modern Weddings",
    seoTitle: "Peach Flowers Guide | BlossomPot",
    seoDescription: "Peach roses, ranunculus and dahlias for weddings and gentle romance.",
    intro: "Peach and coral sit between pink and orange. They are a modern wedding favourite and a softer romantic gift than red.",
    association: "Sincerity and warm romance in contemporary palettes.",
    occasions: "Weddings, anniversaries, thank-yous.",
    season: "Peach ranunculus in spring; peach garden roses in summer; peach roses year-round.",
    flowers: ["rose", "ranunculus", "dahlia", "peony", "lisianthus"],
  },
  {
    slug: "mixed",
    name: "Mixed Colour Flowers",
    h1: "Mixed Colour Flowers: When a Palette Beats a Single Meaning",
    seoTitle: "Mixed Colour Flower Bouquets Guide | BlossomPot",
    seoDescription: "Why mixed bouquets work for birthdays and celebrations when a single colour would over-specify the message.",
    intro: "A mixed bouquet is often the most honest birthday or just-because gift. It does not force a single colour meaning. Designers use a lead colour plus two supporting tones so the bunch still looks intentional.",
    association: "Celebration and personality rather than one coded emotion.",
    occasions: "Birthdays, congratulations, just-because.",
    season: "Use whatever is plentiful that week — that is the point of a mixed seasonal bunch.",
    flowers: ["rose", "alstroemeria", "gerbera", "tulip", "lisianthus"],
  },
];

export function getColourGuide(slug: string): ColourGuide | undefined {
  return colourGuides.find((c) => c.slug === slug);
}
