"use client";

import Link from "next/link";
import type { Product } from "@blossompot/shared";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductImageRotator } from "@/components/ProductImageRotator";
import { useCurrency } from "@/lib/currency-context";
import { getDiscountPercent } from "@/lib/pricing";

export function ProductCard({ product }: { product: Product }) {
  const { format } = useCurrency();
  const discount = getDiscountPercent(product.price, product.compareAtPrice);

  return (
    <div className="group border border-line rounded-xl overflow-hidden bg-surface relative shadow-sm shadow-primary/5 hover:shadow-xl hover:shadow-primary/15 hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300">
      {discount && (
        <span className="absolute top-3 left-3 z-10 bg-accent text-white text-xs md:text-[13px] font-bold px-2 py-1 rounded shadow-sm ring-1 ring-white/70">
          {discount}% OFF
        </span>
      )}
      <div className="relative aspect-square bg-ivory flex items-center justify-center text-muted">
        <WishlistButton product={product} />
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          <ProductImageRotator
            images={product.images ?? []}
            alt={product.name}
            staggerKey={product.slug}
            className="absolute inset-0 h-full w-full"
          />
        </Link>
      </div>
      <Link href={`/products/${product.slug}`} className="block p-4">
        <h3 className="type-product-title font-semibold text-ink group-hover:text-primary line-clamp-2 min-h-[2.5rem] md:min-h-[3.15rem] transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2 w-full">
          <p className="type-price text-primary-deep font-bold">{format(product.price, product.currency)}</p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="type-product-body text-muted line-through">
              {format(product.compareAtPrice, product.currency)}
            </p>
          )}
          {discount !== null && (
            <span className="type-support font-semibold text-accent ml-auto shrink-0">{discount}% OFF</span>
          )}
        </div>
      </Link>
    </div>
  );
}
