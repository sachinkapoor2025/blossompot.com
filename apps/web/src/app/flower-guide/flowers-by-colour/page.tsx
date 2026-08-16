import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { colourGuides } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Colours & Meanings | BlossomPot",
  description: "Browse flowers by colour — red, pink, white, yellow and more — with honest notes on symbolism and season.",
  path: "/flower-guide/flowers-by-colour",
});

export default function ColoursIndexPage() {
  return (
    <FlowerGuideShell current="/flower-guide/flowers-by-colour">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Flower Colours", path: "/flower-guide/flowers-by-colour" },
          ]),
          itemListJsonLd(
            "Flower colours",
            colourGuides.map((c) => ({ name: c.name, path: `/flower-guide/flowers-by-colour/${c.slug}` }))
          ),
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flower Colours" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flowers by colour</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">
          Colour associations are cultural conventions, not botanical facts. Use them as a starting point,
          then choose the flower that fits the season and the relationship.
        </p>
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {colourGuides.map((c) => (
            <li key={c.slug}>
              <Link href={`/flower-guide/flowers-by-colour/${c.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-5 hover:border-nav">
                <p className="font-semibold text-primary">{c.name}</p>
                <p className="text-sm text-slate-600 mt-1">{c.association}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FlowerGuideShell>
  );
}
