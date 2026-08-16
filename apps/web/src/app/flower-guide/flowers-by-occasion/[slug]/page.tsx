import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerCard } from "@/components/flower-guide/FlowerCard";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { directoryBySlug, featuredFlowerLocations, getOccasionGuide, occasionGuides } from "@/lib/content/flower-guide";
import { categoryHref } from "@/lib/category-urls";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return occasionGuides.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getOccasionGuide(slug);
  if (!page) return { title: "Occasion flowers" };
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/flower-guide/flowers-by-occasion/${page.slug}`,
    absoluteTitle: true,
  });
}

export default async function OccasionPage({ params }: Props) {
  const { slug } = await params;
  const page = getOccasionGuide(slug);
  if (!page) notFound();
  const flowers = page.recommended.map((s) => directoryBySlug(s)).filter((f): f is NonNullable<typeof f> => Boolean(f));
  const locations = featuredFlowerLocations(6);

  return (
    <FlowerGuideShell current="/flower-guide/flowers-by-occasion">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Flowers by Occasion", path: "/flower-guide/flowers-by-occasion" },
          { name: page.name, path: `/flower-guide/flowers-by-occasion/${page.slug}` },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flowers by Occasion", href: "/flower-guide/flowers-by-occasion" },
            { label: page.name },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{page.h1}</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">{page.intro}</p>
        <dl className="mt-8 grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl bg-white border border-[#eadfd8] p-4">
            <dt className="text-slate-500">Colours</dt>
            <dd className="mt-1 text-slate-800">{page.colours}</dd>
          </div>
          <div className="rounded-2xl bg-white border border-[#eadfd8] p-4">
            <dt className="text-slate-500">Bouquet styles</dt>
            <dd className="mt-1 text-slate-800">{page.styles}</dd>
          </div>
          <div className="rounded-2xl bg-white border border-[#eadfd8] p-4">
            <dt className="text-slate-500">Symbolism</dt>
            <dd className="mt-1 text-slate-800">{page.symbolism}</dd>
          </div>
          <div className="rounded-2xl bg-white border border-[#eadfd8] p-4">
            <dt className="text-slate-500">What to avoid</dt>
            <dd className="mt-1 text-slate-800">{page.avoid}</dd>
          </div>
        </dl>
        <h2 className="font-display text-2xl text-primary mt-10">Recommended flowers</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flowers.map((f) => (
            <FlowerCard key={f.slug} flower={f} />
          ))}
        </div>
        {page.shopCategory ? (
          <p className="mt-8">
            <Link href={categoryHref(page.shopCategory)} className="btn-nav inline-flex">
              Shop {page.name.toLowerCase()}
            </Link>
          </p>
        ) : null}
        <h2 className="font-display text-2xl text-primary mt-12">Send this occasion</h2>
        <p className="mt-2 text-slate-600 text-sm">
          Links go to published BlossomPot location pages only — US destinations or origin-to-USA guides.
        </p>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
          {locations.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-nav hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FlowerGuideShell>
  );
}
