import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityContentSection } from "@/components/CityContentSection";
import { JsonLd } from "@/components/JsonLd";
import { cityNavHref, site, usCityLinks } from "@/lib/site";
import { getCityContent } from "@/lib/content/city-pages";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { shuffleForCity } from "@/lib/city-products";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceAreaJsonLd } from "@/lib/seo";
import type { Product } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Same as homepage / location pages: always load the full live catalog. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return usCityLinks.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = usCityLinks.find((c) => c.slug === slug);
  const content = getCityContent(slug);
  if (!city) return { title: "City" };
  return pageMetadata({
    title: `Send Rakhi to ${city.label} USA | Fast Delivery`,
    description:
      content?.metaExtra ??
      `Send Rakhi to ${city.label}, USA with ${site.name}. Premium rakhis, 5–7 day delivery, roli chawal included. Order from India worldwide.`,
    path: `/send-rakhi-to-${slug}`,
    keywords: `send rakhi to ${city.label}, rakhi delivery ${city.label}, rakhi USA ${city.label}, online rakhi ${city.label}, raksha bandhan ${city.label}, BlossomPot`,
  });
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = usCityLinks.find((c) => c.slug === slug);
  const content = getCityContent(slug);
  if (!city || !content) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const cityProducts = shuffleForCity(products, slug);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: `Rakhi to ${city.label}` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? `/send-rakhi-to-${slug}` }))),
          faqJsonLd(content.faqs),
          serviceAreaJsonLd({ label: city.label, slug, state: content.state }),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-2">Send Rakhi to {city.label}, USA</h1>
      <p className="text-slate-600 mb-8 max-w-3xl">
        Premium Rakhi delivery to {city.label} in 5–7 business days. Order from India, UK, Canada, or
        anywhere — we ship domestically within America.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cityProducts.map((p) => (
          <HomeProductCard key={p.slug} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-slate-500 mt-4">
          No products yet.{" "}
          <Link href="/products" className="text-nav hover:underline">
            Browse all Rakhis
          </Link>
        </p>
      )}

      <CityContentSection content={content} />

      <section className="mt-12 p-6 bg-slate-50 rounded-xl text-sm text-slate-600">
        <h2 className="font-semibold text-primary mb-2">Also deliver Rakhi to</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {usCityLinks
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <Link key={c.slug} href={cityNavHref(c)} className="text-nav hover:underline">
                {c.label}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
