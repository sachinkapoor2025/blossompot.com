import type { Metadata } from "next";
import { api } from "@/lib/api";
import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, LocationFilteredProducts } from "@/components/LocationFilteredProducts";
import { ShopLocationLink } from "@/components/ShopLocationLink";
import { ProductGrid } from "@/components/ProductGrid";
import type { ProductSort } from "@/components/ProductSortBar";
import { SearchTracker } from "@/components/SearchTracker";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/seo";
import { requestSeoPath } from "@/lib/request-seo-path";
import { loadProducts } from "@/lib/product-loader";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";
import { groupStorefrontProductsOnce, type Product, type Category } from "@blossompot/shared";
import { categoryHref } from "@/lib/category-urls";
import { localizeShopCopy, localizeShopText, locationShopHeading } from "@/lib/location-seo-urls";
import { homeCategoryOrder, orderCategories } from "@/lib/site";
import { isRakhiRelatedCategorySlug, isRakhiRelatedProduct } from "@/lib/rakhi-filter";

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

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  flowers: {
    title: "Flowers Worldwide — Fresh Arrangements | BlossomPot",
    description: "Shop fresh flowers and bouquets with worldwide delivery. Birthday, anniversary, and everyday gifts.",
  },
  "flower-bouquets": {
    title: "Flower Bouquets Worldwide | BlossomPot",
    description: "Designer flower bouquets for worldwide delivery — romantic, celebratory, and thank-you styles.",
  },
  cakes: {
    title: "Celebration Cakes Worldwide | BlossomPot",
    description: "Birthday and celebration cakes with clear worldwide delivery guidance from BlossomPot.",
  },
  "gift-hampers": {
    title: "Gift Hampers Worldwide | BlossomPot",
    description: "Curated gift hampers and celebration boxes shipped worldwide.",
  },
  "birthday-gifts": {
    title: "Birthday Gifts Worldwide | BlossomPot",
    description: "Birthday flowers, cakes, and gift combos with worldwide delivery options.",
  },
  "anniversary-gifts": {
    title: "Anniversary Gifts Worldwide | BlossomPot",
    description: "Anniversary roses, bouquets, and romantic gifts for worldwide delivery.",
  },
  "same-day-gifts": {
    title: "Same-Day Gifts | Select Cities | BlossomPot",
    description: "Same-day eligible gifts in select ZIP codes — confirm cut-off at checkout.",
  },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const seoPath = await requestSeoPath("/products");
  if (params.search) {
    // Search result URLs stay usable but are noindexed; canonical points at the shop hub.
    const copy = localizeShopCopy(seoPath, {
      title: `Search: ${params.search} — Flowers & Gifts Worldwide`,
      description: `Search results for "${params.search}" — flowers, cakes, and gifts with worldwide delivery from BlossomPot.`,
    });
    return pageMetadata({
      title: copy.title,
      description: copy.description,
      path: seoPath,
      noIndex: true,
    });
  }
  if (params.category && CATEGORY_SEO[params.category]) {
    const seo = localizeShopCopy(seoPath, CATEGORY_SEO[params.category]);
    return pageMetadata({
      title: seo.title,
      description: seo.description,
      path: `/products?category=${params.category}`,
      noIndex: true,
    });
  }
  const shopSeo = localizeShopCopy(seoPath, {
    title: "Shop Flowers, Cakes & Gifts — Worldwide Delivery | BlossomPot",
    description:
      "Browse flowers, bouquets, cakes, and curated gift hampers. Birthday, anniversary, Valentine’s, and same-day options with clear worldwide delivery guidance.",
  });
  return pageMetadata({
    title: shopSeo.title,
    description: shopSeo.description,
    path: seoPath,
  });
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const sort = resolveSort(params.sort);
  const deliveryCountry = await getStorefrontDeliveryCountry(params.country);

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [liveProducts, categoriesData] = await Promise.all([
      loadProducts({ search, category, country: deliveryCountry }),
      api<{ categories: Category[] }>("/categories", { revalidate: false }),
    ]);
    products = liveProducts.filter((p) => !isRakhiRelatedProduct(p));
    categories = categoriesData.categories.filter((c) => !isRakhiRelatedCategorySlug(c.slug));
  } catch {
    products = [];
    categories = [];
  }

  const seoPath = await requestSeoPath("/products");
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
    products: grouped.get(slug) ?? [],
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
          {localizeShopText(
            seoPath,
            "Flowers, bouquets, cakes, and curated gifts for birthdays, anniversaries, and everyday thank-yous — with clear worldwide delivery expectations. Enter the recipient address at checkout to see available windows."
          )}
        </p>
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
        <p className="text-slate-600">No products found. Try another category or search term.</p>
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
                <LocationFilteredProducts products={section.products}>
                  {({ products: visible, emptyBecauseLocation }) =>
                    emptyBecauseLocation ? (
                      <LocationEmptyHint />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                        {visible.map((p) => (
                          <HomeProductCard key={p.slug} product={p} />
                        ))}
                      </div>
                    )
                  }
                </LocationFilteredProducts>
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
