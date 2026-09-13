import Link from "next/link";
import { exploreMoreLinksForProduct } from "@/lib/explore-more-links";

/**
 * FNP-style multi-column Explore More links for product pages.
 * Location links rotate deterministically by product slug from the nationwide geo SoT.
 */
export function ExploreMoreSection({
  productSlug,
  categorySlug,
  occasion,
}: {
  productSlug?: string;
  categorySlug?: string;
  occasion?: string;
}) {
  const links = exploreMoreLinksForProduct(productSlug, categorySlug, occasion);
  return (
    <nav
      className="mt-10 pt-8 border-t border-line"
      aria-labelledby="explore-more-heading"
    >
      <h2 id="explore-more-heading" className="text-lg sm:text-xl font-bold text-ink mb-2">
        Explore More
      </h2>
      <p className="text-sm text-muted mb-6 max-w-3xl">
        Browse a few closely related pages for this product, including relevant collections, delivery help,
        and location coverage.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="block rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
