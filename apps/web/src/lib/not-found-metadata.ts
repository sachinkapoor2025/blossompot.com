import type { Metadata } from "next";

/**
 * 404 metadata replaces the root layout entry for this response.
 * `canonical: null` is required: Next.js replaces `alternates` per segment,
 * and a missing canonical would keep the homepage URL from the root layout.
 */
export const notFoundMetadata: Metadata = {
  title: "Page not found",
  description: "This URL is not a page on BlossomPot.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
  openGraph: {
    title: "Page not found",
    description: "This URL is not a page on BlossomPot.",
  },
  twitter: {
    card: "summary",
    title: "Page not found",
    description: "This URL is not a page on BlossomPot.",
  },
};
