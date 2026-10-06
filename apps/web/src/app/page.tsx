import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { HomeBrandTaglines } from "@/components/HomeBrandTaglines";
import { CustomerReviews } from "@/components/CustomerReviews";
import { getGoogleReviews } from "@/lib/google-reviews";
import { TrustStrip } from "@/components/TrustStrip";
import { WhyTrustUsSection } from "@/components/WhyTrustUsSection";
import { HomeFlowerGuideCta } from "@/components/flower-guide/HomeFlowerGuideCta";
import { HomeCategoryCarousel } from "@/components/HomeCategoryCarousel";
import { HomeSeoSection } from "@/components/HomeSeoSection";
import { buildHomeCategoryTiles } from "@/lib/home-category-carousel";
import { JsonLd } from "@/components/JsonLd";
import { faqs, homeBanners, countriesMenu } from "@/lib/site";
import { localizeCopyForCountry } from "@/lib/location-seo-urls";
import { getHomepageCatalogData } from "@/lib/homepage-catalog";
import {
  HOME_PRODUCT_SECTIONS,
  HomeCategoryProductRow,
  HomeCategoryProductRowFallback,
} from "@/components/HomeCategoryProductRow";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { resolveDeliveryCountry } from "@blossompot/shared";
import { flowerDeliverySlugForIso } from "@/lib/content/country-flower-delivery";

export const metadata: Metadata = pageMetadata({
  title: "BlossomPot — Flowers, Cakes & Gifts, Delivered Worldwide",
  description:
    "Order fresh flowers, cakes, and gift hampers with worldwide delivery. Same-day options in select cities, secure checkout, and gifts for every celebration — shop online today.",
  path: "/",
  absoluteTitle: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  // Start reviews immediately so they overlap the catalog fetch instead of following it.
  const reviewsPromise = getGoogleReviews();
  return (
    <div>
      <JsonLd data={[faqJsonLd(faqs)]} />
      <HomeHero banners={[...homeBanners]} />
      <HomeBrandTaglines />
      <Suspense fallback={<HomeBelowHeroFallback />}>
        <HomeBelowHero searchParams={searchParams} reviewsPromise={reviewsPromise} />
      </Suspense>
    </div>
  );
}

/** Resolves the delivery country, then streams the carousel and category rows independently. */
async function HomeBelowHero({
  searchParams,
  reviewsPromise,
}: {
  searchParams: Promise<{ country?: string }>;
  reviewsPromise: ReturnType<typeof getGoogleReviews>;
}) {
  const params = await searchParams;
  const deliveryCountry = await getStorefrontDeliveryCountry(params.country);
  const destinationName = resolveDeliveryCountry(deliveryCountry).countryName;
  const selectedFlowerSlug = flowerDeliverySlugForIso(deliveryCountry);
  const countryPages = selectedFlowerSlug
    ? countriesMenu.items.filter((item) => item.slug === selectedFlowerSlug)
    : [];

  return (
    <>
      <Suspense fallback={<HomeBelowHeroFallback />}>
        <HomeCategoryCarouselBlock country={deliveryCountry} />
      </Suspense>
      <TrustStrip />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 flex flex-wrap justify-center gap-3">
        <Link href="/gift-catalog" className="btn-nav bg-primary">
          Shop gift baskets
        </Link>
        <Link href="/remember" className="btn-nav">
          Remember occasions
        </Link>
      </div>

      {countryPages.length > 0 ? (
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-2">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-primary">Flower delivery in {destinationName}</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl mx-auto">
            Open the {destinationName} flower delivery page for local ordering notes, occasions, and
            collections for this destination.
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {countryPages.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-[4.5rem] items-center justify-center rounded-xl border border-primary/15 bg-white px-3 py-3 text-center text-sm font-semibold text-primary hover:border-primary/40 hover:bg-petal/70"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      <section className="max-w-7xl mx-auto px-4 py-10">
        <p className="text-sm text-slate-600">
          Flowers, bouquets, cakes, and hampers for {destinationName}.
        </p>
        <div className="mt-8 space-y-10">
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

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-8 sm:p-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Personal gifting assistant</p>
          <p className="mt-2 text-2xl sm:text-4xl font-bold text-primary">Never forget a special occasion again.</p>
          <p className="mt-3 text-slate-600 max-w-2xl">
            You tell us the dates. We remember them, help you choose the perfect gift, and make sure your special moments don&apos;t get forgotten.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-5 text-sm text-slate-700">
            <li><strong>1.</strong> Add your people</li>
            <li><strong>2.</strong> Save their dates</li>
            <li><strong>3.</strong> We remind you</li>
            <li><strong>4.</strong> Choose or Surprise Me</li>
            <li><strong>5.</strong> We deliver</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/remember" className="inline-flex min-h-11 items-center rounded-full bg-nav px-5 text-sm font-semibold text-white">
              Start Remembering
            </Link>
            <Link href="/forgot-occasion" className="inline-flex min-h-11 items-center rounded-full border border-primary/30 px-5 text-sm font-semibold text-primary">
              Forgot a special occasion?
            </Link>
          </div>
        </div>
      </section>

      <WhyTrustUsSection />

      <Suspense fallback={<HomeReviewsFallback />}>
        <HomeReviews reviewsPromise={reviewsPromise} />
      </Suspense>

      <HomeFlowerGuideCta />
      <HomeSeoSection countryIso={deliveryCountry} />

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white p-8 sm:p-12 text-center shadow-lg shadow-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold">Send a gift that feels personal</h2>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto">
            From same-day bouquets to anniversary hampers, BlossomPot helps you celebrate with delivery to {destinationName}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/anniversary-gifts"
              className="inline-flex rounded-full bg-white text-primary font-semibold text-sm px-5 py-2.5 hover:bg-orange-50"
            >
              Shop Anniversary Gifts
            </Link>
            <Link
              href="/birthday-gifts"
              className="inline-flex rounded-full border border-white/70 text-white font-semibold text-sm px-5 py-2.5 hover:bg-white/10"
            >
              Shop Birthday Gifts
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-[#eadfd8]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary">Stay in bloom</h2>
          <p className="mt-2 text-sm text-slate-600">
            Occasion ideas, delivery tips, and seasonal collections — join the BlossomPot list.
          </p>
          <Link href="/contact" className="btn-nav mt-5">
            Get gifting updates
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-primary mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <p className="font-semibold text-primary text-sm">{localizeCopyForCountry(f.q, deliveryCountry)}</p>
              <p className="text-sm text-slate-600 mt-1">{localizeCopyForCountry(f.a, deliveryCountry)}</p>
            </div>
          ))}
        </div>
        <Suspense fallback={null}>
          <HomeCategoryCount country={deliveryCountry} />
        </Suspense>
      </section>
    </>
  );
}

async function HomeCategoryCarouselBlock({ country }: { country: string }) {
  let categoryTiles = buildHomeCategoryTiles([], []);
  try {
    const catalog = await getHomepageCatalogData(country);
    categoryTiles = catalog.tiles;
  } catch {
    categoryTiles = buildHomeCategoryTiles([], []);
  }
  return <HomeCategoryCarousel tiles={categoryTiles} />;
}

async function HomeCategoryCount({ country }: { country: string }) {
  try {
    const catalog = await getHomepageCatalogData(country);
    if (catalog.categoryCount <= 0) return null;
    return (
      <p className="text-xs text-slate-400 mt-8">{catalog.categoryCount} categories available in catalog</p>
    );
  } catch {
    return null;
  }
}

async function HomeReviews({
  reviewsPromise,
}: {
  reviewsPromise: ReturnType<typeof getGoogleReviews>;
}) {
  const googleReviews = await reviewsPromise;
  return <CustomerReviews data={googleReviews} />;
}

function HomeReviewsFallback() {
  return (
    <section className="border-y border-[#eadfd8] bg-gradient-to-b from-[#fff8f5] to-white" aria-hidden>
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 animate-pulse">
        <div className="mx-auto mb-8 h-8 w-56 max-w-full rounded bg-white" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-40 rounded-2xl border border-primary/10 bg-white" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Reserves the category row under the hero so the banner does not jump when the catalog streams in. */
function HomeBelowHeroFallback() {
  return (
    <section className="bg-[#f7f1ea] border-y border-[#eadfd8]" aria-hidden>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 animate-pulse">
        <div className="mx-auto mb-5 h-8 w-64 max-w-full rounded bg-white/80" />
        <div className="flex gap-4 sm:gap-5 overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="shrink-0 w-[112px] sm:w-[132px]">
              <div className="aspect-square rounded-2xl bg-white ring-1 ring-[#eadfd8]" />
              <div className="mx-auto mt-2 h-4 w-16 rounded bg-white/80" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
