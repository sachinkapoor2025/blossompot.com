import type { BlogPost } from "./blog-posts";
import { categoryHref } from "@/lib/category-urls";
import { getSeoBlogEntry, locationPublicPath, seoBlogEntries } from "./seo-data";

const PUBLISHED = "2026-06-15";
const UPDATED = "2026-07-05";

const categoryLinks = [
  { label: "Single Rakhi", slug: "single-rakhi" },
  { label: "Rakhi Combo", slug: "rakhi-combo" },
  { label: "Kids Rakhi", slug: "kids-rakhi" },
  { label: "Bhaiya Bhabhi Rakhi", slug: "bhaiya-bhabhi-rakhi" },
  { label: "Lumba Rakhi", slug: "lumba-rakhi" },
] as const;

function templateSections(entry: ReturnType<typeof getSeoBlogEntry>): BlogPost["sections"] {
  if (!entry) return [];
  const kw = entry.keyword;
  const collections = categoryLinks
    .map((c) => `${c.label} (${categoryHref(c.slug)})`)
    .join(", ");

  return [
    {
      paragraphs: [
        `${entry.title} is a common search when sisters plan Raksha Bandhan from India, the UK, Canada, or anywhere abroad. At BlossomPot, we help you ${kw} with domestic USA shipping — your brother receives a beautifully packed rakhi without international customs delays.`,
        `This guide answers what you need to know about ${kw}. Start at our homepage (/) then browse: ${collections}.`,
      ],
    },
    {
      heading: "How BlossomPot helps",
      paragraphs: [
        "Order online at blossompot.com with your brother's US address at checkout.",
        "Pay in USD (Stripe) or INR (Razorpay) from anywhere in the world.",
        "We ship domestically within America in 5–7 business days (faster from our California warehouse to Los Angeles, San Jose, and San Francisco).",
        "Most rakhis include complimentary roli and chawal for the tilak ceremony.",
      ],
    },
    {
      heading: "Shop related collections & city delivery",
      paragraphs: [
        `Send rakhi to USA from India via our ${categoryLinks[0].label} collection (${categoryHref(categoryLinks[0].slug)}) or ${categoryLinks[1].label} (${categoryHref(categoryLinks[1].slug)}) with chocolates.`,
        `Popular delivery pages: ${locationPublicPath("new-york")}, ${locationPublicPath("new-jersey")}, ${locationPublicPath("los-angeles")}, ${locationPublicPath("texas")}.`,
        "See our Raksha Bandhan 2026 guide (/raksha-bandhan) for delivery cutoff dates — festival: August 28, 2026.",
        "Order by August 5–10 for standard nationwide delivery; California metro areas often receive orders faster from our US warehouse.",
      ],
    },
  ];
}

export function seoBlogPostToBlogPost(slug: string): BlogPost | undefined {
  const entry = getSeoBlogEntry(slug);
  if (!entry) return undefined;
  return {
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    excerpt: entry.excerpt,
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    sections: templateSections(entry),
    relatedCategory: "single-rakhi",
  };
}

export function allSeoBlogSlugs(): string[] {
  return seoBlogEntries.map((b) => b.slug);
}

export function getAllBlogSlugs(handwritten: string[]): string[] {
  const set = new Set([...handwritten, ...allSeoBlogSlugs()]);
  return [...set];
}

export function resolveBlogPost(slug: string, handwritten?: BlogPost): BlogPost | undefined {
  if (handwritten) return handwritten;
  return seoBlogPostToBlogPost(slug);
}
