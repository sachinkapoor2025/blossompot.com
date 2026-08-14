import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Send Gifts Online | BlossomPot",
  description: "Order flowers, cakes, and gifts for USA delivery with BlossomPot.",
  path: "/send-rakhi-from-india",
  noIndex: true,
});

export default function LegacySendFromIndiaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-primary">Send gifts to the USA</h1>
      <p className="text-slate-600">
        Order flowers, cakes, and curated gifts from anywhere. Enter a US delivery address at checkout.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/" className="btn-nav">
          Shop BlossomPot
        </Link>
        <Link href="/flowers" className="btn-nav">
          Shop Flowers
        </Link>
      </div>
    </div>
  );
}
