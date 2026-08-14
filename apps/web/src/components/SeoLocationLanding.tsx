import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import type { SeoLocation } from "@/lib/content/seo-data";
import { locationPublicPath } from "@/lib/content/seo-data";
import { site, whatsappChatUrl } from "@/lib/site";

const sharedCategories = [
  { label: "Flowers", slug: "flowers", text: "Fresh arrangements for birthdays, thank-yous, and celebrations." },
  { label: "Flower Bouquets", slug: "flower-bouquets", text: "Signature bouquets for doorstep surprises." },
  { label: "Cakes", slug: "cakes", text: "Chocolate, red velvet, and designer celebration cakes." },
  { label: "Gift Hampers", slug: "gift-hampers", text: "Curated boxes with treats and thoughtful extras." },
  { label: "Birthday Gifts", slug: "birthday-gifts", text: "Flowers, cakes, and combos for birthday moments." },
  { label: "Anniversary Gifts", slug: "anniversary-gifts", text: "Romantic roses, cakes, and gift sets." },
] as const;

function displayName(location: SeoLocation): string {
  if (location.region === "state") return location.name;
  if (location.state) return `${location.name}, ${location.state}`;
  return location.name;
}

function warehouseCopy(location: SeoLocation): string {
  if (!location.isCaliforniaWarehouse) return "";
  return " Our California fulfillment support helps with faster regional dispatch to the Bay Area, Southern California, and nearby western states — a real advantage for timely celebration gifts.";
}

export function buildLocationContent(location: SeoLocation) {
  const place = displayName(location);
  const primaryKw = location.keywords[0] ?? `send gifts to ${location.name.toLowerCase()}`;
  const isState = location.region === "state";

  return {
    headline: isState
      ? `Send Gifts to ${place} — Flowers, Cakes & More`
      : `Send Gifts to ${place} — Fast USA Delivery`,
    intro: [
      `Looking for ${primaryKw}? ${site.name} delivers premium flowers, cakes, and gifts to ${place} with clear USA shipping expectations.${warehouseCopy(location)}`,
      `Shop flowers, bouquets, cakes, gift hampers, and occasion collections. Most products support a personal gift message at checkout.`,
    ],
    delivery: {
      heading: location.isCaliforniaWarehouse
        ? `Fast Gift Delivery to ${place} from Our California Team`
        : `Gift Delivery Across ${place}`,
      paragraphs: [
        location.isCaliforniaWarehouse
          ? `Orders to ${place} benefit from California-based fulfillment support — many shipments dispatch quickly across the metro area after processing. We use trusted US carriers with tracking.`
          : `BlossomPot ships to homes, apartments, offices, and university addresses across ${place}. Nationwide delivery covers all ZIP codes; faster windows may be available to major metros.`,
        `Pay securely in USD (Stripe) or INR (Razorpay). Enter the recipient's full US address at checkout — you can order from outside America while we fulfill for USA delivery.`,
      ],
    },
    faqs: [
      {
        q: `Can I send gifts to ${place} from outside the USA?`,
        a: `Yes. Enter the ${place} delivery address at checkout on BlossomPot.com. We fulfill for delivery within the United States.`,
      },
      {
        q: `How long does gift delivery take to ${place}?`,
        a: location.isCaliforniaWarehouse
          ? `Many ${place} orders arrive quickly after dispatch with California fulfillment support.`
          : `Most orders to ${place} arrive within standard nationwide windows after dispatch.`,
      },
      {
        q: `Can I add a gift message?`,
        a: "Yes. Most products support a personal gift message and delivery date preferences at checkout.",
      },
    ],
  };
}

interface Props {
  location: SeoLocation;
  related: SeoLocation[];
}

export function SeoLocationLanding({ location, related }: Props) {
  const content = buildLocationContent(location);
  const place = displayName(location);

  return (
    <div className="mt-12 pt-10 border-t border-slate-200">
      {location.isCaliforniaWarehouse && (
        <div className="mb-8 rounded-xl bg-nav/5 border border-nav/20 px-5 py-4 text-sm text-slate-700">
          <strong className="text-nav">California fulfillment advantage:</strong> Faster regional support for {place} —
          flowers, cakes, and gifts packed carefully for USA delivery.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-10 xl:gap-12 items-start">
        <article className="lg:col-span-2 space-y-8 text-slate-700 leading-relaxed">
          <header>
            <h2 className="text-2xl font-bold text-primary mb-4">{content.headline}</h2>
            {content.intro.map((p, i) => (
              <p key={i} className="mb-4">
                {p}
              </p>
            ))}
          </header>

          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">{content.delivery.heading}</h3>
            {content.delivery.paragraphs.map((p, i) => (
              <p key={i} className="mb-3">
                {p}
              </p>
            ))}
          </section>

          <section>
            <h3 className="text-xl font-semibold text-primary mb-3">Popular searches for {place}</h3>
            <ul className="flex flex-wrap gap-2 text-sm">
              {location.keywords.slice(0, 12).map((kw) => (
                <li key={kw} className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                  {kw}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="space-y-6">
          <section className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Shop gifts for {place}</h3>
            <ul className="space-y-3 text-sm">
              {sharedCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={categoryHref(cat.slug)} className="font-medium text-nav hover:underline">
                    {cat.label}
                  </Link>
                  <p className="text-slate-500 mt-0.5">{cat.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-nav text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Order gifts to {place}</h3>
            <p className="text-sm text-white/90 mb-4">Need help with address or delivery timing? We respond on WhatsApp and email.</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="bg-white text-nav px-4 py-2 rounded-lg font-medium hover:bg-slate-100">
                Shop BlossomPot home
              </Link>
              <a href={whatsappChatUrl(`Hi, I want to send a gift to ${place}.`)} target="_blank" rel="noopener noreferrer" className="border border-white/60 px-4 py-2 rounded-lg hover:bg-white/10">
                WhatsApp
              </a>
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-10 pt-8 border-t border-slate-200">
        <h3 className="text-xl font-semibold text-primary mb-6">FAQ — Send gifts to {place}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {content.faqs.map((faq) => (
            <div key={faq.q} className="bg-white border border-slate-100 rounded-xl p-5">
              <h4 className="font-semibold text-primary text-sm mb-2">{faq.q}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10 p-6 bg-slate-50 rounded-xl text-sm">
          <h2 className="font-semibold text-primary mb-3">Also deliver gifts nearby</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {related.map((loc) => (
              <Link key={loc.slug} href={locationPublicPath(loc.slug)} className="text-nav hover:underline">
                Gifts to {displayName(loc)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
