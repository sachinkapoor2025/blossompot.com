import type { FlowerGuide } from "../types";
import { coreFlowerGuides } from "./core";
import { moreFlowerGuides } from "./more";
import { specialtyFlowerGuides } from "./specialty";

export const publishedFlowerGuides: FlowerGuide[] = [
  ...coreFlowerGuides,
  ...moreFlowerGuides,
  ...specialtyFlowerGuides,
];

export function getPublishedGuide(slug: string): FlowerGuide | undefined {
  return publishedFlowerGuides.find((g) => g.slug === slug);
}
