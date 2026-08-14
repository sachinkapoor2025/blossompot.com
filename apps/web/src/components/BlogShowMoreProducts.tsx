import Image from "next/image";
import Link from "next/link";
import {
  loadBlogShowMoreProducts,
  type BlogShowMoreProduct,
} from "@/lib/blog-show-more-products";

function ShowMoreGrid({ products }: { products: BlogShowMoreProduct[] }) {
  return (
    <section
      className="mt-12 border-t border-slate-200 pt-10"
      aria-labelledby="blog-show-more-heading"
    >
      <div className="mb-6">
        <h2
          id="blog-show-more-heading"
          className="text-xl sm:text-2xl font-bold text-primary"
        >
          Show More
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Explore Rakhis from Single, Bhaiya Bhabhi, Kids, Lumba, Sets, and Hampers.
        </p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 list-none p-0 m-0">
        {products.map((product) => (
          <li key={`${product.categorySlug}-${product.slug}`} className="min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {product.categoryLabel}
                </span>
                <span className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-nav">
                  {product.name}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** FNP-style “Show More” Rakhi image grid for blog pages (2 products × 6 categories). */
export async function BlogShowMoreProducts() {
  const products = await loadBlogShowMoreProducts();
  if (products.length === 0) return null;
  return <ShowMoreGrid products={products} />;
}
