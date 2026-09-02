import type { Metadata } from "next";
import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import { api } from "@/lib/api";
import { HomeHero } from "@/components/HomeHero";
import { HomeBrandTaglines } from "@/components/HomeBrandTaglines";
import { CustomerReviews } from "@/components/CustomerReviews";
import { getGoogleReviews } from "@/lib/google-reviews";
import { HomeProductList } from "@/components/HomeProductList";
import { FastSellingSection } from "@/components/FastSellingSection";
import { TrustStrip } from "@/components/TrustStrip";
import { WhyTrustUsSection } from "@/components/WhyTrustUsSection";
import { HomeFlowerGuideCta } from "@/components/flower-guide/HomeFlowerGuideCta";
import { HomeCategoryCarousel } from "@/components/HomeCategoryCarousel";
import { buildHomeCategoryTiles } from "@/lib/home-category-carousel";
import { JsonLd } from "@/components/JsonLd";
import { site, homeCategoryOrder, faqs, homeBanners, countriesMenu } from "@/lib/site";
import {
  getCatalogProductsByCategory,
  mergeProductsPreferExisting,
  getCatalogProducts,
} from "@/lib/catalog-fallback";
import { pickHomeCategoryProducts } from "@/lib/home-category-products";
import { loadProducts } from "@/lib/product-loader";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import type { Product, Category } from "@blossompot/shared";

export const metadata: Metadata = pageMetadata({
  title: "BlossomPot — Flowers, Cakes & Gifts | USA, UK, Canada, Australia & UAE",
  description:
    "Order fresh flowers, cakes, and gift hampers online. Shoppers in the USA, UK, Canada, Australia, and UAE send gifts with fast USA delivery. Same-day options in select cities.",
  path: "/",
  absoluteTitle: true,
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [liveProducts, categoriesData] = await Promise.all([
      loadProducts(),
      api<{ categories: Category[] }>("/categories", { revalidate: false }),
    ]);
    products = liveProducts;
    categories = categoriesData.categories;
  } catch {
    products = getCatalogProducts();
    categories = [];
  }

  for (const slug of homeCategoryOrder) {
    products = mergeProductsPreferExisting(products, getCatalogProductsByCategory(slug));
  }

  if (products.length === 0) {
    products = getCatalogProducts();
  }

  const homeCategoryDisplayNames: Record<(typeof homeCategoryOrder)[number], string> = {
    flowers: "Fresh Flowers",
    "flower-bouquets": "Signature Bouquets",
    cakes: "Celebration Cakes",
    "birthday-gifts": "Birthday Gifts",
    "anniversary-gifts": "Anniversary Gifts",
    "gift-hampers": "Gift Hampers",
    "personalized-gifts": "Personalized Gifts",
    "same-day-gifts": "Same-Day Gifts",
  };

  const productsByCategory = homeCategoryOrder.map((slug) => ({
    slug,
    name: homeCategoryDisplayNames[slug],
    products: pickHomeCategoryProducts(products, slug),
  }));

  const bestsellers = [...products]
    .filter((p) => p.published !== false)
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 8);

  const googleReviews = await getGoogleReviews();
  const categoryTiles = buildHomeCategoryTiles(products, categories);

  return (
    <div>
      <JsonLd data={[faqJsonLd(faqs)]} />

      <HomeHero banners={[...homeBanners]} />
      <HomeBrandTaglines />

      <HomeCategoryCarousel tiles={categoryTiles} />
      <TrustStrip />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 flex flex-wrap justify-center gap-3">
        <Link href="/flowers" className="btn-nav">
          Shop Flowers
        </Link>
        <Link href="/same-day-delivery" className="btn-nav bg-primary">
          Same-Day Delivery
        </Link>
        <Link href="/gift-hampers" className="btn-nav">
          Explore Hampers
        </Link>
      </div>

      <section className="max-w-7xl mx-auto px-4 pt-8 pb-2">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-primary">Flower delivery by country</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl mx-auto">
            BlossomPot serves shoppers in the USA, UK, Canada, Australia, and the UAE. Open a country
            page for local ordering notes, occasions, and flower collections.
          </p>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {countriesMenu.items.map((item) => (
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

      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">Best sellers</h2>
              <p className="text-sm text-slate-600 mt-1">Customer favorites across flowers, cakes & gifts</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-nav hover:underline">
              View all
            </Link>
          </div>
          <HomeProductList products={bestsellers} />
        </section>
      )}

      <FastSellingSection products={products} />

      {productsByCategory.map(
        (section) =>
          section.products.length > 0 && (
            <section key={section.slug} className="max-w-7xl mx-auto px-4 py-10 border-t border-[#eadfd8]">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{section.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">Handpicked for {site.name} shoppers</p>
                </div>
                <Link
                  href={categoryHref(section.slug)}
                  className="text-sm font-semibold text-nav hover:underline"
                >
                  Shop {section.name}
                </Link>
              </div>
              <HomeProductList products={section.products} limit={8} />
            </section>
          )
      )}

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

      <CustomerReviews data={googleReviews} />

      <HomeFlowerGuideCta />

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-[#9e2d55] to-accent text-white p-8 sm:p-12 text-center shadow-lg shadow-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold">Send a gift that feels personal</h2>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto">
            From same-day bouquets to anniversary hampers, BlossomPot helps you celebrate across all 50 states, DC and Puerto Rico.
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
              <p className="font-semibold text-primary text-sm">{f.q}</p>
              <p className="text-sm text-slate-600 mt-1">{f.a}</p>
            </div>
          ))}
        </div>
        {categories.length > 0 && (
          <p className="text-xs text-slate-400 mt-8">{categories.length} categories available in catalog</p>
        )}
      </section>
    </div>
  );
}
