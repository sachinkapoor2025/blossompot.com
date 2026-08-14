import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

/** Legacy festival URL — redirected in next.config; stub kept for typecheck safety. */
export const metadata: Metadata = pageMetadata({
  title: "Send Flowers & Gifts Online | BlossomPot",
  description: "BlossomPot delivers flowers, cakes, and thoughtful gifts across the USA.",
  path: "/raksha-bandhan",
  noIndex: true,
});

export default function LegacyRakshaBandhanPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-primary">Looking for celebration gifts?</h1>
      <p className="text-slate-600">
        BlossomPot is now a flowers, cakes, and gifts storefront. Continue shopping our collections.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/flowers" className="btn-nav">
          Shop Flowers
        </Link>
        <Link href="/cakes" className="btn-nav">
          Shop Cakes
        </Link>
        <Link href="/" className="btn-nav">
          Home
        </Link>
      </div>
    </div>
  );
}
