import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogLoadError } from "@/components/CatalogLoadError";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { SpecialDayHero } from "@/components/special-days/SpecialDayHero";
import { JsonLd } from "@/components/JsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
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
  return pageMetadata({
    title: day.title,
    description: day.description,
    path,
    absoluteTitle: true,
    ogImage: day.heroSrc,
  });
}

export default function SpecialDayPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[24rem]" />}>
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
    <div>
      <SpecialDayHero day={day} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <JsonLd
          data={[
            breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href ?? seoPath }))),
            itemListJsonLd(
              `${day.h1} — BlossomPot`,
              products.map((product) => ({ name: product.name, path: `/products/${product.slug}` }))
            ),
            faqJsonLd(day.faqs),
          ]}
        />
        <Breadcrumbs items={crumbs} />
        <article className="max-w-3xl space-y-8 text-base leading-7 text-slate-700">
          <h1 className="font-display text-3xl leading-tight text-primary sm:text-4xl lg:text-5xl">{day.h1}</h1>
          {day.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <section>
            <h2 className="mb-3 font-display text-2xl text-primary sm:text-3xl">{day.deliveryHeading}</h2>
            <p>{day.delivery}</p>
            <p className="mt-3 text-sm text-slate-500">Gifts shown for delivery in {countryName}.</p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl text-primary sm:text-3xl">{day.ideasHeading}</h2>
            <ul className="space-y-2 rounded-2xl border border-primary/15 bg-petal px-4 py-4 text-sm">
              {day.ideas.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-nav" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <h2 className="mb-4 mt-10 font-display text-2xl text-primary sm:text-3xl">Shop {day.name}</h2>
        {failed ? (
          <CatalogLoadError />
        ) : products.length > 0 ? (
          <ProductGrid products={products} sort={sort} />
        ) : (
          <p className="text-slate-600">
            No {day.name} gifts are available for {countryName} yet.{" "}
            <Link href={shopHref} className="font-semibold text-nav hover:underline">
              Browse all gifts
            </Link>
          </p>
        )}

        <article className="mt-12 max-w-3xl space-y-8 text-base leading-7 text-slate-700">
          <section>
            <h2 className="mb-3 font-display text-2xl text-primary sm:text-3xl">{day.tipHeading}</h2>
            <p>{day.tip}</p>
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl text-primary sm:text-3xl">{day.whyHeading}</h2>
            <ul className="list-disc space-y-1 pl-5">
              {day.why.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <nav aria-label="More Valentine week gifts" className="flex flex-wrap gap-2">
            {moreLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-primary hover:border-nav hover:text-nav"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <section>
            <h2 className="mb-4 font-display text-2xl text-primary sm:text-3xl">{day.faqHeading}</h2>
            <FaqAccordion items={day.faqs} />
          </section>
        </article>
      </div>
    </div>
  );
}
