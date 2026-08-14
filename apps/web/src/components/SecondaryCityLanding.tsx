import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import type { SecondaryCity } from "@/lib/content/city-delivery-tiers";
import { secondaryCityIntro } from "@/lib/content/city-delivery-tiers";
import { locationPublicPath } from "@/lib/content/seo-data";
import { site, whatsappChatUrl } from "@/lib/site";

/** Shared thin template for secondary /send-rakhi-to-{city} doorways (5–7 day standard). */
export function buildSecondaryCityFaqs(city: SecondaryCity) {
  const place = `${city.name}, ${city.state}`;
  return [
    {
      q: `Can I send rakhi to ${place} from India?`,
      a: `Yes. Enter the ${place} delivery address at checkout on BlossomPot.com. We ship domestically within the USA so your brother avoids international customs.`,
    },
    {
      q: `How long does rakhi delivery take to ${place}?`,
      a: `Most orders to ${place} arrive in 5–7 business days after dispatch. For faster windows to major metros, see our ${city.nearbyMetroLabel} delivery page.`,
    },
    {
      q: `When should I order for Raksha Bandhan 2026?`,
      a: "Raksha Bandhan 2026 is August 28, 2026. Order today for express delivery to major US cities to avoid the last-minute rush and ensure your Rakhi reaches the USA on time.",
    },
  ] as const;
}

export function SecondaryCityLanding({ city }: { city: SecondaryCity }) {
  const place = `${city.name}, ${city.state}`;
  const faqs = buildSecondaryCityFaqs(city);

  return (
    <div className="mt-12 pt-10 border-t border-slate-200 max-w-3xl space-y-8 text-slate-700 leading-relaxed">
      <section>
        <h2 className="text-2xl font-bold text-primary mb-4">
          Send Rakhi to {place} — USA domestic delivery
        </h2>
        <p className="mb-4">
          {secondaryCityIntro(city.slug, city.name, city.state)} Sisters in India, the UK, Canada, and
          worldwide order online; we fulfill from our US operations so your brother avoids
          international customs delays.
        </p>
        <p>
          Shop single rakhis, combos with chocolates, kids rakhis, Bhaiya Bhabhi sets, and Lumba
          rakhis. Most orders include complimentary roli and chawal. Checkout with Stripe (USD) or
          Razorpay (INR).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">Delivery to {city.name}</h3>
        <p className="mb-3">
          Standard delivery to {place} is 5–7 business days after dispatch. Nearby express coverage
          for major metros is listed on our{" "}
          <Link
            href={locationPublicPath(city.nearbyMetroSlug)}
            className="text-nav font-medium hover:underline"
          >
            {city.nearbyMetroLabel} rakhi delivery
          </Link>{" "}
          page.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">Shop by category</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {(
            [
              ["single-rakhi", "Single Rakhi"],
              ["rakhi-combo", "Rakhi Combo"],
              ["rakhi-hampers", "Rakhi Hamper"],
              ["kids-rakhi", "Kids Rakhi"],
              ["bhaiya-bhabhi-rakhi", "Bhaiya Bhabhi"],
              ["lumba-rakhi", "Lumba Rakhi"],
            ] as const
          ).map(([slug, label]) => (
            <li key={slug}>
              <Link href={categoryHref(slug)} className="text-nav font-medium hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-primary mb-4">FAQ — {city.name}</h3>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <h4 className="font-semibold text-primary text-sm mb-1">{f.q}</h4>
              <p className="text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm">
        Need help?{" "}
        <a
          href={whatsappChatUrl(`Hi! I want to send rakhi to ${place}.`)}
          className="text-nav font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp {site.name}
        </a>
      </p>
    </div>
  );
}
