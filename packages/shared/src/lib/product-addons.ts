import { VENDOR_ORANGE_COUNTY } from "../constants";
import { isGboVendor, parseGboSku, parseGboSlug } from "./gbo";

export type ProductAddonGroup = "cake-extras" | "personalization";

export type ProductAddonDef = {
  id: string;
  name: string;
  priceUsd: number;
  group: ProductAddonGroup;
  /** Short weight / pack label for UI. */
  detail: string;
  /** Path under CloudFront `/uploads/`. */
  image: string;
};

/** Max packs of a single add-on per cart line. */
export const MAX_PRODUCT_ADDON_QUANTITY = 10;

/** Fixed BlossomPot PDP add-on catalog (USD). Not Dynamo SKUs. */
export const PRODUCT_ADDONS: readonly ProductAddonDef[] = [
  {
    id: "cake-candle",
    name: "Cake candle",
    priceUsd: 4,
    group: "cake-extras",
    detail: "Birthday candle set",
    image: "editorial/addons/cake-candle.jpg",
  },
  {
    id: "name-printing",
    name: "Name printing",
    priceUsd: 8,
    group: "personalization",
    detail: "Print a name on the cake",
    image: "editorial/addons/name-printing.jpg",
  },
  {
    id: "greeting-card",
    name: "Greeting card",
    priceUsd: 5,
    group: "personalization",
    detail: "Handwritten-style card",
    image: "editorial/addons/greeting-card.jpg",
  },
  {
    id: "message-plaque",
    name: "Custom message plaque",
    priceUsd: 6,
    group: "personalization",
    detail: "Short message on a cake plaque",
    image: "editorial/addons/message-plaque.jpg",
  },
] as const;

export type ProductAddonId = (typeof PRODUCT_ADDONS)[number]["id"];

/** Client / API selection before server fills name & unit price. */
export type ProductAddonSelection = {
  id: string;
  quantity: number;
};

const ADDON_BY_ID = new Map(PRODUCT_ADDONS.map((a) => [a.id, a]));

export function getProductAddon(id: string): ProductAddonDef | undefined {
  return ADDON_BY_ID.get(id);
}

export function productAllowsAddons(product: {
  vendorSlug?: string | null;
  slug?: string | null;
  sku?: string | null;
}): boolean {
  if (isGboVendor(product.vendorSlug) || parseGboSlug(product.slug) || parseGboSku(product.sku)) {
    return false;
  }
  const v = product.vendorSlug?.trim();
  if (!v) return true;
  if (v === VENDOR_ORANGE_COUNTY) return false;
  return true;
}

export type CartAddonLike = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export function sumAddonPrices(
  addons: Array<{ price: number; quantity: number }> | undefined | null
): number {
  if (!addons?.length) return 0;
  return addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
}

/**
 * Stable merge key: sorted `id:qty` pairs.
 * Empty string = no add-ons. Quantity is part of the signature so 2× of an add-on
 * does not merge with 1× of the same add-on.
 */
export function cartAddonSignature(
  addons: Array<{ id: string; quantity?: number }> | undefined | null
): string {
  if (!addons?.length) return "";
  return [...addons]
    .map((a) => `${a.id}:${Math.max(1, Math.floor(a.quantity ?? 1))}`)
    .sort()
    .join(",");
}

export function cartLineUnitTotal(item: {
  price: number;
  addons?: Array<{ price: number; quantity: number }> | null;
}): number {
  return item.price + sumAddonPrices(item.addons);
}

export type AddonResolveInput = string | { id: string; quantity?: number };

/** Normalize API / client payload into selections (dedupe by id, clamp qty). */
export function normalizeAddonSelections(
  input: AddonResolveInput[] | undefined | null
): { ok: true; selections: ProductAddonSelection[] } | { ok: false; error: string } {
  if (!input?.length) return { ok: true, selections: [] };

  const byId = new Map<string, number>();
  for (const raw of input) {
    const id = (typeof raw === "string" ? raw : raw.id)?.trim();
    if (!id) continue;
    const qtyRaw = typeof raw === "string" ? 1 : (raw.quantity ?? 1);
    const qty = Math.floor(Number(qtyRaw));
    if (!Number.isFinite(qty) || qty < 1) {
      return { ok: false, error: `Invalid add-on quantity for ${id}` };
    }
    if (qty > MAX_PRODUCT_ADDON_QUANTITY) {
      return {
        ok: false,
        error: `Add-on quantity cannot exceed ${MAX_PRODUCT_ADDON_QUANTITY}`,
      };
    }
    byId.set(id, (byId.get(id) ?? 0) + qty);
  }

  if (byId.size > 20) return { ok: false, error: "Too many add-ons selected" };

  const selections: ProductAddonSelection[] = [...byId.entries()]
    .map(([id, quantity]) => {
      const clamped = Math.min(quantity, MAX_PRODUCT_ADDON_QUANTITY);
      return { id, quantity: clamped };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return { ok: true, selections };
}

export function resolveProductAddons(
  input: AddonResolveInput[] | undefined | null
): { ok: true; addons: CartAddonLike[] } | { ok: false; error: string } {
  const normalized = normalizeAddonSelections(input);
  if (!normalized.ok) return normalized;

  const addons: CartAddonLike[] = [];
  for (const sel of normalized.selections) {
    const def = getProductAddon(sel.id);
    if (!def) return { ok: false, error: `Unknown add-on: ${sel.id}` };
    addons.push({
      id: def.id,
      name: def.name,
      price: def.priceUsd,
      quantity: sel.quantity,
    });
  }
  return { ok: true, addons };
}

/** @deprecated Prefer resolveProductAddons — kept for call-site compatibility. */
export function resolveProductAddonsFromIds(
  ids: string[] | undefined | null
): { ok: true; addons: CartAddonLike[] } | { ok: false; error: string } {
  return resolveProductAddons(ids);
}
