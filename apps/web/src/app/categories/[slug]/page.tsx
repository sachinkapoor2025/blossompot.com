import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryContentSection } from "@/components/CategoryContentSection";
import { CountrySeoArticle } from "@/components/CountrySeoArticle";
import { JsonLd } from "@/components/JsonLd";
import { getCategoryContent } from "@/lib/content/category-content";
import { resolveCategoryPageSeo } from "@/lib/content/category-country-seo";
import { getCategoryRichContent } from "@/lib/content/category-rich-content";
import { categoryHref } from "@/lib/category-urls";
import {
  countryDisplayName,
  giftsCatalogLocationHref,
  parseLocationShopPath,
} from "@/lib/location-seo-urls";
import { requestSeoPath } from "@/lib/request-seo-path";
import { ListingPageSkeleton } from "@/components/route-skeletons";
import { loadProductsByCategory, toListingCardProducts } from "@/lib/product-loader";
import { getCatalogProductsByCategory } from "@/lib/catalog-fallback";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";
import { categoryOrder } from "@/lib/site";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { type Product, type Category, productVisibleForDeliveryCountry } from "@blossompot/shared";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; country?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

function isKnownCategorySlug(slug: string): boolean {
  return (categoryOrder as readonly string[]).includes(slug) || slug === "rakhi-hampers";
}

/** Match PDP: always use live product prices (no stale ISR listing HTML). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = await requestSeoPath(categoryHref(slug));
  await notFoundIfShoppingCountryDisabled(path);
  const seo = resolveCategoryPageSeo(slug, path);
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path,
    absoluteTitle: true,
  });
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}

async function CategoryPageContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const sort = resolveSort(query.sort);
  const seoPath = await requestSeoPath(categoryHref(slug));
  await notFoundIfShoppingCountryDisabled(seoPath);
  if (!isKnownCategorySlug(slug)) notFound();
  const deliveryCountry = await getStorefrontDeliveryCountry(query.country);

  let category: Category | null = null;
  let products: Product[] = [];

  try {
    const [catData, categoryProducts] = await Promise.all([
      api<{ category: Category }>(`/categories/${slug}`, { revalidate: 45 }),
      loadProductsByCategory(slug, deliveryCountry),
    ]);
    category = catData.category;
    products = categoryProducts;
  } catch {
    products = await loadProductsByCategory(slug, deliveryCountry);
  }
  if (products.length === 0) {
    products = getCatalogProductsByCategory(slug).filter((product) =>
      productVisibleForDeliveryCountry(product, deliveryCountry)
    );
  }

  const name = category?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const headingName: Record<string, string> = {
    flowers: "Flowers",
    "flower-bouquets": "Flower Bouquets",
    cakes: "Cakes",
    "gift-hampers": "Gift Hampers",
    "birthday-gifts": "Birthday Gifts",
    "anniversary-gifts": "Anniversary Gifts",
    "valentines-day-gifts": "Valentine's Day Gifts",
  };
  const seoCategoryName = headingName[slug] ?? name;
  const located = parseLocationShopPath(seoPath);
  const pageSeo = resolveCategoryPageSeo(slug, seoPath);
  const deliveryCountryName = countryDisplayName(deliveryCountry);
  const h1 = pageSeo.h1;
  const baseDescription =
    category?.description?.trim() ||
    `Browse the ${name} collection on BlossomPot. Choose a product and check delivery availability for the recipient’s address at checkout.`;
  const extra = getCategoryContent(slug);
  const rich = getCategoryRichContent(slug);
  const shopHref = located ? giftsCatalogLocationHref(deliveryCountry) : "/products";

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: shopHref },
    { label: name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? categoryHref(slug) }))),
          itemListJsonLd(
            `${name} — BlossomPot`,
            products.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
          ),
          ...(pageSeo.article ? [faqJsonLd(pageSeo.article.faqs)] : rich ? [faqJsonLd(rich.faqs)] : []),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-8">{h1}</h1>

      {products.length > 0 ? (
        <ProductGrid products={toListingCardProducts(products)} sort={sort} />
      ) : (
        <p className="text-slate-500">
          No gifts in this collection for {deliveryCountryName} yet.{" "}
          <Link href={shopHref} className="text-nav hover:underline">
            Browse all gifts
          </Link>
        </p>
      )}

      {pageSeo.article ? (
        <CountrySeoArticle article={pageSeo.article} omitHeading />
      ) : rich ? (
        <CategoryContentSection
          content={rich}
          categoryName={seoCategoryName}
          deliveryCountryIso={deliveryCountry}
        />
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
            <h2 className="font-semibold text-primary mb-3">How to order {seoCategoryName} from BlossomPot</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Choose a product from this collection
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Enter the recipient’s address at checkout
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Review the dates and charges shown for that order
              </li>
              <li className="flex gap-2">
                <span className="text-nav shrink-0">✓</span>
                Add a message when the product allows it
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
