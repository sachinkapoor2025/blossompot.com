export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  image?: string;
  publishedAt: string;
  updatedAt: string;
  sections: { heading?: string; paragraphs: string[] }[];
  relatedCategory?: string;
}

/** Flower/gift guides only — legacy Rakhi posts removed from the storefront. */
export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-keep-flowers-fresh-longer",
    title: "How to Keep Flowers Fresh Longer",
    description:
      "Practical tips to extend vase life for roses, mixed bouquets, and celebration arrangements from BlossomPot.",
    excerpt:
      "Simple care steps that help birthday and anniversary flowers look their best longer after USA delivery.",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-14",
    relatedCategory: "flowers",
    sections: [
      {
        paragraphs: [
          "Fresh flowers look their best when you trim stems, use clean water, and keep arrangements away from direct heat. Whether you received a birthday bouquet or ordered anniversary roses for someone across the USA, a few minutes of care after delivery makes a noticeable difference.",
          "BlossomPot ships gift-ready arrangements with clear product guidance. Use the steps below as a simple routine for most cut-flower gifts. For flower-by-flower notes, see the Flower Knowledge Centre care guides for roses, tulips, lilies and more.",
        ],
      },
      {
        heading: "Trim and hydrate",
        paragraphs: [
          "Recut stems at an angle under clean water, remove leaves below the waterline, and fill a clean vase. Change water every one to two days and recut stems when they look sealed.",
        ],
      },
      {
        heading: "Placement tips",
        paragraphs: [
          "Keep flowers cool, out of direct sun, and away from ripening fruit. Air conditioning vents can dry blooms quickly — a steady indoor temperature is better.",
        ],
      },
    ],
  },
  {
    slug: "rose-color-meanings-for-gifting",
    title: "Rose Color Meanings for Gifting",
    description:
      "A practical guide to rose colors for birthdays, anniversaries, thank-yous, and romantic gifts across the USA.",
    excerpt:
      "Choose red, pink, white, or mixed roses with confidence — and match the message to the occasion.",
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-14",
    relatedCategory: "flowers",
    sections: [
      {
        paragraphs: [
          "Rose color helps set the tone before the recipient even reads your note. Red remains the classic romantic choice, soft pinks feel warm and appreciative, and whites read elegant for congratulations or sympathy.",
          "When you send flowers across the USA, pick a palette that matches your relationship — not just what photographs well online. The full rose encyclopedia covers colour conventions, varieties and seasonal supply in more depth.",
        ],
      },
      {
        heading: "Quick color guide",
        paragraphs: [
          "Red: love and deep affection. Pink: gratitude and celebration. White: elegance and new beginnings. Yellow: friendship and bright energy. Mixed: playful, festive, and birthday-friendly.",
        ],
      },
    ],
  },
  {
    slug: "what-to-write-in-a-gift-message",
    title: "What to Write in a Gift Message",
    description:
      "Short, sincere gift message examples for birthdays, anniversaries, thank-yous, and congratulations.",
    excerpt:
      "Keep it specific and warm — a clear note often matters as much as the flowers or cake.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-14",
    relatedCategory: "birthday-gifts",
    sections: [
      {
        paragraphs: [
          "A strong gift message names the occasion and adds one personal detail. Skip long generic quotes when a sincere sentence will land better.",
          "Most BlossomPot products support a personal note at checkout — use it for birthdays, anniversaries, and thank-yous alike.",
        ],
      },
      {
        heading: "Examples",
        paragraphs: [
          "Birthday: “Happy birthday — hope these blooms make your morning brighter.” Anniversary: “Happy anniversary — grateful for another year with you.” Thank-you: “Thank you for everything this month — thinking of you.”",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function listAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function allBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
