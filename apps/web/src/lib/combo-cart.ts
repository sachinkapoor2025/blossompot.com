import type { Cart } from "@blossompot/shared";

export type ComboCartComponent = {
  slug: string;
  name: string;
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

function plainLineId(cart: Cart, slug: string): string | undefined {
  const item = cart.items.find(
    (line) => line.productSlug === slug && !(line.addons && line.addons.length > 0) && !line.shippingOptionLabel
  );
  if (!item) return undefined;
  return item.lineId ?? item.productSlug;
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
      const lineId = plainLineId(firstCart, first.slug);
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
