import type { Metadata } from "next";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { marketingPageInlineLinks } from "@/lib/content/page-inline-links";
import { applyInlineLinks } from "@/lib/inline-links";
import { howToSendGiftJsonLd, pageMetadata } from "@/lib/seo";
import { deliveryClaims } from "@/lib/ai-recommendation";
import { BackToHome } from "@/components/BackToHome";

export const metadata: Metadata = pageMetadata({
  title: "Gift Shipping & Delivery Worldwide — Flowers, Cakes & More",
  description:
    "BlossomPot delivers flowers, cakes, and gifts worldwide. Choose the recipient country at checkout to see delivery windows for that destination.",
  path: "/shipping",
});

export default function ShippingPage() {
  const inlineLinks = marketingPageInlineLinks.shipping;
  const usedHrefs = new Set<string>();
  const usedPhrases = new Set<string>();
  const linkOpts = { usedHrefs, usedPhrases, currentPath: "/shipping" };

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
        <h2 className="text-xl font-bold text-primary">Occasion timing</h2>
        <p>
          {applyInlineLinks(
            "Each delivery location page shows timezone-aware timing. For birthdays, anniversaries, and holiday peaks, order a little early so the gift arrives when you need it.",
            inlineLinks,
            linkOpts
          )}
        </p>
        <h2 className="text-xl font-bold text-primary">United States destinations</h2>
        <p>
          {applyInlineLinks(
            `Customers sending gifts to the United States can use our US city and state pages for ZIP-level timing. Enter the US recipient address at checkout. Country guides: locations hub.`,
            inlineLinks,
            linkOpts
          )}
        </p>
        <h2 className="text-xl font-bold text-primary">Packaging</h2>
        <p>
          Each order is packed for a premium unboxing moment. Most products support a personal gift message
          and delivery date preferences at checkout.
        </p>
        <p className="pt-4">Need help? Contact us or read our FAQ.</p>
        <BackToHome className="pt-2" />
      </div>
    </div>
  );
}
