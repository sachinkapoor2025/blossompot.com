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

type StoredComboIdentity = {
  slug: string;
  productSlugs?: readonly string[];
};

type ComboPublishStorage = {
  insertCombo: (input: ComboDraft, timestamp?: string) => Promise<unknown>;
  queryCombos: () => Promise<StoredComboIdentity[]>;
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
  const existingSlugs = new Set<string>();
  const existingPairs = new Map<string, string>();
  rememberStoredCombos(await storage.queryCombos(), existingSlugs, existingPairs);
  const skips: ComboPublishSkip[] = [];
  let inserted = 0;

  for (const draft of drafts) {
    const representedBy = existingComboSlug(draft, existingSlugs, existingPairs);
    if (representedBy) {
      skips.push({ slug: representedBy, reason: "existing-combo" });
      continue;
    }
    try {
      await storage.insertCombo(draft, timestamp);
      existingSlugs.add(draft.slug);
      const key = componentSetKey(draft.productSlugs);
      if (key) existingPairs.set(key, draft.slug);
      inserted += 1;
    } catch (err) {
      if (!(err instanceof ComboSlugConflictError)) throw err;
      const stored = await storage.queryCombos();
      rememberStoredCombos(stored, existingSlugs, existingPairs);
      const matched = existingComboSlug(draft, existingSlugs, existingPairs);
      skips.push({ slug: matched ?? draft.slug, reason: matched ? "existing-combo" : "product-slug" });
    }
  }

  return {
    generated: drafts.length,
    inserted,
    skipped: skips.length,
    skips,
  };
}

function rememberStoredCombos(
  stored: readonly StoredComboIdentity[],
  existingSlugs: Set<string>,
  existingPairs: Map<string, string>
): void {
  for (const combo of stored) {
    existingSlugs.add(combo.slug);
    const key = componentSetKey(combo.productSlugs);
    if (key && !existingPairs.has(key)) existingPairs.set(key, combo.slug);
  }
}

/** Stored slug for this draft when the slug or the same unordered components already exist. */
function existingComboSlug(
  draft: ComboDraft,
  existingSlugs: Set<string>,
  existingPairs: Map<string, string>
): string | undefined {
  if (existingSlugs.has(draft.slug)) return draft.slug;
  const key = componentSetKey(draft.productSlugs);
  return key ? existingPairs.get(key) : undefined;
}

function componentSetKey(slugs: readonly string[] | undefined): string | undefined {
  if (!slugs || slugs.length < 2) return undefined;
  const normalized = slugs.map((slug) => slug.trim()).filter((slug) => slug.length > 0);
  if (new Set(normalized).size !== normalized.length) return undefined;
  return [...normalized].sort().join("\0");
}
