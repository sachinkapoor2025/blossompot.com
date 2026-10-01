import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: `Terms and conditions for shopping on ${site.name} — flowers, cakes, and gifts with worldwide delivery.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Terms &amp; Conditions</h1>
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        <p>
          Welcome to {site.name} ({site.domain}). These Terms &amp; Conditions (&quot;Terms&quot;) govern your access
          to and use of our website, products, and services. {site.name} is operated by {site.legalName} (&quot;we,&quot;{" "}
          &quot;us,&quot; or &quot;our&quot;). By browsing the website, creating an account, or placing an order, you
          agree to these Terms.
        </p>
        <p>
          If you do not agree with these Terms, please do not use the website or place an order. If you have any
          questions, please contact us using the details provided at the end of this page.
        </p>

        <h2 className="text-xl font-bold text-primary">1. Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to place an order. By using
          the website, you confirm that the information you provide is accurate and that you are authorized to use the
          payment method selected at checkout.
        </p>

        <h2 className="text-xl font-bold text-primary">2. Products &amp; Descriptions</h2>
        <p>
          We offer flowers, bouquets, cakes, gift hampers, plants, and other related gifts for delivery worldwide.
        </p>
        <p>
          Flowers, cakes, and other perishable products are naturally unique and may vary in appearance. Colors,
          varieties, garnishes, and arrangement styles may vary depending on the season and local availability while
          remaining reasonably comparable in quality, value, and overall appearance. Product images are representative,
          and we do not guarantee an identical match to every product image displayed on the website.
        </p>
        <p>
          We may update our product catalog, prices, and availability at any time. An item is not reserved until we
          accept your order and successfully process your payment.
        </p>

        <h2 className="text-xl font-bold text-primary">3. Orders &amp; Acceptance</h2>
        <p>
          Submitting an order constitutes an offer to purchase the selected products. We may accept, decline, or
          request clarification regarding an order, including when an address is incomplete or a product is unavailable.
        </p>
        <p>
          A contract is formed when we send you an order confirmation by email. Please carefully review the
          recipient&apos;s name, delivery address, delivery date, and gift message before completing your payment.
          Incorrect or incomplete information may delay or prevent delivery.
        </p>

        <h2 className="text-xl font-bold text-primary">4. Pricing &amp; Payment</h2>
        <p>
          Prices may be displayed in USD, INR, or other supported currencies, depending on your location, payment
          method, and checkout availability. Applicable taxes, delivery charges, and other fees will be displayed
          before you place your order, where applicable.
        </p>
        <p>
          Payment may be processed securely through third-party payment providers, including Stripe for supported
          USD/card payments and Razorpay for supported INR payments, UPI, cards, and net banking. We do not store full
          card numbers on our servers.
        </p>
        <p>
          If a payment fails, is reversed, disputed, or flagged as unauthorized, we may cancel or place the order on
          hold and are not required to dispatch the order until cleared funds are received.
        </p>

        <h2 className="text-xl font-bold text-primary">5. Delivery</h2>
        <p>
          We offer delivery to eligible addresses worldwide, subject to product availability, destination coverage,
          local regulations, and delivery partner availability.
        </p>
        <p>
          Standard delivery times are estimates and may vary depending on the product, destination, weather conditions,
          holidays, customs requirements, and carrier performance. Same-day delivery is available only in select cities
          and for eligible products when the order is placed before the applicable local cut-off time.
        </p>
        <p>
          You are responsible for providing a complete and accurate delivery address, recipient information, contact
          details, and any necessary access instructions. If the recipient is unavailable, the delivery partner may
          follow local delivery procedures, leave the gift at an appropriate location where permitted, or attempt
          redelivery.
        </p>
        <p>
          We are not responsible for delays or failed deliveries caused by incorrect or incomplete address information,
          restricted access, customs-related issues, recipient unavailability, or circumstances beyond our reasonable
          control.
        </p>

        <h2 className="text-xl font-bold text-primary">6. Gift Messages &amp; Personalization</h2>
        <p>
          Where available, gift messages and personalization will be printed or prepared according to the information
          submitted by the customer.
        </p>
        <p>
          We reserve the right to decline or modify content that is unlawful, abusive, offensive, or otherwise
          inappropriate.
        </p>
        <p>
          Personalized products may have limited options for changes or cancellations once production or preparation has
          begun.
        </p>

        <h2 className="text-xl font-bold text-primary">7. Changes, Cancellations &amp; Returns</h2>
        <p>
          Because many of our products are perishable or prepared to order, changes and cancellations may only be
          possible if the order has not yet been processed, prepared, or dispatched.
        </p>
        <p>
          If you need to make a change or request a cancellation, please contact us as soon as possible and provide your
          order number.
        </p>

        <h2 className="text-xl font-bold text-primary">8. Promotions &amp; Membership</h2>
        <p>
          Coupons, free-shipping offers, promotional discounts, and membership programs, including occasion reminders,
          are subject to their respective terms, eligibility requirements, and expiry dates.
        </p>
        <p>
          Unless otherwise stated, promotions cannot be combined with other offers, have no cash value, and may be
          withdrawn or modified at any time.
        </p>
        <p>Occasion reminder memberships do not automatically charge you for gifts or purchases.</p>

        <h2 className="text-xl font-bold text-primary">9. Acceptable Use</h2>
        <p>
          You agree not to misuse the website or services, attempt to gain unauthorized access, scrape or copy website
          content at scale, interfere with other customers&apos; use of the website, or use the website for fraudulent,
          harmful, or unlawful purposes.
        </p>
        <p>
          We may suspend or terminate accounts and refuse or cancel orders that we reasonably believe violate these
          Terms or applicable laws.
        </p>

        <h2 className="text-xl font-bold text-primary">10. Intellectual Property</h2>
        <p>
          The {site.name} name, logo, website design, product photography, written content, graphics, and other website
          materials are owned by us or our licensors.
        </p>
        <p>
          You may not copy, reproduce, modify, distribute, or commercially exploit website content without our prior
          written permission, except for personal and non-commercial use of pages that you lawfully access.
        </p>

        <h2 className="text-xl font-bold text-primary">11. Third-Party Services</h2>
        <p>
          Our website and services may rely on third-party providers for payment processing, messaging, analytics,
          maps, communications, and delivery services.
        </p>
        <p>
          Your use of third-party services may also be subject to the respective provider&apos;s terms and privacy
          policies.
        </p>
        <p>
          We are not responsible for outages, interruptions, errors, or failures caused by third-party services that
          are outside our reasonable control.
        </p>

        <h2 className="text-xl font-bold text-primary">12. Disclaimer &amp; Limitation of Liability</h2>
        <p>
          The website, products, and services are provided on an &quot;as is&quot; and &quot;as available&quot; basis,
          to the fullest extent permitted by applicable law.
        </p>
        <p>
          We disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement to
          the extent permitted by law.
        </p>
        <p>
          Fresh flowers, cakes, plants, and other perishable products are naturally subject to variations in
          appearance, availability, and condition. We address product-quality concerns through our applicable returns,
          replacement, and customer-support processes rather than guaranteeing an identical appearance to product
          images.
        </p>
        <p>
          To the fullest extent permitted by applicable law, {site.name} and {site.legalName} will not be liable for
          indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill
          arising from your use of the website or any order.
        </p>
        <p>
          Our total liability for any claim relating to an order will be limited to the amount paid by you for that
          order, except where applicable law requires otherwise.
        </p>
        <p>
          Some jurisdictions do not permit certain limitations of liability. In such cases, our liability will be
          limited to the maximum extent permitted by applicable law.
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
        <p>
          For more information, please visit our{" "}
          <Link href="/shipping" className="text-nav underline">
            Shipping &amp; Delivery
          </Link>{" "}
          page.
        </p>
        <p>
          Refunds, replacements, and our satisfaction guarantee are described in our{" "}
          <Link href="/returns" className="text-nav underline">
            Returns &amp; Guarantee
          </Link>{" "}
          policy, which forms part of these Terms.
        </p>
        <p>
          How we collect and use personal information is described in our{" "}
          <Link href="/privacy" className="text-nav underline">
            Privacy Policy
          </Link>
          . By using the site, you also acknowledge that policy.
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
