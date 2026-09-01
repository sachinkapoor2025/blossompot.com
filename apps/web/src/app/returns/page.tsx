import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

const returnFaqs = [
  {
    q: "Do I need to send the item back to get a refund or replacement?",
    a: "No — for flowers, cakes, and hampers, a clear photo is enough in almost every case. We'll let you know if anything further is needed.",
  },
  {
    q: "What if the recipient isn't home to receive the delivery?",
    a: "Reach out with your order number; we'll coordinate with our delivery partner for redelivery or a safe drop-off where possible, keeping the perishable nature of the item in mind.",
  },
  {
    q: "Can I get a refund if I simply changed my mind?",
    a: "Since flowers and cakes are perishable and made to order, we can't accept change-of-mind returns once delivered. Damaged, defective, or incorrect items are always covered.",
  },
  {
    q: "What if the cake or bouquet doesn't look exactly like the photo?",
    a: "Every flower arrangement and cake is handcrafted by a local florist/baker, so slight variations in blooms or decoration are normal. Significant differences (wrong flavor, wrong design, wrong flowers) are covered under our guarantee.",
  },
] as const;

export const metadata: Metadata = pageMetadata({
  title: "Returns & Satisfaction Guarantee",
  description:
    "BlossomPot 48-hour satisfaction guarantee: free replacement or full refund for damaged, wilted, or incorrect flowers, cakes, and hampers delivered in the USA.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={faqJsonLd(returnFaqs)} />
      <h1 className="text-3xl font-bold text-primary mb-6">Returns &amp; Satisfaction Guarantee</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        <p>
          At {site.name}, we know a gift is more than an item — it&apos;s a moment you&apos;re creating for
          someone you care about. Whether it&apos;s fresh flowers, a cake, or a curated hamper, we want every
          delivery to arrive exactly as you imagined. If something goes wrong, we will make it right.
        </p>

        <h2 className="text-xl font-bold text-primary">Our Guarantee at a Glance</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>48-hour reporting window for damaged, defective, wilted, or incorrect items</li>
          <li>Free replacement or full refund for qualifying issues</li>
          <li>Freshness commitment on flowers and cakes</li>
          <li>Real-time tracking support if your delivery is delayed</li>
          <li>Easy cancellations before your order ships</li>
          <li>Support available over WhatsApp and email, every day of the week</li>
        </ul>

        <h2 className="text-xl font-bold text-primary">Damaged, Defective, or Incorrect Items</h2>
        <p>
          We work with trusted local florists, bakers, and packers to get every order out in top condition —
          but transit and weather can occasionally affect delicate items. If your flowers, cake, or hamper
          arrives damaged, wilted, defective, or different from what you ordered, we&apos;ll fix it quickly.
        </p>
        <p className="font-semibold text-slate-800">What to do:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Contact us within 48 hours of delivery.</li>
          <li>
            Share your order number and clear photos of the item (bouquet, cake, or hamper as received,
            including any visible damage).
          </li>
          <li>We&apos;ll review and confirm a resolution within 1–2 business days.</li>
        </ol>
        <p>
          <strong>Your options:</strong> a free replacement (redelivered as quickly as availability allows) or
          a full refund to your original payment method.
        </p>
        <p>
          This covers items that arrive wilted or crushed, cakes that are melted, damaged, or the wrong
          flavor/design, missing items from a hamper, or anything that doesn&apos;t match your order
          confirmation.
        </p>

        <h2 className="text-xl font-bold text-primary">Our Freshness Promise</h2>
        <p>
          Flowers and cakes are perishable, so freshness matters most in the first 24–48 hours after delivery.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Flowers:</strong> should look vibrant and hydrated on arrival. Minor bud closure or petal
            settling during transit is normal and not a defect — but visibly wilted, broken stems, or dead
            flowers on arrival are covered.
          </li>
          <li>
            <strong>Cakes:</strong> should arrive intact and true to the flavor/design ordered. We recommend
            refrigerating promptly and consuming within the timeframe noted on the product page.
          </li>
        </ul>
        <p>
          If freshness looks off right out of the box, send us photos within 48 hours and we&apos;ll make it
          right.
        </p>

        <h2 className="text-xl font-bold text-primary">What Isn&apos;t Covered</h2>
        <p>To keep things fair and transparent:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Requests made after 48 hours of delivery confirmation</li>
          <li>
            Natural wilting or cake softening that occurs after the recommended storage window has passed
          </li>
          <li>Change-of-mind returns once a perishable item has been delivered</li>
          <li>
            Minor variations in flower color/bloom stage or cake decoration style compared to the photo —
            florists and bakers use fresh, seasonal stock, so slight natural variation is expected
          </li>
          <li>Delays caused by an incorrect or incomplete delivery address provided at checkout</li>
        </ul>
        <p>
          If you&apos;re ever unsure whether your situation qualifies, just reach out — we&apos;d rather take a
          look than have you guess.
        </p>

        <h2 className="text-xl font-bold text-primary">Delivery Issues &amp; Delays</h2>
        <p>
          Most orders arrive within the estimated 5–7 business day window (same-day delivery is available in
          select cities). If your gift hasn&apos;t arrived within that time:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Message us on{" "}
            <a
              href={whatsappChatUrl("Hi BlossomPot, I need help tracking my order.")}
              className="text-nav underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>{" "}
            or email{" "}
            <a href={`mailto:${site.supportEmail}`} className="text-nav underline">
              {site.supportEmail}
            </a>{" "}
            with your order number.
          </li>
          <li>
            We&apos;ll pull up the live tracking status and follow up with the courier or local partner on
            your behalf.
          </li>
          <li>
            If the shipment is lost or significantly delayed, we&apos;ll offer a replacement, expedited
            reshipment, or refund depending on the situation — especially important for time-sensitive
            occasions like birthdays and anniversaries.
          </li>
        </ul>
        <p>
          For same-day and date-specific deliveries, we monitor at-risk orders proactively so we can step in
          before the occasion is missed.
        </p>

        <h2 className="text-xl font-bold text-primary">Cancellations &amp; Order Changes</h2>
        <p>
          <strong>Before dispatch:</strong> Orders can be cancelled or modified (delivery date, address,
          message card, add-ons) free of charge. Contact us as soon as possible so we can catch it before the
          florist or baker begins preparation.
        </p>
        <p>
          <strong>After dispatch:</strong> Once an order has shipped or a cake/bouquet has been prepared for
          same-day delivery, cancellation usually isn&apos;t possible. Contact us right away and we&apos;ll do
          everything we can, but we can&apos;t guarantee a stop once preparation has started.
        </p>

        <h2 className="text-xl font-bold text-primary">Refund Timelines</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Refunds are issued to your original payment method (card, UPI, or Razorpay/Stripe-supported
            method).
          </li>
          <li>Once approved, refunds are typically processed within 3–5 business days.</li>
          <li>
            Depending on your bank or card provider, it may take an additional 5–10 business days to reflect
            in your statement.
          </li>
          <li>You&apos;ll receive an email confirmation as soon as your refund is initiated.</li>
        </ul>

        <h2 className="text-xl font-bold text-primary">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {returnFaqs.map((f, i) => (
            <div key={f.q}>
              <h3 className="font-semibold text-slate-800">
                {i + 1}. {f.q}
              </h3>
              <p className="mt-1">{f.a}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-primary">How to Request Help</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Email:{" "}
            <a href={`mailto:${site.supportEmail}`} className="text-nav underline">
              {site.supportEmail}
            </a>
          </li>
          <li>
            WhatsApp:{" "}
            <a
              href={whatsappChatUrl("Hi BlossomPot, I need help with a returns or guarantee request.")}
              className="text-nav underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {whatsappLinkLabel()}
            </a>
          </li>
          <li>
            <Link href="/contact" className="text-nav underline">
              Contact form
            </Link>
          </li>
        </ul>
        <p>Our team typically responds within a few hours, and faster around major gifting occasions.</p>

        <p className="text-slate-500 text-sm">Last updated: August 2026</p>
        <Link href="/" className="text-nav font-semibold hover:underline inline-block">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
