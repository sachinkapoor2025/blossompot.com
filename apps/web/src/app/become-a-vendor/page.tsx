import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { VendorSignupForm } from "./VendorSignupForm";

const faqs = [
  {
    q: "Is there an upfront listing fee?",
    a: "No. There is no upfront listing fee to apply. BlossomPot earns a configurable commission on completed orders after you are approved.",
  },
  {
    q: "Who talks to the customer?",
    a: "BlossomPot remains the customer-facing brand. We handle acquisition, checkout, and customer communication. You focus on preparing and delivering the order.",
  },
  {
    q: "How do payments work?",
    a: "Customers pay BlossomPot. After an order is fulfilled, your partner cost (minus adjustments/refunds) is tracked in the vendor ledger and paid out on the agreed schedule.",
  },
  {
    q: "Do you guarantee order volume?",
    a: "No. We do not promise guaranteed orders or revenue. We invest in customer acquisition and promote competitive partner-priced products.",
  },
  {
    q: "What can I sell?",
    a: "Flowers, cakes, chocolates, gifts, balloons, plants, personalized gifts, hampers, and celebration products for birthdays, weddings, anniversaries, and festivals.",
  },
];

const why = [
  "Get more local orders from BlossomPot customers",
  "Expand reach beyond your usual marketing area",
  "No upfront listing fee",
  "We handle customer acquisition",
  "We handle online ordering and payments",
  "We handle customer communication",
  "You fulfill the order",
  "Get paid for every completed order",
  "Simple vendor dashboard",
  "Easy product management",
];

const steps = [
  {
    title: "Apply",
    body: "Tell us about your shop, delivery ZIPs, and product categories.",
  },
  {
    title: "Get reviewed",
    body: "Our team verifies your business details before activation.",
  },
  {
    title: "List products",
    body: "Add partner pricing. Admin approves products before they go live.",
  },
  {
    title: "Fulfill & get paid",
    body: "Accept orders in your portal. BlossomPot pays out after completion.",
  },
];

export const metadata: Metadata = pageMetadata({
  title: "Become a Vendor — Grow Your Local Gift Business | BlossomPot",
  description:
    "Partner with BlossomPot to list flowers, cakes, and gifts. Reach more local customers with no upfront listing fee. We bring the customer — you fulfill the order.",
  path: "/become-a-vendor",
  absoluteTitle: true,
});

export default function BecomeAVendorPage() {
  const path = "/become-a-vendor";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Become a Vendor" },
  ];

  return (
    <div className="bg-gradient-to-b from-rose-50/80 via-white to-emerald-50/40">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(faqs),
        ]}
      />

      <section className="relative overflow-hidden border-b border-primary/10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 20%, rgba(194,58,107,0.18), transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(47,143,107,0.12), transparent 45%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-16 sm:pt-14 sm:pb-20">
          <Breadcrumbs items={crumbs} />
          <p className="mt-6 font-display text-5xl sm:text-6xl font-semibold tracking-tight text-primary">
            {site.name}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Grow Your Local Business With BlossomPot
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 leading-relaxed">
            List your flowers, cakes, gifts and celebration products and reach more customers across
            your local delivery area.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#vendor-apply"
              className="inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Become a BlossomPot Vendor
            </a>
            <Link
              href="/vendor/login"
              className="inline-flex rounded-full border border-primary/30 bg-white/80 px-7 py-3 text-sm font-semibold text-primary hover:bg-white"
            >
              Vendor login
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Join BlossomPot — no upfront listing fee. We bring the customer. You fulfill the order.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">
        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-3">
            Why partner with BlossomPot?
          </h2>
          <p className="text-slate-600 mb-6 max-w-2xl">
            Reach more customers without spending more on advertising. List your products and grow
            your local sales — without building your own ecommerce stack.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {why.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm text-slate-700 border-l-2 border-accent/60 pl-3 py-1"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-6">How it works</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <li key={s.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                  Step {i + 1}
                </p>
                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-3">What you can sell</h2>
          <p className="text-slate-600 mb-4">
            Flowers, cakes, chocolates, gifts, balloons, plants, personalized gifts, hampers, and
            occasion collections for weddings, anniversaries, birthdays, and festivals.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-3">How payments work</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            You set a partner/wholesale cost. BlossomPot sets the customer selling price and keeps the
            margin. After completion, your payable amount is recorded in the vendor ledger (Pending →
            Approved → Payable → Paid). Competitive partner pricing helps us promote your products more
            aggressively and generate more orders for your business.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-3">Vendor success benefits</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            Access a dedicated portal for products, orders, payouts, and performance insights — plus
            recommendations to improve conversion. BlossomPot is a sales channel, not just an order
            form.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-3">Vendor stories</h2>
          <p className="text-sm text-slate-500 italic">
            Testimonials from approved partners will appear here as our network grows.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold text-primary mb-4">FAQ</h2>
          <dl className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="border-b border-slate-200 pb-4">
                <dt className="font-semibold text-slate-900 mb-1">{f.q}</dt>
                <dd className="text-sm text-slate-600 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-primary/15 bg-white/90 p-6 sm:p-8 shadow-sm shadow-primary/5">
          <h2 className="font-display text-3xl font-semibold text-primary mb-2">
            Become a BlossomPot Vendor
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl">
            Apply below. Applications are reviewed before activation — we do not auto-publish every
            vendor.
          </p>
          <VendorSignupForm />
        </section>
      </div>
    </div>
  );
}
