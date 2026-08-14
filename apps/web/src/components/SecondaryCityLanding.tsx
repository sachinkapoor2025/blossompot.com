import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import type { SecondaryCity } from "@/lib/content/city-delivery-tiers";
import { secondaryCityIntro } from "@/lib/content/city-delivery-tiers";
import { locationPublicPath } from "@/lib/content/seo-data";
import { site, whatsappChatUrl } from "@/lib/site";

/** Shared thin template for secondary /gifts-to-{city} doorways. */
export function buildSecondaryCityFaqs(city: SecondaryCity) {
  const place = `${city.name}, ${city.state}`;
  return [
    {
      q: `Can I send gifts to ${place} from outside the USA?`,
      a: `Yes. Enter the ${place} delivery address at checkout on BlossomPot.com. We fulfill for delivery within the United States.`,
    },
    {
      q: `How long does gift delivery take to ${place}?`,
      a: `Most orders to ${place} arrive within standard nationwide windows after dispatch. For faster windows to major metros, see our ${city.nearbyMetroLabel} delivery page.`,
    },
    {
      q: `Can I add a gift message?`,
      a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
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
          Send gifts to {place} — USA delivery
        </h2>
        <p className="mb-4">
          {secondaryCityIntro(city.slug, city.name, city.state)} Order online from anywhere; we fulfill for
          USA delivery so your recipient gets a smooth domestic experience.
        </p>
        <p>
          Shop flowers, bouquets, cakes, gift hampers, and occasion collections. Most products support a
          personal gift message. Checkout with Stripe (USD) or Razorpay (INR).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">Delivery to {city.name}</h3>
        <p className="mb-3">
          Standard delivery to {place} uses our nationwide windows after dispatch. Nearby express coverage
          for major metros is listed on our{" "}
          <Link
            href={locationPublicPath(city.nearbyMetroSlug)}
            className="text-nav font-medium hover:underline"
          >
            {city.nearbyMetroLabel} gift delivery
          </Link>{" "}
          page.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">Shop by category</h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {(
            [
              ["flowers", "Flowers"],
              ["flower-bouquets", "Flower Bouquets"],
              ["cakes", "Cakes"],
              ["gift-hampers", "Gift Hampers"],
              ["birthday-gifts", "Birthday Gifts"],
              ["anniversary-gifts", "Anniversary Gifts"],
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
          href={whatsappChatUrl(`Hi! I want to send a gift to ${place}.`)}
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
