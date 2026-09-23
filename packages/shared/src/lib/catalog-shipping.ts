import type { Product } from "../schemas/product";

const DEFAULT_CAKE_SHIPPING_LABEL = "2nd Day";

export function productHasCatalogShipping(product: {
  deliveryFee?: number;
  shippingOptions?: Array<{ label: string; price: number }>;
}): boolean {
  return Boolean(product.shippingOptions?.length) || product.deliveryFee != null;
}

/** Per-unit sheet shipping. Cake day-wise options are never added to product price. */
export function resolveCatalogShippingFee(
  product: Pick<Product, "deliveryFee" | "shippingOptions">,
  shippingOptionLabel?: string | null
): number | undefined {
  const options = product.shippingOptions ?? [];
  if (options.length > 0) {
    const wanted = (shippingOptionLabel ?? "").trim();
    const match =
      options.find((o) => o.label.toLowerCase() === wanted.toLowerCase()) ??
      options.find((o) => o.label === DEFAULT_CAKE_SHIPPING_LABEL) ??
      options[0];
    return match.price;
  }
  if (product.deliveryFee != null) return product.deliveryFee;
  return undefined;
}

export function resolveCatalogShippingLabel(
  product: Pick<Product, "shippingOptions">,
  shippingOptionLabel?: string | null
): string | undefined {
  const options = product.shippingOptions ?? [];
  if (options.length === 0) return undefined;
  const wanted = (shippingOptionLabel ?? "").trim();
  const match =
    options.find((o) => o.label.toLowerCase() === wanted.toLowerCase()) ??
    options.find((o) => o.label === DEFAULT_CAKE_SHIPPING_LABEL) ??
    options[0];
  return match.label;
}
