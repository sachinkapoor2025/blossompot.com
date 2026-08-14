import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { categoryHref } from "@/lib/category-urls";
import { site, whatsappChatUrl } from "@/lib/site";
import { faqJsonLd, pageMetadata, canonical } from "@/lib/seo";

const PATH = "/send-rakhi-from-india";

const faqs = [
  {
    q: "Can I order Rakhi from India and have it delivered in the USA?",
    a: "Yes. Shop on BlossomPot from India, pay in INR via Razorpay (UPI, cards, netbanking), and we ship domestically within the United States to your brother’s address — no international customs delay for him.",
  },
  {
    q: "How do I pay from India?",
    a: "At checkout choose INR. Razorpay supports UPI, Indian cards, and netbanking. USD/Stripe is also available if you prefer.",
  },
  {
    q: "How long does delivery take in the USA?",
    a: "Most orders reach all 50 US states in 5–7 business days after dispatch. Many California metros are faster from our US fulfillment team.",
  },
  {
    q: "Is roli and chawal included?",
    a: "Yes — complimentary roli and chawal are included with most rakhis so your brother can complete the tilak ceremony.",
  },
  {
    q: "When should I order for Raksha Bandhan 2026?",
    a: "Raksha Bandhan 2026 is August 28. Order early from India so packing and US domestic shipping finish before the festival — avoid the last-minute rush.",
  },
] as const;

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Send Rakhi to USA from India | Pay INR / UPI | BlossomPot",
    description:
      "Order Rakhi from India for your brother in America. Pay with UPI or INR via Razorpay. BlossomPot ships domestically in the USA — 5–7 day delivery, 140+ designs, roli chawal included.",
    path: PATH,
    keywords:
      "send rakhi to usa from india, order rakhi online from india to usa, rakhi delivery usa from india, pay inr rakhi usa, upi rakhi to usa, send rakhi india to america online",
    absoluteTitle: true,
  }),
  alternates: {
    canonical: canonical(PATH),
    languages: {
      "en-IN": canonical(PATH),
      en: canonical(PATH),
      "x-default": canonical("/"),
    },
  },
};

function howToFromIndiaJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to send Rakhi to USA from India",
    description:
      "Order online from India, pay in INR/UPI, and have BlossomPot deliver domestically to your brother in the United States.",
    totalTime: "P7D",
    step: [
      {
        "@type": "HowToStep",
        name: "Choose a Rakhi",
        text: "Pick a single rakhi, combo, or hamper on BlossomPot.com.",
      },
      {
        "@type": "HowToStep",
        name: "Enter USA shipping address",
        text: "Add your brother’s full US address at checkout.",
      },
      {
        "@type": "HowToStep",
        name: "Pay in INR",
        text: "Select INR and pay with Razorpay — UPI, card, or netbanking.",
      },
      {
        "@type": "HowToStep",
        name: "We deliver in the USA",
        text: "Orders ship domestically within America in about 5–7 business days.",
      },
    ],
  };
}

export default function SendRakhiFromIndiaPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      <JsonLd data={[faqJsonLd([...faqs]), howToFromIndiaJsonLd()]} />

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#4876e818,_transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-14 md:py-20 text-center">
          <p className="text-sm font-semibold text-nav tracking-wide mb-3">For sisters ordering from India</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight mb-4">
            Send Rakhi to USA from India
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Pay in <strong>INR / UPI</strong>, we deliver to your brother{" "}
            <strong>inside the United States</strong> — domestic shipping, no customs delay for him.
            Trusted by sisters across India for Raksha Bandhan.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-nav text-white px-5 py-2.5 text-sm font-semibold hover:bg-nav/90"
            >
              Shop Rakhis →
            </Link>
            <Link
              href={categoryHref("rakhi-hampers")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:border-nav"
            >
              View Hampers
            </Link>
            <a
              href={whatsappChatUrl("Hi BlossomPot, I want to send rakhi from India to USA.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-600/40 text-emerald-800 bg-emerald-50 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-100"
            >
              WhatsApp {site.whatsappDisplay}
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary mb-3 text-center">Why Indian sisters choose BlossomPot</h2>
        <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
          Destination stays USA — you order from India. We handle US domestic fulfillment so your
          brother gets festival-ready packaging on time.
        </p>
        <ul className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
          {[
            "Pay with UPI, INR cards, or netbanking (Razorpay)",
            "WhatsApp support on +91 for order help",
            "Ships from within the USA — no customs for recipient",
            "5–7 day delivery to all 50 states",
            "140+ designs · roli & chawal on most orders",
            "Combos & hampers with chocolates, sweets, dry fruits",
          ].map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">How to order from India</h2>
        <ol className="space-y-4 max-w-xl mx-auto">
          {[
            "Browse Single Rakhi, Combos, or Hampers and add to cart.",
            "Enter your brother’s complete USA shipping address.",
            "Switch to INR at checkout and pay via Razorpay (UPI supported).",
            "We pack and ship domestically in America — track until delivery.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nav text-white text-sm font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-primary mb-4 text-center">Popular picks to send from India</h2>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href={categoryHref("single-rakhi")} className="rounded-full border px-4 py-2 hover:border-nav">
            Single Rakhi
          </Link>
          <Link href={categoryHref("rakhi-combo")} className="rounded-full border px-4 py-2 hover:border-nav">
            Rakhi + Chocolates
          </Link>
          <Link href={categoryHref("rakhi-hampers")} className="rounded-full border px-4 py-2 hover:border-nav">
            Rakhi Hampers
          </Link>
          <Link href={categoryHref("bhaiya-bhabhi-rakhi")} className="rounded-full border px-4 py-2 hover:border-nav">
            Bhaiya Bhabhi
          </Link>
          <Link href="/raksha-bandhan" className="rounded-full border px-4 py-2 hover:border-nav">
            Raksha Bandhan 2026
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">FAQs for India orders</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-semibold text-primary cursor-pointer text-sm">{f.q}</summary>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-8">
          Prefer a longer guide?{" "}
          <Link href="/blog/send-rakhi-to-usa-from-india" className="text-nav font-semibold hover:underline">
            Read the full from-India blog →
          </Link>
        </p>
      </section>
    </div>
  );
}
