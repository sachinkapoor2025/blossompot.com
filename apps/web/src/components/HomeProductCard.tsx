"use client";

import Link from "next/link";
import type { Product } from "@blossompot/shared";
import { isFastSelling } from "@blossompot/shared";
import { AddToCartControl } from "@/components/AddToCartControl";
import { WishlistButton } from "@/components/WishlistButton";
import { FastSellingBadge } from "@/components/FastSellingBadge";
import { ProductImageRotator } from "@/components/ProductImageRotator";
import { useCurrency } from "@/lib/currency-context";
import { getDiscountPercent } from "@/lib/pricing";

export function HomeProductCard({
  product,
  showFastSellingBadge = false,
}: {
  product: Product;
  showFastSellingBadge?: boolean;
}) {
  const { format } = useCurrency();
  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const fastSelling = showFastSellingBadge || isFastSelling(product);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow relative flex h-full flex-col">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-50">
        {/* Badges stacked top-left; wishlist alone top-right — no overlap on mobile */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1 max-w-[70%] pointer-events-none">
          {discount !== null && (
            <span className="bg-accent text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              {discount}% OFF
            </span>
          )}
          {fastSelling && <FastSellingBadge className="!text-[10px] sm:!text-xs" />}
        </div>
        <WishlistButton product={product} className="!top-2 !right-2 z-20" />
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          <ProductImageRotator
            images={product.images ?? []}
            alt={product.name}
            staggerKey={product.slug}
            className="absolute inset-0 h-full w-full"
          />
        </Link>
      </div>
      <Link href={`/products/${product.slug}`} className="block flex-1">
        <div className="p-3 flex h-full flex-col">
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 min-h-[2.75rem] hover:text-nav">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 w-full">
            <span className="text-nav font-bold">{format(product.price, product.currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {format(product.compareAtPrice, product.currency)}
              </span>
            )}
            {discount !== null && (
              <span className="text-xs font-semibold text-green-600 ml-auto shrink-0">{discount}% OFF</span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto px-3 pb-3">
        <AddToCartControl productSlug={product.slug} disabled={product.inventory <= 0} />
      </div>
    </div>
  );
}
