import { deliveryClaims } from "@/lib/ai-recommendation";
import { site, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";

/** Shared trust copy used in footer, reviews, and badges. */
export const trustFacts = {
  seasonLabel: "Fresh flowers, cakes & gifts for every occasion",
  operator: "Divit Global Ventures (DGV)",
  fulfillment: "Worldwide delivery — same-day options in select cities where available",
  support: "WhatsApp & email support before, during, and after delivery",
  catalog: "Curated flowers, cakes, plants, and gift hampers for birthdays, anniversaries & more",
  payments: "Secure checkout via Stripe (USD) and Razorpay (INR)",
  guarantee: "Satisfaction guarantee — see our returns policy",
} as const;

/** Homepage “why trust us” block — Diwali & Bhai Dooj USA delivery (no Rakhi copy). */
export const homepageFestivalTrust = {
  seasonLabel: "Diwali & Bhai Dooj gifts for USA delivery",
  heading: "Why sisters and families trust BlossomPot for USA delivery",
  intro:
    "Send Diwali gifts and Bhai Dooj gifts to loved ones in the United States with convenient online ordering, a published gift selection, delivery information on the product page and checkout, secure Stripe or Razorpay payment, and WhatsApp or email support.",
} as const;

export const trustHighlights = [
  {
    icon: "🪔",
    title: "Shop Diwali gifts online",
    detail:
      "Browse the live catalog of flowers, cakes, and hampers, then send a Diwali gift to a United States address without visiting a local shop.",
  },
  {
    icon: "🤝",
    title: "Bhai Dooj gifts for brothers in the USA",
    detail:
      "Choose a listed bouquet, cake, or hamper for a brother in America and add a personal gift message at checkout.",
  },
  {
    icon: "🚚",
    title: "Clear USA delivery information",
    detail: `${deliveryClaims.express}. ${deliveryClaims.standard}. ${deliveryClaims.dispatch}. Check the product page and checkout for dates and cutoffs.`,
  },
  {
    icon: "🎁",
    title: "Festival gift selection",
    detail:
      "Celebration gifts, flowers, cakes, plants, and hampers in one checkout — pick what matches the household.",
  },
  {
    icon: "🔒",
    title: "Secure checkout",
    detail: trustFacts.payments,
  },
  {
    icon: "💬",
    title: "Customer support",
    detail: `${whatsappLinkLabel("WhatsApp chat")} · ${site.supportEmail}`,
    href: whatsappChatUrl("Hi BlossomPot, I have a question about a Diwali or Bhai Dooj gift to the USA."),
  },
] as const;

export const trustStripItems = [
  "Fresh flowers & cakes",
  "Same-day options where available",
  "Worldwide delivery",
  "Secure Stripe & Razorpay checkout",
  "WhatsApp + email support",
] as const;
