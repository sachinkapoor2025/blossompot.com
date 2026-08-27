import Link from "next/link";
import { HUB_HERO } from "@/lib/content/flower-guide/images";

export function HomeFlowerGuideCta() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#eadfd8] bg-white shadow-sm">
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
            <p className="text-xs uppercase tracking-[0.2em] text-nav font-semibold">Flower Knowledge Centre</p>
            <h2 className="font-display text-3xl text-primary mt-2">Discover the world of flowers</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
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
