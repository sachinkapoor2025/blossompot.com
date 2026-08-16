"use client";

import { useState } from "react";
import { site } from "@/lib/site";

type SafeStoreImageProps = {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
};

/** Storefront image that falls back to the BlossomPot logo if the CDN asset is missing. */
export function SafeStoreImage({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
}: SafeStoreImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? site.logoSrc : src;
  const usingLogo = resolved === site.logoSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={usingLogo ? site.name : alt}
      width={width}
      height={height}
      loading={loading}
      className={usingLogo ? `${className ?? ""} object-contain bg-white p-6`.trim() : className}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
