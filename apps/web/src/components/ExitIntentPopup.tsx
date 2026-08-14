"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DAILY_DEAL_SEGMENTS,
  DAILY_DEAL_WHEEL_LABELS,
  WELCOME_COUPON_HOURS,
  pickDailyDealDiscount,
} from "@blossompot/shared";
import { site } from "@/lib/site";
import { getOrCreateSessionId } from "@/lib/session";
import { api } from "@/lib/api";
import { saveWelcomeCoupon, formatCouponExpiry } from "@/lib/welcome-coupon";
import { trackSessionHeartbeat } from "@/lib/track";
import { DEFAULT_COUNTRY_ISO } from "@/lib/country-codes";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { PhoneInput, buildPhoneValue } from "@/components/PhoneInput";

const STORAGE_KEY = "blossompot_daily_deal_shown";
const SHOW_AFTER_MS = 10_000;
const SPIN_MS = 4200;

const SEGMENTS = [...DAILY_DEAL_SEGMENTS];
const WHEEL_LABELS = [...DAILY_DEAL_WHEEL_LABELS];
const SEGMENT_COLORS = [
  "#c23a6b",
  "#e5a23a",
  "#e07a9a",
  "#2f8f6b",
  "#9e2d55",
  "#e5a23a",
  "#c23a6b",
  "#2f8f6b",
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function segmentIndexForPercent(percent: number): number {
  const matches = SEGMENTS.map((p, i) => (p === percent ? i : -1)).filter((i) => i >= 0);
  if (matches.length === 0) return 0;
  return matches[Math.floor(Math.random() * matches.length)]!;
}

function rotationForSegment(index: number, extraSpins = 6): number {
  const slice = 360 / SEGMENTS.length;
  const centerOfSlice = index * slice;
  return extraSpins * 360 + ((360 - centerOfSlice) % 360);
}

type CouponResult = {
  code: string;
  expiresAt: string;
  discountPercent: number;
  reused?: boolean;
  alreadyClaimedToday?: boolean;
};

export function ExitIntentPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [localNumber, setLocalNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "spinning" | "celebrating" | "done" | "blocked"
  >("idle");
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [animateSpin, setAnimateSpin] = useState(false);
  const [wonPercent, setWonPercent] = useState<number | null>(null);
  const [burstKey, setBurstKey] = useState(0);

  const wheelGradient = useMemo(() => {
    const slice = 100 / SEGMENTS.length;
    const stops = SEGMENTS.map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      return `${color} ${i * slice}% ${(i + 1) * slice}%`;
    });
    return `conic-gradient(from -${180 / SEGMENTS.length}deg, ${stops.join(", ")})`;
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email") || pathname.startsWith("/checkout")) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const TIMER_START_KEY = "blossompot_daily_deal_timer_start";
    let startedAt = Number(sessionStorage.getItem(TIMER_START_KEY) || 0);
    if (!startedAt) {
      startedAt = Date.now();
      sessionStorage.setItem(TIMER_START_KEY, String(startedAt));
    }

    const remaining = Math.max(0, SHOW_AFTER_MS - (Date.now() - startedAt));
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      const path = window.location.pathname;
      if (path.startsWith("/admin") || path.startsWith("/ses-email") || path.startsWith("/checkout")) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
      trackSessionHeartbeat("daily_deal_shown", SHOW_AFTER_MS, path);
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

  const spin = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = buildPhoneValue(countryIso, localNumber);
    const trimmedEmail = email.trim();
    if (phase !== "idle") return;
    if (!isValidPhone(fullPhone)) {
      setError("Enter a valid mobile number to spin for today’s discount.");
      return;
    }
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError("Enter a valid email, or leave it blank.");
      return;
    }

    setError("");
    setCoupon(null);
    setPhase("spinning");

    const won = pickDailyDealDiscount();
    setWonPercent(won);
    const idx = segmentIndexForPercent(won);
    setAnimateSpin(true);
    setRotation((prev) => prev + rotationForSegment(idx, 7));

    const sessionId = getOrCreateSessionId();
    const spinStartedAt = Date.now();

    const couponPromise = api<{
      ok: boolean;
      coupon?: CouponResult;
    }>("/leads", {
      method: "POST",
      sessionId,
      body: JSON.stringify({
        sessionId,
        phone: fullPhone,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        page: pathname,
        source: "newsletter",
        metadata: {
          offer: "discount_of_the_day",
          trigger: "daily_deal_wheel",
          discountPercent: String(won),
        },
      }),
    });

    void (async () => {
      try {
        const remainingSpin = Math.max(0, SPIN_MS - (Date.now() - spinStartedAt));
        await new Promise((r) => window.setTimeout(r, remainingSpin));
        setAnimateSpin(false);

        // Firecracker / confetti — reveal discount % only here
        setBurstKey((k) => k + 1);
        setPhase("celebrating");

        const res = await couponPromise;

        if (!res.coupon) {
          setPhase("idle");
          setWonPercent(null);
          setError("Could not save your discount. Please try again.");
          return;
        }

        const result = res.coupon;
        const expired = new Date(result.expiresAt).getTime() < Date.now();

        if (result.alreadyClaimedToday && expired) {
          setCoupon(result);
          setWonPercent(null);
          setPhase("blocked");
          return;
        }

        if (result.discountPercent !== won) {
          setWonPercent(result.discountPercent);
          setAnimateSpin(true);
          const reuseIdx = segmentIndexForPercent(result.discountPercent);
          setRotation((prev) => prev + rotationForSegment(reuseIdx, 2));
          await new Promise((r) => window.setTimeout(r, 1600));
          setAnimateSpin(false);
          setBurstKey((k) => k + 1);
        }

        setCoupon(result);
        saveWelcomeCoupon({
          ...result,
          phone: fullPhone,
          ...(trimmedEmail ? { email: trimmedEmail } : {}),
        });

        await new Promise((r) => window.setTimeout(r, 900));
        setPhase("done");
      } catch (err) {
        setAnimateSpin(false);
        setWonPercent(null);
        setPhase("idle");
        setError(
          err instanceof Error
            ? err.message
            : "Could not spin right now. Try again or WhatsApp us."
        );
      }
    })();
  };

  if (!open) return null;

  const showWheel = phase === "idle" || phase === "spinning" || phase === "celebrating";
  const celebrating = phase === "celebrating";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-[2px]"
      role="dialog"
      aria-label="Discount of the Day"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <ConfettiBurst active={celebrating} burstKey={burstKey} />

        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#9e2d55] to-nav px-5 pt-4 pb-5 text-white">
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
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white/40 overflow-hidden p-1.5">
              <Image
                src={site.logoSrc}
                alt={site.name}
                width={40}
                height={40}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <div>
              <p className="font-display text-xl sm:text-2xl font-semibold leading-tight tracking-tight">
                {site.name}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100/95">
                blossompot.com · Gift offer · Today only
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-bold leading-tight mt-3">Discount of the Day</h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            Spin for a mystery gift discount · 1 spin / mobile / day · valid {WELCOME_COUPON_HOURS}h
          </p>
        </div>

        <div className="relative px-5 py-5">
          {phase === "blocked" ? (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-primary mb-2">You already spun today</p>
              <p className="text-sm text-slate-600 mb-4">
                Each mobile number gets one Discount of the Day spin per day. Come back tomorrow for another chance.
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
              <p className="text-sm uppercase tracking-wide text-accent font-bold mb-1">
                It&apos;s your lucky day!
              </p>
              <p className="text-4xl font-bold text-primary mb-1">{coupon.discountPercent}% off</p>
              <p className="text-sm font-semibold text-primary mb-2">
                You got the maximum discount
              </p>
              <p className="text-sm text-slate-600 mb-3">
                {coupon.reused
                  ? "Here’s your active Discount of the Day code:"
                  : `Your gift discount is valid for ${WELCOME_COUPON_HOURS} hour — use it at checkout:`}
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
              <p className="text-xs text-slate-500 mb-4">
                {email.trim()
                  ? "Also sent to your email when available."
                  : "Use this code at checkout with the same mobile number."}
              </p>
              <Link
                href="/products"
                onClick={close}
                className="inline-block rounded-lg bg-accent text-white font-semibold text-sm px-5 py-2.5 hover:opacity-90 shadow-sm"
              >
                Shop gifts with my discount
              </Link>
            </div>
          ) : showWheel ? (
            <>
              <div className="relative mx-auto mb-4 w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]">
                <div
                  className="absolute -inset-1 rounded-full opacity-90"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #e5a23a, #c23a6b, #e5a23a, #2f8f6b, #e5a23a, #e07a9a, #e5a23a)",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 rounded-full bg-white" aria-hidden />

                <div className="absolute left-1/2 -top-0.5 z-30 -translate-x-1/2 drop-shadow-md" aria-hidden>
                  <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-accent" />
                </div>

                <div
                  className="absolute inset-[6px] rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.25)] border-[3px] border-amber-200/80"
                  style={{
                    background: wheelGradient,
                    transform: `rotate(${rotation}deg)`,
                    transition: animateSpin
                      ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.18, 1)`
                      : undefined,
                    boxShadow: "0 8px 28px rgba(194,58,107,0.28)",
                  }}
                >
                  {WHEEL_LABELS.map((label, i) => {
                    const slice = 360 / WHEEL_LABELS.length;
                    const angle = i * slice;
                    return (
                      <div
                        key={`${label}-${i}`}
                        className="absolute inset-0 pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <span
                          className="absolute left-1/2 top-[16%] whitespace-nowrap text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide text-white"
                          style={{
                            transform: `translateX(-50%) rotate(${slice / 2 - angle}deg)`,
                            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="flex h-[84px] w-[84px] sm:h-24 sm:w-24 flex-col items-center justify-center rounded-full bg-white border-[3px] border-primary shadow-lg ring-2 ring-amber-300/70 overflow-hidden px-2 py-1.5">
                    <Image
                      src={site.logoSrc}
                      alt={site.name}
                      width={72}
                      height={28}
                      className="h-auto w-full max-w-[68px] object-contain"
                    />
                    <span className="mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-primary leading-none">
                      BlossomPot
                    </span>
                  </div>
                </div>
              </div>

              {celebrating && wonPercent != null ? (
                <div className="text-center space-y-3 mb-1">
                  <p className="text-lg sm:text-xl font-bold text-primary animate-bounce">
                    It&apos;s your lucky day — you got the maximum discount!
                  </p>
                  <p className="text-2xl font-bold text-accent">{wonPercent}% off</p>
                  <p className="text-sm text-slate-600">Generating your discount coupon…</p>
                  <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
                  </div>
                </div>
              ) : (
                <form onSubmit={spin} className="space-y-3">
                  <PhoneInput
                    label=""
                    countryIso={countryIso}
                    localNumber={localNumber}
                    onCountryChange={setCountryIso}
                    onLocalNumberChange={setLocalNumber}
                    required
                    compact
                    disabled={phase === "spinning"}
                    placeholder="Mobile number"
                    selectClassName="border-slate-200 py-2.5 focus:outline-none focus:ring-2 focus:ring-nav"
                    inputClassName="border-slate-200 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nav"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Share email to get coupon on email (optional)"
                    disabled={phase === "spinning"}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nav disabled:opacity-60"
                  />
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={close}
                      disabled={phase === "spinning"}
                      className="w-full sm:w-auto sm:min-w-[7.5rem] rounded-lg border-2 border-slate-300 bg-white text-slate-700 font-bold text-sm py-3.5 px-4 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-70"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={phase === "spinning"}
                      className="w-full flex-1 rounded-lg bg-accent text-white font-bold text-sm py-3.5 hover:opacity-90 disabled:opacity-70 shadow-md shadow-accent/25"
                    >
                      {phase === "spinning" ? "Spinning…" : "Spin the wheel"}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
