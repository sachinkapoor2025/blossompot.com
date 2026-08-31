import { canonical } from "@/lib/seo";
import { site } from "@/lib/site";

export const REMEMBER_FAQS = [
  {
    q: "What is BlossomPot Remember?",
    a: "BlossomPot Remember is a personal occasion reminder membership for birthdays, anniversaries, festivals, and other supported special dates.",
  },
  {
    q: "Do you automatically charge me for gifts?",
    a: "No. Reminders help you remember and plan. You approve every gift purchase yourself.",
  },
  {
    q: "Which occasions can I receive reminders for?",
    a: "Supported occasions listed on the page include birthdays, anniversaries, Valentine's Day, Chocolate Day, Mother's Day, Rakhi, Christmas, and other occasions shown within your membership window.",
  },
  {
    q: "Can I receive reminders by WhatsApp and email?",
    a: "Yes. You can choose WhatsApp, email, or both as your reminder preference.",
  },
  {
    q: "How do I pay for membership?",
    a: "Membership checkout supports Stripe and Razorpay.",
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
      "BlossomPot Remember is an occasion reminder membership for birthdays, anniversaries, festivals, and other dates that matter. Receive reminders by email, WhatsApp, or both. Gifts are never charged automatically.",
    areaServed: { "@type": "Country", name: "United States" },
    brand: { "@type": "Brand", name: site.name },
  };
}

export function rememberHowToJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to start a BlossomPot Remember membership",
    description: "Start an occasion reminder membership: choose a plan, select occasions, set reminder preferences, review details, then pay with Stripe or Razorpay.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Select a plan",
        text: "Choose from 3 months, 6 months, 1 year, 2 years, or a custom membership length.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Choose events",
        text: "Pick birthdays, anniversaries, Valentine's Day, festivals, and other dates in your membership window.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Reminder preference",
        text: "Receive reminders by email, WhatsApp, or both.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Review & confirm",
        text: "Check plan, duration, event dates, and reminder channel before payment.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Pay & remember",
        text: "Complete checkout with Stripe or Razorpay. Membership activates only after payment is confirmed.",
      },
    ],
  };
}
