import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import { loadHomeCategoryProducts } from "@/lib/product-loader";
import { CatalogLoadError } from "@/components/CatalogLoadError";
import { HomeCategoryProductScroller } from "@/components/HomeCategoryProductScroller";
import {
  HOME_PRODUCT_ROW_LIMIT,
  productsForHomepageRow,
  toHomepageRowCards,
} from "@/lib/homepage-row";

export { HOME_PRODUCT_ROW_LIMIT };

export const HOME_PRODUCT_SECTIONS = [
  { slug: "flowers", title: "Flowers" },
  { slug: "flower-bouquets", title: "Bouquets" },
  { slug: "cakes", title: "Cakes" },
  { slug: "gift-hampers", title: "Gift Hampers" },
] as const;

const CARD_WIDTH = "w-[10.75rem] sm:w-[13rem] lg:w-[15rem]";

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
  const loaded = await loadHomeCategoryProducts(slug, country);
  const cards = toHomepageRowCards(productsForHomepageRow(slug, loaded));

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-2xl font-bold text-primary">
        {title}
      </h2>
      {loaded.state === "error" ? (
        <CatalogLoadError message="We couldn't load this category right now. Please try again." />
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
