import Link from "next/link";
import type { SubscriptionPlan } from "@blossompot/shared";
import { PlanCards } from "./PlanCards";

const STEPS = [
  { n: "1", title: "Add Your People", text: "Wife, mom, friend — whoever you never want to forget." },
  { n: "2", title: "Save Their Special Dates", text: "Birthdays, anniversaries, and the day you met." },
  { n: "3", title: "We Remind You", text: "Email — and WhatsApp when your account is connected." },
  { n: "4", title: "Choose or Let Us Surprise You", text: "Pick flowers, cake, a combo, or Surprise Me." },
  { n: "5", title: "We Deliver", text: "The gift arrives. Next year, we remember again." },
];

export function RememberLanding({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">Personal gifting assistant</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight">Never Forget a Special Occasion Again.</h1>
          <p className="mt-4 text-white/90 max-w-2xl mx-auto text-base sm:text-lg">
            You tell us the dates. We remember them, help you choose the perfect gift, and make sure your special moments don&apos;t get forgotten.
          </p>
          <Link
            href="/account?tab=membership"
            className="mt-8 inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-primary"
          >
            Start Remembering
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary text-center mb-8">How it works</h2>
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
          Not a discount membership — a never-forget service for the people you love.
        </p>
        <PlanCards plans={plans} />
        <div className="text-center mt-8">
          <Link href="/account?tab=membership" className="inline-flex min-h-12 items-center rounded-full bg-nav px-6 text-sm font-semibold text-white">
            Start Remembering
          </Link>
        </div>
      </section>
    </div>
  );
}
