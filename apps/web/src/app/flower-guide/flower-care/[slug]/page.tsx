import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { careArticles, directoryBySlug, getCareArticle } from "@/lib/content/flower-guide";
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return careArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getCareArticle(slug);
  if (!page) return { title: "Flower care" };
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: `/flower-guide/flower-care/${page.slug}`,
    absoluteTitle: true,
  });
}

export default async function CareArticlePage({ params }: Props) {
  const { slug } = await params;
  const page = getCareArticle(slug);
  if (!page) notFound();
  const path = `/flower-guide/flower-care/${page.slug}`;

  return (
    <FlowerGuideShell current="/flower-guide/flower-care">
      <JsonLd
        data={[
          articleJsonLd({
            slug: page.slug,
            title: page.title,
            description: page.seoDescription,
            publishedAt: "2026-08-16",
            updatedAt: "2026-08-16",
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Flower Guide", path: "/flower-guide" },
            { name: "Flower Care", path: "/flower-guide/flower-care" },
            { name: page.title, path },
          ]),
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Flower Care", href: "/flower-guide/flower-care" },
            { label: page.title },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{page.h1}</h1>
        <p className="mt-4 text-lg text-slate-800 leading-relaxed">{page.summary}</p>
        <ol className="mt-8 list-decimal pl-5 space-y-3 text-slate-700">
          {page.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {page.notes.map((n) => (
          <p key={n} className="mt-4 text-sm text-slate-600">
            {n}
          </p>
        ))}
        {page.relatedFlowers.length > 0 ? (
          <p className="mt-8 text-sm">
            Related guides:{" "}
            {page.relatedFlowers.map((s, i) => {
              const f = directoryBySlug(s);
              const published = f && (f.status === "published" || f.status === "reviewed");
              return (
                <span key={s}>
                  {i > 0 ? ", " : ""}
                  {published ? (
                    <Link href={`/flower-guide/${s}`} className="text-nav hover:underline">
                      {f.name}
                    </Link>
                  ) : (
                    f?.name ?? s
                  )}
                </span>
              );
            })}
          </p>
        ) : null}
      </div>
    </FlowerGuideShell>
  );
}
