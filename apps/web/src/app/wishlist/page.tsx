import type { Metadata } from "next";
import { WishlistPageClient } from "./WishlistPageClient";
import { loadFeaturedProducts } from "@/lib/product-loader";

export const metadata: Metadata = {
  title: "Wish List",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const recommendedProducts = await loadFeaturedProducts(10);
  return <WishlistPageClient recommendedProducts={recommendedProducts} />;
}
