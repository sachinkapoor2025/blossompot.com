import type { Metadata } from "next";
import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import { api } from "@/lib/api";
import { applyInlineLinks } from "@/lib/inline-links";
import { homepageInlineLinks } from "@/lib/content/page-inline-links";
import { HomeHero } from "@/components/HomeHero";
import { GoogleReviews } from "@/components/GoogleReviews";
import { getGoogleReviews } from "@/lib/google-reviews";
import { HomeProductCard } from "@/components/HomeProductCard";
import { FastSellingSection } from "@/components/FastSellingSection";
import { FlashSaleSection } from "@/components/FlashSaleSection";
import { HomeSeoSection } from "@/components/HomeSeoSection";
import { HomeRakshaBandhan2026Section } from "@/components/HomeRakshaBandhan2026Section";
import { TrustStrip } from "@/components/TrustStrip";
import { IndiaBuyerBanner } from "@/components/IndiaBuyerBanner";
import { WhyTrustUsSection } from "@/components/WhyTrustUsSection";
import { JsonLd } from "@/components/JsonLd";
import { site, homeCategoryOrder, faqs } from "@/lib/site";
import { getHomeBanners } from "@/lib/independence-day-hero";
import {
  getCatalogProduct,
  getCatalogProductsByCategory,
  mergeProductsPreferExisting,
} from "@/lib/catalog-fallback";
import { pickHomeCategoryProducts } from "@/lib/home-category-products";
import { loadProducts } from "@/lib/product-loader";
import { faqJsonLd, howToSendRakhiJsonLd, pageMetadata } from "@/lib/seo";
import { FLASH_COMBO_SALE_SLUG, isFlashComboSaleActive, type Product, type Category } from "@blossompot/shared";

export const metadata: Metadata = pageMetadata({
  title: "Send Rakhi to USA Online | Rakhi Delivery USA | BlossomPot",
  description:
    "Send rakhi to USA with domestic delivery — order from India with INR/UPI, or buy rakhi online USA. Designer rakhis, combos, 5–7 day nationwide shipping from our California warehouse.",
  path: "/",
  keywords:
    "send rakhi to usa, rakhi delivery usa, buy rakhi online usa, send rakhi to usa from india, order rakhi from india to usa, rakhi store usa, usa rakhi shop online, rakhi gifts to usa, nationwide rakhi delivery usa, pay inr rakhi usa",
});

/** Same as PDP: always render from live product API so listing prices cannot drift. */
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
    products = [];
    categories = [];
  }

  // Orange County hampers (and other catalog fallbacks) may not be in API yet.
  // Prefer live API prices — catalog JSON can be stale for shared slugs.
  for (const slug of homeCategoryOrder) {
    products = mergeProductsPreferExisting(products, getCatalogProductsByCategory(slug));
  }
  if (!categories.some((c) => c.slug === "rakhi-hampers")) {
    const now = new Date().toISOString();
    categories = [
      ...categories,
      {
        name: "Rakhi Hamper",
        slug: "rakhi-hampers",
        description: "Premium Rakhi gift hampers for USA delivery.",
        published: true,
        sortOrder: 15,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // Home-page-only display labels under category product sections.
  // Does not change category names, URLs, slugs, nav, or SEO elsewhere.
  const homeCategoryDisplayNames: Record<(typeof homeCategoryOrder)[number], string> = {
    "single-rakhi": "Single Rakhi To USA",
    "rakhi-combo": "Rakhi Combo To USA",
    "rakhi-hampers": "Rakhi Hamper To USA",
    "bhaiya-bhabhi-rakhi": "Bhaiya Bhabhi Rakhi To USA",
    "kids-rakhi": "Kids Rakhi To USA",
    "lumba-rakhi": "Lumba Rakhi To USA",
  };

  // Home-only curated lists + order (does not change category/shop/search pages).
  const productsByCategory = homeCategoryOrder.map((slug) => ({
    slug,
    name: homeCategoryDisplayNames[slug],
    products: pickHomeCategoryProducts(products, slug),
  }));
  const googleReviews = await getGoogleReviews();
  const flashCombo = isFlashComboSaleActive()
    ? products.find((p) => p.slug === FLASH_COMBO_SALE_SLUG && p.published !== false) ??
      getCatalogProduct(FLASH_COMBO_SALE_SLUG) ??
      null
    : null;

  return (
    <div>
      <JsonLd data={[faqJsonLd(faqs), howToSendRakhiJsonLd()]} />
      <HomeHero banners={getHomeBanners()} />
      <FlashSaleSection product={flashCombo} />
      <TrustStrip />
      <IndiaBuyerBanner />

      <FastSellingSection products={products} />

      {productsByCategory.map((section) =>
        section.products.length > 0 ? (
          <section key={section.slug} className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-primary capitalize">{section.name}</h2>
              <Link href={categoryHref(section.slug)} className="text-nav font-semibold text-sm hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
              {section.products.map((p) => (
                <HomeProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {products.length === 0 && (
        <p className="text-center text-slate-500 py-12">
          Products could not be loaded. Confirm Amplify env var{" "}
          <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> is set and redeploy.
        </p>
      )}

      <section className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
          Send Rakhi to USA — Free Shipping | Premium Online Rakhi Delivery
        </h1>
        <p className="text-slate-600 leading-relaxed mb-4">
          {applyInlineLinks(
            `${site.name} helps sisters in India, UK, Canada, Australia, and worldwide send rakhi to USA with reliable rakhi delivery USA across all 50 states. Shop 140+ designer rakhis — Single Rakhi, Combos with chocolates, rakhi gift hamper boxes with sweets and dry fruits, Kids Rakhi, Bhaiya Bhabhi sets, and Lumba Rakhi — delivered in 5–7 business days with roli chawal included. Order rakhi to USA from India in minutes at our online rakhi store USA.`,
            homepageInlineLinks
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/raksha-bandhan" className="text-nav font-semibold hover:underline">
            Raksha Bandhan 2026 →
          </Link>
          <Link href="/send-rakhi-from-india" className="text-nav font-semibold hover:underline">
            Order from India (INR/UPI) →
          </Link>
          <Link href="/blog/send-rakhi-to-usa-from-india" className="text-nav font-semibold hover:underline">
            Send from India guide →
          </Link>
          <Link href={categoryHref("rakhi-hampers")} className="text-nav font-semibold hover:underline">
            Rakhi Hampers →
          </Link>
          <Link href="/shipping" className="text-nav font-semibold hover:underline">
            Shipping info →
          </Link>
        </div>
      </section>

      <HomeRakshaBandhan2026Section />

      <WhyTrustUsSection />

      <GoogleReviews data={googleReviews} />

      <HomeSeoSection />

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-primary text-center mb-2">More Questions?</h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          Quick answers below — or{" "}
          <Link href="/faq" className="text-nav hover:underline">
            read our full FAQ page
          </Link>
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {faqs.slice(0, 6).map((f) => (
            <details key={f.q} className="border border-slate-200 rounded-xl p-5 bg-white">
              <summary className="font-semibold text-primary cursor-pointer text-sm">{f.q}</summary>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
