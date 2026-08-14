import { deliveryClaims } from "@/lib/ai-recommendation";
import { site, whatsappChatUrl } from "@/lib/site";

/** Trust copy — festival expertise, California warehouse, domestic fulfillment. */
export const trustFacts = {
  seasonLabel: "Rooted in Rakhi & Raksha Bandhan traditions",
  operator: "Divit Global Ventures (DGV)",
  fulfillment:
    "California-based US fulfillment team — orders ship domestically within America (no customs delays for your brother)",
  support: "WhatsApp & email support before, during, and after delivery",
  catalog: "126+ premium Rakhi designs across five categories",
  payments: "Secure checkout via Stripe (USD) and Razorpay (INR)",
  guarantee: "Satisfaction guarantee — see our returns policy",
} as const;

export const trustHighlights = [
  {
    icon: "🇺🇸",
    title: "Ships from within the USA",
    detail: deliveryClaims.fulfillment,
  },
  {
    icon: "📍",
    title: "California fulfillment team",
    detail: "Operated by DGV with a dedicated US team packing and dispatching every Raksha Bandhan order.",
  },
  {
    icon: "🚚",
    title: "Fast nationwide delivery",
    detail: `${deliveryClaims.express}. ${deliveryClaims.standard}. ${deliveryClaims.dispatch}.`,
  },
  {
    icon: "🎁",
    title: "126+ curated designs",
    detail: "Single Rakhi, combos with chocolates, Kids, Bhaiya Bhabhi, and Lumba — roli chawal on most orders.",
  },
  {
    icon: "🔒",
    title: "Secure payments",
    detail: trustFacts.payments,
  },
  {
    icon: "💬",
    title: "Real human support",
    detail: `${site.whatsappDisplay} · ${site.supportEmail}`,
    href: whatsappChatUrl("Hi BlossomPot, I have a question before ordering."),
  },
] as const;

export const trustStripItems = [
  "Ships from within the USA",
  "5–7 day delivery · all 50 states",
  "Order from India · pay INR/UPI",
  "Secure Stripe & Razorpay checkout",
  "WhatsApp +91 support",
] as const;
