"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { Product } from "@blossompot/shared";
import { HomeProductCard } from "@/components/HomeProductCard";
import { LocationEmptyHint, useLocationFilteredProducts } from "@/components/LocationFilteredProducts";

const CARD_WIDTH = "w-[10.75rem] sm:w-[13rem] lg:w-[15rem]";

function ArrowIcon({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      {dir === "prev" ? (
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}

export function HomeCategoryProductScroller({
  title,
  products,
  showMoreHref,
}: {
  title: string;
  products: Product[];
  showMoreHref: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const visible = useLocationFilteredProducts(products);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, visible.products.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 160), behavior: reduce ? "auto" : "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByDir(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByDir(-1);
    }
  };

  return (
    <div className="relative">
      {visible.emptyBecauseLocation ? <LocationEmptyHint /> : null}
      {canPrev ? (
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          className="absolute left-0 top-[38%] z-10 flex h-10 w-10 -translate-x-1 items-center justify-center rounded-full border border-[#eadfd8] bg-white text-primary shadow-md hover:bg-petal sm:-translate-x-3"
          aria-label={`Scroll ${title} back`}
        >
          <ArrowIcon dir="prev" />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          className="absolute right-0 top-[38%] z-10 flex h-10 w-10 translate-x-1 items-center justify-center rounded-full border border-[#eadfd8] bg-white text-primary shadow-md hover:bg-petal sm:translate-x-3"
          aria-label={`Scroll ${title} forward`}
        >
          <ArrowIcon dir="next" />
        </button>
      ) : null}
      <ul
        ref={scrollerRef}
        tabIndex={0}
        aria-label={`${title} products`}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth overscroll-x-contain pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [scrollbar-width:thin]"
      >
        {visible.products.map((product) => (
          <li key={product.slug} className={`snap-start shrink-0 self-stretch ${CARD_WIDTH}`}>
            <HomeProductCard product={product} loadGalleryWhenVisible />
          </li>
        ))}
        <li className={`snap-start shrink-0 self-stretch ${CARD_WIDTH}`}>
          <Link
            href={showMoreHref}
            className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 text-center hover:border-primary/40 hover:bg-petal/70"
          >
            <span className="text-sm font-semibold text-primary">Show more</span>
            <span className="text-xs text-slate-600">{title}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
