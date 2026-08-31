import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryContentSection } from "@/components/CategoryContentSection";
import { JsonLd } from "@/components/JsonLd";
import { getCategoryContent } from "@/lib/content/category-content";
import { getCategoryPageSeo } from "@/lib/content/category-seo";
import { getCategoryRichContent } from "@/lib/content/category-rich-content";
import { categoryHref } from "@/lib/category-urls";
import { loadProductsByCategory } from "@/lib/product-loader";
import { categoryOrder } from "@/lib/site";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { type Product, type Category } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

function isKnownCategorySlug(slug: string): boolean {
  return (categoryOrder as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return categoryOrder.map((slug) => ({ slug }));
}

/** Match PDP: always use live product prices (no stale ISR listing HTML). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = getCategoryPageSeo(slug);
  const path = categoryHref(slug);

  if (seo) {
    return pageMetadata({
      title: seo.title,
      description: seo.description,
      path,
      absoluteTitle: true,
    });
  }

  try {
    const data = await api<{ category: Category }>(`/categories/${slug}`, { revalidate: 3600 });
    const c = data.category;
    return pageMetadata({
      title: `${c.name} | USA Delivery | BlossomPot`,
      description:
        c.seoDescription ??
        c.description?.slice(0, 160) ??
        `Shop ${c.name} with fast USA delivery from BlossomPot — flowers, cakes, and thoughtful gifts.`,
      path,
    });
  } catch {
    const label = slug.replace(/-/g, " ");
    return pageMetadata({
      title: `${label} | BlossomPot`,
      description: `Shop ${label} with USA delivery from BlossomPot.`,
      path,
    });
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sort = resolveSort((await searchParams).sort);

  if (!isKnownCategorySlug(slug)) notFound();

  let category: Category | null = null;
  let products: Product[] = [];

  try {
    const [catData, categoryProducts] = await Promise.all([
      api<{ category: Category }>(`/categories/${slug}`, { revalidate: false }),
      loadProductsByCategory(slug),
    ]);
    category = catData.category;
    products = categoryProducts;
  } catch {
    products = await loadProductsByCategory(slug);
  }

  const name = category?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const headingName: Record<string, string> = {
    flowers: "Flowers",
    "flower-bouquets": "Flower Bouquets",
    cakes: "Cakes",
    "gift-hampers": "Gift Hampers",
    "birthday-gifts": "Birthday Gifts",
    "anniversary-gifts": "Anniversary Gifts",
    "same-day-gifts": "Same-Day Gifts",
    "valentines-day-gifts": "Valentine's Day Gifts",
  };
  const seoCategoryName = headingName[slug] ?? name;
  const pageSeo = getCategoryPageSeo(slug);
  const h1 = pageSeo?.h1 ?? `${name} — USA Delivery`;
  const baseDescription =
    category?.description?.trim() ||
    `Browse our ${name} collection — flowers, cakes, and thoughtful gifts with USA delivery from BlossomPot.`;
  const extra = getCategoryContent(slug);
  const rich = getCategoryRichContent(slug);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? categoryHref(slug) }))),
          itemListJsonLd(
            `${name} — BlossomPot USA`,
            products.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
          ...(rich ? [faqJsonLd(rich.faqs)] : []),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-8">{h1}</h1>

      {products.length > 0 ? (
        <ProductGrid products={products} sort={sort} />
      ) : (
        <p className="text-slate-500">
          Products loading soon.{" "}
          <Link href="/products" className="text-nav hover:underline">
            Browse all gifts
          </Link>
        </p>
      )}

      {rich ? (
        <CategoryContentSection content={rich} categoryName={seoCategoryName} />
      ) : (
        <>
          <section className="mt-12 pt-10 border-t border-slate-200">
            <div className="grid lg:grid-cols-2 gap-x-12 gap-y-6 text-slate-700 leading-relaxed">
              <div className="space-y-4">
                {baseDescription.split(/(?<=\.)\s+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                {extra?.extraParagraphs.map((para, i) => (
                  <p key={`extra-${i}`}>{para}</p>
                ))}
              </div>
              {extra?.sections && extra.sections.length > 0 && (
                <div className="space-y-6">
                  {extra.sections.map((section) => (
                    <div key={section.heading}>
                      <h2 className="text-lg font-bold text-primary mb-3">{section.heading}</h2>
                      <ul className="space-y-2 text-sm">
                        {section.paragraphs.map((item, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-nav mt-1 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-10 p-6 bg-slate-50 rounded-xl">
            <h2 className="font-semibold text-primary mb-3">Why order {seoCategoryName} from BlossomPot?</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Nationwide USA delivery with clear shipping windows
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Order from the USA or abroad — we deliver to US addresses
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Gift messages available on most products
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Secure checkout with Razorpay and Stripe
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
