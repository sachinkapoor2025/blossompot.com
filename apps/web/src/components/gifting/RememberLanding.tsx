import Link from "next/link";
import type { SubscriptionPlan } from "@blossompot/shared";
import { PlanCards } from "./PlanCards";
import { REMEMBER_FAQS } from "./remember-content";
import { site } from "@/lib/site";

const STEPS = [
  { n: "1", title: "Select a plan", text: "3 months, 6 months, 1 year, 2 years, or a custom length." },
  { n: "2", title: "Choose events", text: "We'll show occasions that fall in your membership window." },
  { n: "3", title: "Reminder preference", text: "WhatsApp, email, or both — you decide." },
  { n: "4", title: "Review & confirm", text: "Check the plan, dates, and events before paying." },
  { n: "5", title: "Pay & remember", text: "Pay with Stripe or Razorpay. We remind you in time." },
];

const BENEFITS = [
  {
    title: "Never miss a birthday",
    text: "Get a reminder 10, 7, and 3 days before saved birthdays so you can send flowers or cake on time.",
  },
  {
    title: "Anniversaries, handled",
    text: "We track wedding anniversaries and the dates that matter to your people — not a generic calendar blast.",
  },
  {
    title: "Festivals on your radar",
    text: "Valentine's Day, Chocolate Day, Mother's Day, Rakhi, Christmas, and more — only if they fall in your plan.",
  },
  {
    title: "You approve every gift",
    text: "Reminders help you choose. Checkout stays in your hands. We never auto-charge a bouquet.",
  },
];

export function RememberLanding({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <div className="bg-[#fbf7f4]">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#fff,_transparent_45%)]" aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-white/75 font-semibold">
            Occasion reminder membership
          </p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Never forget a birthday, anniversary, or special occasion again
          </h1>
          <p className="mt-5 text-white/90 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            BlossomPot Remember is a personal reminder membership for the people you love. Choose a plan,
            pick the dates, and we send email or WhatsApp reminders before each occasion — in time to send
            flowers, cake, or a gift across the USA.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account?tab=membership"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-primary shadow-lg shadow-black/10"
            >
              Start your membership
            </Link>
            <a
              href="#membership-plans"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 px-7 text-sm font-semibold text-white"
            >
              View plans
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-3 max-w-lg mx-auto text-center">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/70">Reminders</dt>
              <dd className="mt-1 text-sm font-semibold">Email & WhatsApp</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/70">Gifts</dt>
              <dd className="mt-1 text-sm font-semibold">Never auto-charged</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-white/70">Checkout</dt>
              <dd className="mt-1 text-sm font-semibold">Stripe or Razorpay</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-white" aria-label="Why members trust Remember">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-700 font-medium">
            <li>Secure Stripe & Razorpay checkout</li>
            <li>Operated by {site.legalName}</li>
            <li>USA gift delivery when you are ready</li>
            <li>Cancel anytime from your account</li>
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14" aria-labelledby="how-remember-works">
        <h2 id="how-remember-works" className="text-2xl sm:text-3xl font-bold text-primary text-center">
          A simple 5-step reminder membership
        </h2>
        <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          You will not see every decision at once. Select a plan, choose events, set how we should remind you,
          review the details, then pay. You can go back and edit before checkout.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-5">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-2xl border border-rose-100 bg-white p-4 text-center shadow-sm">
              <p className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                {step.n}
              </p>
              <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white border-y border-slate-100" aria-labelledby="remember-benefits">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 id="remember-benefits" className="text-2xl sm:text-3xl font-bold text-primary text-center">
            Why families use BlossomPot Remember
          </h2>
          <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
            It is not a discount club. It is a never-forget service for birthdays, anniversaries, and festivals
            — with gift ideas when you want them, and no surprise charges.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-[#fbf7f4] p-5">
                <h3 className="font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="membership-plans" className="max-w-5xl mx-auto px-4 py-14" aria-labelledby="choose-plan">
        <h2 id="choose-plan" className="text-2xl sm:text-3xl font-bold text-primary text-center">
          Choose how long we remember
        </h2>
        <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto text-sm sm:text-base mb-8">
          View benefits, then select a plan. 1-year and 2-year memberships include the full calendar of supported
          occasions. 3-month and 6-month plans only show events inside your dates. Custom plans let you set the
          length from 1 to 24 months.
        </p>
        <PlanCards plans={plans} teaser />
      </section>

      <section className="bg-white border-t border-slate-100" aria-labelledby="remember-faq">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 id="remember-faq" className="text-2xl sm:text-3xl font-bold text-primary text-center">
            Occasion reminder membership FAQs
          </h2>
          <div className="mt-8 space-y-3">
            {REMEMBER_FAQS.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-[#fbf7f4] px-5 py-4">
                <summary className="cursor-pointer font-semibold text-slate-900 list-none flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-primary group-open:rotate-45 transition text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/account?tab=membership"
              className="inline-flex min-h-12 items-center rounded-full bg-nav px-7 text-sm font-semibold text-white"
            >
              Continue to membership signup
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
