import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeProductCard } from "@/components/HomeProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import {
  allCollectionSlugs,
  getCollection,
} from "@/lib/collections";
import { loadProducts } from "@/lib/product-loader";
import { getCatalogProducts, mergeProductsPreferExisting } from "@/lib/catalog-fallback";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import type { Product } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return allCollectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection" };
  return pageMetadata({
    title: collection.title,
    description: collection.description,
    path: `/collections/${slug}`,
    keywords: `${collection.h1}, send rakhi to usa, BlossomPot`,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  let products: Product[] = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }
  products = mergeProductsPreferExisting(products, getCatalogProducts());
  const filtered = collection.filter(products).filter((p) => p.published !== false);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: collection.h1 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 overflow-x-hidden">
      <JsonLd
        data={[
          breadcrumbJsonLd(
            crumbs.map((c) => ({
              name: c.label,
              path: c.href ?? `/collections/${slug}`,
            }))
          ),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">{collection.h1}</h1>
        <p className="text-slate-600 max-w-3xl">{collection.intro}</p>
      </header>

      {filtered.length === 0 ? (
        <p className="text-slate-600 mb-8">
          Products for this collection are being updated.{" "}
          <Link href="/products" className="text-nav font-semibold hover:underline">
            Browse all gifts →
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
          {filtered.map((product) => (
            <HomeProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
