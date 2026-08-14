import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogShowMoreProducts } from "@/components/BlogShowMoreProducts";
import { categoryHref } from "@/lib/category-urls";
import { JsonLd } from "@/components/JsonLd";
import { loadBlogPostWithImage } from "@/lib/blog-images";
import { listAllBlogPosts } from "@/lib/content/blog-posts";
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Keep article pages fresh when admin updates hero images. */
export const revalidate = 60;

export function generateStaticParams() {
  return listAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadBlogPostWithImage(slug);
  if (!post) return { title: "Article" };
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    ...(post.image ? { ogImage: post.image } : {}),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await loadBlogPostWithImage(slug);
  if (!post) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  return (
    <div className="overflow-x-hidden">
      <article className="max-w-3xl mx-auto px-4 py-10 min-w-0 w-full">
        <JsonLd
          data={[
            articleJsonLd(post),
            breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? `/blog/${slug}` }))),
          ]}
        />
        <Breadcrumbs items={crumbs} />
        <header className="mb-8 min-w-0">
          <time dateTime={post.publishedAt} className="text-sm text-slate-500">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mt-2 mb-3 break-words">{post.title}</h1>
          <p className="text-base sm:text-lg text-slate-600 break-words">{post.excerpt}</p>
        </header>

        <div className="relative w-full aspect-[16/10] max-h-[420px] rounded-xl overflow-hidden mb-8 bg-slate-100">
          {post.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[200px] w-full items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-center px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Blog image placeholder</p>
            </div>
          )}
        </div>

        <div className="space-y-8 min-w-0 break-words [overflow-wrap:anywhere]">
          {post.sections.map((section, i) => (
            <section key={i} className="min-w-0">
              {section.heading && (
                <h2 className="text-xl font-bold text-primary mb-3 break-words">{section.heading}</h2>
              )}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-slate-700 leading-relaxed mb-4 break-words [overflow-wrap:anywhere]">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {post.relatedCategory && (
          <div className="mt-10 p-6 bg-slate-50 rounded-xl border min-w-0">
            <h2 className="font-semibold text-primary mb-2">Shop related Rakhis</h2>
            <Link href={categoryHref(post.relatedCategory)} className="text-nav font-semibold hover:underline">
              Browse {post.relatedCategory.replace(/-/g, " ")} →
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-nav hover:underline">
            Shop BlossomPot home →
          </Link>
          <Link href="/raksha-bandhan" className="text-nav hover:underline">
            Raksha Bandhan 2026 guide →
          </Link>
          <Link href="/blog" className="text-nav hover:underline">
            ← All articles
          </Link>
        </div>
      </article>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <BlogShowMoreProducts />
      </div>
    </div>
  );
}
