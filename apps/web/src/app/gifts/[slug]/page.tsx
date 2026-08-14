import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import {
  allGiftGuideSlugs,
  getGiftGuide,
  giftGuideCategoryHref,
  type GiftGuidePage as GiftGuideConfig,
  type RecipientGiftPage,
} from "@/lib/content/recipients";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { loadProducts } from "@/lib/product-loader";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import type { Product } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return allGiftGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getGiftGuide(slug);
  if (!page) {
    return { title: "Gift Ideas", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: page.title,
    description: page.intro.slice(0, 155),
    path: `/gifts/${slug}`,
    absoluteTitle: true,
  });
}

function filterGiftProducts(products: Product[], page: GiftGuideConfig): Product[] {
  const published = products.filter((p) => p.published !== false);

  if (page.kind === "price") {
    return published.filter((p) => p.price <= page.maxPrice).slice(0, 30);
  }

  const recipient = page as RecipientGiftPage;
  const tokens = [recipient.slug, ...recipient.matchTokens].map((t) => t.toLowerCase());
  const matched = published.filter((p) => {
    if (p.categorySlug === recipient.categorySlug) return true;
    if (p.additionalCategorySlugs?.includes(recipient.categorySlug)) return true;
    const hay = `${p.name} ${(p.tags ?? []).join(" ")} ${p.categorySlug}`.toLowerCase();
    return tokens.some((t) => t.length > 2 && hay.includes(t));
  });
  return (matched.length > 0 ? matched : published).slice(0, 24);
}

export default async function GiftSlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getGiftGuide(slug);
  if (!page) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const filtered = filterGiftProducts(products, page);
  const categoryHref = giftGuideCategoryHref(page);
  const path = `/gifts/${slug}`;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Gifts", href: "/products" },
    { label: page.h1 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(page.faqs),
          itemListJsonLd(
            page.h1,
            filtered.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{page.h1}</h1>
      <p className="text-slate-600 mb-6 max-w-3xl leading-relaxed">{page.intro}</p>

      {page.kind === "price" && (
        <p className="text-sm text-slate-500 mb-4">
          Showing published gifts priced at or under ${page.maxPrice}. Prices are product prices before
          shipping.
        </p>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <HomeProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-slate-600 mb-6">
          No matching gifts right now.{" "}
          <Link href={categoryHref} className="text-nav font-semibold hover:underline">
            Browse related collection →
          </Link>
        </p>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Explore more in our{" "}
        <Link href={categoryHref} className="text-nav hover:underline">
          related collection
        </Link>{" "}
        or{" "}
        <Link href="/products" className="text-nav hover:underline">
          shop all gifts
        </Link>
        .
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-primary mb-4">Frequently asked questions</h2>
        <div className="space-y-4 max-w-3xl">
          {page.faqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Need help choosing? Email{" "}
        <a href={`mailto:${site.supportEmail}`} className="text-nav hover:underline">
          {site.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
