import Link from "next/link";
import { EXPLORE_MORE_GROUPS } from "@/lib/explore-more-links";

/**
 * FNP-style multi-column Explore More links for product pages.
 * Crawlable semantic nav — strengthens internal linking for cities, types, and collections.
 */
export function ExploreMoreSection() {
  return (
    <nav
      className="mt-10 pt-8 border-t border-slate-200"
      aria-labelledby="explore-more-heading"
    >
      <h2 id="explore-more-heading" className="text-lg sm:text-xl font-bold text-primary mb-2">
        Explore More
      </h2>
      <p className="text-sm text-slate-600 mb-6 max-w-3xl">
        Browse gifts by city, category, and occasion — fast links to help you find the right flowers, cakes, and hampers for USA delivery.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {EXPLORE_MORE_GROUPS.map((group) => (
          <section key={group.heading} aria-labelledby={`explore-${slugify(group.heading)}`}>
            <h3
              id={`explore-${slugify(group.heading)}`}
              className="text-sm font-bold uppercase tracking-wide text-primary mb-3"
            >
              {group.heading}
            </h3>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={`${group.heading}-${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-700 hover:text-nav hover:underline underline-offset-2 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
