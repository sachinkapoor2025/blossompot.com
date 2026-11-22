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
  srcSet?: string;
  sizes?: string;
  /** Original asset used when a resized delivery URL fails. */
  fallbackSrc?: string | null;
};

/** Storefront image that falls back to the BlossomPot logo if the CDN asset is missing. */
export function SafeStoreImage({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  srcSet,
  sizes,
  fallbackSrc,
}: SafeStoreImageProps) {
  const [stage, setStage] = useState<"primary" | "fallback" | "logo">("primary");
  const usingFallback = stage === "fallback" && Boolean(fallbackSrc);
  const resolved =
    stage === "logo" || !src ? site.logoSrc : usingFallback ? fallbackSrc || site.logoSrc : src;
  const usingLogo = resolved === site.logoSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved ?? site.logoSrc}
      alt={usingLogo ? site.name : alt}
      width={width}
      height={height}
      loading={loading}
      {...(!usingLogo && !usingFallback && srcSet ? { srcSet, sizes } : {})}
      className={usingLogo ? `${className ?? ""} object-contain bg-white p-6`.trim() : className}
      onError={() => {
        setStage((current) => {
          if (current === "primary" && fallbackSrc && fallbackSrc !== src) return "fallback";
          return "logo";
        });
      }}
    />
  );
}
