import type { CartItem } from "../schemas/cart";
import type {
  CheckoutShipment,
  OrderShipment,
  ShippingAddress,
} from "../schemas/order";
import { cartSubtotal } from "../currency";
import type { ShopCurrency } from "../currency";
import { roundDisplayAmount } from "./currency-display";
import { quoteCartDeliveryDateShipping } from "./delivery-date-shipping";
import { quoteAddressShipmentShipping } from "./free-shipping";

export function addressFingerprint(address: ShippingAddress): string {
  return [
    address.name.trim().toLowerCase(),
    address.line1.trim().toLowerCase(),
    (address.line2 ?? "").trim().toLowerCase(),
    address.city.trim().toLowerCase(),
    address.state.trim().toUpperCase(),
    address.postalCode.trim(),
    address.country.trim().toUpperCase(),
  ].join("|");
}

/** Ensure checkout shipments cover every cart line exactly (by productSlug qty). */
export function validateShipmentsPartitionCart(
  cartItems: CartItem[],
  shipments: CheckoutShipment[]
): string | null {
  if (!shipments.length) return "At least one shipment is required";

  const needed = new Map<string, number>();
  for (const item of cartItems) {
    needed.set(item.productSlug, (needed.get(item.productSlug) ?? 0) + item.quantity);
  }

  const assigned = new Map<string, number>();
  for (const shipment of shipments) {
    for (const line of shipment.items) {
      assigned.set(line.productSlug, (assigned.get(line.productSlug) ?? 0) + line.quantity);
    }
  }

  for (const [slug, qty] of needed) {
    if ((assigned.get(slug) ?? 0) !== qty) {
      return `Shipment items must match cart quantities for ${slug}`;
    }
  }
  for (const [slug] of assigned) {
    if (!needed.has(slug)) {
      return `Unknown product in shipments: ${slug}`;
    }
  }
  return null;
}

function takeItemsFromCart(
  cartBySlug: Map<string, CartItem>,
  lines: Array<{ productSlug: string; quantity: number }>
): CartItem[] | string {
  const out: CartItem[] = [];
  for (const line of lines) {
    const source = cartBySlug.get(line.productSlug);
    if (!source) return `Unknown product: ${line.productSlug}`;
    out.push({ ...source, quantity: line.quantity });
  }
  return out;
}

export function buildOrderShipments(input: {
  cartItems: CartItem[];
  checkoutShipments: CheckoutShipment[];
  currency: ShopCurrency;
  usdInrRate: number;
  /** When customerShippingMode is pass_through, skip threshold and use this single charge. */
  passThroughShipping?: number;
  /**
   * When set, every unit is charged from this delivery date instead of the
   * subtotal shipping table. Same-day $16, next-day $18, within 3 days $20,
   * within 5 days and later free.
   */
  scheduledDeliveryDate?: string;
  now?: Date;
}): { shipments: OrderShipment[]; shippingTotal: number } | { error: string } {
  const partitionError = validateShipmentsPartitionCart(
    input.cartItems,
    input.checkoutShipments
  );
  if (partitionError) return { error: partitionError };

  const cartBySlug = new Map(input.cartItems.map((i) => [i.productSlug, i]));
  const built: Omit<OrderShipment, "shipping">[] = [];

  for (let i = 0; i < input.checkoutShipments.length; i++) {
    const raw = input.checkoutShipments[i];
    const items = takeItemsFromCart(cartBySlug, raw.items);
    if (typeof items === "string") return { error: items };
    built.push({
      shipmentId: `ship-${i + 1}`,
      shippingAddress: raw.shippingAddress,
      items,
      subtotal: cartSubtotal(items),
    });
  }

  if (input.passThroughShipping != null) {
    const shippingTotal = input.passThroughShipping;
    const per = built.length ? shippingTotal / built.length : 0;
    return {
      shippingTotal,
      shipments: built.map((s, idx) => ({
        ...s,
        shipping:
          idx === built.length - 1
            ? shippingTotal - per * (built.length - 1)
            : Math.round(per * 100) / 100,
      })),
    };
  }

  if (input.scheduledDeliveryDate) {
    const quote = quoteCartDeliveryDateShipping({
      items: built.flatMap((shipment) => shipment.items.map((item) => ({ quantity: item.quantity }))),
      deliveryDate: input.scheduledDeliveryDate,
      currency: input.currency,
      usdInrRate: input.usdInrRate,
      now: input.now,
    });
    const totalUnits = built.reduce(
      (sum, shipment) => sum + shipment.items.reduce((units, item) => units + item.quantity, 0),
      0
    );
    let assigned = 0;
    const shipments = built.map((shipment, index) => {
      const units = shipment.items.reduce((sum, item) => sum + item.quantity, 0);
      const shipping =
        index === built.length - 1 || totalUnits === 0
          ? roundDisplayAmount(quote.totalCharge - assigned, input.currency)
          : roundDisplayAmount((quote.totalCharge * units) / totalUnits, input.currency);
      assigned += shipping;
      return { ...shipment, shipping };
    });
    return { shippingTotal: quote.totalCharge, shipments };
  }

  /** Per address × vendor: under $8 → $6.99; $8–$13.99 → $3.99; above $13.99 ($14+) → free. */
  const perAddress = built.map((s) =>
    quoteAddressShipmentShipping({
      items: s.items,
      currency: input.currency,
      usdInrRate: input.usdInrRate,
    })
  );
  const shippingTotal = perAddress.reduce((sum, q) => sum + q.totalCharge, 0);

  return {
    shippingTotal,
    shipments: built.map((s, idx) => ({
      ...s,
      shipping: perAddress[idx]?.totalCharge ?? 0,
    })),
  };
}

/** Single-address fallback when client omits shipments[]. */
export function singleCheckoutShipment(
  shippingAddress: CheckoutShipment["shippingAddress"],
  cartItems: CartItem[]
): CheckoutShipment {
  return {
    shippingAddress,
    items: cartItems.map((i) => ({
      productSlug: i.productSlug,
      quantity: i.quantity,
    })),
  };
}
