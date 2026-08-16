import Link from "next/link";
import {
  childLocations,
  getInternationalLocation,
  internationalPath,
  isInternationalIndexable,
  MARKET_SLUGS,
} from "@/lib/content/geo/international";

/** Crawlable country / region / city selector — real <a> links, no JS-only navigation. */
export function LocationSelector({ currentSlug }: { currentSlug?: string }) {
  return (
    <nav aria-label="Browse locations" className="rounded-xl border border-primary/15 bg-petal/50 p-4 sm:p-5">
      <p className="text-sm font-semibold text-primary mb-3">Browse locations</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        {MARKET_SLUGS.map((slug) => {
          const market = getInternationalLocation(slug);
          if (!market || !isInternationalIndexable(market)) return null;
          const children = childLocations(market);
          return (
            <li key={slug}>
              <Link
                href={internationalPath(market)}
                className={`font-semibold hover:underline ${
                  currentSlug === slug ? "text-primary" : "text-nav"
                }`}
              >
                {market.label}
              </Link>
              {children.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-slate-600">
                  {children.slice(0, 8).map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={internationalPath(child)}
                        className={`hover:underline ${
                          currentSlug === child.slug ? "text-primary font-medium" : "text-nav"
                        }`}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/locations" className="text-nav hover:underline font-medium">
          All locations
        </Link>
        {" · "}
        <Link href="/delivery-locations" className="text-nav hover:underline font-medium">
          USA state &amp; city index
        </Link>
      </p>
    </nav>
  );
}
