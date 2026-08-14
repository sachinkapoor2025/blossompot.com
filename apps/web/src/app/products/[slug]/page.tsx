import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ProductDetailClient } from "./ProductDetailClient";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, productPageMetadata } from "@/lib/seo";
import { productFaqsForCategory } from "@/lib/content/product-faqs";
import { resolveImageUrl } from "@/lib/images";
import { loadProduct, loadRelatedProducts, getStaticProductSlugs } from "@/lib/product-loader";
import { api } from "@/lib/api";
import { categoryHref } from "@/lib/category-urls";
import { getCategoryPageSeo } from "@/lib/content/category-seo";
import type { Product } from "@blossompot/shared";

function categoryBreadcrumbLabel(categorySlug: string): string {
  const seo = getCategoryPageSeo(categorySlug);
  if (seo?.h1) {
    // Normalize legacy SEO title prefixes
    return seo.h1.replace(/^Send\s+/i, "").replace(/\s+to USA$/i, "").trim();
  }
  return categorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Always SSR from the live products API. Static ISR + stale-while-revalidate (~1 year)
 * was serving prerendered catalog prices ($1.50) while the API returned $14.72 — flipping
 * product:price:amount and % OFF between requests / edge caches.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep for discoverability; with force-dynamic these are not baked as static HTML. */
export async function generateStaticParams() {
  const slugs = getStaticProductSlugs();
  if (slugs.length > 0) {
    return slugs.map((slug) => ({ slug }));
  }
  try {
    const data = await api<{ products: Product[] }>("/products", { revalidate: 300 });
    return data.products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadProduct(slug);
  if (!p) return { title: "Product" };

  return productPageMetadata({
    title: p.seoTitle ?? p.name,
    seoDescription: p.seoDescription,
    description: p.description,
    path: `/products/${slug}`,
    price: p.price,
    currency: p.currency,
    ogImage: resolveImageUrl(p.images?.[0]),
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const relatedProducts = await loadRelatedProducts(product.categorySlug, product.slug);
  const faqs = productFaqsForCategory(product.categorySlug);

  const categoryLabel = categoryBreadcrumbLabel(product.categorySlug);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: categoryLabel, href: categoryHref(product.categorySlug) },
    { label: product.name },
  ];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? `/products/${slug}` }))),
          faqJsonLd(faqs),
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <ProductDetailClient product={product} relatedProducts={relatedProducts} faqs={faqs} />
    </>
  );
}
