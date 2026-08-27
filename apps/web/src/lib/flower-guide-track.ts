"use client";

import { trackSearch } from "./track";

export function trackFlowerGuideSearch(query: string, resultCount: number) {
  trackSearch(`flower-guide:${query}`, resultCount);
}
