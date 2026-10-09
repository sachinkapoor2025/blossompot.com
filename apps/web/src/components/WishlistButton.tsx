"use client";

import type { Product } from "@blossompot/shared";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { wishlistEntryHref } from "@/lib/wishlist-href";

export function WishlistButton({
  product,
  className = "",
  variant = "overlay",
}: {
  product: Product;
  className?: string;
  variant?: "overlay" | "toolbar";
}) {
  const { isWishlisted, toggle } = useWishlist();
  const { user, loading } = useAuth();
  const router = useRouter();
  const active = isWishlisted(product.slug);

  const overlayClass =
    "absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] ring-1 ring-slate-200 transition-transform hover:scale-110 active:scale-95";
  const toolbarClass =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-nav bg-white text-nav hover:bg-blue-50 transition active:scale-95";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;
        if (!user) {
          router.push(wishlistEntryHref(false));
          return;
        }
        toggle(product);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={`${variant === "toolbar" ? toolbarClass : overlayClass} ${className}`}
    >
      <svg
        className={`h-5 w-5 ${
          variant === "overlay"
            ? active
              ? "text-accent"
              : "text-slate-800"
            : active
              ? "text-accent fill-current"
              : "fill-none stroke-current stroke-2"
        }`}
        viewBox="0 0 24 24"
        fill={variant === "toolbar" && !active ? "none" : "currentColor"}
        aria-hidden
      >
        {variant === "toolbar" && !active ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        ) : (
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        )}
      </svg>
    </button>
  );
}
