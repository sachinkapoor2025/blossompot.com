"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useAuth, useApiClient } from "@/lib/auth-context";
import { useCurrency, type DisplayCurrency } from "@/lib/currency-context";
import { useSessionId, useDebouncedLeadCapture, useLeadCapture } from "@/lib/session";
import { trackCheckoutStart, trackPurchase } from "@/lib/track";
import { getAttributionSnapshotForCheckout } from "@/lib/attribution-store";
import Script from "next/script";
import { PaymentMethodPicker, type PaymentMethod } from "@/components/PaymentMethodPicker";
import { ShippingAddressForm } from "@/components/ShippingAddressForm";
import { SecureCheckoutBadge } from "@/components/SecureCheckoutBadge";
import { CheckoutLegalNotice } from "@/components/CheckoutLegalNotice";
import { TrustBadges } from "@/components/TrustBadges";
import { CouponInput } from "@/components/CouponInput";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { RazorpayQrPanel } from "@/components/RazorpayQrPanel";
import { EstimatedDeliveryNote } from "@/components/EstimatedDeliveryNote";
import { ScheduleDeliveryPicker } from "@/components/ScheduleDeliveryPicker";
import { FreeShippingNotice } from "@/components/FreeShippingNotice";
import { RecipientAddressFields } from "@/components/RecipientAddressFields";
import { loadWelcomeCoupon } from "@/lib/welcome-coupon";
import { loadPreferredDeliveryDate } from "@/lib/preferred-delivery";
import {
  emptyShippingAddress,
  loadSavedAddresses,
  saveShippingAddress,
} from "@/lib/shipping-address";
import {
  buildCheckoutShipmentsFromUnits,
  expandCartToDeliveryUnits,
  quoteShippingFromDeliveryUnits,
  validateDeliveryUnits,
  type DeliveryUnit,
} from "@/lib/checkout-shipments";
import { fetchAccount, createAccountAddress } from "@/lib/account";
import {
  ORDER_STATUS,
  isValidShippingPhone,
  DEFAULT_SENDER_MESSAGE,
  quoteFreeShippingThreshold,
  shippingVendorKey,
  cartLineUnitTotal,
  cartHasCouponExcludedItems,
  isFlashComboProduct,
  type Order,
  type RateQuote,
  type ShippingAddress,
} from "@blossompot/shared";
import { resolveImageUrl } from "@/lib/images";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-600">Loading checkout…</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryOrderId = searchParams.get("orderId");
  const { cart, loading: cartLoading, refresh } = useCart();
  const { user, token } = useAuth();
  const { format, displayCurrency, convert, usdInrRate } = useCurrency();
  const sessionId = useSessionId();
  const captureLeadDebounced = useDebouncedLeadCapture(sessionId);
  const captureLeadNow = useLeadCapture(sessionId);
  const apiClient = useApiClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [savedCouponCode, setSavedCouponCode] = useState("");
  const [stripeCheckout, setStripeCheckout] = useState<{ clientSecret: string; orderId: string } | null>(
    null
  );
  const [razorpayPayment, setRazorpayPayment] = useState<{
    order: Order;
    razorpayOrderId: string;
    razorpayKeyId?: string;
    qrImageUrl?: string;
  } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [razorpayScriptKey, setRazorpayScriptKey] = useState(0);
  const [razorpayLoadError, setRazorpayLoadError] = useState("");
  const [openingRazorpay, setOpeningRazorpay] = useState(false);
  const [retryOrder, setRetryOrder] = useState<Order | null>(null);
  const [retryLoading, setRetryLoading] = useState(Boolean(retryOrderId));
  const [address, setAddress] = useState<ShippingAddress>(emptyShippingAddress);
  const [saveForLater, setSaveForLater] = useState(true);
  const [deliveryUnits, setDeliveryUnits] = useState<DeliveryUnit[]>([]);
  const addressPrefilled = useRef(false);
  const addressRef = useRef(address);
  addressRef.current = address;

  useEffect(() => {
    if (retryOrderId || cartLoading) return;
    const items = cart?.items ?? [];
    setDeliveryUnits((prev) => expandCartToDeliveryUnits(items, prev));
  }, [cart?.items, cartLoading, retryOrderId]);

  type ShippingQuoteState = {
    selected?: RateQuote;
    settingsMode: "free" | "pass_through";
    customerCharge: number;
  };
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteState>({
    settingsMode: "free",
    customerCharge: 0,
  });
  const ratesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAddressReadyForRates = useCallback((a: ShippingAddress) => {
    return Boolean(
      a.line1.trim() &&
        a.city.trim() &&
        a.state.trim() &&
        a.postalCode.trim() &&
        a.country.trim().length >= 2
    );
  }, []);

  useEffect(() => {
    if (retryOrder || !sessionId || cartLoading || !cart?.items.length) return;

    if (!isAddressReadyForRates(address)) {
      setShippingQuote({ settingsMode: "free", customerCharge: 0 });
      return;
    }

    if (ratesTimerRef.current) clearTimeout(ratesTimerRef.current);
    ratesTimerRef.current = setTimeout(() => {
      const a = addressRef.current;
      const params = new URLSearchParams({
        line1: a.line1.trim(),
        city: a.city.trim(),
        state: a.state.trim(),
        postalCode: a.postalCode.trim(),
        country: (a.country || "US").trim(),
      });
      if (a.line2?.trim()) params.set("line2", a.line2.trim());

      void apiClient<{
        rates: RateQuote[];
        selected?: RateQuote;
        customerShippingCharge?: number;
        settingsSnapshot?: { mode: "free" | "pass_through" };
      }>(`/shipping/rates?${params.toString()}`)
        .then((data) => {
          const mode = data.settingsSnapshot?.mode ?? "free";
          const selected = data.selected;
          const customerCharge =
            mode === "pass_through"
              ? (data.customerShippingCharge ?? selected?.price ?? 0)
              : (data.customerShippingCharge ?? 0);
          setShippingQuote({ selected, settingsMode: mode, customerCharge });
        })
        .catch(() => {
          setShippingQuote({ settingsMode: "free", customerCharge: 0 });
        });
    }, 600);

    return () => {
      if (ratesTimerRef.current) clearTimeout(ratesTimerRef.current);
    };
  }, [
    address.line1,
    address.city,
    address.state,
    address.postalCode,
    address.country,
    address.line2,
    sessionId,
    cartLoading,
    cart?.items.length,
    retryOrder,
    apiClient,
    isAddressReadyForRates,
  ]);

  useEffect(() => {
    if (displayCurrency === "INR") setPaymentMethod("razorpay");
    else if (displayCurrency === "USD") setPaymentMethod("stripe");
    setStripeCheckout(null);
    setRazorpayPayment(null);
  }, [displayCurrency]);

  const markRazorpayReady = useCallback(() => {
    setRazorpayReady(true);
    setRazorpayLoadError("");
  }, []);

  const retryRazorpayScript = useCallback(() => {
    setRazorpayReady(false);
    setRazorpayLoadError("");
    setRazorpayScriptKey((k) => k + 1);
  }, []);

  // Razorpay checkout.js can fail silently (ad blockers, flaky mobile data) or
  // skip onLoad when already cached — without a fallback the Pay button stays
  // on "Loading payment…" forever (customer reports we couldn't reproduce).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      markRazorpayReady();
      return;
    }

    let cancelled = false;
    const started = Date.now();
    const poll = window.setInterval(() => {
      if (cancelled) return;
      if (window.Razorpay) {
        markRazorpayReady();
        window.clearInterval(poll);
        return;
      }
      if (Date.now() - started >= 12_000) {
        window.clearInterval(poll);
        setRazorpayLoadError(
          "Payment is taking too long to load. Check your connection or turn off ad blockers, then retry."
        );
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [razorpayScriptKey, markRazorpayReady]);

  useEffect(() => {
    const stored = loadWelcomeCoupon();
    if (stored?.code) setSavedCouponCode(stored.code);
  }, []);

  useEffect(() => {
    if (!retryOrderId || !sessionId) {
      setRetryLoading(false);
      return;
    }
    setRetryLoading(true);
    api<{ order: Order }>(`/orders/${retryOrderId}`, { sessionId, token })
      .then((data) => {
        if (data.order.status !== ORDER_STATUS.PENDING_PAYMENT) {
          router.replace(`/orders/${retryOrderId}`);
          return;
        }
        setRetryOrder(data.order);
        if (data.order.shippingAddress) {
          const sa = data.order.shippingAddress;
          setAddress({
            ...sa,
            phone: sa.phone ?? "",
            senderName: sa.senderName ?? "",
            senderMessage: sa.senderMessage?.trim() || DEFAULT_SENDER_MESSAGE,
          });
        }
        if (data.order.paymentProvider === "razorpay") setPaymentMethod("razorpay");
        else if (data.order.paymentProvider === "stripe") setPaymentMethod("stripe");
        if (data.order.discount > 0) {
          setDiscount(data.order.discount);
          if (data.order.couponCode) setAppliedCouponCode(data.order.couponCode);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load order for retry"))
      .finally(() => setRetryLoading(false));
  }, [retryOrderId, sessionId, token, router]);

  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !cart?.items.length) return;
    checkoutTracked.current = true;
    const value = cart.items.reduce((sum, item) => {
      const lineCurrency = (item.currency ?? "USD") as DisplayCurrency;
      return sum + convert(cartLineUnitTotal(item) * item.quantity, lineCurrency);
    }, 0);
    trackCheckoutStart(value);
  }, [cart, convert]);

  useEffect(() => {
    if (addressPrefilled.current || !sessionId) return;

    const prefill = async () => {
      if (token) {
        try {
          const account = await fetchAccount(token, sessionId);
          if (account.profile.preferredPaymentMethod) {
            setPaymentMethod(account.profile.preferredPaymentMethod);
          }
          const defaultAddress =
            account.addresses.find((a) => a.isDefault) ?? account.addresses[0];
          if (defaultAddress) {
            setAddress({
              name: defaultAddress.name,
              line1: defaultAddress.line1,
              line2: defaultAddress.line2,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
              phone: defaultAddress.phone ?? "",
              email: defaultAddress.email || user?.email || "",
              senderName: defaultAddress.senderName ?? "",
              senderMessage: defaultAddress.senderMessage?.trim() || DEFAULT_SENDER_MESSAGE,
            });
            addressPrefilled.current = true;
            return;
          }
        } catch {
          // fall through to local storage
        }
      }

      const saved = loadSavedAddresses();
      if (saved.length > 0) {
        const latest = saved[0];
        setAddress({
          name: latest.name,
          line1: latest.line1,
          line2: latest.line2,
          city: latest.city,
          state: latest.state,
          postalCode: latest.postalCode,
          country: latest.country,
          phone: latest.phone ?? "",
          email: latest.email || user?.email || "",
          senderName: latest.senderName ?? "",
          senderMessage: latest.senderMessage?.trim() || DEFAULT_SENDER_MESSAGE,
        });
        addressPrefilled.current = true;
        return;
      }

      if (token) {
        try {
          const data = await api<{ orders: Order[] }>("/orders", { sessionId, token });
          const latest = data.orders[0];
          if (latest?.shippingAddress) {
            const sa = latest.shippingAddress;
            setAddress({
              ...sa,
              phone: sa.phone ?? "",
              senderName: sa.senderName ?? "",
              senderMessage: sa.senderMessage?.trim() || DEFAULT_SENDER_MESSAGE,
            });
            addressPrefilled.current = true;
            return;
          }
        } catch {
          // ignore
        }
      }

      if (user?.email) {
        setAddress((a) => ({ ...a, email: user.email }));
      }
      addressPrefilled.current = true;
    };

    void prefill();
  }, [user, token, sessionId]);

  const captureField = (field: string, value: string) => {
    const a = addressRef.current;
    captureLeadDebounced({
      name: field === "name" ? value : a.name,
      email: field === "email" ? value : a.email,
      phone: field === "phone" ? value : a.phone,
      page: "/checkout",
      source: "checkout",
    });
  };

  const openRazorpayCheckout = async (order: Order, razorpayOrderId: string, razorpayKeyId?: string) => {
    const key = razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key || razorpayOrderId.includes("_dev_")) {
      trackPurchase(order.total, {
        orderId: order.orderId,
        provider: "razorpay_dev",
        currency: order.currency,
      });
      await refresh();
      router.push(`/orders/${order.orderId}?dev=1`);
      return;
    }

    if (typeof window.Razorpay === "undefined") {
      throw new Error("Razorpay checkout failed to load. Please refresh and try again.");
    }

    setOpeningRazorpay(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key,
          amount: Math.round(order.total * 100),
          currency: order.currency,
          name: "BlossomPot",
          description: `Order ${order.orderId.slice(0, 8)}`,
          order_id: razorpayOrderId,
          prefill: {
            name: address.name,
            email: address.email,
            contact: address.phone || undefined,
          },
          theme: { color: "#183a68" },
          config: {
            display: {
              preferences: { show_default_blocks: true },
            },
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await api("/payments/razorpay/verify", {
                method: "POST",
                sessionId,
                token,
                body: JSON.stringify({
                  orderId: order.orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              trackPurchase(order.total, {
                orderId: order.orderId,
                provider: "razorpay",
                currency: order.currency,
              });
              await refresh();
              resolve();
              router.push(`/orders/${order.orderId}`);
            } catch (verifyErr) {
              // Payment may already be captured; webhook/reconcile can still mark paid.
              try {
                for (let i = 0; i < 8; i++) {
                  await new Promise((r) => setTimeout(r, 1500));
                  const res = await api<{ order: Order }>(`/orders/${order.orderId}`, {
                    sessionId,
                    token,
                  });
                  if (res.order.status !== "pending_payment") {
                    trackPurchase(order.total, {
                      orderId: order.orderId,
                      provider: "razorpay",
                      currency: order.currency,
                    });
                    await refresh();
                    resolve();
                    router.push(`/orders/${order.orderId}`);
                    return;
                  }
                }
              } catch {
                /* fall through */
              }
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });

        rzp.on("payment.failed", (response) => {
          reject(new Error(response.error?.description ?? "Payment failed"));
        });

        rzp.open();
      });
    } finally {
      setOpeningRazorpay(false);
    }
  };

  const startRazorpayPayment = async (
    order: Order,
    razorpayOrderId: string,
    razorpayKeyId?: string,
    qrImageUrl?: string
  ) => {
    if (qrImageUrl && order.currency === "INR") {
      setRazorpayPayment({ order, razorpayOrderId, razorpayKeyId, qrImageUrl });
      return;
    }
    await openRazorpayCheckout(order, razorpayOrderId, razorpayKeyId);
  };

  const persistAddressIfNeeded = async () => {
    if (!saveForLater) return;

    const payload = {
      ...address,
      country: "US" as const,
      label: address.name,
      isDefault: true,
      phone: address.phone.trim(),
      senderName: address.senderName?.trim() || undefined,
      senderMessage: address.senderMessage?.trim() || undefined,
      ...(address.line2?.trim() ? { line2: address.line2.trim() } : { line2: undefined }),
    };

    if (token && sessionId) {
      try {
        const account = await fetchAccount(token, sessionId);
        const exists = account.addresses.some(
          (a) =>
            a.line1 === address.line1 &&
            a.city === address.city &&
            a.state === address.state &&
            a.postalCode === address.postalCode &&
            a.name === address.name
        );
        if (!exists) {
          await createAccountAddress(token, sessionId, payload);
        }
        return;
      } catch {
        // fall back to local storage
      }
    }

    saveShippingAddress(address);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (retryOrder) {
        const data = await api<{
          order: Order;
          clientSecret?: string;
          razorpayOrderId?: string;
          razorpayKeyId?: string;
          razorpayQrImageUrl?: string;
        }>(`/orders/${retryOrder.orderId}/retry-payment`, {
          method: "POST",
          sessionId,
          token,
          body: JSON.stringify({ paymentMethod }),
        });

        if (paymentMethod === "stripe") {
          const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
          if (!stripeKey) throw new Error("Stripe is not configured.");
          if (!data.clientSecret || data.clientSecret.includes("_dev_")) {
            throw new Error("Stripe payment could not be started.");
          }
          setStripeCheckout({ clientSecret: data.clientSecret, orderId: data.order.orderId });
          setRetryOrder(data.order);
          return;
        }

        if (!data.razorpayOrderId) throw new Error("Razorpay could not be started.");
        await startRazorpayPayment(
          data.order,
          data.razorpayOrderId,
          data.razorpayKeyId,
          data.razorpayQrImageUrl
        );
        return;
      }

      const senderName = address.senderName?.trim() ?? "";
      const senderMessage = address.senderMessage?.trim() ?? "";
      const phone = address.phone?.trim() ?? "";
      if (!senderName) {
        throw new Error("Please enter your name (sender) so the recipient knows who sent the gift.");
      }
      if (senderMessage.length < 10) {
        throw new Error("Please write a short message for your brother (it will appear on the shipping label).");
      }
      if (!isValidShippingPhone(phone)) {
        throw new Error(
          "Please enter a valid mobile number (select country code, then enter your number)."
        );
      }

      const payload: ShippingAddress = {
        ...address,
        country: "US",
        phone,
        senderName,
        senderMessage,
        ...(address.line2?.trim() ? { line2: address.line2.trim() } : { line2: undefined }),
      };

      const unitsError = validateDeliveryUnits(deliveryUnits, payload);
      if (unitsError) throw new Error(unitsError);

      const shipments = buildCheckoutShipmentsFromUnits(deliveryUnits, payload);

      await captureLeadNow({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        page: "/checkout",
        source: "checkout",
      });

      const data = await api<{
        order: Order;
        clientSecret?: string;
        razorpayOrderId?: string;
        razorpayKeyId?: string;
        razorpayQrImageUrl?: string;
      }>("/checkout", {
        method: "POST",
        sessionId,
        token,
        body: JSON.stringify({
          paymentMethod,
          checkoutCurrency: displayCurrency,
          ...(displayCurrency === "INR" ? { usdInrRate } : {}),
          shippingAddress: payload,
          shipments,
          attribution: getAttributionSnapshotForCheckout(),
          ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
          ...(() => {
            const preferredDeliveryDate = loadPreferredDeliveryDate();
            return preferredDeliveryDate ? { preferredDeliveryDate } : {};
          })(),
          ...(shippingQuote.selected
            ? {
                shippingServiceCode: shippingQuote.selected.mailClass,
                shippingRateId: shippingQuote.selected.rateId,
              }
            : {}),
        }),
      });

      await persistAddressIfNeeded();
      // Keep pending order for retry if Razorpay/Stripe is dismissed (avoids "Cart is empty").
      setRetryOrder(data.order);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("orderId", data.order.orderId);
        window.history.replaceState({}, "", url.toString());
      }

      if (paymentMethod === "stripe") {
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
        if (!stripeKey) {
          throw new Error("Stripe is not configured. Contact support or pay with Razorpay (INR).");
        }
        if (!data.clientSecret || data.clientSecret.includes("_dev_")) {
          throw new Error(
            "Stripe payment could not be started. Ensure STRIPE_SECRET_KEY is set on the API and redeploy."
          );
        }
        setStripeCheckout({ clientSecret: data.clientSecret, orderId: data.order.orderId });
        return;
      }

      if (!data.razorpayOrderId) {
        throw new Error("Razorpay could not be started. Check payment configuration and try again.");
      }

      await startRazorpayPayment(
        data.order,
        data.razorpayOrderId,
        data.razorpayKeyId,
        data.razorpayQrImageUrl
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      setError(message);
      // After cancel/fail, reload cart so items stay visible for another attempt.
      void refresh();
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading || retryLoading) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-600">Loading checkout...</div>;
  }

  const isRetry = Boolean(retryOrder);
  const checkoutItems = isRetry ? retryOrder!.items : cart?.items ?? [];

  if (!checkoutItems.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">Your cart is empty.</p>
        <Link href="/products" className="text-nav font-semibold hover:underline">
          Continue shopping →
        </Link>
      </div>
    );
  }

  const cartCurrency = (checkoutItems[0]?.currency ?? "USD") as DisplayCurrency;
  /** Subtotal in the shopper's selected display currency (matches cart page). */
  const displaySubtotal = isRetry
    ? retryOrder!.subtotal
    : checkoutItems.reduce((sum, item) => {
        const lineCurrency = (item.currency ?? cartCurrency) as DisplayCurrency;
        return sum + convert(cartLineUnitTotal(item) * item.quantity, lineCurrency);
      }, 0);
  const couponEligibleDisplaySubtotal = isRetry
    ? displaySubtotal
    : checkoutItems.reduce((sum, item) => {
        if (item.couponExcluded || isFlashComboProduct(item.productSlug)) return sum;
        const lineCurrency = (item.currency ?? cartCurrency) as DisplayCurrency;
        return sum + convert(cartLineUnitTotal(item) * item.quantity, lineCurrency);
      }, 0);
  const hasCouponExcludedLines =
    !isRetry && cartHasCouponExcludedItems(checkoutItems);
  const itemCount = checkoutItems.reduce((sum, i) => sum + i.quantity, 0);
  const multiShippingQuote = isRetry
    ? { totalCharge: retryOrder!.shipping, perShipment: [] as ReturnType<typeof quoteShippingFromDeliveryUnits>["perShipment"] }
    : quoteShippingFromDeliveryUnits(
        deliveryUnits.map((u) => ({
          ...u,
          price: convert(u.price, cartCurrency),
        })),
        address,
        displayCurrency,
        usdInrRate
      );
  const freeShippingQuote =
    multiShippingQuote.perShipment.find((q) => !q.qualifiesForFreeShipping) ??
    multiShippingQuote.perShipment[0] ??
    quoteFreeShippingThreshold({
      subtotal: displaySubtotal,
      currency: displayCurrency,
      usdInrRate,
    });
  /** Prefer per-delivery threshold for free mode so shipping shows before address rates load. */
  const shippingCharge = isRetry
    ? retryOrder!.shipping
    : shippingQuote.settingsMode === "pass_through"
      ? shippingQuote.customerCharge
      : multiShippingQuote.totalCharge;
  const orderTotal = isRetry
    ? retryOrder!.total
    : Math.max(0, displaySubtotal - discount + shippingCharge);
  const showSplitDelivery = !isRetry && deliveryUnits.length > 1;
  const chargedShipmentCount = multiShippingQuote.perShipment.filter((q) => q.charge > 0).length;
  const mixedVendors =
    !isRetry &&
    new Set(checkoutItems.map((i) => shippingVendorKey(i))).size > 1;
  const showMixedVendorShippingException =
    mixedVendors && multiShippingQuote.perShipment.some((q) => q.charge > 0);
  const showMultiGroupShippingNotice =
    !showMixedVendorShippingException && multiShippingQuote.perShipment.length > 1;

  const shippingDetailLine = isRetry
    ? null
    : (() => {
        const selected = shippingQuote.selected;
        const serviceName = selected?.serviceName ?? "Standard shipping";
        const deliveryHint = selected?.estimatedDeliveryDate
          ? ` · arrives by ${new Date(selected.estimatedDeliveryDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}`
          : "";
        if (shippingCharge <= 0) {
          return `${serviceName}${deliveryHint} (FREE)`;
        }
        return `${serviceName}${deliveryHint}`;
      })();

  return (
    <>
      <Script
        key={razorpayScriptKey}
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={markRazorpayReady}
        onError={() =>
          setRazorpayLoadError(
            "Could not load Razorpay. Disable ad blockers or try another network, then tap Retry."
          )
        }
      />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
        {isRetry && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Retrying payment for order <span className="font-mono">{retryOrder!.orderId.slice(0, 8)}…</span>
          </p>
        )}
        <EstimatedDeliveryNote variant="banner" prefix="Estimated delivery:" className="mb-6" />
        {!isRetry && <ScheduleDeliveryPicker className="mb-6" />}

        <form
          onSubmit={handleCheckout}
          className="grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-8 lg:gap-10 items-start"
        >
          <div className="space-y-6">
            <ShippingAddressForm
              value={address}
              onChange={setAddress}
              onFieldLeadCapture={captureField}
              saveForLater={saveForLater}
              onSaveForLaterChange={setSaveForLater}
            />

            {showSplitDelivery && (
              <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Deliver each gift</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    By default every gift ships to the address above. Uncheck “Same address” to send
                    a gift to a different US location. Per address: under $8 is $6.99, $8–$13.99 is
                    $3.99, and above $13.99 ships free.
                  </p>
                </div>
                <ul className="space-y-4">
                  {deliveryUnits.map((unit, index) => (
                    <li
                      key={unit.key}
                      className="rounded-lg border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex gap-3 items-start">
                        {unit.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(unit.image)}
                            alt=""
                            className="w-14 h-14 rounded-md object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-md bg-slate-100 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-500">
                            Gift {index + 1} of {deliveryUnits.length}
                          </p>
                          <p className="font-semibold text-slate-900 line-clamp-2">{unit.name}</p>
                          <p className="text-sm text-accent font-medium mt-0.5">
                            {format(convert(unit.price, cartCurrency), displayCurrency)}
                          </p>
                        </div>
                      </div>
                      <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.useSameAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDeliveryUnits((prev) =>
                              prev.map((u) =>
                                u.key === unit.key
                                  ? {
                                      ...u,
                                      useSameAddress: checked,
                                      address: checked
                                        ? u.address
                                        : {
                                            ...emptyShippingAddress(),
                                            email: address.email,
                                            phone: address.phone,
                                            senderName: address.senderName,
                                            senderMessage: address.senderMessage,
                                          },
                                    }
                                  : u
                              )
                            );
                          }}
                          className="mt-0.5 rounded border-slate-300 text-nav focus:ring-accent"
                        />
                        <span>
                          Send this gift to the same address
                          <span className="block text-xs text-slate-500 mt-0.5">
                            Uncheck to enter a different delivery address
                          </span>
                        </span>
                      </label>
                      {!unit.useSameAddress && (
                        <RecipientAddressFields
                          value={unit.address}
                          onChange={(next) =>
                            setDeliveryUnits((prev) =>
                              prev.map((u) => (u.key === unit.key ? { ...u, address: next } : u))
                            )
                          }
                          title={`Address for gift ${index + 1}`}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="border border-slate-200 rounded-lg bg-white p-5 sm:p-6 lg:sticky lg:top-24 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">ORDER SUMMARY</h2>

            <ul className="space-y-3 text-sm border-b border-slate-200 pb-4">
              {checkoutItems.map((item) => {
                const lineCurrency = (item.currency ?? cartCurrency) as DisplayCurrency;
                const lineKey = item.lineId ?? item.productSlug;
                return (
                <li key={lineKey} className="space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-700 line-clamp-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-900 shrink-0">
                      {format(cartLineUnitTotal(item) * item.quantity, lineCurrency)}
                    </span>
                  </div>
                  {item.addons?.length ? (
                    <ul className="pl-2 space-y-0.5 text-xs text-slate-500">
                      {item.addons.map((a) => (
                        <li key={a.id}>
                          + {a.quantity > 1 ? `${a.quantity}× ` : ""}
                          {a.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
              })}
            </ul>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-700">Items ({itemCount})</span>
                <span className="font-medium">{format(displaySubtotal, displayCurrency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between gap-4 text-green-700">
                  <span>Coupon ({appliedCouponCode})</span>
                  <span>−{format(discount, displayCurrency)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-slate-700">
                  Shipping
                  {shippingDetailLine && (
                    <span className="block text-xs text-slate-500 font-normal mt-0.5">
                      {shippingDetailLine}
                    </span>
                  )}
                </span>
                <span
                  className={
                    shippingCharge > 0
                      ? "font-medium text-slate-900"
                      : "font-bold text-accent"
                  }
                >
                  {shippingCharge > 0
                    ? format(shippingCharge, displayCurrency)
                    : "FREE"}
                </span>
              </div>
              {!isRetry && shippingQuote.settingsMode !== "pass_through" && (
                <>
                  {showMixedVendorShippingException ? (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                      Your items ship from different sellers, so shipping is checked separately for
                      each — not on the order total. Under $8 is $6.99, $8–$13.99 is $3.99, and
                      above $13.99 is free per seller. Current shipping fee:{" "}
                      {format(shippingCharge, displayCurrency)}.
                    </p>
                  ) : showMultiGroupShippingNotice ? (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                      Shipping is calculated per delivery address. Under $8 is $6.99, $8–$13.99 is
                      $3.99, and above $13.99 is free for that delivery.
                      {chargedShipmentCount > 0 ? (
                        <>
                          {" "}
                          {chargedShipmentCount} of {multiShippingQuote.perShipment.length} deliveries
                          include shipping ({format(shippingCharge, displayCurrency)} total).
                        </>
                      ) : (
                        <> All deliveries qualify for free shipping.</>
                      )}
                    </p>
                  ) : (
                    <FreeShippingNotice
                      quote={freeShippingQuote}
                      formatMoney={format}
                      currency={displayCurrency}
                    />
                  )}
                </>
              )}
              <div className="flex justify-between gap-4 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-nav text-base">
                  {format(orderTotal, displayCurrency)}
                </span>
              </div>
            </div>

            {!isRetry && (
              <CouponInput
                email={address.email}
                phone={address.phone}
                subtotal={couponEligibleDisplaySubtotal}
                currency={displayCurrency}
                formatMoney={format}
                hasCouponExcludedItems={hasCouponExcludedLines}
                initialCode={savedCouponCode}
                onApplied={(amount, code) => {
                  setDiscount(amount);
                  setAppliedCouponCode(code);
                }}
                onCleared={() => {
                  setDiscount(0);
                  setAppliedCouponCode("");
                }}
              />
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Payment method</p>
              <PaymentMethodPicker
                value={paymentMethod}
                onChange={(method) => {
                  setPaymentMethod(method);
                  setStripeCheckout(null);
                  setRazorpayPayment(null);
                }}
                checkoutCurrency={displayCurrency}
              />
            </div>

            {razorpayPayment?.qrImageUrl && paymentMethod === "razorpay" && (
              <RazorpayQrPanel
                qrImageUrl={razorpayPayment.qrImageUrl}
                amountLabel={format(razorpayPayment.order.total, displayCurrency)}
                orderId={razorpayPayment.order.orderId}
                sessionId={sessionId}
                token={token}
                openingCheckout={openingRazorpay}
                onPaid={(paidOrder) => {
                  trackPurchase(paidOrder.total, {
                    orderId: paidOrder.orderId,
                    provider: "razorpay",
                    currency: paidOrder.currency,
                  });
                  void refresh();
                  router.push(`/orders/${paidOrder.orderId}`);
                }}
                onOpenCheckout={() =>
                  void openRazorpayCheckout(
                    razorpayPayment.order,
                    razorpayPayment.razorpayOrderId,
                    razorpayPayment.razorpayKeyId
                  ).catch((err) => setError(err instanceof Error ? err.message : "Payment failed"))
                }
              />
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {stripeCheckout && paymentMethod === "stripe" && (
              <StripePaymentForm
                clientSecret={stripeCheckout.clientSecret}
                returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/orders/${stripeCheckout.orderId}`}
                amountLabel={format(orderTotal, displayCurrency)}
                onError={setError}
              />
            )}

            {!stripeCheckout && !razorpayPayment && (
              <>
                {paymentMethod === "razorpay" && razorpayLoadError && !razorpayReady && (
                  <p className="text-amber-800 text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {razorpayLoadError}
                  </p>
                )}
                {paymentMethod === "razorpay" && razorpayLoadError && !razorpayReady ? (
                  <button
                    type="button"
                    onClick={retryRazorpayScript}
                    className="w-full rounded-md bg-primary text-white font-bold text-sm uppercase tracking-wide py-3.5 hover:bg-primary/90 transition"
                  >
                    Retry loading payment
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || (paymentMethod === "razorpay" && !razorpayReady)}
                    className="w-full rounded-md bg-primary text-white font-bold text-sm uppercase tracking-wide py-3.5 hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {loading
                      ? "Processing..."
                      : paymentMethod === "razorpay" && !razorpayReady
                        ? "Loading payment…"
                        : paymentMethod === "razorpay"
                          ? "Pay with Razorpay"
                          : "Continue to Stripe payment"}
                  </button>
                )}
              </>
            )}

            <CheckoutLegalNotice className="text-center" />

            <TrustBadges variant="compact" className="pt-2" />

            <SecureCheckoutBadge />

            <Link href="/cart" className="block text-center text-sm text-nav hover:underline">
              ← Back to cart
            </Link>
          </aside>
        </form>
      </div>
    </>
  );
}
