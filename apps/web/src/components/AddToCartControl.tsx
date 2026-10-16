"use client";

import Link from "next/link";
import { useState } from "react";
import { estimatedDeliveryShort } from "@blossompot/shared";
import type { ProductAddonSelection } from "@blossompot/shared";
import { addComboComponentsToCart, comboComponentLine, comboQuantityChange } from "@/lib/combo-cart";
import { useCart } from "@/lib/cart-context";

export type CartControlLine = {
  quantity: number;
  lineId?: string;
};

/**
 * Listing cards render one cart action.
 * The add button stays until every tracked line is in the cart, then the quantity control replaces it.
 */
export function cartControlMode(lines: readonly CartControlLine[]): "add" | "in-cart" {
  if (lines.length === 0 || lines.some((line) => line.quantity <= 0 || !line.lineId)) return "add";
  return "in-cart";
}

export function cartControlActions(mode: "add" | "in-cart"): { add: boolean; viewCart: boolean } {
  return mode === "in-cart" ? { add: false, viewCart: true } : { add: true, viewCart: false };
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

function MinusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

const stepBtnClass =
  "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-50 transition";

const detailPillBtnClass =
  "flex h-9 w-9 shrink-0 items-center justify-center hover:bg-white/15 rounded-full disabled:opacity-50 transition";

interface AddToCartControlProps {
  productSlug: string;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  variant?: "default" | "detail";
  /** Called before add — use to save name/email immediately (not debounced). */
  getContact?: () => { name?: string; email?: string; phone?: string };
  /** Selected product add-ons with quantities (BlossomPot only). */
  addons?: ProductAddonSelection[];
  shippingOptionLabel?: string;
  /** When set, one control adds and tracks both component lines. */
  combo?: {
    components: readonly [{ slug: string; name: string }, { slug: string; name: string }];
  };
}

export function AddToCartControl({
  productSlug,
  disabled,
  className = "",
  fullWidth = true,
  variant = "default",
  getContact,
  addons = [],
  shippingOptionLabel,
  combo,
}: AddToCartControlProps) {
  const { cart, sessionReady, addItem, updateItem, removeItem, quantityFor, lineIdFor } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [addedNote, setAddedNote] = useState("");

  const tracked = combo
    ? combo.components.map((component) => comboComponentLine(cart, component))
    : [
        {
          quantity: quantityFor(productSlug, addons, shippingOptionLabel),
          lineId: lineIdFor(productSlug, addons, shippingOptionLabel),
        },
      ];
  const quantity = Math.min(...tracked.map((line) => line.quantity));
  const lineId = tracked[0]?.lineId;
  const actions = cartControlActions(cartControlMode(tracked));
  const addonsPayload = addons.length ? addons : undefined;

  const addCurrent = async () => {
    if (!combo) {
      await addItem(productSlug, 1, getContact?.(), addonsPayload, shippingOptionLabel);
      return;
    }
    const result = await addComboComponentsToCart(
      combo.components,
      comboComponentLine(cart, combo.components[0]).quantity,
      {
      addItem: (slug) => addItem(slug),
      updateItem,
      removeItem,
    });
    if (!result.ok) throw new Error(result.message);
  };

  const decreaseCurrent = async () => {
    if (!combo) {
      if (!lineId) return;
      if (quantity <= 1) await removeItem(lineId);
      else await updateItem(lineId, quantity - 1);
      return;
    }
    const change = comboQuantityChange(tracked, "decrease");
    if (change.kind === "remove") {
      for (const id of change.lineIds) await removeItem(id);
      return;
    }
    for (const update of change.updates) await updateItem(update.lineId, update.quantity);
  };

  const removeCurrent = async () => {
    if (!combo) {
      if (lineId) await removeItem(lineId);
      return;
    }
    const change = comboQuantityChange(tracked, "remove");
    if (change.kind === "remove") {
      for (const id of change.lineIds) await removeItem(id);
    }
  };

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isDetail = variant === "detail";
  const addLabel = disabled ? "Out of Stock" : busy ? "Adding..." : isDetail ? "Add to cart" : "Add to cart";

  if (actions.add) {
    return (
      <div className={className}>
        {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
        {addedNote && <p className="text-xs text-green-700 mb-1">{addedNote}</p>}
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            void run(async () => {
              await addCurrent();
              setAddedNote(`Added! Est. delivery ${estimatedDeliveryShort()}`);
              window.setTimeout(() => setAddedNote(""), 5000);
            });
          }}
          disabled={disabled || busy || !sessionReady}
          className={
            isDetail
              ? `w-full rounded-md bg-primary text-white font-bold text-sm uppercase tracking-wide py-3.5 shadow-md shadow-primary/25 hover:brightness-110 transition disabled:opacity-50`
              : `btn-cart ${fullWidth ? "w-full" : ""} text-xs sm:text-sm px-3 py-2 sm:px-5 sm:py-2.5`
          }
        >
          {isDetail ? addLabel.toUpperCase() : addLabel}
        </button>
      </div>
    );
  }

  const quantityControls = (
    <>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={busy}
        onClick={(e) => {
          stop(e);
          void run(() => decreaseCurrent());
        }}
        className={stepBtnClass}
      >
        <MinusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      <span className="min-w-[1.25rem] sm:min-w-[1.5rem] text-center text-sm sm:text-base font-bold tabular-nums px-0.5">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={busy || disabled}
        onClick={(e) => {
          stop(e);
          void run(() => addCurrent());
        }}
        className={stepBtnClass}
      >
        <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </>
  );

  const removeButton = (
    <button
      type="button"
      aria-label="Remove from cart"
      disabled={busy}
      onClick={(e) => {
        stop(e);
        void run(() => removeCurrent());
      }}
      className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10 active:scale-95 disabled:opacity-50 transition"
    >
      <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  );

  return (
    <div className={className} onClick={stop}>
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      {isDetail ? (
        <div className="flex items-center justify-between gap-3 rounded-full bg-nav text-white font-semibold text-sm px-4 py-2.5 w-full">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={busy}
            onClick={(e) => {
              stop(e);
              void run(() => decreaseCurrent());
            }}
            className={detailPillBtnClass}
          >
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="min-w-[1.5rem] text-center text-base font-bold tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={busy || disabled}
            onClick={(e) => {
              stop(e);
              void run(() => addCurrent());
            }}
            className={detailPillBtnClass}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          {removeButton}
        </div>
      ) : (
        <div
          className={`flex items-center justify-between gap-1 rounded-full bg-nav text-white font-semibold text-sm px-1.5 py-1.5 sm:px-3 sm:py-2 ${fullWidth ? "w-full" : "min-w-[10rem] sm:min-w-[12rem]"}`}
        >
          {quantityControls}
          {removeButton}
        </div>
      )}
      {actions.viewCart && !isDetail && (
        <Link
          href="/cart"
          onClick={(e) => e.stopPropagation()}
          className="block text-center text-nav text-sm font-semibold mt-2 hover:underline"
        >
          View Cart
        </Link>
      )}
    </div>
  );
}
