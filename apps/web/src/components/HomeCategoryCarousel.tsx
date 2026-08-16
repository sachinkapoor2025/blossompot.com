"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { HomeCategoryTile } from "@/lib/home-category-carousel";

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

export function HomeCategoryCarousel({ tiles }: { tiles: HomeCategoryTile[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))));
  }, []);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      setPage(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [measure, tiles.length]);

  const scrollByPage = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (tiles.length === 0) return null;

  return (
    <section className="bg-[#f7f1ea] border-y border-[#eadfd8]" aria-labelledby={labelId}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="text-center mb-5">
          <h2 id={labelId} className="font-display text-2xl sm:text-3xl text-primary">
            Shop BlossomPot gifts
          </h2>
          <p className="mt-1 text-sm text-slate-600">Flowers, cakes, and gifts for every celebration</p>
        </div>

        {pageCount > 1 ? (
          <div className="flex justify-center gap-1.5 mb-4" aria-hidden>
            {Array.from({ length: pageCount }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === page ? "w-6 bg-primary" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="relative">
          {pageCount > 1 ? (
            <>
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1 sm:-translate-x-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-md border border-[#eadfd8] hover:bg-petal"
                aria-label="Previous categories"
              >
                <ArrowIcon dir="prev" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1 sm:translate-x-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-md border border-[#eadfd8] hover:bg-petal"
                aria-label="Next categories"
              >
                <ArrowIcon dir="next" />
              </button>
            </>
          ) : null}

          <ul
            ref={scrollerRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {tiles.map((tile) => (
              <li key={tile.slug} className="snap-start shrink-0 w-[112px] sm:w-[132px]">
                <Link href={tile.href} className="group block text-center">
                  <span className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eadfd8] aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tile.image}
                      alt={tile.alt}
                      width={264}
                      height={264}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-[1.04] transition duration-300"
                    />
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-800 group-hover:text-primary">
                    {tile.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
