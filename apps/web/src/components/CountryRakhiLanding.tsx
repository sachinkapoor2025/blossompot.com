import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { categoryHref } from "@/lib/category-urls";
import type { CountryRakhiPage } from "@/lib/content/country-rakhi-pages";
import { site, whatsappChatUrl } from "@/lib/site";
import { faqJsonLd, itemListJsonLd } from "@/lib/seo";
import type { Product } from "@blossompot/shared";

const ACCENTS = {
  uk: {
    heroBg: "linear-gradient(180deg, rgba(1,33,105,0.10) 0%, #ffffff 72%)",
    badge: "#012169",
    cta: "#012169",
    ring: "rgba(200,16,46,0.22)",
    bar: "linear-gradient(90deg, transparent, #C8102E, #012169, transparent)",
  },
  canada: {
    heroBg: "linear-gradient(180deg, rgba(255,0,0,0.08) 0%, #ffffff 72%)",
    badge: "#A50000",
    cta: "#C8102E",
    ring: "rgba(255,0,0,0.18)",
    bar: "linear-gradient(90deg, transparent, #FF0000, #C8102E, transparent)",
  },
} as const;

/**
 * Country-specific landing (UK / Canada) — intentionally distinct from US city
 * `/send-rakhi-to-*` pages (no CityContentSection / metro delivery blocks).
 */
export function CountryRakhiLanding({
  page,
  products,
  sort,
}: {
  page: CountryRakhiPage;
  products: Product[];
  sort: ProductSort;
}) {
  const accent = ACCENTS[page.id];
  const crumbs = [
    { label: "Home", href: "/" },
    { label: page.menuLabel },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-w-0 overflow-x-hidden">
      <JsonLd
        data={[
          faqJsonLd(page.faqs),
          itemListJsonLd(
            page.menuLabel,
            products.slice(0, 24).map((p) => ({
              name: p.name,
              path: `/products/${p.slug}`,
            }))
          ),
        ]}
      />

      {/* Country hero — full-bleed accent plane, not a city-page layout */}
      <section className="relative overflow-hidden border-b border-slate-200" style={{ background: accent.heroBg }}>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent.bar }} aria-hidden />
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-12 md:pb-16">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-wide mb-3" style={{ color: accent.badge }}>
              {page.eyebrow}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight mb-4 break-words">
              {page.heading}
            </h1>
            <div className="space-y-3 text-slate-600 text-base md:text-lg leading-relaxed text-left sm:text-center">
              {page.intro.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#country-products"
                className="inline-flex items-center justify-center rounded-lg text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                style={{ backgroundColor: accent.cta }}
              >
                Shop Rakhi collection
              </a>
              <Link
                href={categoryHref("rakhi-combo")}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:border-nav"
              >
                Rakhi Combos
              </Link>
              <a
                href={whatsappChatUrl(page.whatsappPrefill)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-emerald-600/40 text-emerald-800 bg-emerald-50 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-100"
              >
                WhatsApp {site.whatsappDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 md:py-12">
        <h2 className="text-2xl font-bold text-primary mb-3 text-center">Why shop this collection</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-700 mt-6">
          {page.highlights.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              style={{ boxShadow: `inset 0 0 0 1px ${accent.ring}` }}
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">{page.howToHeading}</h2>
        <ol className="space-y-4 max-w-2xl mx-auto">
          {page.howToSteps.map((step, i) => (
            <li key={step} className="flex gap-3 text-slate-700">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: accent.cta }}
              >
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="country-products" className="max-w-6xl mx-auto px-4 py-10 md:py-12 scroll-mt-24">
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">{page.productSectionHeading}</h2>
          <p className="text-slate-600 text-sm md:text-base">{page.productSectionIntro}</p>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} sort={sort} showSort />
        ) : (
          <p className="text-center text-slate-500 py-12">
            Products are loading. Please{" "}
            <Link href="/products" className="text-nav font-semibold hover:underline">
              browse all Rakhis
            </Link>
            .
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          {(
            [
              ["single-rakhi", "Single Rakhi"],
              ["bhaiya-bhabhi-rakhi", "Bhaiya Bhabhi"],
              ["kids-rakhi", "Kids Rakhi"],
              ["lumba-rakhi", "Lumba Rakhi"],
              ["rakhi-combo", "Rakhi Combo"],
              ["rakhi-hampers", "Rakhi Hampers"],
            ] as const
          ).map(([slug, label]) => (
            <Link
              key={slug}
              href={categoryHref(slug)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 hover:border-nav text-slate-700"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 pb-16">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">FAQs</h2>
        <div className="space-y-3">
          {page.faqs.map((f) => (
            <details key={f.q} className="border border-slate-200 rounded-xl p-4 bg-white">
              <summary className="font-semibold text-primary cursor-pointer text-sm">{f.q}</summary>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
