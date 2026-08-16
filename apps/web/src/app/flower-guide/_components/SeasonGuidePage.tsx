import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { directoryBySlug, seasonPages } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export function seasonMetadata(slug: string): Metadata {
  const page = seasonPages.find((s) => s.slug === slug);
  if (!page) return { title: "Seasonal flowers" };
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/flower-guide/${page.slug}`,
    absoluteTitle: true,
  });
}

export function SeasonGuidePage({ slug }: { slug: string }) {
  const page = seasonPages.find((s) => s.slug === slug);
  if (!page) notFound();
  const flowers = page.flowers.map((s) => directoryBySlug(s)).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <FlowerGuideShell current={`/flower-guide/${slug}`}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Seasonal Flowers", path: "/flower-guide/seasonal-flowers" },
          { name: page.name, path: `/flower-guide/${page.slug}` },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Seasonal Flowers", href: "/flower-guide/seasonal-flowers" },
            { label: page.name },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{page.h1}</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">{page.intro}</p>
        <h2 className="font-display text-2xl text-primary mt-10">Northern Hemisphere</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
          {page.northern.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-8">Australia and the Southern Hemisphere</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
          {page.southern.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-8">Bouquet ideas</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
          {page.bouquetIdeas.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-8">Care in this season</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
          {page.care.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-8">Availability</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
          {page.availability.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <h2 className="font-display text-2xl text-primary mt-10">Flowers to explore</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flowers.map((f) => (
            <FlowerCard key={f.slug} flower={f} />
          ))}
        </div>
        <p className="mt-8">
          <Link href="/flower-guide/seasonal-flowers" className="text-nav font-semibold hover:underline">
            Back to the monthly calendar →
          </Link>
        </p>
      </div>
    </FlowerGuideShell>
  );
}
