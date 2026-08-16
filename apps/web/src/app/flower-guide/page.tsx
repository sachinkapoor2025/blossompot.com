import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { FlowerSearch } from "@/components/flower-guide/FlowerSearch";
import {
  exploreCategories,
  flowerGuideNav,
  HUB_HERO,
  publicDirectoryEntries,
} from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Guide: Complete Encyclopedia of Flowers | BlossomPot",
  description:
    "BlossomPot’s Flower Knowledge Centre helps you discover flower names, meanings, colours, seasons, care tips, occasions, bouquet ideas and delivery information.",
  path: "/flower-guide",
  ogImage: HUB_HERO.src,
  absoluteTitle: true,
});

export default function FlowerGuideHubPage() {
  const published = publicDirectoryEntries();
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Flower Guide" },
  ];

  return (
    <FlowerGuideShell current="/flower-guide">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
          ]),
          itemListJsonLd(
            "Flower Guide sections",
            flowerGuideNav.map((n) => ({ name: n.label, path: n.href }))
          ),
        ]}
      />

      <section className="relative min-h-[420px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HUB_HERO.src}
          alt={HUB_HERO.alt}
          width={HUB_HERO.width}
          height={HUB_HERO.height}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/45 to-slate-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-white/80">BlossomPot Flower Knowledge Centre</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl leading-tight">
            Complete Flower Guide &amp; Flower Encyclopedia
          </h1>
          <p className="mt-4 max-w-2xl text-white/90 text-lg leading-relaxed">
            Discover flower names, meanings, colours, seasons, care tips, occasions, bouquet ideas,
            availability and delivery information — written for people first, then structured for search.
          </p>
          <div className="mt-8">
            <FlowerSearch />
          </div>
          <p className="mt-3 text-sm text-white/70">Try Rose, Tulip, Peony, Orchid or Sunflower</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Breadcrumbs items={crumbs} />

        <section className="mb-14">
          <h2 className="font-display text-3xl text-primary">Explore flowers</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Start with a category that matches how you shop — by occasion, season, colour or simply A–Z.
            Only published, reviewed guides are indexed.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exploreCategories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.href}
                  className="block rounded-2xl border border-[#eadfd8] bg-white p-4 hover:border-nav hover:shadow-sm transition"
                >
                  <p className="font-semibold text-primary">{c.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-3xl text-primary">Published flower guides</h2>
              <p className="text-slate-600 mt-1">
                Full encyclopedia pages with facts, seasons, care and shop links.
              </p>
            </div>
            <Link href="/flower-guide/flowers-a-z" className="text-sm font-semibold text-nav hover:underline">
              Flowers A–Z
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {published.slice(0, 8).map((flower) => (
              <FlowerCard key={flower.slug} flower={flower} shopHref={`/products?search=${encodeURIComponent(flower.name)}`} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-primary text-white p-8 sm:p-10">
          <h2 className="font-display text-3xl">Shop what you just learned</h2>
          <p className="mt-2 text-white/85 max-w-2xl">
            Guides stay educational. When you are ready, BlossomPot can help you send flowers, bouquets
            and gifts to addresses we actually serve.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/flowers" className="rounded-full bg-white text-primary font-semibold px-5 py-2.5 text-sm">
              Shop flowers
            </Link>
            <Link href="/locations" className="rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold">
              Delivery locations
            </Link>
          </div>
        </section>
      </div>
    </FlowerGuideShell>
  );
}
