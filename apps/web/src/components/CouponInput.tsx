"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSessionId } from "@/lib/session";
import { formatCouponExpiry } from "@/lib/welcome-coupon";
import {
  applyPercentDiscount,
  applyTrialPayableDiscount,
  isTrialCouponKind,
  trialTargetPayable,
} from "@blossompot/shared";

type Props = {
  email: string;
  phone?: string;
  /** Subtotal coupons may discount (excludes flash-sale / couponExcluded lines). */
  subtotal: number;
  /** Merchandise + shipping (+ tax) before coupon — used for trial $1 codes. */
  payableBeforeDiscount?: number;
  currency: "USD" | "INR";
  usdInrRate?: number;
  formatMoney: (amount: number, currency: "USD" | "INR") => string;
  initialCode?: string;
  /** When true, flash-sale lines are in the cart — coupons skip those lines. */
  hasCouponExcludedItems?: boolean;
  onApplied: (discount: number, code: string) => void;
  onCleared: () => void;
};

export function CouponInput({
  email,
  phone = "",
  subtotal,
  payableBeforeDiscount,
  currency,
  usdInrRate = 0,
  formatMoney,
  initialCode = "",
  hasCouponExcludedItems = false,
  onApplied,
  onCleared,
}: Props) {
  const sessionId = useSessionId();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discountPercent: number;
    expiresAt: string;
    discountAmount: number;
    trial?: boolean;
  } | null>(null);

  const apply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const hasEmail = Boolean(email.trim() && email.includes("@"));
    const hasPhone = phone.replace(/\D/g, "").length >= 7;
    if (!hasEmail && !hasPhone) {
      setError("Enter your mobile number or email in the shipping form first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api<{
        valid: boolean;
        code?: string;
        discountPercent?: number;
        expiresAt?: string;
        error?: string;
        kind?: "percent" | "trial";
        targetUsd?: number;
      }>("/coupons/validate", {
        method: "POST",
        sessionId: sessionId ?? undefined,
        body: JSON.stringify({
          code: trimmed,
          ...(hasEmail ? { email: email.trim() } : {}),
          ...(hasPhone ? { phone: phone.trim() } : {}),
        }),
      });

      if (!result.valid || !result.code) {
        throw new Error(result.error ?? "Invalid coupon");
      }

      const trial = isTrialCouponKind(result.kind);
      if (!trial && (!result.discountPercent || subtotal <= 0)) {
        throw new Error(
          subtotal <= 0 ? "Coupons cannot be applied to flash sale items" : result.error ?? "Invalid coupon"
        );
      }

      const discountAmount = trial
        ? applyTrialPayableDiscount(
            payableBeforeDiscount ?? subtotal,
            trialTargetPayable(currency, usdInrRate)
          )
        : applyPercentDiscount(subtotal, result.discountPercent!);
      setApplied({
        code: result.code,
        discountPercent: result.discountPercent ?? 0,
        expiresAt: result.expiresAt ?? "",
        discountAmount,
        trial,
      });
      onApplied(discountAmount, result.code);
    } catch (err) {
      setApplied(null);
      onCleared();
      setError(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    setApplied(null);
    setError("");
    onCleared();
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
      <p className="text-sm font-semibold text-slate-900">Coupon code</p>
      <p className="text-xs text-slate-500">
        One coupon can be applied per order.
        {hasCouponExcludedItems
          ? " Flash sale items are excluded from coupon discounts."
          : ""}
      </p>
      {applied ? (
        <div className="text-sm space-y-1">
          <p className="text-green-700 font-medium">
            {applied.trial
              ? `${applied.code} applied — order total set to ${formatMoney(
                  (payableBeforeDiscount ?? subtotal) - applied.discountAmount,
                  currency
                )} for testing`
              : `${applied.code} applied — ${applied.discountPercent}% off (−${formatMoney(applied.discountAmount, currency)})`}
          </p>
          {applied.expiresAt && (
            <p className="text-xs text-slate-500">Expires {formatCouponExpiry(applied.expiresAt)}</p>
          )}
          <button type="button" onClick={remove} className="text-xs text-nav hover:underline">
            Remove coupon
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GIFT-XXXXXX or TRIAL-XXXXXX"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
            />
            <button
              type="button"
              onClick={() => void apply()}
              disabled={loading || !code.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "…" : "Apply"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </>
      )}
    </div>
  );
}
