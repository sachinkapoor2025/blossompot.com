"use client";

import { useLayoutEffect, useState } from "react";

/** Fallback until the live sticky <header> is measured. */
const FALLBACK_HEADER_PX = 136;
const GAP_PX = 12;

/**
 * Distance from the viewport top to clear the existing storefront header.
 * Reads the real header height so the PDP gallery does not sit underneath it.
 * Does not change header/nav behavior.
 */
export function useStorefrontHeaderOffset(): number {
  const [offset, setOffset] = useState(FALLBACK_HEADER_PX + GAP_PX);

  useLayoutEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    const update = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) setOffset(height + GAP_PX);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return offset;
}
