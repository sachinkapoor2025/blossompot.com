import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { careArticles } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flower Care Centre | BlossomPot",
  description: "How to keep cut flowers fresh: water changes, stem cuts, summer heat, lily pollen and flower-specific care.",
  path: "/flower-guide/flower-care",
});

export default function CareIndexPage() {
  return (
    <FlowerGuideShell current="/flower-guide/flower-care">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Flower Care", path: "/flower-guide/flower-care" },
          ]),
          itemListJsonLd(
            "Flower care articles",
            careArticles.map((a) => ({ name: a.title, path: `/flower-guide/flower-care/${a.slug}` }))
          ),
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flower Care" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flower care centre</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">
          These articles follow standard florist practice: clean water, fresh cuts, cool rooms. They do
          not invent day-counts. Related reading:{" "}
          <Link href="/blog/how-to-keep-flowers-fresh-longer" className="text-nav hover:underline">
            our gifting blog on keeping flowers fresh
          </Link>
          .
        </p>
        <ul className="mt-8 space-y-3">
          {careArticles.map((a) => (
            <li key={a.slug}>
              <Link href={`/flower-guide/flower-care/${a.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-5 hover:border-nav">
                <p className="font-semibold text-primary">{a.title}</p>
                <p className="text-sm text-slate-600 mt-1">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FlowerGuideShell>
  );
}
