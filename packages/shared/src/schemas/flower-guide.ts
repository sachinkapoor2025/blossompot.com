import { z } from "zod";

export const FLOWER_CONTENT_STATUSES = [
  "draft",
  "researching",
  "reviewed",
  "published",
  "needs_update",
  "archived",
] as const;

export type FlowerContentStatus = (typeof FLOWER_CONTENT_STATUSES)[number];

export const flowerContentStatusSchema = z.enum(FLOWER_CONTENT_STATUSES);

/** Only reviewed + published guides are indexable. */
export function isFlowerGuideIndexable(status: FlowerContentStatus): boolean {
  return status === "published" || status === "reviewed";
}

export const FLOWER_COLOURS = [
  "red",
  "pink",
  "white",
  "yellow",
  "orange",
  "purple",
  "blue",
  "green",
  "peach",
  "mixed",
] as const;

export type FlowerColour = (typeof FLOWER_COLOURS)[number];

export const FLOWER_SEASONS = ["spring", "summer", "autumn", "winter", "year-round"] as const;
export type FlowerSeason = (typeof FLOWER_SEASONS)[number];

export const FLOWER_OCCASIONS = [
  "birthday",
  "anniversary",
  "valentines-day",
  "mothers-day",
  "wedding",
  "engagement",
  "congratulations",
  "thank-you",
  "get-well",
  "sympathy",
  "funeral",
  "new-baby",
  "housewarming",
  "apology",
  "romantic",
  "just-because",
  "graduation",
  "corporate",
] as const;

export type FlowerOccasion = (typeof FLOWER_OCCASIONS)[number];
