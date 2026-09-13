"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const MD_QUERY = "(min-width: 768px)";

function isOnScreen(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/**
 * Same Add to Cart control sticks to the bottom on desktop while its
 * natural slot is off-screen. No second button. Design polish comes later.
 */
export function PdpPinnedAddToCart({
  sectionRef,
  className = "",
  children,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [slotBox, setSlotBox] = useState({ width: 0, height: 0, left: 0 });

  useLayoutEffect(() => {
    const mq = window.matchMedia(MD_QUERY);
    let cancelled = false;
    let cleanup = () => {};

    const bind = () => {
      if (cancelled) return;
      const slot = slotRef.current;
      const cta = ctaRef.current;
      const section = sectionRef.current;
      if (!slot || !cta || !section) {
        requestAnimationFrame(bind);
        return;
      }

      const pinnedRef = { current: false };

      const measureSlot = () => {
        if (pinnedRef.current) return;
        const width = Math.round(slot.getBoundingClientRect().width || slot.offsetWidth);
        const height = Math.round(cta.getBoundingClientRect().height || cta.offsetHeight);
        const left = Math.round(slot.getBoundingClientRect().left);
        if (width > 0 && height > 0) {
          setSlotBox((prev) =>
            prev.width === width && prev.height === height && prev.left === left
              ? prev
              : { width, height, left }
          );
        }
      };

      const sync = () => {
        const slotVisible = isOnScreen(slot);
        const sectionVisible = isOnScreen(section);
        const next = mq.matches && !slotVisible && sectionVisible;
        if (next && !pinnedRef.current) measureSlot();
        pinnedRef.current = next;
        setPinned(next);
        if (next) {
          const left = Math.round(slot.getBoundingClientRect().left);
          setSlotBox((prev) => (prev.left === left ? prev : { ...prev, left }));
        }
      };

      measureSlot();
      sync();

      mq.addEventListener("change", sync);
      window.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);

      cleanup = () => {
        mq.removeEventListener("change", sync);
        window.removeEventListener("scroll", sync);
        window.removeEventListener("resize", sync);
      };
    };

    bind();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [sectionRef]);

  return (
    <div
      ref={slotRef}
      className={className}
      style={
        pinned && slotBox.height > 0
          ? {
              height: slotBox.height,
              minHeight: slotBox.height,
              width: slotBox.width,
              flex: "0 0 auto",
            }
          : undefined
      }
    >
      <div
        ref={ctaRef}
        className={pinned ? "fixed z-40 bottom-0" : undefined}
        style={
          pinned && slotBox.width > 0
            ? { width: slotBox.width, left: slotBox.left, right: "auto" }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
