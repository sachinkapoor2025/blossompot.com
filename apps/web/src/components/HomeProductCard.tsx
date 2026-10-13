"use client";

import Link from "next/link";
import type { Product } from "@blossompot/shared";
import { isFastSelling } from "@blossompot/shared";
import { AddToCartControl } from "@/components/AddToCartControl";
import { WishlistButton } from "@/components/WishlistButton";
import { FastSellingBadge } from "@/components/FastSellingBadge";
import { ProductImageRotator } from "@/components/ProductImageRotator";
import type { StorefrontCombo } from "@/lib/combos-page";
import { useCurrency } from "@/lib/currency-context";
import { resolveImageUrl } from "@/lib/images";
import { getDiscountPercent } from "@/lib/pricing";
import { useOptionalDeliveryLocation } from "@/lib/delivery-location-context";

type HomeProductCardProps = {
  showFastSellingBadge?: boolean;
  /** Homepage rows defer extra gallery frames until the card is on screen. */
  loadGalleryWhenVisible?: boolean;
  /** When false, the card links to the product page and does not offer add-to-cart. */
  showPurchaseControls?: boolean;
} & ({ product: Product; combo?: undefined } | { combo: StorefrontCombo; product?: undefined });

function ComboHalfImage({ image, alt }: { image: string | null; alt: string }) {
  const src = image ? resolveImageUrl(image) : "";
  if (!src) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-slate-100 px-2 text-center text-[10px] text-slate-400"
        role="img"
        aria-label={`No image for ${alt}`}
      >
        No image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-cover object-center" loading="lazy" decoding="async" />
  );
}

export function HomeProductCard({
  showFastSellingBadge = false,
  loadGalleryWhenVisible = false,
  showPurchaseControls = true,
  ...rest
}: HomeProductCardProps) {
  const combo = "combo" in rest ? rest.combo : undefined;
  const product = "product" in rest ? rest.product : undefined;
  const { format } = useCurrency();
  const delivery = useOptionalDeliveryLocation();
  const price = combo ? combo.price : (product?.price ?? 0);
  const compareAtPrice = combo ? combo.compareAtPrice : product?.compareAtPrice;
  const currency = combo ? combo.currency : (product?.currency ?? "USD");
  const name = combo ? combo.name : (product?.name ?? "");
  const discount = getDiscountPercent(price, compareAtPrice);
  const fastSelling = product != null && (showFastSellingBadge || isFastSelling(product));
  const [first, second] = combo?.components ?? [];
  const details = (
    <div className="p-3 flex h-full flex-col">
      <p className="font-sans text-sm font-semibold leading-5 text-slate-900 line-clamp-2 min-h-[2.75rem] hover:text-nav">
        {name}
      </p>
      {combo && first && second ? (
        <p className="mt-1 text-xs leading-4 text-slate-600 line-clamp-2">
          <Link href={`/products/${first.slug}`} className="hover:text-nav hover:underline">
            {first.name}
          </Link>
          <span> and </span>
          <Link href={`/products/${second.slug}`} className="hover:text-nav hover:underline">
            {second.name}
          </Link>
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-2 w-full">
        <span className="text-nav font-bold">{format(price, currency)}</span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-xs text-slate-400 line-through">{format(compareAtPrice, currency)}</span>
        )}
        {discount !== null && (
          <span className="text-xs font-semibold text-green-600 ml-auto shrink-0">{discount}% OFF</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow relative flex h-full flex-col">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-50">
        {/* Badges stacked top-left; wishlist alone top-right — no overlap on mobile */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1 max-w-[70%] pointer-events-none">
          {combo ? (
            <span className="bg-primary text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              COMBO
            </span>
          ) : null}
          {discount !== null && (
            <span className="bg-accent text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              {discount}% OFF
            </span>
          )}
          {fastSelling && <FastSellingBadge className="!text-[10px] sm:!text-xs" />}
        </div>
        {product ? <WishlistButton product={product} className="!top-2 !right-2 z-20" /> : null}
        {combo && first && second ? (
          <div className="absolute inset-0 z-[1] flex">
            <Link href={`/products/${first.slug}`} className="relative block h-full w-1/2" prefetch={false}>
              <ComboHalfImage image={first.image} alt={first.name} />
            </Link>
            <Link href={`/products/${second.slug}`} className="relative block h-full w-1/2" prefetch={false}>
              <ComboHalfImage image={second.image} alt={second.name} />
            </Link>
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/90" aria-hidden />
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-base font-semibold leading-none text-slate-700 shadow-sm"
              aria-hidden
            >
              +
            </span>
          </div>
        ) : product ? (
          <Link href={`/products/${product.slug}`} className="absolute inset-0 z-[1] block" prefetch={false}>
            <ProductImageRotator
              images={product.images ?? []}
              alt={product.name}
              staggerKey={product.slug}
              className="pointer-events-none absolute inset-0 h-full w-full"
              loadWhenVisible={loadGalleryWhenVisible}
            />
          </Link>
        ) : null}
      </div>
      {product ? (
        <Link href={`/products/${product.slug}`} className="block flex-1">
          {details}
        </Link>
      ) : (
        <div className="block flex-1">{details}</div>
      )}
      {showPurchaseControls ? (
        <div className="mt-auto px-3 pb-3">
          {!delivery?.location ? <p className="text-[11px] text-slate-500 mb-1">Check delivery</p> : null}
          {combo && first && second ? (
            <AddToCartControl
              productSlug={first.slug}
              disabled={first.inventory <= 0 || second.inventory <= 0}
              combo={{
                components: [
                  { slug: first.slug, name: first.name },
                  { slug: second.slug, name: second.name },
                ],
              }}
            />
          ) : product ? (
            <AddToCartControl productSlug={product.slug} disabled={product.inventory <= 0} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
