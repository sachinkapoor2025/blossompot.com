"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  VALENTINE_WEEK_DAYS,
  VALENTINE_WEEK_IMAGE,
  valentineWeekHref,
  valentineWeekShopHref,
} from "@/lib/valentine-week";

const PANEL_ID = "valentine-week-panel";

function DayArrow() {
  return (
    <svg className="h-4 w-4 shrink-0 text-nav transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DayLinks({
  countryIso,
  onNavigate,
}: {
  countryIso: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {VALENTINE_WEEK_DAYS.map((day) => (
        <li key={day.id}>
          <Link
            href={valentineWeekHref(day, countryIso)}
            onClick={onNavigate}
            className="group flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-1.5 transition hover:bg-petal"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-petal text-lg leading-none" aria-hidden>
              {day.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-primary">{day.name}</span>
              <span className="block text-xs text-slate-500">{day.date}</span>
            </span>
            <DayArrow />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PromoImage({
  href,
  onNavigate,
  className,
}: {
  href: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link href={href} onClick={onNavigate} aria-label="Shop Valentine's Week gifts" className={className}>
      <Image
        src={VALENTINE_WEEK_IMAGE}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 220px"
        className="object-cover"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-[#9e2d55]/85 via-[#c23a6b]/20 to-transparent" />
      <span className="absolute bottom-3 left-3 right-3 font-display text-2xl leading-tight text-white">
        Valentine&apos;s Week
      </span>
    </Link>
  );
}

export function ValentineWeekDesktop({
  countryIso,
  active,
}: {
  countryIso: string;
  active: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const labelId = useId();
  const shopHref = valentineWeekShopHref(countryIso);

  const clearClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setShown(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setShown(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!shown) return;
    const place = () => {
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;
      const rect = button.getBoundingClientRect();
      const width = panel.offsetWidth;
      const left = Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12));
      panel.style.left = `${left}px`;
      panel.style.top = `${rect.bottom - 2}px`;
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [shown]);

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onMouseEnter={() => {
        clearClose();
        setOpen(true);
      }}
      onMouseLeave={() => {
        clearClose();
        closeTimer.current = window.setTimeout(() => setOpen(false), 140);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`btn-nav gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          active || open ? "btn-nav-active" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={PANEL_ID}
        onClick={(event) => {
          clearClose();
          // A pointer click should reveal the menu. Keyboard activation toggles it.
          if (event.detail === 0) setOpen((value) => !value);
          else setOpen(true);
        }}
      >
        Valentine&apos;s
        <span className={`text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
          ▼
        </span>
      </button>
      {shown ? (
        <div
          ref={panelRef}
          id={PANEL_ID}
          role="region"
          aria-labelledby={labelId}
          className={`fixed z-[100] w-[min(40rem,calc(100vw-1.5rem))] pt-2 motion-safe:transition motion-safe:duration-200 motion-safe:ease-out ${
            visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <div className="grid max-h-[min(34rem,calc(100vh-7rem))] grid-cols-[11.75rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-2xl shadow-primary/15">
            <PromoImage href={shopHref} onNavigate={() => setOpen(false)} className="relative block h-full min-h-[16rem]" />
            <div className="overflow-y-auto px-3 py-4">
              <p id={labelId} className="px-2.5 font-display text-xl leading-tight text-primary">
                Celebrate Love, All Week Long
              </p>
              <div className="mt-3">
                <DayLinks countryIso={countryIso} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ValentineWeekMobile({
  countryIso,
  active,
  onNavigate,
}: {
  countryIso: string;
  active: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const shopHref = valentineWeekShopHref(countryIso);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          open || active ? "bg-nav text-white" : "text-primary hover:bg-blue-50 hover:text-nav"
        }`}
      >
        Valentine&apos;s
        <span className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
          ▼
        </span>
      </button>
      {open ? (
        <div id={panelId} className="mt-1 space-y-2 border-l-2 border-primary/15 py-2 pl-2">
          <PromoImage
            href={shopHref}
            onNavigate={onNavigate}
            className="relative block h-28 overflow-hidden rounded-xl"
          />
          <DayLinks countryIso={countryIso} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}
