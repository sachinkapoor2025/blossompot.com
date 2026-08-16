export type GlossaryTerm = {
  slug: string;
  term: string;
  definition: string;
  related?: string[];
};

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: "bouquet",
    term: "Bouquet",
    definition:
      "A gathered bunch of cut flowers, usually meant to be held or placed in a vase. In shops it may be hand-tied, wrapped, or already arranged in a container.",
  },
  {
    slug: "hand-tied-bouquet",
    term: "Hand-tied bouquet",
    definition:
      "Stems bound together in the hand so they spiral and can stand in a vase when the wrap is removed. A common European and British florist method.",
  },
  {
    slug: "spray-rose",
    term: "Spray rose",
    definition:
      "A rose stem with several smaller blooms instead of one large head. Used for texture in mixed bouquets and wedding work.",
    related: ["rose"],
  },
  {
    slug: "garden-rose",
    term: "Garden rose",
    definition:
      "A rose with a looser, many-petalled, old-fashioned form — often more fragrant than a tight hybrid-tea florist rose. Popular in weddings.",
    related: ["rose"],
  },
  {
    slug: "boutonniere",
    term: "Boutonniere",
    definition:
      "A small floral accent worn on a lapel, traditionally on the left. Often a rose, spray rose, or other compact bloom with a bit of foliage.",
  },
  {
    slug: "corsage",
    term: "Corsage",
    definition:
      "A small arrangement worn on the wrist or pinned to clothing, common at formal dances and some weddings. Gardenias and spray roses are frequent choices.",
    related: ["gardenia", "rose"],
  },
  {
    slug: "floral-foam",
    term: "Floral foam",
    definition:
      "A water-absorbing plastic foam used to hold stems in place. It is convenient for some designs but is not biodegradable. Many florists now offer foam-free mechanics.",
  },
  {
    slug: "flower-food",
    term: "Flower food",
    definition:
      "A sachet of sugar, acidifier and biocide designed to feed stems and slow bacteria in vase water. It helps when used in a clean vase; it is not a substitute for changing dirty water.",
  },
  {
    slug: "posy",
    term: "Posy",
    definition:
      "A small, round hand-tied bouquet. Historically a compact gift bunch; today a common bridal and everyday size.",
  },
  {
    slug: "nosegay",
    term: "Nosegay",
    definition:
      "A small, fragrant handheld bunch. The word comes from the idea of a 'gay' (pretty) thing for the nose — a scented posy.",
  },
  {
    slug: "floriography",
    term: "Floriography",
    definition:
      "The Victorian-era practice of assigning coded meanings to flowers and colours. It is a historical language, not a scientific fact, and it was never used the same way in every country.",
  },
  {
    slug: "florists-choice",
    term: "Florist's choice bouquet",
    definition:
      "A design where the florist selects the best stems available that day within a colour or budget brief. It usually looks fresher than forcing an out-of-season named flower.",
  },
  {
    slug: "vase-life",
    term: "Vase life",
    definition:
      "How long a cut flower remains attractive in water. It is a range that depends on cultivar, harvest stage, transport and home care — not a guaranteed number of days.",
  },
  {
    slug: "cut-flower",
    term: "Cut flower",
    definition:
      "A flower harvested for arranging, as opposed to a potted flowering plant. Cut flowers need a vase; plants need light and watering as living specimens.",
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}
