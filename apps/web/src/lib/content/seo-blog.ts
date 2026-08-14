import type { BlogPost } from "./blog-posts";

/** Legacy SEO stub pipeline retired — storefront blog is handwritten flower/gift posts only. */
export function allSeoBlogSlugs(): string[] {
  return [];
}

export function seoBlogPostToBlogPost(_slug: string): BlogPost | undefined {
  return undefined;
}

export function allBlogSlugsMerged(handwritten: string[]): string[] {
  return [...handwritten];
}
