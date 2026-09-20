"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Hash URLs cannot be 301'd on the server; send `/#gift-catalog` to `/gift-catalog`. */
export function GiftCatalogHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/" && window.location.hash === "#gift-catalog") {
      router.replace("/gift-catalog");
    }
  }, [router]);

  return null;
}
