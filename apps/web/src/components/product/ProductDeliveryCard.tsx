import type { ReactNode } from "react";

type DeliveryLocation = {
  postalDisplay: string;
} | null;

/**
 * Groups existing location, availability, estimate, date, and partner shipping copy.
 * Does not compute serviceability — callers pass the current deliverable flag.
 */
export function ProductDeliveryCard({
  location,
  deliverable,
  onOpenSelector,
  isGboProduct,
  estimate,
  datePicker,
}: {
  location: DeliveryLocation;
  deliverable: boolean;
  onOpenSelector: () => void;
  isGboProduct: boolean;
  estimate: ReactNode;
  datePicker: ReactNode;
}) {
  return (
    <section
      className="mb-4 rounded-lg border border-line bg-surface px-3 py-3 sm:px-4 sm:py-3.5"
      aria-labelledby="deliver-this-gift-heading"
    >
      <h2 id="deliver-this-gift-heading" className="text-sm font-bold text-ink mb-2">
        Deliver this gift
      </h2>

      {location ? (
        deliverable ? (
          <p className="text-sm text-primary">
            ✓ Available for delivery to {location.postalDisplay}
          </p>
        ) : (
          <p className="text-sm text-sale">
            This product is currently not available for delivery to {location.postalDisplay}.
          </p>
        )
      ) : (
        <p className="text-sm text-ink">Select a delivery location to confirm availability.</p>
      )}

      <button
        type="button"
        onClick={onOpenSelector}
        className="mt-1 text-sm font-semibold text-nav underline underline-offset-2"
      >
        {location ? "Change location" : "Choose location"}
      </button>

      <div className="mt-3">{estimate}</div>

      {isGboProduct ? (
        <p className="mt-2 text-xs text-muted">$19 shipping · Partner fulfillment</p>
      ) : null}

      <div className="mt-3">{datePicker}</div>
    </section>
  );
}
