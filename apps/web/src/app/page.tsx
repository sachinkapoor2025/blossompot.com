import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeHero } from "@/components/HomeHero";
import { HomeBrandTaglines } from "@/components/HomeBrandTaglines";
import { TrustStrip } from "@/components/TrustStrip";
import { WhyTrustUsSection } from "@/components/WhyTrustUsSection";
import { HomeSeoSection } from "@/components/HomeSeoSection";
import { JsonLd } from "@/components/JsonLd";
import { homeBanners } from "@/lib/site";
import {
  HOME_PRODUCT_SECTIONS,
  HomeCategoryProductRow,
  HomeCategoryProductRowFallback,
} from "@/components/HomeCategoryProductRow";
import { getIndexableHomeCountry, getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { countrySeoContent } from "@/lib/content/country-seo-registry";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const country = await getIndexableHomeCountry();
  const article = countrySeoContent(country, "home");
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: "/",
    absoluteTitle: true,
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const indexableCountryPromise = getIndexableHomeCountry();
  return (
    <div>
      <HomeHero banners={[...homeBanners]} />
      <HomeBrandTaglines />
      <TrustStrip />

      <Suspense fallback={<HomeBelowHeroFallback />}>
        <HomeProductSection searchParams={searchParams} />
      </Suspense>

      <WhyTrustUsSection />

      <Suspense fallback={null}>
        <HomeIndexableSeo countryPromise={indexableCountryPromise} />
      </Suspense>
    </div>
  );
}

/** Shopper delivery country for the product rows. Does not choose the indexable SEO country. */
async function HomeProductSection({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const deliveryCountry = await getStorefrontDeliveryCountry(params.country);

  return (
    <section className="site-container py-10">
      <div className="space-y-10">
        {HOME_PRODUCT_SECTIONS.map((section) => (
          <Suspense
            key={section.slug}
            fallback={<HomeCategoryProductRowFallback title={section.title} />}
          >
            <HomeCategoryProductRow
              slug={section.slug}
              title={section.title}
              country={deliveryCountry}
            />
          </Suspense>
        ))}
      </div>
    </section>
  );
}

/** Indexable homepage article and FAQ schema. Uses the admin default country, not the shopper cookie. */
async function HomeIndexableSeo({
  countryPromise,
}: {
  countryPromise: ReturnType<typeof getIndexableHomeCountry>;
}) {
  const indexableCountry = await countryPromise;
  const indexableSeo = countrySeoContent(indexableCountry, "home");
  return (
    <>
      <JsonLd data={[faqJsonLd(indexableSeo.faqs)]} />
      <HomeSeoSection countryIso={indexableCountry} />
    </>
  );
}

/** Product-row placeholders while the delivery country and catalog resolve. */
function HomeBelowHeroFallback() {
  return (
    <section className="site-container py-10" aria-hidden>
      <div className="space-y-10">
        {HOME_PRODUCT_SECTIONS.map((section) => (
          <HomeCategoryProductRowFallback key={section.slug} title={section.title} />
        ))}
      </div>
    </section>
  );
}
