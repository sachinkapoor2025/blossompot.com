import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { flowerComparisons, getComparison, getPublishedGuide } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return flowerComparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) return { title: "Flower comparison" };
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/flower-guide/flower-comparisons/${page.slug}`,
    absoluteTitle: true,
  });
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const page = getComparison(slug);
  if (!page) notFound();
  const a = getPublishedGuide(page.a);
  const b = getPublishedGuide(page.b);

  return (
    <FlowerGuideShell current="/flower-guide/flower-comparisons">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Comparisons", path: "/flower-guide/flower-comparisons" },
          { name: page.title, path: `/flower-guide/flower-comparisons/${page.slug}` },
        ])}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Comparisons", href: "/flower-guide/flower-comparisons" },
            { label: page.title },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{page.h1}</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">{page.intro}</p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-[#eadfd8]">
                <th className="py-2 pr-3"> </th>
                <th className="py-2 pr-3">{a ? <Link href={`/flower-guide/${a.slug}`} className="text-nav hover:underline">{a.name}</Link> : page.a}</th>
                <th className="py-2">{b ? <Link href={`/flower-guide/${b.slug}`} className="text-nav hover:underline">{b.name}</Link> : page.b}</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.label} className="border-b border-[#eadfd8]/70 align-top">
                  <td className="py-3 pr-3 font-medium text-primary">{row.label}</td>
                  <td className="py-3 pr-3 text-slate-700">{row.a}</td>
                  <td className="py-3 text-slate-700">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 text-slate-800 leading-relaxed">{page.verdict}</p>
      </div>
    </FlowerGuideShell>
  );
}
