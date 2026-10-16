import { cartLineOptionsSignature, type Cart } from "@blossompot/shared";

export type ComboCartComponent = {
  slug: string;
  name: string;
};

/** Cart API default when a combo add does not choose a shipping option. */
const COMBO_DEFAULT_SHIPPING_LABEL = "2nd Day";

export type ComboQuantityChange =
  | { kind: "update"; updates: { lineId: string; quantity: number }[] }
  | { kind: "remove"; lineIds: string[] };

type ComboLineSource = {
  slug: string;
  shippingOptionLabel?: string;
};

export type ComboCartClient = {
  addItem: (productSlug: string) => Promise<Cart>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
};

export type ComboAddResult = { ok: true } | { ok: false; message: string };

function detail(err: unknown): string {
  return err instanceof Error && err.message.trim() ? err.message.trim() : "Something went wrong";
}

function lineLabel(label?: string | null): string {
  return (label ?? "").trim().toLowerCase();
}

/**
 * The cart line a combo component controls.
 * Plain products match a line with no shipping label.
 * Products that receive the cart's default shipping label match that line.
 */
export function comboComponentLine(
  cart: Cart | null | undefined,
  component: ComboLineSource
): { quantity: number; lineId?: string } {
  const items = (cart?.items ?? []).filter(
    (line) => line.productSlug === component.slug && !(line.addons && line.addons.length > 0)
  );
  const wanted = component.shippingOptionLabel?.trim();
  const item = wanted
    ? items.find((line) => lineLabel(line.shippingOptionLabel) === wanted.toLowerCase())
    : items.find((line) => !lineLabel(line.shippingOptionLabel)) ??
      items.find((line) => lineLabel(line.shippingOptionLabel) === COMBO_DEFAULT_SHIPPING_LABEL.toLowerCase());
  if (!item) return { quantity: 0 };
  const plain = cartLineOptionsSignature(item.addons, item.shippingOptionLabel) === "";
  return {
    quantity: item.quantity,
    lineId: item.lineId ?? (plain ? item.productSlug : undefined),
  };
}

/** Decrement or remove both component lines together. */
export function comboQuantityChange(
  lines: readonly { quantity: number; lineId?: string }[],
  direction: "decrease" | "remove"
): ComboQuantityChange {
  const quantity = lines.length ? Math.min(...lines.map((line) => line.quantity)) : 0;
  if (direction === "remove" || quantity <= 1) {
    return { kind: "remove", lineIds: lines.flatMap((line) => (line.lineId ? [line.lineId] : [])) };
  }
  return {
    kind: "update",
    updates: lines.flatMap((line) =>
      line.lineId ? [{ lineId: line.lineId, quantity: line.quantity - 1 }] : []
    ),
  };
}

function plainLineId(cart: Cart, component: ComboCartComponent): string | undefined {
  return comboComponentLine(cart, component).lineId;
}

/**
 * Add both component products as separate cart lines.
 * A failure rolls the first line back to its previous quantity.
 * The result is successful only when both adds finish.
 */
export async function addComboComponentsToCart(
  components: readonly [ComboCartComponent, ComboCartComponent],
  previousFirstQuantity: number,
  client: ComboCartClient
): Promise<ComboAddResult> {
  const [first, second] = components;
  let firstCart: Cart;
  try {
    firstCart = await client.addItem(first.slug);
  } catch (err) {
    return { ok: false, message: `Could not add ${first.name}. ${detail(err)}` };
  }

  try {
    await client.addItem(second.slug);
  } catch (err) {
    const reason = `Could not add both gifts. ${detail(err)}`;
    try {
      const lineId = plainLineId(firstCart, first);
      if (!lineId) throw new Error("Missing cart line");
      if (previousFirstQuantity <= 0) await client.removeItem(lineId);
      else await client.updateItem(lineId, previousFirstQuantity);
      return { ok: false, message: reason };
    } catch {
      return {
        ok: false,
        message: `${reason} ${first.name} is in your cart, and ${second.name} was not added.`,
      };
    }
  }

  return { ok: true };
}
