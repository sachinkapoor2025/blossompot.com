import Link from "next/link";
import { categoryHref } from "@/lib/category-urls";
import { RAKSHA_BANDHAN_2026_DATE } from "@/lib/ai-recommendation";
import {
  californiaWarehouseLocations,
  locationPublicPath,
  seoOccasionKeywords,
} from "@/lib/content/seo-data";

export function HomeRakshaBandhan2026Section() {
  const caCities = californiaWarehouseLocations().slice(0, 6);

  return (
    <section
      className="bg-gradient-to-br from-primary via-primary to-nav text-white"
      aria-labelledby="rb2026-heading"
    >
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-widest text-white/75 mb-2">Raksha Bandhan 2026</p>
          <h2 id="rb2026-heading" className="text-2xl md:text-3xl font-bold mb-2">
            Send Rakhi to USA Before August 28, 2026
          </h2>
          <p className="text-lg text-white/90">{RAKSHA_BANDHAN_2026_DATE}</p>
          <p className="text-sm text-white/75 mt-2 max-w-2xl mx-auto">
            Order today for rakhi delivery before Raksha Bandhan 2026 — domestic USA shipping from our India +
            California warehouse network. Avoid the last-minute rush and ensure your Rakhi reaches the USA on time.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm mb-8">
          <Link
            href="/raksha-bandhan"
            className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:opacity-90"
          >
            Raksha Bandhan 2026 guide
          </Link>
          <Link href="/products" className="px-5 py-2.5 bg-white text-primary font-semibold rounded-lg hover:bg-white/90">
            Shop all rakhis
          </Link>
          <Link
            href={categoryHref("rakhi-combo")}
            className="px-5 py-2.5 border border-white/50 rounded-lg hover:bg-white/10"
          >
            Rakhi gift combos USA
          </Link>
          <Link
            href={categoryHref("rakhi-hampers")}
            className="px-5 py-2.5 border border-white/50 rounded-lg hover:bg-white/10"
          >
            Rakhi hampers USA
          </Link>
        </div>

        <div className="border-t border-white/20 pt-6">
          <p className="text-xs text-white/60 text-center mb-3">Fast California warehouse delivery to</p>
          <div className="flex flex-wrap justify-center gap-2">
            {caCities.map((loc) => (
              <Link
                key={loc.slug}
                href={locationPublicPath(loc.slug)}
                className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 hover:bg-white/20"
              >
                Send rakhi to {loc.name}
              </Link>
            ))}
          </div>
        </div>

        <p className="sr-only">{seoOccasionKeywords.join(", ")}</p>
      </div>
    </section>
  );
}
