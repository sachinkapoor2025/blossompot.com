import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import type { SeoLocation } from "@/lib/content/seo-data";
import { locationPublicPath } from "@/lib/content/seo-data";
import { site, whatsappChatUrl } from "@/lib/site";

const sharedCategories = [
  { label: "Single Rakhi", slug: "single-rakhi", text: "Designer, Om, pearl, and traditional rakhis with roli chawal." },
  { label: "Rakhi Combo", slug: "rakhi-combo", text: "Rakhi with Ferrero Rocher, Lindt, Hershey's chocolates." },
  { label: "Rakhi Hamper", slug: "rakhi-hampers", text: "Gift boxes with rakhi, kaju katli, dry fruits, and sweets." },
  { label: "Bhaiya Bhabhi Rakhi", slug: "bhaiya-bhabhi-rakhi", text: "Matching sets for brother and sister-in-law." },
  { label: "Kids Rakhi", slug: "kids-rakhi", text: "Cartoon and colorful rakhis for younger brothers." },
  { label: "Lumba Rakhi", slug: "lumba-rakhi", text: "Bracelet-style Lumba rakhis for Bhabhi." },
] as const;

function displayName(location: SeoLocation): string {
  if (location.region === "state") return location.name;
  if (location.state) return `${location.name}, ${location.state}`;
  return location.name;
}

function warehouseCopy(location: SeoLocation): string {
  if (!location.isCaliforniaWarehouse) return "";
  return " Our California warehouse (India + US fulfillment through Divit Global Ventures) enables faster regional dispatch to the Bay Area, Southern California, and nearby western states — a real advantage for sisters who need reliable Raksha Bandhan delivery.";
}

export function buildLocationContent(location: SeoLocation) {
  const place = displayName(location);
  const primaryKw = location.keywords[0] ?? `send rakhi to ${location.name.toLowerCase()}`;
  const isState = location.region === "state";

  return {
    headline: isState
      ? `Send Rakhi to ${place} — Online USA Delivery for Raksha Bandhan`
      : `Send Rakhi to ${place} — Fast USA Rakhi Delivery`,
    intro: [
      `Looking for ${primaryKw}? ${site.name} delivers premium rakhis to ${place} with domestic USA shipping — no customs delays for your brother. Sisters in India, the UK, Canada, Australia, and worldwide order online; we fulfill from our US operations including a California warehouse team.${warehouseCopy(location)}`,
      `Shop single rakhis, designer sets, kids rakhis, Bhaiya Bhabhi pairs, Lumba rakhis, and chocolate combos. Most orders include complimentary roli (kumkum) and chawal (rice) for the traditional tilak ceremony on Raksha Bandhan.`,
    ],
    delivery: {
      heading: location.isCaliforniaWarehouse
        ? `Fast Rakhi Delivery to ${place} from Our California Warehouse`
        : `Rakhi Delivery Across ${place}`,
      paragraphs: [
        location.isCaliforniaWarehouse
          ? `Orders to ${place} benefit from our California-based fulfillment — many shipments dispatch quickly for 2–5 business day delivery across the metro area after processing. We use trusted US carriers with tracking.`
          : `BlossomPot ships to homes, apartments, offices, and university addresses across ${place}. Standard nationwide delivery is 5–7 business days after dispatch; order by early August 2026 for Raksha Bandhan (August 28).`,
        `Pay securely in USD (Stripe) or INR (Razorpay). Enter your brother's full US address at checkout — you can order from outside America while we ship domestically within the USA.`,
      ],
    },
    faqs: [
      {
        q: `Can I send rakhi to ${place} from India?`,
        a: `Yes. Enter the ${place} delivery address at checkout on BlossomPot.com. We ship domestically within the USA so your brother avoids international customs.`,
      },
      {
        q: `How long does rakhi delivery take to ${place}?`,
        a: location.isCaliforniaWarehouse
          ? `Many ${place} orders arrive in 2–5 business days after dispatch from our California warehouse team.`
          : `Most orders to ${place} arrive in 5–7 business days after dispatch.`,
      },
      {
        q: `When should I order for Raksha Bandhan 2026?`,
        a: "Raksha Bandhan 2026 is August 28, 2026. Order today for express delivery to major US cities to avoid the last-minute rush and ensure your Rakhi reaches the USA on time.",
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
          <strong className="text-nav">California warehouse advantage:</strong> Faster dispatch to {place} from
          our US fulfillment team — India-designed rakhis, packed and shipped domestically across America.
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
            <h3 className="text-lg font-semibold text-primary mb-4">Shop Rakhi for {place}</h3>
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
            <h3 className="text-lg font-semibold mb-2">Order Rakhi to {place}</h3>
            <p className="text-sm text-white/90 mb-4">Need help with address or delivery timing? We respond on WhatsApp and email.</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="bg-white text-nav px-4 py-2 rounded-lg font-medium hover:bg-slate-100">
                Shop BlossomPot home
              </Link>
              <a href={whatsappChatUrl(`Hi, I want to send rakhi to ${place}.`)} target="_blank" rel="noopener noreferrer" className="border border-white/60 px-4 py-2 rounded-lg hover:bg-white/10">
                WhatsApp
              </a>
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-10 pt-8 border-t border-slate-200">
        <h3 className="text-xl font-semibold text-primary mb-6">FAQ — Send Rakhi to {place}</h3>
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
          <h2 className="font-semibold text-primary mb-3">Also deliver Rakhi nearby</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {related.map((loc) => (
              <Link key={loc.slug} href={locationPublicPath(loc.slug)} className="text-nav hover:underline">
                Send Rakhi to {displayName(loc)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
