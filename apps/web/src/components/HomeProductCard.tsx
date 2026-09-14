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
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";

export function HomeProductCard({
  product,
  showFastSellingBadge = false,
}: {
  product: Product;
  showFastSellingBadge?: boolean;
}) {
  const { format } = useCurrency();
  const delivery = useOptionalDeliveryLocation();
  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const fastSelling = showFastSellingBadge || isFastSelling(product);

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface hover:shadow-md transition-shadow relative flex h-full flex-col">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-ivory">
        {/* Badges stacked top-left; wishlist alone top-right — no overlap on mobile */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1 max-w-[70%] pointer-events-none">
          {discount !== null && (
            <span className="bg-accent text-white text-[10px] sm:text-xs md:text-[13px] font-bold px-2 py-0.5 rounded shadow-sm ring-1 ring-white/70">
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
        <div className="p-3 md:p-4 flex h-full flex-col">
          <h3 className="type-product-title font-semibold text-ink line-clamp-2 min-h-[2.75rem] md:min-h-[3.15rem] hover:text-nav">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 w-full">
            <span className="type-price text-primary-deep font-bold">{format(product.price, product.currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="type-product-body text-muted line-through">
                {format(product.compareAtPrice, product.currency)}
              </span>
            )}
            {discount !== null && (
              <span className="type-support font-semibold text-accent ml-auto shrink-0">{discount}% OFF</span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto px-3 pb-3 md:px-4 md:pb-4">
        {delivery?.location ? (
          <p className="type-product-body text-primary mb-1">✓ Available for {delivery.location.postalDisplay}</p>
        ) : (
          <p className="type-product-body text-muted mb-1">Check delivery</p>
        )}
        <AddToCartControl productSlug={product.slug} disabled={product.inventory <= 0} />
      </div>
    </div>
  );
}
