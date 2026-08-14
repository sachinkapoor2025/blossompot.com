import type { Metadata } from "next";
import Link from "next/link";
import { site, cityNavHref, usCityLinks } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { howToSendGiftJsonLd, pageMetadata } from "@/lib/seo";
import { deliveryClaims } from "@/lib/ai-recommendation";

export const metadata: Metadata = pageMetadata({
  title: "Gift Shipping & Delivery USA — Flowers, Cakes & More",
  description:
    "BlossomPot delivers flowers, cakes, and gifts across the USA. Nationwide coverage, faster windows to major metros when available, and same-day options in select cities. Free shipping on selected orders.",
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={howToSendGiftJsonLd()} />
      <h1 className="text-3xl font-bold text-primary mb-6">Shipping & Delivery</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          {site.name} delivers premium flowers, cakes, and gifts across the{" "}
          <strong>United States</strong> with clear delivery expectations and careful packaging — so
          celebrations arrive looking as good as they feel.
        </p>
        <h2 className="text-xl font-bold text-primary">Delivery times</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Express:</strong> {deliveryClaims.express}
          </li>
          <li>
            <strong>Nationwide:</strong> {deliveryClaims.standard}
          </li>
          <li>
            <strong>Dispatch:</strong> {deliveryClaims.dispatch}
          </li>
          <li>
            <strong>Shipping:</strong> {deliveryClaims.shipping}
          </li>
        </ul>
        <h2 className="text-xl font-bold text-primary">Same-day & occasion timing</h2>
        <p>
          Same-day gift options are available in select US cities when you order before the local cut-off.
          For birthdays, anniversaries, and holiday peaks, order a little early so your recipient gets the
          best delivery window.
        </p>
        <h2 className="text-xl font-bold text-primary">Ordering from outside the USA</h2>
        <p>
          Customers in India, the United Kingdom, Canada, Australia, and worldwide can order on {site.domain}.
          Enter your recipient&apos;s <strong>US delivery address</strong> at checkout — we fulfill for
          delivery inside America.
        </p>
        <h2 className="text-xl font-bold text-primary">Packaging</h2>
        <p>
          Each order is packed for a premium unboxing moment. Most products support a personal gift message
          and delivery date preferences at checkout.
        </p>
        <h2 className="text-xl font-bold text-primary">Cities we deliver to</h2>
        <p>Popular delivery destinations include:</p>
        <ul className="flex flex-wrap gap-2">
          {usCityLinks.map((c) => (
            <li key={c.slug}>
              <Link href={cityNavHref(c)} className="text-nav hover:underline text-sm">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-4">
          Need help? <Link href="/contact" className="text-nav hover:underline">Contact us</Link> or read our{" "}
          <Link href="/faq" className="text-nav hover:underline">FAQ</Link>.
        </p>
      </div>
    </div>
  );
}
