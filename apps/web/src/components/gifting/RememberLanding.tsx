import Link from "next/link";
import type { SubscriptionPlan } from "@blossompot/shared";
import { PlanCards } from "./PlanCards";

const STEPS = [
  { n: "1", title: "Select a plan", text: "3 months, 6 months, 1 year, 2 years, or a custom length." },
  { n: "2", title: "Choose events", text: "We’ll show occasions that fall in your membership window." },
  { n: "3", title: "Reminder preference", text: "WhatsApp, email, or both — you decide." },
  { n: "4", title: "Review & confirm", text: "Check the plan, dates, and events before paying." },
  { n: "5", title: "Pay & remember", text: "Activate membership. We remind you before each occasion." },
];

export function RememberLanding({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">Personal gifting assistant</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">Never Forget a Special Occasion Again.</h1>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto text-base sm:text-lg">
            Pick a membership, choose the dates that matter, and we’ll remind you in time to send the perfect gift.
          </p>
          <Link
            href="/account?tab=membership"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-primary"
          >
            Start membership
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">A simple 5-step membership</h2>
        <ol className="grid gap-4 sm:grid-cols-5">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-primary font-bold">{step.n}</p>
              <p className="mt-2 font-semibold text-slate-800">{step.title}</p>
              <p className="mt-1 text-sm text-slate-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-primary text-center mb-2">Choose how long we remember</h2>
        <p className="text-center text-slate-600 text-sm mb-8">
          View benefits first, then select a plan. You’ll pick events and reminders next — not all at once.
        </p>
        <PlanCards plans={plans} teaser />
      </section>
    </div>
  );
}
