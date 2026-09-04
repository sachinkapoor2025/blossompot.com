import type { Metadata } from "next";
import { RememberLanding } from "@/components/gifting/RememberLanding";
import { fetchPublicPlans } from "@/lib/gifting";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@blossompot/shared";
import { REMEMBER_FAQS, rememberHowToJsonLd, rememberServiceJsonLd } from "@/components/gifting/remember-content";

export const metadata: Metadata = pageMetadata({
  title: "Occasion Reminder Membership — Never Forget a Birthday or Anniversary | BlossomPot",
  description:
    "BlossomPot Remember membership sends email and WhatsApp reminders before birthdays, anniversaries, Valentine's Day, and festivals. Choose a 3-month to 2-year plan, pick your dates, then pay securely with Stripe or Razorpay. Gifts are never charged automatically.",
  path: "/remember",
  absoluteTitle: true,
});

export const dynamic = "force-dynamic";

export default async function RememberPage() {
  let plans = DEFAULT_SUBSCRIPTION_PLANS.map((p) => ({
    ...p,
    createdAt: "",
    updatedAt: "",
  }));
  try {
    const data = await fetchPublicPlans();
    if (data.plans.length) plans = data.plans;
  } catch {
    /* fallback defaults */
  }
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Remember Membership", path: "/remember" },
          ]),
          rememberServiceJsonLd(),
          rememberHowToJsonLd(),
          faqJsonLd(REMEMBER_FAQS),
        ]}
      />
      <RememberLanding plans={plans} />
    </>
  );
}
