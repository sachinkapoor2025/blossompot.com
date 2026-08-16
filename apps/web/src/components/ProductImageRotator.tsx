"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveImageUrl } from "@/lib/images";
import { site } from "@/lib/site";
import {
  selectDisplayableProductImages,
  type SizedProductImage,
} from "@blossompot/shared";

const ROTATE_MS = 3000;
const MAX_FRAMES = 4;

/**
 * Auto-rotates through a product's gallery images on listing cards.
 * Pauses while hovered; only advances when the card is on-screen.
 * Skips tiny vendor thumbnails (e.g. 100×100) once real dimensions are known.
 */
export function ProductImageRotator({
  images,
  alt,
  className = "",
  /** Stable seed so neighboring cards don't all flip at the same time. */
  staggerKey = "",
  /** First image eager only for above-the-fold cards; listing grids should stay lazy. */
  priority = false,
}: {
  images: string[];
  alt: string;
  className?: string;
  staggerKey?: string;
  priority?: boolean;
}) {
  const resolved = useMemo(
    () => [...new Set(images.map(resolveImageUrl).filter(Boolean))].slice(0, MAX_FRAMES),
    [images]
  );
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setUrls([]);
    setIndex(0);
    if (resolved.length === 0) return;

    let cancelled = false;
    const measured: SizedProductImage[] = [];
    let remaining = resolved.length;

    const finish = () => {
      if (cancelled) return;
      const picked = selectDisplayableProductImages(measured).slice(0, MAX_FRAMES);
      // Prefer measured frames; if every probe failed, still show resolved URLs
      // so cards are not blank while Unsplash/CDN recovers.
      setUrls(picked.length > 0 ? picked : resolved.slice(0, MAX_FRAMES));
    };

    resolved.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        measured.push({ url, width: img.naturalWidth, height: img.naturalHeight });
        remaining -= 1;
        if (remaining === 0) finish();
      };
      img.onerror = () => {
        remaining -= 1;
        if (remaining === 0) finish();
      };
      img.src = url;
    });

    return () => {
      cancelled = true;
    };
  }, [resolved]);

  useEffect(() => {
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: "80px", threshold: 0.15 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    setIndex(0);
  }, [urls]);

  useEffect(() => {
    if (urls.length <= 1 || paused || !visible) return;

    let hash = 0;
    for (let i = 0; i < staggerKey.length; i++) hash = (hash + staggerKey.charCodeAt(i) * (i + 1)) % 900;
    const delay = ROTATE_MS + hash;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % urls.length);
    }, delay);
    return () => window.clearInterval(id);
  }, [urls, paused, visible, staggerKey]);

  const frames = urls.length > 0 ? urls : resolved.length > 0 ? resolved : [site.logoSrc];

  if (resolved.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={site.logoSrc} alt={site.name} className="h-2/3 w-2/3 object-contain p-4" />
      </div>
    );
  }

  return (
    <div
      ref={setRoot}
      className={`relative overflow-hidden bg-slate-50 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === 0 ? alt : ""}
          aria-hidden={i !== index}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          loading={priority && i === 0 ? "eager" : "lazy"}
          decoding="async"
          width={1200}
          height={1200}
          onError={(event) => {
            event.currentTarget.src = site.logoSrc;
            event.currentTarget.classList.add("object-contain", "bg-white", "p-6");
          }}
        />
      ))}
      {frames.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-[1] flex -translate-x-1/2 gap-1" aria-hidden>
          {urls.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
