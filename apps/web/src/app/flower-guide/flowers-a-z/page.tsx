import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerFilters } from "@/components/flower-guide/FlowerFilters";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { FlowerSearch } from "@/components/flower-guide/FlowerSearch";
import { directoryByLetter, filterDirectory, searchFlowerKnowledge } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean(
    first(sp.q) ||
      first(sp.colour) ||
      first(sp.season) ||
      first(sp.occasion) ||
      first(sp.fragrance) ||
      first(sp.longevity) ||
      first(sp.petFriendly) ||
      first(sp.category)
  );
  return pageMetadata({
    title: "Flowers A–Z: Flower Names & Directory | BlossomPot",
    description:
      "Browse BlossomPot’s flower directory from Alstroemeria to Zinnia. Published guides include meanings, seasons and care; other names are listed as the encyclopedia grows.",
    path: "/flower-guide/flowers-a-z",
    noIndex: filtered,
  });
}

export default async function FlowersAZPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const filtered = filterDirectory({
    q,
    colour: first(sp.colour),
    season: first(sp.season),
    occasion: first(sp.occasion),
    fragrance: first(sp.fragrance),
    longevity: first(sp.longevity),
    petFriendly: first(sp.petFriendly) === "1",
    category: first(sp.category),
  });
  const searchHits = q ? searchFlowerKnowledge(q, 8) : [];
  const byLetter = directoryByLetter();
  const letters = [...byLetter.keys()].sort();
  const hasFilters = Boolean(q || first(sp.colour) || first(sp.season) || first(sp.occasion) || first(sp.fragrance) || first(sp.longevity) || first(sp.petFriendly) || first(sp.category));

  return (
    <FlowerGuideShell current="/flower-guide/flowers-a-z">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Flowers A–Z", path: "/flower-guide/flowers-a-z" },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flowers A–Z" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flowers A–Z</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          A living directory of flower names. Full encyclopedia pages are published only after research
          and review. Names without a guide stay listed so the collection can grow without thin pages.
        </p>
        <div className="mt-6 max-w-xl">
          <FlowerSearch initialQuery={q} variant="inline" />
        </div>
        <div className="mt-6">
          <Suspense fallback={null}>
            <FlowerFilters />
          </Suspense>
        </div>

        {q && searchHits.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-[#eadfd8] bg-white p-5">
            <h2 className="font-semibold text-primary">Also in the Flower Guide</h2>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
              {searchHits.map((hit) => (
                <li key={hit.href}>
                  <a href={hit.href} className="text-nav hover:underline font-medium">
                    {hit.title}
                  </a>
                  <span className="text-slate-400"> · {hit.type}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {hasFilters ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl text-primary mb-4">
              {filtered.length} {filtered.length === 1 ? "flower" : "flowers"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((flower) => (
                <FlowerCard
                  key={flower.slug}
                  flower={flower}
                  shopHref={`/products?search=${encodeURIComponent(flower.name)}`}
                />
              ))}
            </div>
          </section>
        ) : (
          letters.map((letter) => (
            <section key={letter} className="mt-10">
              <h2 className="font-display text-3xl text-primary border-b border-[#eadfd8] pb-2">{letter}</h2>
              <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(byLetter.get(letter) ?? []).map((flower) => {
                  const published = flower.status === "published" || flower.status === "reviewed";
                  return (
                    <li key={flower.slug}>
                      {published ? (
                        <a href={`/flower-guide/${flower.slug}`} className="text-nav hover:underline font-medium">
                          {flower.name}
                        </a>
                      ) : (
                        <span className="text-slate-700">
                          {flower.name}{" "}
                          <span className="text-xs text-slate-400">guide in research</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </FlowerGuideShell>
  );
}
