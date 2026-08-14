import type { Metadata } from "next";
import Link from "next/link";
import { BlogShowMoreProducts } from "@/components/BlogShowMoreProducts";
import { loadBlogPostsWithImages } from "@/lib/blog-images";
import { pageMetadata } from "@/lib/seo";

/** Keep blog list fresh when admin updates hero images. */
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Gifting Blog — Flowers, Cakes & Celebration Ideas",
  description:
    "Guides and ideas for sending flowers, cakes, and thoughtful gifts across the USA — birthdays, anniversaries, Valentine's Day, and more from BlossomPot.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await loadBlogPostsWithImages();
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-primary mb-2">Gifting Guides & Blog</h1>
      <p className="text-slate-600 mb-8">
        Ideas and tips for sending flowers, cakes, and thoughtful gifts across the USA — for birthdays,
        anniversaries, and everyday celebrations.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition bg-white flex flex-col"
          >
            <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Blog image placeholder
                </div>
              )}
            </Link>
            <div className="p-5 flex flex-col flex-1 min-w-0">
              <time dateTime={post.publishedAt} className="text-xs text-slate-400">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="text-lg font-bold text-primary mt-1 mb-2 leading-snug">
                <Link href={`/blog/${post.slug}`} className="hover:text-nav break-words">
                  {post.title}
                </Link>
              </h2>
              <p className="text-slate-600 text-sm mb-4 flex-1 break-words">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-nav font-semibold text-sm hover:underline">
                Read full guide →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <BlogShowMoreProducts />
    </div>
  );
}
