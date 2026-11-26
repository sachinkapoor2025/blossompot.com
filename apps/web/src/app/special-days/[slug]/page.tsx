import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogLoadError } from "@/components/CatalogLoadError";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { ListingPageSkeleton } from "@/components/route-skeletons";
import { JsonLd } from "@/components/JsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { CountrySeoArticle } from "@/components/CountrySeoArticle";
import { countrySeoContent, hasApprovedCountrySeo, type CountrySeoContent } from "@/lib/content/country-seo-registry";
import { allSpecialDays, getSpecialDay, loadSpecialDayProducts, specialDayLocationHref } from "@/lib/special-days";
import { adjacentSpecialDays } from "@/lib/special-day-slugs";
import { categoryLocationHref, countryDisplayName, giftsCatalogLocationHref } from "@/lib/location-seo-urls";
import { requestSeoPath } from "@/lib/request-seo-path";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; country?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

/** /valentines-day-gifts-to-usa is this special-day route, so the approved USA article has to be applied here. */
function approvedValentineArticle(slug: string, country: string): CountrySeoContent | null {
  if (slug !== "valentines-day" || !hasApprovedCountrySeo(country, "valentines-day-gifts")) return null;
  return countrySeoContent(country, "valentines-day-gifts");
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return allSpecialDays().map((day) => ({ slug: day.id }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const stub = getSpecialDay(slug);
  if (!stub) return { title: "Special day gifts", robots: { index: false, follow: false } };
  const path = await requestSeoPath(`/${stub.publicSlug}`);
  await notFoundIfShoppingCountryDisabled(path);
  const country = await getStorefrontDeliveryCountry(query.country);
  const day = getSpecialDay(slug, country) ?? stub;
  const approved = approvedValentineArticle(slug, country);
  return pageMetadata({
    title: approved?.title ?? day.title,
    description: approved?.description ?? day.description,
    path,
    absoluteTitle: true,
    ogImage: day.heroSrc,
  });
}

export default function SpecialDayPage(props: Props) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <SpecialDayContent {...props} />
    </Suspense>
  );
}

async function SpecialDayContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const stub = getSpecialDay(slug);
  if (!stub) notFound();

  const seoPath = await requestSeoPath(`/${stub.publicSlug}`);
  await notFoundIfShoppingCountryDisabled(seoPath);
  const country = await getStorefrontDeliveryCountry(query.country);
  const day = getSpecialDay(slug, country) ?? stub;
  const approved = approvedValentineArticle(slug, country);
  const heading = approved?.heading ?? day.h1;
  const faqs = approved?.faqs ?? day.faqs;
  const countryName = countryDisplayName(country);
  const shopHref = giftsCatalogLocationHref(country);
  const sort = resolveSort(query.sort);
  const neighbors = adjacentSpecialDays(day.id);
  const previous = neighbors.prev ? getSpecialDay(neighbors.prev, country) : null;
  const next = neighbors.next ? getSpecialDay(neighbors.next, country) : null;
  const moreLinks = [
    previous ? { href: specialDayLocationHref(previous.id, country), label: previous.name } : null,
    next ? { href: specialDayLocationHref(next.id, country), label: next.name } : null,
    day.id === "valentines-day"
      ? null
      : { href: specialDayLocationHref("valentines-day", country), label: "Valentine's Day" },
    { href: categoryLocationHref("flower-bouquets", country), label: "Bouquets" },
    { href: categoryLocationHref("cakes", country), label: "Cakes" },
    { href: categoryLocationHref("gift-hampers", country), label: "Hampers" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  let products: Awaited<ReturnType<typeof loadSpecialDayProducts>> = [];
  let failed = false;
  try {
    products = await loadSpecialDayProducts(day.id, country);
  } catch {
    failed = true;
  }

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: shopHref },
    { label: day.name },
  ];

  return (
    <>
    <div className="site-container py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href ?? seoPath }))),
          itemListJsonLd(
            `${heading} — BlossomPot`,
            products.map((product) => ({ name: product.name, path: `/products/${product.slug}` }))
          ),
          faqJsonLd(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="mb-8 text-3xl font-bold text-primary">{heading}</h1>
      {failed ? (
        <CatalogLoadError />
      ) : products.length > 0 ? (
        <ProductGrid products={products} sort={sort} />
      ) : (
        <p className="text-slate-500">
          No {day.name} gifts are available for {countryName} yet.{" "}
          <Link href={shopHref} className="text-nav hover:underline">
            Browse all gifts
          </Link>
        </p>
      )}

      {approved ? null : (
        <div className="mt-12 border-t border-slate-200 pt-10">
          <article className="space-y-8 leading-relaxed text-slate-700">
            {day.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <section>
              <h2 className="mb-3 text-lg font-bold text-primary">{day.deliveryHeading}</h2>
              <p>{day.delivery}</p>
              <p className="mt-3 text-sm text-slate-500">Gifts shown for delivery in {countryName}.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-primary">{day.ideasHeading}</h2>
              <ul className="space-y-2 text-sm">
                {day.ideas.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 shrink-0 text-nav">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-primary">{day.tipHeading}</h2>
              <p>{day.tip}</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-primary">{day.whyHeading}</h2>
              <ul className="space-y-2 text-sm">
                {day.why.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="shrink-0 text-nav">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="border-t border-slate-200 pt-10">
              <h2 className="mb-6 font-display text-xl font-semibold text-primary">{day.faqHeading}</h2>
              <FaqAccordion items={day.faqs} />
            </section>
          </article>
        </div>
      )}
    </div>
    {approved ? (
      <CountrySeoArticle article={approved} omitHeading headingClassName="text-3xl font-bold text-primary mb-4" />
    ) : null}
    <div className="site-container pb-10">
      <nav aria-label="More Valentine week gifts" className="mt-10 flex flex-wrap gap-2">
        {moreLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-nav hover:text-nav sm:text-sm"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
    </>
  );
}
