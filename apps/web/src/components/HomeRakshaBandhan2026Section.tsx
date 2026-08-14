import Link from "next/link";

/** Soft stub — festival promo section retired for BlossomPot gifting. */
export function HomeRakshaBandhan2026Section() {
  return (
    <section className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 text-center space-y-3">
        <h2 className="text-2xl font-bold">Celebrate with flowers, cakes & gifts</h2>
        <p className="text-white/90">Premium USA delivery for every occasion.</p>
        <Link href="/flowers" className="inline-flex rounded-full bg-white text-primary font-semibold text-sm px-5 py-2.5">
          Shop Flowers
        </Link>
      </div>
    </section>
  );
}
