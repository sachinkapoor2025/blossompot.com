import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { occasionGuides } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Flowers by Occasion | BlossomPot",
  description:
    "Choose flowers for birthdays, anniversaries, weddings, Valentine’s Day, Mother’s Day, sympathy and more — with cultural notes and honest seasonality.",
  path: "/flower-guide/flowers-by-occasion",
});

export default function OccasionsIndexPage() {
  return (
    <FlowerGuideShell current="/flower-guide/flowers-by-occasion">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Flowers by Occasion", path: "/flower-guide/flowers-by-occasion" },
          ]),
          itemListJsonLd(
            "Flowers by occasion",
            occasionGuides.map((o) => ({ name: o.name, path: `/flower-guide/flowers-by-occasion/${o.slug}` }))
          ),
        ]}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flowers by Occasion" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">Flowers by occasion</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">
          Occasion guides recommend flowers that usually fit the moment. They are not rules. Culture,
          relationship and season matter more than a generic “best flower” list.
        </p>
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {occasionGuides.map((o) => (
            <li key={o.slug}>
              <Link href={`/flower-guide/flowers-by-occasion/${o.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-5 hover:border-nav">
                <p className="font-semibold text-primary">{o.name}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-3">{o.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FlowerGuideShell>
  );
}
