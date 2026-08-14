import { ORDER_STATUS } from "../constants";

/** Statuses that mean payment succeeded (order is past checkout). */
const PAYMENT_SETTLED_STATUSES = new Set<string>([
  ORDER_STATUS.PAID,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.ON_HOLD,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERY_EXCEPTION,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETE,
  ORDER_STATUS.REFUNDED,
]);

/** True when the customer has paid — includes shipped / delivered / complete, not only `paid`. */
export function isOrderPaymentSettled(status: string): boolean {
  return PAYMENT_SETTLED_STATUSES.has(status);
}

/** True when the customer still needs to complete checkout payment. */
export function isOrderAwaitingPayment(status: string): boolean {
  return status === ORDER_STATUS.PENDING_PAYMENT;
}

/** Human-readable customer-facing status label. */
export function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case ORDER_STATUS.PENDING_PAYMENT:
      return "Pending payment";
    case ORDER_STATUS.PAID:
      return "Paid";
    case ORDER_STATUS.ACCEPTED:
      return "Accepted";
    case ORDER_STATUS.ON_HOLD:
      return "On hold";
    case ORDER_STATUS.PROCESSING:
      return "Processing";
    case ORDER_STATUS.SHIPPED:
      return "Shipped";
    case ORDER_STATUS.IN_TRANSIT:
      return "In transit";
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return "Out for delivery";
    case ORDER_STATUS.DELIVERY_EXCEPTION:
      return "Delivery exception";
    case ORDER_STATUS.DELIVERED:
      return "Delivered";
    case ORDER_STATUS.COMPLETE:
      return "Complete";
    case ORDER_STATUS.CANCELLED:
      return "Cancelled";
    case ORDER_STATUS.REFUNDED:
      return "Refunded";
    default:
      return status.replace(/_/g, " ");
  }
}

/** Short customer headline for the order confirmation page. */
export function orderConfirmationHeadline(status: string): string {
  switch (status) {
    case ORDER_STATUS.SHIPPED:
      return "Your order has shipped!";
    case ORDER_STATUS.IN_TRANSIT:
      return "Your order is in transit!";
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return "Your order is out for delivery!";
    case ORDER_STATUS.DELIVERY_EXCEPTION:
      return "There's a delivery update";
    case ORDER_STATUS.DELIVERED:
      return "Your order was delivered!";
    case ORDER_STATUS.COMPLETE:
      return "Your order is complete!";
    case ORDER_STATUS.PROCESSING:
    case ORDER_STATUS.ACCEPTED:
      return "Your order is being prepared!";
    case ORDER_STATUS.ON_HOLD:
      return "Your order is on hold";
    case ORDER_STATUS.REFUNDED:
      return "This order was refunded";
    case ORDER_STATUS.CANCELLED:
      return "This order was cancelled";
    case ORDER_STATUS.PENDING_PAYMENT:
      return "Awaiting payment";
    case ORDER_STATUS.PAID:
    default:
      return isOrderPaymentSettled(status)
        ? "Thank you — your order is confirmed!"
        : "Awaiting payment";
  }
}

/** Supporting copy under the confirmation headline. */
export function orderConfirmationSubcopy(status: string): string {
  switch (status) {
    case ORDER_STATUS.SHIPPED:
      return "Your gift is on the way. Use the tracking details below to follow your shipment.";
    case ORDER_STATUS.IN_TRANSIT:
      return "Your package is moving through the carrier network. Tracking updates appear below as scans arrive.";
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return "Your package is out for delivery today. Please watch for the carrier.";
    case ORDER_STATUS.DELIVERY_EXCEPTION:
      return "The carrier reported a delivery exception. Check tracking details below or contact support.";
    case ORDER_STATUS.DELIVERED:
      return "Your gift has arrived. We hope they love it — thank you for choosing BlossomPot.";
    case ORDER_STATUS.COMPLETE:
      return "Thank you for choosing BlossomPot.";
    case ORDER_STATUS.PROCESSING:
    case ORDER_STATUS.ACCEPTED:
      return "We've received your payment and our team is preparing your order for USA dispatch.";
    case ORDER_STATUS.ON_HOLD:
      return "Our team is reviewing your order. We'll email you with an update shortly.";
    case ORDER_STATUS.REFUNDED:
      return "A refund has been issued for this order. Contact support if you have questions.";
    case ORDER_STATUS.CANCELLED:
      return "This order was cancelled. You can place a new order anytime.";
    case ORDER_STATUS.PENDING_PAYMENT:
      return "Complete payment to confirm your order and start USA delivery.";
    default:
      return isOrderPaymentSettled(status)
        ? "Your gift is on its way. We've sent a confirmation email and our team will dispatch your order soon."
        : "Complete payment to confirm your order and start USA delivery.";
  }
}
