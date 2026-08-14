"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EARLY_BIRD_DISCOUNT_PERCENT,
  EARLY_BIRD_ENDS_DATE,
  SCHEDULE_DELIVERY_MAX_DATE,
  WELCOME_COUPON_HOURS,
  isEarlyBirdPromoActive,
} from "@blossompot/shared";
import { site } from "@/lib/site";
import { getOrCreateSessionId } from "@/lib/session";
import { api } from "@/lib/api";
import { saveWelcomeCoupon, loadWelcomeCoupon, formatCouponExpiry } from "@/lib/welcome-coupon";
import { trackSessionHeartbeat } from "@/lib/track";
import { DEFAULT_COUNTRY_ISO } from "@/lib/country-codes";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PhoneInput, buildPhoneValue } from "@/components/PhoneInput";

const DISMISS_KEY = "blossompot_early_bird_marquee_dismissed";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function formatPromoEnd(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatShortDayMonth(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type CouponResult = {
  code: string;
  expiresAt: string;
  discountPercent: number;
  reused?: boolean;
  alreadyClaimedToday?: boolean;
};

type Phase = "idle" | "submitting" | "done" | "blocked" | "ended";

/**
 * Live Early Bird UI — sticky marquee + logo claim panel.
 * Modal popup backup: `components/backups/EarlyBirdDiscountPopup.tsx`
 */
export function EarlyBirdPromoMarquee() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [localNumber, setLocalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const promoEndLabel = formatPromoEnd(EARLY_BIRD_ENDS_DATE);
  const promoEndShort = formatShortDayMonth(EARLY_BIRD_ENDS_DATE);
  const scheduleMaxLabel = formatPromoEnd(SCHEDULE_DELIVERY_MAX_DATE);

  const remainingMs = coupon?.expiresAt
    ? Math.max(0, new Date(coupon.expiresAt).getTime() - nowMs)
    : 0;
  const hasLiveCoupon = Boolean(coupon?.code && remainingMs > 0);

  useEffect(() => {
    const existing = loadWelcomeCoupon();
    if (existing) {
      setCoupon({
        code: existing.code,
        expiresAt: existing.expiresAt,
        discountPercent: existing.discountPercent,
      });
      setPhase("done");
    }
  }, []);

  useEffect(() => {
    if (!coupon?.expiresAt) return;
    const tick = () => {
      const t = Date.now();
      setNowMs(t);
      if (new Date(coupon.expiresAt).getTime() <= t) {
        setCoupon(null);
        setPhase("idle");
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [coupon?.expiresAt]);

  useEffect(() => {
    if (!isEarlyBirdPromoActive()) {
      setVisible(false);
      return;
    }
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/ses-email") ||
      pathname.startsWith("/checkout")
    ) {
      setVisible(false);
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setVisible(false);
      return;
    }
    setVisible(true);
    trackSessionHeartbeat("early_bird_marquee_shown", 0, pathname);
  }, [pathname]);

  // Re-show ribbon after a fresh claim only if user hasn’t dismissed it.
  useEffect(() => {
    if (hasLiveCoupon && sessionStorage.getItem(DISMISS_KEY) !== "1") {
      setVisible(true);
    }
  }, [hasLiveCoupon]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setExpanded(false);
    setVisible(false);
  };

  const copyCode = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const claim = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== "idle") return;
    if (!isEarlyBirdPromoActive()) {
      setPhase("ended");
      return;
    }

    const fullPhone = buildPhoneValue(countryIso, localNumber);
    const trimmedEmail = email.trim();
    if (!isValidPhone(fullPhone)) {
      setError("Enter a valid mobile number with country code.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setCoupon(null);
    setPhase("submitting");

    const sessionId = getOrCreateSessionId();

    void (async () => {
      try {
        const res = await api<{
          ok: boolean;
          coupon?: CouponResult;
        }>("/leads", {
          method: "POST",
          sessionId,
          body: JSON.stringify({
            sessionId,
            phone: fullPhone,
            email: trimmedEmail,
            page: pathname,
            source: "newsletter",
            metadata: {
              offer: "early_bird",
              trigger: "early_bird_marquee",
              discountPercent: String(EARLY_BIRD_DISCOUNT_PERCENT),
            },
          }),
        });

        if (!res.coupon) {
          setPhase("idle");
          setError("Could not save your discount. Please try again.");
          return;
        }

        const result = res.coupon;
        const expired = new Date(result.expiresAt).getTime() < Date.now();

        if (result.alreadyClaimedToday && expired) {
          setCoupon(result);
          setPhase("blocked");
          return;
        }

        setCoupon(result);
        saveWelcomeCoupon({
          ...result,
          phone: fullPhone,
          email: trimmedEmail,
        });
        setBurstKey((k) => k + 1);
        setPhase("done");
      } catch (err) {
        setPhase("idle");
        setError(
          err instanceof Error
            ? err.message
            : "Could not claim Early Bird discount. Try again or WhatsApp us."
        );
      }
    })();
  };

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-[60] isolate">
      <div className="relative overflow-hidden border-b border-amber-300/25 bg-primary/80 text-white shadow-[0_10px_28px_rgba(24,58,104,0.22)] backdrop-blur-md supports-[backdrop-filter]:bg-primary/70">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(196,163,90,0.22), transparent 28%, transparent 72%, rgba(225,29,72,0.18)), radial-gradient(circle at 50% 120%, rgba(255,255,255,0.12), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent" aria-hidden />

        {/* Mobile: bullets + claim below (no overlap) */}
        <div className="md:hidden relative px-3 py-3 space-y-3">
          {hasLiveCoupon && coupon ? (
            <div className="relative pr-9 flex flex-col items-stretch gap-2.5">
              <button
                type="button"
                onClick={dismiss}
                className="absolute right-0 top-0 rounded-full p-2 text-white/75 hover:bg-white/15 hover:text-white"
                aria-label="Dismiss Early Bird banner"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <p className="text-center text-[15px] font-extrabold tracking-wide text-amber-50 pr-2">
                <span className="early-bird-emphasis early-bird-hot text-amber-300">
                  {coupon.discountPercent}% OFF
                </span>
                <span className="mx-1.5 text-white/40">·</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/90">Time left</span>{" "}
                <span className="font-mono text-base font-black tabular-nums text-white early-bird-hot">
                  {formatRemaining(remainingMs)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-amber-200/80 bg-white/10 px-3 py-2 hover:bg-white/15 transition"
                title="Copy coupon code"
              >
                <span className="font-mono text-lg font-black tracking-[0.14em] text-amber-200 early-bird-hot">
                  {coupon.code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-white/90">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          ) : (
            <>
              <ul className="space-y-1.5 text-[13px] font-bold leading-snug text-amber-50">
                <li className="flex gap-2">
                  <span className="text-amber-300 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>
                    <span className="early-bird-emphasis early-bird-hot text-amber-300">
                      Early Bird discount {EARLY_BIRD_DISCOUNT_PERCENT}%
                    </span>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-300 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>
                    discount ends on{" "}
                    <span className="text-amber-200 font-extrabold">{promoEndShort}</span>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-300 shrink-0" aria-hidden>
                    •
                  </span>
                  <span className="early-bird-emphasis early-bird-hot text-amber-300">
                    option to Schedule delivery
                  </span>
                </li>
              </ul>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="early-bird-claim-btn flex-1 rounded-full bg-accent px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-[0_0_0_3px_rgba(225,29,72,0.25)] hover:brightness-110 active:scale-[0.98] transition"
                >
                  {expanded ? "Close" : `Claim ${EARLY_BIRD_DISCOUNT_PERCENT}% OFF`}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="shrink-0 rounded-full p-2.5 text-white/75 hover:bg-white/15 hover:text-white"
                  aria-label="Dismiss Early Bird banner"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop: unchanged centered line + claim on the right */}
        <div className="relative hidden md:flex items-center justify-center gap-2 px-4 py-3.5 min-h-[3.85rem] pr-[11.5rem]">
          {hasLiveCoupon && coupon ? (
            <div className="min-w-0 w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-4 text-center">
              <p className="text-lg font-extrabold tracking-wide text-amber-50">
                <span className="early-bird-emphasis early-bird-hot text-amber-300">
                  {coupon.discountPercent}% OFF
                </span>
                <span className="mx-1.5 text-white/40">·</span>
                <span className="text-white/90">Your code</span>
              </p>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-200/80 bg-white/10 px-3 py-1.5 hover:bg-white/15 transition"
                title="Copy coupon code"
              >
                <span className="font-mono text-xl font-black tracking-[0.14em] text-amber-200 early-bird-hot">
                  {coupon.code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-white/90">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1.5 shadow-md shadow-accent/30">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/90">Time left</span>
                <span className="font-mono text-xl font-black tabular-nums text-white early-bird-hot">
                  {formatRemaining(remainingMs)}
                </span>
              </div>
            </div>
          ) : (
            <p className="min-w-0 w-full text-center text-[14px] md:text-[15px] font-bold leading-snug text-amber-50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
              <span className="early-bird-emphasis early-bird-hot text-amber-300">
                Early Bird discount {EARLY_BIRD_DISCOUNT_PERCENT}%
              </span>
              <span className="text-white/45 mx-1.5">·</span>
              <span>
                coupon code valid for{" "}
                <span className="text-white font-extrabold">{WELCOME_COUPON_HOURS} hour</span>
              </span>
              <span className="text-white/45 mx-1.5">·</span>
              <span>
                Early bird deal ends on{" "}
                <span className="text-amber-200 font-extrabold">{promoEndLabel}</span>
              </span>
              <span className="text-white/45 mx-1.5">·</span>
              <span className="early-bird-emphasis early-bird-hot text-amber-300">
                option to Schedule delivery
              </span>
            </p>
          )}

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="early-bird-claim-btn shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_0_0_3px_rgba(225,29,72,0.25)] hover:brightness-110 active:scale-[0.98] transition"
            >
              {expanded
                ? "Close"
                : hasLiveCoupon
                  ? "View details"
                  : `Claim ${EARLY_BIRD_DISCOUNT_PERCENT}% OFF`}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-full p-2 text-white/75 hover:bg-white/15 hover:text-white"
              aria-label="Dismiss Early Bird banner"
            >
              <svg className="w-[1.1rem] h-[1.1rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="relative border-b border-slate-200 bg-white shadow-xl">
          <ConfettiBurst active={phase === "done"} burstKey={burstKey} />
          <div className="max-w-3xl mx-auto px-4 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="shrink-0 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50 border border-slate-200 shadow-sm p-2">
                  <Image
                    src={site.logoSrc}
                    alt={site.name}
                    width={64}
                    height={28}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  Limited time · ends {promoEndLabel}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-primary leading-tight mt-1">
                  Early Bird Discount
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {EARLY_BIRD_DISCOUNT_PERCENT}% OFF · unique code valid {WELCOME_COUPON_HOURS} hour
                </p>
              </div>

              <div className="flex-1 min-w-0">
                {phase === "ended" ? (
                  <div>
                    <p className="text-lg font-bold text-primary mb-2">Early Bird has ended</p>
                    <p className="text-sm text-slate-600 mb-4">
                      This offer was available through {promoEndLabel}. Continue shopping for current Rakhi deals.
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="rounded-lg bg-primary text-white font-semibold text-sm px-5 py-2.5"
                    >
                      Continue shopping
                    </button>
                  </div>
                ) : phase === "blocked" ? (
                  <div>
                    <p className="text-lg font-bold text-primary mb-2">Already claimed today</p>
                    <p className="text-sm text-slate-600 mb-4">
                      Each mobile number can claim one Early Bird code per day. Your previous code may have expired —
                      try again tomorrow before {promoEndLabel}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="rounded-lg bg-primary text-white font-semibold text-sm px-5 py-2.5"
                    >
                      Continue shopping
                    </button>
                  </div>
                ) : phase === "done" && coupon ? (
                  <div>
                    <p className="text-sm uppercase tracking-wide text-accent font-bold mb-1">You&apos;re in!</p>
                    <p className="text-3xl sm:text-4xl font-bold text-primary mb-2">{coupon.discountPercent}% off</p>
                    <p className="text-sm text-slate-600 mb-3">
                      {coupon.reused
                        ? "Here’s your active Early Bird code:"
                        : `Your unique code is live for ${WELCOME_COUPON_HOURS} hour — use it at checkout:`}
                    </p>
                    <div className="rounded-xl border-2 border-dashed border-nav bg-gradient-to-b from-slate-50 to-amber-50/40 px-4 py-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-bold tracking-widest text-primary">{coupon.code}</p>
                        <button
                          type="button"
                          onClick={() => void copyCode()}
                          className="shrink-0 rounded-md border border-nav bg-white px-2.5 py-1.5 text-xs font-semibold text-nav hover:bg-blue-50"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Expires {formatCouponExpiry(coupon.expiresAt)}
                        {remainingMs > 0 ? ` · ${formatRemaining(remainingMs)} left` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 mb-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      You can <strong>schedule your delivery</strong> on the product page or at checkout — choose any
                      date through <strong>{scheduleMaxLabel}</strong>.
                    </p>
                    <Link
                      href="/products"
                      onClick={() => setExpanded(false)}
                      className="inline-block rounded-lg bg-accent text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 shadow-sm"
                    >
                      Shop with my discount
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-4">
                      Lock in <strong>{EARLY_BIRD_DISCOUNT_PERCENT}% OFF</strong> before {promoEndLabel}. After you
                      claim, you can <strong>schedule delivery</strong> for any date through {scheduleMaxLabel}.
                    </p>
                    <form onSubmit={claim} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Country code &amp; mobile number <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                          label=""
                          countryIso={countryIso}
                          localNumber={localNumber}
                          onCountryChange={setCountryIso}
                          onLocalNumberChange={setLocalNumber}
                          required
                          compact
                          disabled={phase === "submitting"}
                          placeholder="Mobile number"
                          selectClassName="border-slate-200 py-2.5 focus:outline-none focus:ring-2 focus:ring-nav"
                          inputClassName="border-slate-200 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nav"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="early-bird-marquee-email">
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="early-bird-marquee-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          disabled={phase === "submitting"}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nav disabled:opacity-60"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={phase === "submitting"}
                        className="w-full sm:w-auto rounded-lg bg-accent text-white font-bold text-sm px-6 py-3 hover:opacity-90 disabled:opacity-70 shadow-md shadow-accent/25"
                      >
                        {phase === "submitting"
                          ? "Generating your code…"
                          : `Claim ${EARLY_BIRD_DISCOUNT_PERCENT}% OFF`}
                      </button>
                      {error && <p className="text-red-500 text-xs">{error}</p>}
                    </form>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="mt-3 text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                    >
                      No thanks — continue without a discount
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
