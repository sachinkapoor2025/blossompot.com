import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Send Gifts from Canada | BlossomPot",
  description: "Order flowers, cakes, and gifts for USA delivery with BlossomPot.",
  path: "/rakhi-from-canada",
  noIndex: true,
});

export default function LegacyFromCanadaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-primary">Gifts for USA delivery</h1>
      <p className="text-slate-600">
        Shop flowers, cakes, and hampers on BlossomPot — perfect when you are ordering from Canada for a US recipient.
      </p>
      <Link href="/flowers" className="btn-nav inline-flex">
        Shop Flowers
      </Link>
    </div>
  );
}
