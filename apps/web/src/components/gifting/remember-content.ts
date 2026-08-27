import { canonical } from "@/lib/seo";
import { site } from "@/lib/site";

export const REMEMBER_FAQS = [
  {
    q: "What is BlossomPot Remember membership?",
    a: "Remember is an occasion reminder membership. You choose how long we should remember — 3 months, 6 months, 1 year, 2 years, or a custom length — then pick the dates that matter. We email or WhatsApp you before each occasion so you have time to send flowers, cake, or a gift.",
  },
  {
    q: "Do you automatically charge me for gifts?",
    a: "No. Membership covers reminders and gift recommendations only. When an occasion is coming up, you approve the gift and complete checkout yourself. We never auto-charge a bouquet or cake.",
  },
  {
    q: "Which occasions can I get reminders for?",
    a: "Valentine’s Day, Chocolate Day, birthdays, anniversaries, Mother’s Day, Father’s Day, Friendship Day, Rakhi, Halloween, Thanksgiving, Christmas, New Year, and custom dates you add. Shorter plans only list events that fall inside your membership window.",
  },
  {
    q: "Can I get reminders on WhatsApp and email?",
    a: "Yes. After you select events, choose Email, WhatsApp, or both. WhatsApp is sent when your account is connected; otherwise we still send email so you do not miss the date.",
  },
  {
    q: "How do I pay for membership?",
    a: "Pay securely with Stripe (cards) or Razorpay (UPI, cards, netbanking). The method you select on the last step is the checkout that opens. Membership is activated only after payment is confirmed.",
  },
] as const;

export function rememberServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "BlossomPot Remember occasion reminder membership",
    serviceType: "Occasion reminder membership",
    provider: { "@id": `${new URL(canonical("/")).origin}/#organization` },
    url: canonical("/remember"),
    description:
      "Subscription reminder service for birthdays, anniversaries, Valentine’s Day, and festivals, with email and WhatsApp alerts and gift recommendations. Gifts are never auto-charged.",
    areaServed: { "@type": "Country", name: "United States" },
    brand: { "@type": "Brand", name: site.name },
  };
}

export function rememberHowToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to start a BlossomPot Remember membership",
    description: "Start an occasion reminder membership in five steps, then pay with Stripe or Razorpay.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Select a membership plan",
        text: "Choose 3 months, 6 months, 1 year, 2 years, or a custom length. View benefits before you select.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Choose reminder events",
        text: "Pick birthdays, anniversaries, Valentine’s Day, festivals, and other dates in your membership window.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Set reminder preferences",
        text: "Receive reminders by email, WhatsApp, or both.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Review and confirm",
        text: "Check plan, duration, event dates, and reminder channel before payment.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Pay securely",
        text: "Complete checkout with Stripe or Razorpay. Membership activates only after payment is confirmed.",
      },
    ],
  };
}
