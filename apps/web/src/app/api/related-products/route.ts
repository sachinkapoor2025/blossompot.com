import { NextResponse } from "next/server";
import { loadRelatedProducts, toListingCardProducts } from "@/lib/product-loader";
import { getStorefrontDeliveryCountry } from "@/lib/storefront-country";

/** Related rail for a product page. Loaded after the product HTML so the document does not wait on the category catalog. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "";
  const exclude = url.searchParams.get("exclude") ?? "";
  if (!/^[a-z0-9-]{1,80}$/.test(category) || !/^[a-z0-9-]{1,160}$/.test(exclude)) {
    return NextResponse.json({ products: [] });
  }
  const country = await getStorefrontDeliveryCountry();
  if (!country) return NextResponse.json({ products: [] });
  const products = await loadRelatedProducts(category, exclude, country);
  return NextResponse.json({ products: toListingCardProducts(products) });
}
