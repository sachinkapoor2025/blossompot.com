import Link from "next/link";
import { HUB_HERO } from "@/lib/content/flower-guide/images";

export function HomeFlowerGuideCta() {
  return (
    <section className="store-wrap py-12">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HUB_HERO.src}
              alt={HUB_HERO.alt}
              width={HUB_HERO.width}
              height={HUB_HERO.height}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="p-8 sm:p-10">
            <p className="type-support uppercase tracking-[0.2em] text-nav font-semibold">Discover the world of flowers</p>
            <h2 className="type-section font-display text-ink mt-2">Flower Knowledge Centre</h2>
            <p className="type-body mt-3 text-muted leading-relaxed">
              Not sure which flowers to choose? Explore our flower guides to discover meanings, colours,
              seasons, care tips and the best flowers for every occasion.
            </p>
            <Link href="/flower-guide" className="btn-nav mt-6 inline-flex">
              Explore Flower Guide
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
