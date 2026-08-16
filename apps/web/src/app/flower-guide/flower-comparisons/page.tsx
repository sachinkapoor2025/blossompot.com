import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { flowerComparisons } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Comparison Guides | BlossomPot",
  description: "Compare roses and peonies, lilies and roses, sunflowers and gerberas, and other florist choices.",
  path: "/flower-guide/flower-comparisons",
});

export default function ComparisonsIndexPage() {
  return (
    <FlowerGuideShell current="/flower-guide/flower-comparisons">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Comparisons", path: "/flower-guide/flower-comparisons" },
          ]),
          itemListJsonLd(
            "Flower comparisons",
            flowerComparisons.map((c) => ({ name: c.title, path: `/flower-guide/flower-comparisons/${c.slug}` }))
          ),
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Comparisons" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flower comparisons</h1>
        <p className="mt-4 text-slate-700">Side-by-side guides for the choices people actually debate.</p>
        <ul className="mt-8 space-y-3">
          {flowerComparisons.map((c) => (
            <li key={c.slug}>
              <Link href={`/flower-guide/flower-comparisons/${c.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-5 hover:border-nav">
                <p className="font-semibold text-primary">{c.title}</p>
                <p className="text-sm text-slate-600 mt-1">{c.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FlowerGuideShell>
  );
}
