import {
  ComboSlugConflictError,
  generateComboDrafts,
  type ComboDraft,
  type ComboSourceProduct,
  type VendorDisplaySource,
} from "@blossompot/shared";
import { insertCombo as insertStoredCombo, queryCombos as queryStoredCombos } from "./combo-store";
import { now } from "./db";

/** Initial publishing cap. Callers can pass a different per-vendor limit. */
export const DEFAULT_COMBOS_PER_VENDOR = 10;

export type ComboPublishSkipReason = "existing-combo" | "product-slug";

export type ComboPublishSkip = {
  slug: string;
  reason: ComboPublishSkipReason;
};

export type ComboPublishResult = {
  generated: number;
  inserted: number;
  skipped: number;
  skips: ComboPublishSkip[];
};

type ComboPublishStorage = {
  insertCombo: (input: ComboDraft, timestamp?: string) => Promise<unknown>;
  queryCombos: () => Promise<Array<{ slug: string }>>;
};

/**
 * Insert generated drafts in generator order.
 * An existing combo row is left unchanged, including one an admin has edited.
 * Product-slug conflicts are skipped. Any other storage error stops the run.
 */
export async function publishGeneratedCombos(
  input: {
    products: readonly ComboSourceProduct[];
    vendors: readonly VendorDisplaySource[];
    limitPerVendor?: number;
    timestamp?: string;
  },
  storage: ComboPublishStorage = {
    insertCombo: insertStoredCombo,
    queryCombos: queryStoredCombos,
  }
): Promise<ComboPublishResult> {
  const drafts = generateComboDrafts(
    input.products,
    input.vendors,
    input.limitPerVendor ?? DEFAULT_COMBOS_PER_VENDOR
  );
  const timestamp = input.timestamp ?? now();
  const existing = new Set((await storage.queryCombos()).map((combo) => combo.slug));
  const skips: ComboPublishSkip[] = [];
  let inserted = 0;

  for (const draft of drafts) {
    if (existing.has(draft.slug)) {
      skips.push({ slug: draft.slug, reason: "existing-combo" });
      continue;
    }
    try {
      await storage.insertCombo(draft, timestamp);
      existing.add(draft.slug);
      inserted += 1;
    } catch (err) {
      if (!(err instanceof ComboSlugConflictError)) throw err;
      const stored = (await storage.queryCombos()).some((combo) => combo.slug === draft.slug);
      if (stored) existing.add(draft.slug);
      skips.push({ slug: draft.slug, reason: stored ? "existing-combo" : "product-slug" });
    }
  }

  return {
    generated: drafts.length,
    inserted,
    skipped: skips.length,
    skips,
  };
}
