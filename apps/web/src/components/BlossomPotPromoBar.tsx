"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Soft announcement bar for BlossomPot storefront (hidden on admin). */
export function BlossomPotPromoBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email")) return null;

  return (
    <div className="bg-gradient-to-r from-primary via-[#9e2d55] to-nav text-white text-center text-xs sm:text-sm py-2 px-3">
      <Link href="/products" className="hover:underline underline-offset-2">
        Shop flowers, cakes & hampers
      </Link>
    </div>
  );
}
