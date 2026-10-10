import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { GroupedProductCards } from "@/components/LocationFilteredProducts";
import { ShopLocationLink } from "@/components/ShopLocationLink";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { SearchTracker } from "@/components/SearchTracker";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { catalogShopSeo, resolveCategoryPageSeo } from "@/lib/content/category-country-seo";
import { pageMetadata } from "@/lib/seo";
import { requestSeoPath } from "@/lib/request-seo-path";
import { loadProducts, toListingCardProducts } from "@/lib/product-loader";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";
import { groupStorefrontProductsOnce, noProductsForDeliveryCountryMessage, type Product, type Category } from "@blossompot/shared";
import { categoryHref } from "@/lib/category-urls";
import { locationShopHeading } from "@/lib/location-seo-urls";
import { homeCategoryOrder, orderCategories } from "@/lib/site";
import { ListingPageSkeleton } from "@/components/route-skeletons";
import { isRakhiRelatedProduct, productsNotShownInSections, storefrontSkipsRakhiCategory } from "@/lib/rakhi-filter";

/** Match PDP: no ISR HTML with stale product prices. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ search?: string; category?: string; sort?: string; country?: string }>;
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name-asc", "name-desc"];

function resolveSort(raw?: string): ProductSort {
  return SORT_VALUES.includes(raw as ProductSort) ? (raw as ProductSort) : "featured";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const seoPath = await requestSeoPath("/products");
  await notFoundIfShoppingCountryDisabled(seoPath);
  const shopSeo = catalogShopSeo(seoPath);
  if (params.search) {
    return pageMetadata({
      title: `Search: ${params.search} | BlossomPot`,
      description: `Search results for "${params.search}". ${shopSeo.description}`,
      path: seoPath,
      noIndex: true,
      absoluteTitle: true,
    });
  }
  if (params.category) {
    const categorySeo = resolveCategoryPageSeo(params.category, "/products");
    return pageMetadata({
      title: categorySeo.title,
      description: categorySeo.description,
      path: `/products?category=${params.category}`,
      noIndex: true,
      absoluteTitle: true,
    });
  }
  return pageMetadata({
    title: shopSeo.title,
    description: shopSeo.description,
    path: seoPath,
    absoluteTitle: true,
  });
}

export default function ProductsPage(props: Props) {
  return (
    <Suspense fallback={<ListingPageSkeleton width="6xl" />}>
      <ProductsPageContent {...props} />
    </Suspense>
  );
}

async function ProductsPageContent({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const sort = resolveSort(params.sort);
  const seoPath = await requestSeoPath("/products");
  await notFoundIfShoppingCountryDisabled(seoPath);
  const deliveryCountry = await getStorefrontDeliveryCountry(params.country);

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [liveProducts, categoriesData] = await Promise.all([
      loadProducts({ search, category, country: deliveryCountry }),
      api<{ categories: Category[] }>("/categories", { revalidate: 45 }),
    ]);
    products = liveProducts.filter((p) => !isRakhiRelatedProduct(p));
    categories = categoriesData.categories.filter((c) => !storefrontSkipsRakhiCategory(c.slug));
  } catch {
    products = [];
    categories = [];
  }

  const h1 = locationShopHeading(
    seoPath,
    search
      ? `Search: ${search}`
      : category
        ? categories.find((c) => c.slug === category)?.name ?? category.replace(/-/g, " ")
        : "Shop Flowers, Cakes & Gifts"
  );

  const sortedCategories = orderCategories(categories);
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const grouped = groupStorefrontProductsOnce(products, homeCategoryOrder);
  const productsByCategory = homeCategoryOrder.map((slug) => ({
    slug,
    name: categoryMap.get(slug)?.name ?? slug.replace(/-/g, " "),
    products: (grouped.get(slug) ?? []).slice(0, 8),
  }));
  const ungrouped = productsNotShownInSections(
    products,
    homeCategoryOrder.flatMap((slug) => grouped.get(slug) ?? [])
  ).slice(0, 8);
  const ungroupedTitle = ungrouped.every((product) => product.categorySlug === "rakhi-hampers")
    ? "Rakhi Hampers"
    : "More gifts";
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
        <p className="text-slate-600 mb-8 max-w-2xl">{catalogShopSeo(seoPath).intro}</p>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <ShopLocationLink
            href="/products"
            catalog
            className={`px-3 py-1 rounded-full text-sm border ${!category ? "bg-nav text-white border-nav" : "border-slate-300 hover:border-nav"}`}
          >
            All
          </ShopLocationLink>
          {sortedCategories.map((c) => (
            <ShopLocationLink
              key={c.slug}
              href={categoryHref(c.slug)}
              category={c.slug}
              className={`px-3 py-1 rounded-full text-sm border ${category === c.slug ? "bg-nav text-white border-nav" : "border-slate-300 hover:border-nav"}`}
            >
              {c.name}
            </ShopLocationLink>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-slate-600">
          {!search && deliveryCountry
            ? noProductsForDeliveryCountryMessage(deliveryCountry)
            : "No products found. Try another category or search term."}
        </p>
      ) : showGrouped ? (
        <div className="space-y-10">
          {productsByCategory.map((section) =>
            section.products.length > 0 ? (
              <section key={section.slug}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary capitalize">{section.name}</h2>
                  <ShopLocationLink href={categoryHref(section.slug)} category={section.slug} className="text-nav font-semibold text-sm hover:underline">
                    View All →
                  </ShopLocationLink>
                </div>
                <GroupedProductCards products={toListingCardProducts(section.products)} />
              </section>
            ) : null
          )}
          {ungrouped.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold text-primary mb-4">{ungroupedTitle}</h2>
              <GroupedProductCards products={toListingCardProducts(ungrouped)} />
            </section>
          ) : null}
        </div>
      ) : (
        <ProductGrid products={toListingCardProducts(products)} sort={sort} />
      )}
    </div>
  );
}
