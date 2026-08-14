/**
 * BACKUP — modal Early Bird popup (banner header).
 * Not mounted. To restore: import { EarlyBirdDiscountPopup } in HeaderShell
 * instead of (or above) EarlyBirdPromoMarquee.
 */
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
import { saveWelcomeCoupon, formatCouponExpiry } from "@/lib/welcome-coupon";
import { trackSessionHeartbeat } from "@/lib/track";
import { DEFAULT_COUNTRY_ISO } from "@/lib/country-codes";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PhoneInput, buildPhoneValue } from "@/components/PhoneInput";

const STORAGE_KEY = "blossompot_early_bird_shown";
const SHOW_AFTER_MS = 10_000;

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

type CouponResult = {
  code: string;
  expiresAt: string;
  discountPercent: number;
  reused?: boolean;
  alreadyClaimedToday?: boolean;
};

/** Early Bird Discount popup (replaces Spin the Wheel). */
export function EarlyBirdDiscountPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [localNumber, setLocalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "submitting" | "done" | "blocked" | "ended">(
    "idle"
  );
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!isEarlyBirdPromoActive()) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email") || pathname.startsWith("/checkout")) {
      return;
    }
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const TIMER_START_KEY = "blossompot_early_bird_timer_start";
    let startedAt = Number(sessionStorage.getItem(TIMER_START_KEY) || 0);
    if (!startedAt) {
      startedAt = Date.now();
      sessionStorage.setItem(TIMER_START_KEY, String(startedAt));
    }

    const remaining = Math.max(0, SHOW_AFTER_MS - (Date.now() - startedAt));
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      if (!isEarlyBirdPromoActive()) return;
      const path = window.location.pathname;
      if (path.startsWith("/admin") || path.startsWith("/ses-email") || path.startsWith("/checkout")) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
      trackSessionHeartbeat("early_bird_shown", SHOW_AFTER_MS, path);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [pathname]);

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

  const close = () => setOpen(false);

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
              trigger: "early_bird_popup",
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

  if (!open) return null;

  const promoEndLabel = formatPromoEnd(EARLY_BIRD_ENDS_DATE);
  const scheduleMaxLabel = formatPromoEnd(SCHEDULE_DELIVERY_MAX_DATE);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-[2px]"
      role="dialog"
      aria-label="Early Bird Discount"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <ConfettiBurst active={phase === "done"} burstKey={burstKey} />

        <div className="relative h-28 sm:h-32 overflow-hidden">
          <Image
            src="/banners/banner-2-connecting-hearts.png"
            alt="Premium Rakhi for USA delivery"
            fill
            className="object-cover object-center"
            sizes="512px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/75 to-primary/40" />
          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-white/90 hover:bg-white/15"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-0 px-5 pb-4 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
              Limited time · ends {promoEndLabel}
            </p>
            <h2 className="text-2xl font-bold leading-tight mt-0.5">Early Bird Discount</h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              {EARLY_BIRD_DISCOUNT_PERCENT}% OFF · unique code valid {WELCOME_COUPON_HOURS} hour
            </p>
          </div>
        </div>

        <div className="relative px-5 py-5">
          {phase === "ended" ? (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-primary mb-2">Early Bird has ended</p>
              <p className="text-sm text-slate-600 mb-4">
                This offer was available through {promoEndLabel}. Continue shopping for current Rakhi deals.
              </p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-primary text-white font-semibold text-sm px-5 py-2.5"
              >
                Continue shopping
              </button>
            </div>
          ) : phase === "blocked" ? (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-primary mb-2">Already claimed today</p>
              <p className="text-sm text-slate-600 mb-4">
                Each mobile number can claim one Early Bird code per day. Your previous code may have expired —
                try again tomorrow before {promoEndLabel}.
              </p>
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-primary text-white font-semibold text-sm px-5 py-2.5"
              >
                Continue shopping
              </button>
            </div>
          ) : phase === "done" && coupon ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-primary overflow-hidden p-1">
                <Image src={site.logoSrc} alt={site.name} width={48} height={20} className="object-contain" />
              </div>
              <p className="text-sm uppercase tracking-wide text-accent font-bold mb-1">You&apos;re in!</p>
              <p className="text-4xl font-bold text-primary mb-2">{coupon.discountPercent}% off</p>
              <p className="text-sm text-slate-600 mb-3">
                {coupon.reused
                  ? "Here’s your active Early Bird code:"
                  : `Your unique code is live for ${WELCOME_COUPON_HOURS} hour — use it at checkout:`}
              </p>
              <div className="rounded-xl border-2 border-dashed border-nav bg-gradient-to-b from-slate-50 to-amber-50/40 px-4 py-3 mb-3">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold tracking-widest text-primary">{coupon.code}</p>
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="shrink-0 rounded-md border border-nav bg-white px-2.5 py-1.5 text-xs font-semibold text-nav hover:bg-blue-50"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Expires {formatCouponExpiry(coupon.expiresAt)}</p>
              </div>
              <p className="text-sm text-slate-700 mb-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                You can <strong>schedule your delivery</strong> on the product page or at checkout — choose any
                date through <strong>{scheduleMaxLabel}</strong>.
              </p>
              <Link
                href="/products"
                onClick={close}
                className="inline-block rounded-lg bg-accent text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 shadow-sm"
              >
                Shop with my discount
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Lock in <strong>{EARLY_BIRD_DISCOUNT_PERCENT}% OFF</strong> before {promoEndLabel}. After you claim,
                you can <strong>schedule delivery</strong> for any date through {scheduleMaxLabel}.
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
                  <label className="block text-sm font-medium mb-1" htmlFor="early-bird-email">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="early-bird-email"
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
                  className="w-full rounded-lg bg-accent text-white font-bold text-sm py-3.5 hover:opacity-90 disabled:opacity-70 shadow-md shadow-accent/25"
                >
                  {phase === "submitting" ? "Generating your code…" : `Claim ${EARLY_BIRD_DISCOUNT_PERCENT}% OFF`}
                </button>
                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              </form>
              <button
                type="button"
                onClick={close}
                className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                No thanks — continue without a discount
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
