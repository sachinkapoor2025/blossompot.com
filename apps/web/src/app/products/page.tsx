import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { HomeProductCard } from "@/components/HomeProductCard";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { SearchTracker } from "@/components/SearchTracker";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { loadProducts } from "@/lib/product-loader";
import type { Product, Category } from "@blossompot/shared";
import { categoryHref } from "@/lib/category-urls";
import { homeCategoryOrder, orderCategories } from "@/lib/site";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "@/lib/rakhi-filter";

/** Match PDP: no ISR HTML with stale product prices. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ search?: string; category?: string; sort?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  flowers: {
    title: "Flowers USA — Fresh Arrangements | BlossomPot",
    description: "Shop fresh flowers and bouquets with USA delivery. Birthday, anniversary, and everyday gifts.",
  },
  "flower-bouquets": {
    title: "Flower Bouquets USA | BlossomPot",
    description: "Designer flower bouquets for USA delivery — romantic, celebratory, and thank-you styles.",
  },
  cakes: {
    title: "Celebration Cakes USA | BlossomPot",
    description: "Birthday and celebration cakes with clear USA delivery guidance from BlossomPot.",
  },
  "gift-hampers": {
    title: "Gift Hampers USA | BlossomPot",
    description: "Curated gift hampers and celebration boxes shipped across the United States.",
  },
  "birthday-gifts": {
    title: "Birthday Gifts USA | BlossomPot",
    description: "Birthday flowers, cakes, and gift combos with USA delivery options.",
  },
  "anniversary-gifts": {
    title: "Anniversary Gifts USA | BlossomPot",
    description: "Anniversary roses, bouquets, and romantic gifts for USA delivery.",
  },
  "same-day-gifts": {
    title: "Same-Day Gifts USA | BlossomPot",
    description: "Same-day eligible gifts in select ZIP codes — confirm cut-off at checkout.",
  },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  if (params.search) {
    // Search result URLs stay usable but are noindexed; canonical points at the shop hub.
    return pageMetadata({
      title: `Search: ${params.search} — Flowers & Gifts USA`,
      description: `Search results for "${params.search}" — flowers, cakes, and gifts with USA delivery from BlossomPot.`,
      path: "/products",
      noIndex: true,
    });
  }
  if (params.category && CATEGORY_SEO[params.category]) {
    const seo = CATEGORY_SEO[params.category];
    return pageMetadata({
      title: seo.title,
      description: seo.description,
      path: `/products?category=${params.category}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: "Shop Flowers, Cakes & Gifts — USA Delivery | BlossomPot",
    description:
      "Browse flowers, bouquets, cakes, and curated gift hampers. Birthday, anniversary, Valentine’s, and same-day options with clear USA delivery guidance.",
    path: "/products",
  });
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const sort = resolveSort(params.sort);

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [liveProducts, categoriesData] = await Promise.all([
      loadProducts({ search, category }),
      api<{ categories: Category[] }>("/categories", { revalidate: false }),
    ]);
    products = liveProducts.filter((p) => !isRakhiRelatedProduct(p));
    categories = categoriesData.categories.filter((c) => !isRakhiRelatedCategorySlug(c.slug));
  } catch {
    products = [];
    categories = [];
  }

  const h1 = search
    ? `Search: ${search}`
    : category
      ? categories.find((c) => c.slug === category)?.name ?? category.replace(/-/g, " ")
      : "Shop Flowers, Cakes & Gifts";

  const sortedCategories = orderCategories(categories);
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const productsByCategory = homeCategoryOrder.map((slug) => ({
    slug,
    name: categoryMap.get(slug)?.name ?? slug.replace(/-/g, " "),
    products: products.filter((p) => p.categorySlug === slug),
  }));
  const showGrouped = !search && !category;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {search ? <SearchTracker query={search} resultCount={products.length} /> : null}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category ? [{ label: h1 }] : [{ label: "Shop" }]),
        ]}
      />
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-primary">{h1}</h1>
      </div>
      {!search && !category && (
        <p className="text-slate-600 mb-8 max-w-2xl">
          Flowers, bouquets, cakes, and curated gifts for birthdays, anniversaries, and everyday thank-yous —
          with clear USA delivery expectations. Enter the recipient address at checkout to see available
          windows.
        </p>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/products"
            className={`px-3 py-1 rounded-full text-sm border ${!category ? "bg-nav text-white border-nav" : "border-slate-300 hover:border-nav"}`}
          >
            All
          </Link>
          {sortedCategories.map((c) => (
            <Link
              key={c.slug}
              href={categoryHref(c.slug)}
              className={`px-3 py-1 rounded-full text-sm border ${category === c.slug ? "bg-nav text-white border-nav" : "border-slate-300 hover:border-nav"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-slate-600">No products found. Try another category or search term.</p>
      ) : showGrouped ? (
        <div className="space-y-10">
          {productsByCategory.map((section) =>
            section.products.length > 0 ? (
              <section key={section.slug}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary capitalize">{section.name}</h2>
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
        </div>
      ) : (
        <ProductGrid products={products} sort={sort} />
      )}
    </div>
  );
}
