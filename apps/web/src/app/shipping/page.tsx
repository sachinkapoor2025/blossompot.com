import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { marketingPageInlineLinks } from "@/lib/content/page-inline-links";
import { applyInlineLinks } from "@/lib/inline-links";
import { howToSendGiftJsonLd, pageMetadata } from "@/lib/seo";
import { deliveryClaims } from "@/lib/ai-recommendation";
import { footerGeoLinks } from "@/lib/content/geo/locations";

export const metadata: Metadata = pageMetadata({
  title: "Gift Shipping & Delivery Worldwide — Flowers, Cakes & More",
  description:
    "BlossomPot delivers flowers, cakes, and gifts worldwide. Choose the recipient country at checkout. Same-day options appear where the local cut-off allows.",
  path: "/shipping",
});

export default function ShippingPage() {
  const inlineLinks = marketingPageInlineLinks.shipping;
  const usedHrefs = new Set<string>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={howToSendGiftJsonLd()} />
      <h1 className="text-3xl font-bold text-primary mb-6">Shipping & Delivery</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          {site.name} delivers premium flowers, cakes, and gifts <strong>worldwide</strong>. Choose the
          recipient country at checkout to see delivery windows for that destination.
        </p>
        <h2 className="text-xl font-bold text-primary">Delivery times</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Express:</strong> {deliveryClaims.express}
          </li>
          <li>
            <strong>Worldwide:</strong> {deliveryClaims.standard}
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
          {applyInlineLinks(
            "Same-day gift options appear only where coverage and the local cut-off support them. Each delivery location page shows timezone-aware timing. For birthdays, anniversaries, and holiday peaks, order a little early.",
            inlineLinks,
            { usedHrefs, currentPath: "/shipping", max: 4 }
          )}
        </p>
        <h2 className="text-xl font-bold text-primary">United States destinations</h2>
        <p>
          {applyInlineLinks(
            `Customers sending gifts to the United States can use our US city and state pages for ZIP-level timing. Enter the US recipient address at checkout. Country guides: locations hub.`,
            inlineLinks,
            { usedHrefs, currentPath: "/shipping", max: 4 }
          )}
        </p>
        <h2 className="text-xl font-bold text-primary">Packaging</h2>
        <p>
          Each order is packed for a premium unboxing moment. Most products support a personal gift message
          and delivery date preferences at checkout.
        </p>
        <h2 className="text-xl font-bold text-primary">Popular delivery hubs</h2>
        <ul className="flex flex-wrap gap-2">
          {footerGeoLinks(12).map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="text-nav hover:underline text-sm">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/delivery-locations" className="text-nav hover:underline">
            Browse all state and city delivery pages
          </Link>
        </p>
        <p className="pt-4">Need help? Contact us or read our FAQ.</p>
      </div>
    </div>
  );
}
