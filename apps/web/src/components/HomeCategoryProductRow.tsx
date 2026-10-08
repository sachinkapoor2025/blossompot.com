import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import { loadProductsByCategory, toListingCardProducts } from "@/lib/product-loader";
import { getCatalogProductsByCategory } from "@/lib/catalog-fallback";
import { productVisibleForDeliveryCountry, type Product } from "@blossompot/shared";
import { HomeCategoryProductScroller } from "@/components/HomeCategoryProductScroller";
import { isRakhiRelatedProduct } from "@/lib/rakhi-filter";

export const HOME_PRODUCT_ROW_LIMIT = 8;

export const HOME_PRODUCT_SECTIONS = [
  { slug: "flowers", title: "Flowers" },
  { slug: "flower-bouquets", title: "Bouquets" },
  { slug: "cakes", title: "Cakes" },
  { slug: "gift-hampers", title: "Gift Hampers" },
] as const;

const CARD_WIDTH = "w-[10.75rem] sm:w-[13rem] lg:w-[15rem]";

function productsForHomeSection(slug: string, products: Product[]): Product[] {
  const withoutRakhi = products.filter(
    (product) => product.categorySlug !== "rakhi-hampers" && !isRakhiRelatedProduct(product)
  );
  if (slug === "gift-hampers") {
    return withoutRakhi.filter((product) => product.categorySlug === "gift-hampers");
  }
  return withoutRakhi;
}

export function HomeCategoryProductRowFallback({ title }: { title: string }) {
  return (
    <section aria-busy="true" aria-label={`Loading ${title}`} className="animate-pulse">
      <div className="mb-4 h-8 w-40 max-w-full rounded bg-[#eadfd8]/80" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`shrink-0 ${CARD_WIDTH}`}>
            <div className="aspect-square rounded-xl bg-white ring-1 ring-[#eadfd8]" />
            <div className="mt-3 h-4 w-3/4 rounded bg-[#eadfd8]/80" />
            <div className="mt-2 h-4 w-1/2 rounded bg-[#eadfd8]/70" />
            <div className="mt-3 h-9 rounded-full bg-[#eadfd8]/80" />
          </div>
        ))}
      </div>
    </section>
  );
}

export async function HomeCategoryProductRow({
  slug,
  title,
  country,
}: {
  slug: string;
  title: string;
  country: string;
}) {
  const headingId = `home-category-${slug}`;
  const showMoreHref = categoryHref(slug);
  let error = "";
  let products: Awaited<ReturnType<typeof loadProductsByCategory>> = [];

  try {
    products = await loadProductsByCategory(slug, country);
  } catch (err) {
    error = err instanceof Error ? err.message : "This category is temporarily unavailable.";
  }
  if (products.length === 0 && !error) {
    products = getCatalogProductsByCategory(slug).filter((product) =>
      productVisibleForDeliveryCountry(product, country)
    );
  }
  products = productsForHomeSection(slug, products);

  const cards = toListingCardProducts(products.slice(0, HOME_PRODUCT_ROW_LIMIT));

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-2xl font-bold text-primary">
        {title}
      </h2>
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}{" "}
          <Link href={showMoreHref} className="font-semibold text-nav hover:underline">
            Show more
          </Link>
        </p>
      ) : cards.length === 0 ? (
        <p className="text-sm text-slate-600">
          No gifts in this category for this delivery country.{" "}
          <Link href={showMoreHref} className="font-semibold text-nav hover:underline">
            Show more
          </Link>
        </p>
      ) : (
        <HomeCategoryProductScroller title={title} products={cards} showMoreHref={showMoreHref} />
      )}
    </section>
  );
}
