import Link from "next/link";
import type { Product } from "@blossompot/shared";
import { AnswerBlock } from "@/components/AnswerBlock";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { HomeProductCard } from "@/components/HomeProductCard";
import { JsonLd } from "@/components/JsonLd";
import {
  getCountryFlowerDelivery,
  otherCountryFlowerDeliveryLinks,
  type CountryFlowerDeliverySlug,
} from "@/lib/content/country-flower-delivery";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, canonical, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/env";

const FLOWER_CATEGORY_SLUGS = new Set(["flowers", "flower-bouquets"]);

function pickCountryProducts(products: Product[], slug: CountryFlowerDeliverySlug): Product[] {
  const visible = products.filter((p) => p.published !== false);
  const flowersFirst = [
    ...visible.filter((p) => FLOWER_CATEGORY_SLUGS.has(p.categorySlug)),
    ...visible.filter((p) => !FLOWER_CATEGORY_SLUGS.has(p.categorySlug)),
  ];
  return shuffleForCity(flowersFirst, `flower-delivery-${slug}`).slice(0, 10);
}

export async function CountryFlowerDeliveryPage({
  country,
}: {
  country: CountryFlowerDeliverySlug;
}) {
  const page = getCountryFlowerDelivery(country);
  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const featured = pickCountryProducts(products, country);
  const otherCountries = otherCountryFlowerDeliveryLinks(country);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: page.menuLabel },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.menuLabel, path: page.href },
          ]),
          faqJsonLd(page.faqs),
          itemListJsonLd(
            page.h1,
            featured.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            url: canonical(page.href),
            name: page.title,
            description: page.description,
            inLanguage: page.locale,
            isPartOf: { "@id": `${siteUrl}/#website` },
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: page.h1,
            description: page.availability,
            url: canonical(page.href),
            provider: { "@id": `${siteUrl}/#organization` },
            serviceType:
              page.serviceMode === "destination"
                ? "Flower delivery in the United States"
                : `Flower and gift ordering from ${page.countryName} for USA delivery`,
            areaServed: { "@type": "Country", name: "United States" },
            audience: {
              "@type": "Audience",
              geographicArea: { "@type": "Country", name: page.countryName },
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: canonical(page.href),
            },
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{page.h1}</h1>
      <p className="text-slate-600 mb-6 max-w-3xl leading-relaxed">{page.intro}</p>

      <div className="mb-8 rounded-xl border border-primary/15 bg-petal/80 px-4 py-3 text-sm text-slate-800">
        <p className="font-medium">{page.availability}</p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">{page.howItWorksHeading}</h2>
        <p className="text-slate-700 leading-relaxed max-w-3xl">{page.howItWorks}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">{page.categoriesHeading}</h2>
        <p className="text-slate-700 mb-4 max-w-3xl leading-relaxed">{page.categoriesIntro}</p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {page.categories.map((cat) => (
            <li key={cat.href}>
              <Link
                href={cat.href}
                className="flex min-h-11 items-center rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm font-semibold text-primary hover:border-primary/40 hover:bg-petal/60"
              >
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-3">Featured gifts for {page.countryName}</h2>
          <p className="text-slate-700 mb-4 max-w-3xl leading-relaxed">
            A rotating selection from the live {site.name} catalog — flowers first, then cakes and hampers.
            Open any product for current price, inventory, and delivery timing.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featured.map((product) => (
              <HomeProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4">{page.occasionsHeading}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {page.occasions.map((occasion) => (
            <article
              key={occasion.h3}
              className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm shadow-primary/5"
            >
              <h3 className="font-semibold text-primary mb-2">{occasion.h3}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{occasion.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">{page.citiesHeading}</h2>
        <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">{page.citiesIntro}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {page.cityLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-nav hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">{page.whyHeading}</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 max-w-3xl">
          {page.whyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="mb-10 rounded-3xl border border-primary/15 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-primary">{page.ctaHeading}</h2>
        <p className="mt-2 text-slate-600 max-w-2xl">{page.ctaText}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={page.primaryCta.href}
            className="inline-flex min-h-11 items-center rounded-full bg-nav px-5 text-sm font-semibold text-white hover:opacity-95"
          >
            {page.primaryCta.label}
          </Link>
          <Link
            href={page.secondaryCta.href}
            className="inline-flex min-h-11 items-center rounded-full border border-primary/30 px-5 text-sm font-semibold text-primary hover:bg-white"
          >
            {page.secondaryCta.label}
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4">Frequently asked questions</h2>
        <div className="grid gap-3 max-w-3xl">
          {page.faqs.map((faq) => (
            <AnswerBlock key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">Flower delivery in other countries</h2>
        <p className="text-slate-700 mb-3 max-w-3xl leading-relaxed">
          The BlossomPot homepage serves shoppers in the USA, UK, Canada, Australia, and the UAE. Each
          country page has its own flower delivery notes, occasions, and internal links.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {otherCountries.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-nav hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-3">Related pages</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {page.relatedHubs.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-nav hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/faq" className="text-nav hover:underline">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-nav hover:underline">
              Contact
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
