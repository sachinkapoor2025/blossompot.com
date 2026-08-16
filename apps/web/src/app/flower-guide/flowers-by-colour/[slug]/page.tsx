import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { colourGuides, directoryBySlug, getColourGuide } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return colourGuides.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getColourGuide(slug);
  if (!page) return { title: "Flower colour" };
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/flower-guide/flowers-by-colour/${page.slug}`,
    absoluteTitle: true,
  });
}

export default async function ColourPage({ params }: Props) {
  const { slug } = await params;
  const page = getColourGuide(slug);
  if (!page) notFound();
  const flowers = page.flowers.map((s) => directoryBySlug(s)).filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <FlowerGuideShell current="/flower-guide/flowers-by-colour">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Flower Colours", path: "/flower-guide/flowers-by-colour" },
          { name: page.name, path: `/flower-guide/flowers-by-colour/${page.slug}` },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flower Colours", href: "/flower-guide/flowers-by-colour" },
            { label: page.name },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{page.h1}</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">{page.intro}</p>
        <p className="mt-4 text-slate-700"><span className="font-medium">Association:</span> {page.association}</p>
        <p className="mt-2 text-slate-700"><span className="font-medium">Occasions:</span> {page.occasions}</p>
        <p className="mt-2 text-slate-700"><span className="font-medium">Season:</span> {page.season}</p>
        <h2 className="font-display text-2xl text-primary mt-10">Popular flower types</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flowers.map((f) => (
            <FlowerCard key={f.slug} flower={f} shopHref={`/products?search=${encodeURIComponent(f.name)}`} />
          ))}
        </div>
      </div>
    </FlowerGuideShell>
  );
}
