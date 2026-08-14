import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnswerBlock } from "@/components/AnswerBlock";
import {
  allOccasionSlugs,
  getOccasion,
  occasionCategoryHref,
  type OccasionPage,
} from "@/lib/content/occasions";
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
  return allOccasionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const occasion = getOccasion(slug);
  if (!occasion) {
    return { title: "Occasion Gifts", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: occasion.title,
    description: occasion.intro.slice(0, 155),
    path: `/occasions/${slug}`,
    absoluteTitle: true,
  });
}

function filterOccasionProducts(products: Product[], occasion: OccasionPage): Product[] {
  const tokens = [occasion.slug, ...occasion.matchTokens, occasion.primaryKeyword].map((t) =>
    t.toLowerCase()
  );
  const matched = products.filter((p) => {
    if (p.published === false) return false;
    if (p.categorySlug === occasion.categorySlug) return true;
    if (p.additionalCategorySlugs?.includes(occasion.categorySlug)) return true;
    const hay = `${p.name} ${(p.tags ?? []).join(" ")} ${p.categorySlug}`.toLowerCase();
    return tokens.some((t) => t.length > 2 && hay.includes(t));
  });
  return matched.slice(0, 24);
}

export default async function OccasionSlugPage({ params }: Props) {
  const { slug } = await params;
  const occasion = getOccasion(slug);
  if (!occasion) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const filtered = filterOccasionProducts(products, occasion);
  const categoryHref = occasionCategoryHref(occasion);
  const path = `/occasions/${slug}`;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Occasions", href: "/occasions" },
    { label: occasion.h1 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path }))),
          faqJsonLd(occasion.faqs),
          itemListJsonLd(
            occasion.h1,
            filtered.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">{occasion.h1}</h1>
      <p className="text-slate-600 mb-6 max-w-3xl leading-relaxed">{occasion.intro}</p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <HomeProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-slate-600 mb-6">
          Products for this occasion are being updated.{" "}
          <Link href={categoryHref} className="text-nav font-semibold hover:underline">
            Browse related gifts →
          </Link>
        </p>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Looking for more? Visit our{" "}
        <Link href={categoryHref} className="text-nav hover:underline">
          related collection
        </Link>{" "}
        or{" "}
        <Link href="/products" className="text-nav hover:underline">
          shop all gifts
        </Link>
        .
      </p>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-primary mb-3">Etiquette &amp; gifting tips</h2>
        <p className="text-slate-700 leading-relaxed">{occasion.etiquette}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-primary mb-4">Frequently asked questions</h2>
        <div className="space-y-4 max-w-3xl">
          {occasion.faqs.map((f) => (
            <AnswerBlock key={f.q} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Questions about delivery? Contact {site.name} at{" "}
        <a href={`mailto:${site.supportEmail}`} className="text-nav hover:underline">
          {site.supportEmail}
        </a>
        .
      </p>
    </div>
  );
}
