import type {
  FlowerColour,
  FlowerContentStatus,
  FlowerOccasion,
  FlowerSeason,
} from "@blossompot/shared";

export type { FlowerColour, FlowerContentStatus, FlowerOccasion, FlowerSeason };

export type FlowerImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  filename: string;
  attribution?: string;
  license?: string;
  role: "hero" | "close-up" | "bouquet" | "colour" | "variety" | "habitat";
};

export type FlowerColourNote = {
  colour: FlowerColour;
  label: string;
  association: string;
  occasions: FlowerOccasion[];
};

export type FlowerVariety = {
  name: string;
  summary: string;
};

export type FlowerFaq = { q: string; a: string };

export type FlowerSource = {
  label: string;
  url?: string;
  note?: string;
};

export type MarketSeasonNote = {
  market: "us" | "canada" | "uk" | "europe" | "australia" | "uae";
  summary: string;
};

export type FlowerGuide = {
  slug: string;
  name: string;
  commonNames: string[];
  botanicalName: string;
  family: string;
  letter: string;
  shortDescription: string;
  glance: string;
  whatIs: string;
  about: string[];
  meaning: string[];
  colours: FlowerColourNote[];
  varieties: FlowerVariety[];
  season: FlowerSeason[];
  seasonSummary: string;
  seasonDetail: string[];
  marketNotes: MarketSeasonNote[];
  origin: string;
  habitat: string;
  appearance: string;
  fragrance: string;
  vaseLife: string;
  cutFlower: boolean;
  bouquetUse: string;
  floristUses: string;
  care: string[];
  occasions: FlowerOccasion[];
  occasionNotes: string[];
  petSafety: string;
  pollenNotes: string;
  facts: string[];
  relatedFlowers: string[];
  relatedColours: FlowerColour[];
  relatedOccasions: FlowerOccasion[];
  relatedCareSlug?: string;
  shopQuery: string;
  shopCategory?: string;
  faqs: FlowerFaq[];
  sources: FlowerSource[];
  images: FlowerImage[];
  status: FlowerContentStatus;
  publishedAt?: string;
  updatedAt: string;
  reviewedBy: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
};

export type FlowerDirectoryEntry = {
  slug: string;
  name: string;
  letter: string;
  shortDescription: string;
  colours: FlowerColour[];
  season: FlowerSeason[];
  meaning: string;
  occasions: FlowerOccasion[];
  fragrance: "none" | "light" | "moderate" | "strong";
  longevity: "short" | "medium" | "long";
  petFriendly?: boolean;
  categories: string[];
  status: FlowerContentStatus;
  image?: FlowerImage;
};

export type FlowerGuideNavItem = {
  label: string;
  href: string;
  description?: string;
};
