import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: `Terms and conditions for shopping on ${site.name} — flowers, cakes, and gifts with USA delivery.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Terms &amp; Conditions</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        <p>
          Welcome to {site.name} ({site.domain}). These Terms &amp; Conditions (&quot;Terms&quot;) govern your
          access to and use of our website, products, and services. {site.name} is operated by {site.legalName}{" "}
          (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By browsing the site, creating an account, or placing
          an order, you agree to these Terms.
        </p>
        <p>
          If you do not agree, please do not use the website or place an order. For questions, contact us using the
          details at the end of this page.
        </p>

        <h2 className="text-xl font-bold text-primary">1. Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to place an order. By using
          the site, you confirm that the information you provide is accurate and that you are authorized to use the
          payment method selected at checkout.
        </p>

        <h2 className="text-xl font-bold text-primary">2. Products &amp; descriptions</h2>
        <p>
          We sell flowers, bouquets, cakes, gift hampers, plants, and related gifts for delivery within the United
          States. Flowers and cakes are perishable and naturally unique. Colors, varieties, garnish, and arrangement
          style may vary with season and local availability while remaining comparable in quality, value, and overall
          look. Product photos are representative; we do not guarantee an identical match to every listing image.
        </p>
        <p>
          We may update catalog items, prices, and availability at any time. An item is not reserved until we accept
          your order and payment is successfully processed.
        </p>

        <h2 className="text-xl font-bold text-primary">3. Orders &amp; acceptance</h2>
        <p>
          Submitting an order is an offer to purchase. We may accept, decline, or request clarification (for example
          if an address is incomplete or an item is unavailable). A contract is formed when we send an order
          confirmation by email. Please review recipient name, address, delivery date, and gift message carefully
          before you pay — incorrect details can delay or prevent delivery.
        </p>

        <h2 className="text-xl font-bold text-primary">4. Pricing &amp; payment</h2>
        <p>
          Prices are shown in USD or INR at checkout, depending on the payment method. Applicable taxes and delivery
          fees are displayed before you place the order. Payment is processed securely by Stripe (USD cards) or
          Razorpay (INR — UPI, cards, netbanking) where enabled. We do not store full card numbers on our servers.
        </p>
        <p>
          If a payment fails, is reversed, or is flagged as unauthorized, we may cancel the order and are not obliged
          to dispatch the gift until cleared funds are received.
        </p>

        <h2 className="text-xl font-bold text-primary">5. Delivery</h2>
        <p>
          We deliver to addresses within the United States. Standard delivery times are estimates (typically several
          business days) and can vary by product, destination, weather, and carrier performance. Same-day options
          appear only in select cities when you order before the local cut-off.
        </p>
        <p>
          You are responsible for providing a complete, deliverable US address and any access instructions. If the
          recipient is unavailable, the delivery partner may follow local procedures, leave the gift where permitted,
          or attempt redelivery. We are not responsible for delays or failed delivery caused by an incorrect address,
          restricted access, or recipient unavailability.
        </p>
        <p>
          More detail is available on our{" "}
          <Link href="/shipping" className="text-nav underline">
            Shipping &amp; Delivery
          </Link>{" "}
          page.
        </p>

        <h2 className="text-xl font-bold text-primary">6. Gift messages &amp; personalization</h2>
        <p>
          Where offered, gift messages and personalization are printed or prepared as submitted. We may decline or
          edit content that is unlawful, abusive, or otherwise inappropriate. Personalized items may have limited
          change or cancellation options once production has begun.
        </p>

        <h2 className="text-xl font-bold text-primary">7. Changes, cancellations &amp; returns</h2>
        <p>
          Because many products are perishable and prepared to order, changes and cancellations are only possible if
          the order has not yet been processed or prepared for delivery. Contact us immediately with your order
          number. Refunds, replacements, and our satisfaction guarantee are described on the{" "}
          <Link href="/returns" className="text-nav underline">
            Returns &amp; Guarantee
          </Link>{" "}
          page, which forms part of these Terms.
        </p>

        <h2 className="text-xl font-bold text-primary">8. Promotions &amp; membership</h2>
        <p>
          Coupons, free-shipping offers, and membership programs (including occasion reminders) are subject to their
          stated rules, expiry dates, and eligibility. Unless we say otherwise, promotions cannot be combined, have
          no cash value, and may be withdrawn. Reminder memberships do not automatically charge you for gifts.
        </p>

        <h2 className="text-xl font-bold text-primary">9. Acceptable use</h2>
        <p>
          You agree not to misuse the website, attempt unauthorized access, scrape or copy content at scale, interfere
          with other customers, or use the service for fraudulent, harmful, or unlawful purposes. We may suspend
          accounts or refuse orders that we reasonably believe violate these Terms.
        </p>

        <h2 className="text-xl font-bold text-primary">10. Intellectual property</h2>
        <p>
          The {site.name} name, logo, website design, product photography, copy, and other content are owned by us or
          our licensors. You may not copy, reproduce, or commercially exploit site content without our prior written
          permission, except for personal, non-commercial use of pages you lawfully access.
        </p>

        <h2 className="text-xl font-bold text-primary">11. Third-party services</h2>
        <p>
          Checkout, messaging, analytics, maps, and delivery depend on third-party providers. Their terms and privacy
          practices apply to their services. We are not responsible for outages or errors outside our reasonable
          control.
        </p>

        <h2 className="text-xl font-bold text-primary">12. Disclaimer &amp; limitation of liability</h2>
        <p>
          The website and products are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the
          fullest extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular
          purpose, and non-infringement. Fresh flowers and baked goods are inherently variable; we stand behind
          quality through our returns process rather than an unlimited guarantee of identical appearance.
        </p>
        <p>
          To the fullest extent permitted by law, {site.name} and {site.legalName} are not liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost profits, data, or goodwill, arising
          from your use of the site or any order. Our total liability for any claim related to an order is limited to
          the amount you paid for that order. Some jurisdictions do not allow certain limitations; in those cases, our
          liability is limited to the maximum extent permitted.
        </p>

        <h2 className="text-xl font-bold text-primary">13. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless {site.name} and {site.legalName} from claims, losses, and expenses
          (including reasonable legal fees) arising from your misuse of the site, inaccurate order information, or
          violation of these Terms.
        </p>

        <h2 className="text-xl font-bold text-primary">14. Privacy</h2>
        <p>
          How we collect and use personal information is described in our{" "}
          <Link href="/privacy" className="text-nav underline">
            Privacy Policy
          </Link>
          . By using the site, you also acknowledge that policy.
        </p>

        <h2 className="text-xl font-bold text-primary">15. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. The &quot;Last updated&quot; date below will change when we do.
          Continued use of the website after an update constitutes acceptance of the revised Terms. Material changes
          may also be noted on the site or by email where appropriate.
        </p>

        <h2 className="text-xl font-bold text-primary">16. Governing law</h2>
        <p>
          These Terms are governed by the laws of the United States and the State of California, without regard to
          conflict-of-law rules. Courts located in California shall have exclusive jurisdiction over disputes arising
          from these Terms or your use of the website, except where applicable consumer law requires otherwise.
        </p>

        <h2 className="text-xl font-bold text-primary">17. Contact</h2>
        <p>
          For order changes, cancellations, delivery issues, or questions about these Terms, contact us at{" "}
          <a href={`mailto:${site.supportEmail}`} className="text-nav underline">
            {site.supportEmail}
          </a>{" "}
          or{" "}
          <a
            href={whatsappChatUrl("Hi BlossomPot, I have a question about your Terms & Conditions.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nav underline"
          >
            {whatsappLinkLabel()}
          </a>
          . You can also use our{" "}
          <Link href="/contact" className="text-nav underline">
            contact form
          </Link>
          .
        </p>
        <p className="text-slate-500 text-sm">Last updated: September 2026</p>
        <p>
          <Link href="/" className="text-nav font-semibold hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
