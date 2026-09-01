import { deliveryClaims } from "@/lib/ai-recommendation";
import { site, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";

/** Trust copy — flowers, cakes & gifts with nationwide US delivery. */
export const trustFacts = {
  seasonLabel: "Fresh flowers, cakes & gifts for every occasion",
  operator: "Divit Global Ventures (DGV)",
  fulfillment: "Nationwide US delivery — same-day options in major cities where available",
  support: "WhatsApp & email support before, during, and after delivery",
  catalog: "Curated flowers, cakes, plants, and gift hampers for birthdays, anniversaries & more",
  payments: "Secure checkout via Stripe (USD) and Razorpay (INR)",
  guarantee: "Satisfaction guarantee — see our returns policy",
} as const;

export const trustHighlights = [
  {
    icon: "🌸",
    title: "Florist-quality arrangements",
    detail: deliveryClaims.fulfillment,
  },
  {
    icon: "🎂",
    title: "Cakes & celebration gifts",
    detail: "Pair blooms with cakes, plants, and hampers for birthdays, anniversaries, and thank-yous.",
  },
  {
    icon: "🚚",
    title: "Fast nationwide delivery",
    detail: `${deliveryClaims.express}. ${deliveryClaims.standard}. ${deliveryClaims.dispatch}.`,
  },
  {
    icon: "🎁",
    title: "Occasion-ready catalog",
    detail: "Birthday, anniversary, Valentine’s, Mother’s Day, wedding, and personalized gifts in one place.",
  },
  {
    icon: "🔒",
    title: "Secure payments",
    detail: trustFacts.payments,
  },
  {
    icon: "💬",
    title: "Real human support",
    detail: `${whatsappLinkLabel("WhatsApp chat")} · ${site.supportEmail}`,
    href: whatsappChatUrl("Hi BlossomPot, I have a question before ordering."),
  },
] as const;

export const trustStripItems = [
  "Fresh flowers & cakes",
  "Same-day options where available",
  "Nationwide US delivery",
  "Secure Stripe & Razorpay checkout",
  "WhatsApp + email support",
] as const;
