import type { Metadata } from "next";
import { RememberLanding } from "@/components/gifting/RememberLanding";
import { fetchPublicPlans } from "@/lib/gifting";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@blossompot/shared";

export const metadata: Metadata = pageMetadata({
  title: "Never Forget a Special Occasion | BlossomPot",
  description:
    "BlossomPot remembers birthdays, anniversaries, and custom dates, then helps you choose and deliver the perfect gift.",
  path: "/remember",
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
  return <RememberLanding plans={plans} />;
}
