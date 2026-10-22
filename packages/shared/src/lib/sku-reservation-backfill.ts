import { productKeys, productSkuKeys } from "../db/keys";
import { catalogSkuReservationItem, diagnoseCatalogSkuReservations, normalizeCatalogSku } from "./catalog-sku";

/** Live DEV target. The utility refuses every other account, region, and table. */
export const DEV_SKU_BACKFILL_ACCOUNT = "796174527529";
export const DEV_SKU_BACKFILL_REGION = "us-east-1";
export const DEV_SKU_BACKFILL_TABLE = "blossompot-products-dev";
export const DEV_SKU_BACKFILL_STACK = "blossompot-dev";
export const PROD_SKU_BACKFILL_TABLE = "blossompot-products-prod";

/** One product condition check plus one reservation put. */
export const SKU_BACKFILL_ACTIONS_PER_PRODUCT = 2;
/** DynamoDB TransactWriteItems allows 100 actions. */
export const SKU_BACKFILL_MAX_ACTIONS = 100;
export const SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION =
  SKU_BACKFILL_MAX_ACTIONS / SKU_BACKFILL_ACTIONS_PER_PRODUCT;
/** DynamoDB rejects a transaction larger than 4 MB. */
export const SKU_BACKFILL_MAX_TRANSACTION_BYTES = 4_000_000;

export type SkuBackfillCandidate = {
  slug: string;
  /** Exact product `sku` attribute read during the scan. */
  auditedSku: string;
  normalizedSku: string;
};

export type SkuBackfillConflict = {
  kind:
    | "duplicate-sku"
    | "orphan-reservation"
    | "mismatched-reservation"
    | "reserved-by-other"
    | "unexpected-reservation"
    | "product-slug-mismatch"
    | "unexpected-product-sku"
    | "incomplete-scan";
  sku?: string;
  slug?: string;
  slugs?: string[];
  productSlug?: string;
  productSku?: string | null;
  detail?: string;
};

export type SkuBackfillPlan = {
  ok: boolean;
  scanComplete: boolean;
  candidates: SkuBackfillCandidate[];
  alreadyComplete: Array<{ slug: string; normalizedSku: string }>;
  blankSkuSlugs: string[];
  conflicts: SkuBackfillConflict[];
  refusal: string | null;
};

export type SkuBackfillTransactItem = {
  ConditionCheck?: {
    TableName: string;
    Key: { PK: string; SK: string };
    ConditionExpression: string;
    ExpressionAttributeValues: Record<string, string>;
  };
  Put?: {
    TableName: string;
    Item: Record<string, unknown>;
    ConditionExpression: string;
  };
};

type CatalogRow = Record<string, unknown>;

function productIdentity(item: CatalogRow): { slug: string; mismatch: boolean } | null {
  const pk = typeof item.PK === "string" ? item.PK : "";
  if (!pk.startsWith("PRODUCT#") || item.SK !== "META") return null;
  const fromKey = pk.slice("PRODUCT#".length);
  const attr = typeof item.slug === "string" ? item.slug : "";
  return { slug: fromKey, mismatch: Boolean(attr) && attr !== fromKey };
}

function reservationKey(item: CatalogRow): string | null {
  const pk = typeof item.PK === "string" ? item.PK : "";
  if (!pk.startsWith("SKU#") || item.SK !== "META") return null;
  return pk.slice("SKU#".length);
}

/**
 * Classify a completed catalog scan. This does not write.
 * A plan is applicable only when the scan is complete and every conflict list is empty.
 * Blank SKUs are skipped. An exact reservation already owned by that product is already complete.
 */
export function planSkuReservationBackfill(input: {
  items: readonly CatalogRow[];
  scanComplete: boolean;
}): SkuBackfillPlan {
  const conflicts: SkuBackfillConflict[] = [];
  if (!input.scanComplete) {
    conflicts.push({ kind: "incomplete-scan", detail: "The catalog scan did not finish every page." });
  }

  const products: CatalogRow[] = [];
  const reservations: CatalogRow[] = [];
  for (const item of input.items) {
    const pk = typeof item.PK === "string" ? item.PK : "";
    if (pk.startsWith("SKU#") && item.SK !== "META") {
      conflicts.push({ kind: "unexpected-reservation", sku: pk.slice("SKU#".length), detail: "Reservation sort key is not META." });
      continue;
    }
    if (pk.startsWith("PRODUCT#") && item.SK === "META") products.push(item);
    else if (pk.startsWith("SKU#") && item.SK === "META") reservations.push(item);
  }

  const seenSlugs = new Set<string>();
  const blankSkuSlugs: string[] = [];
  const usable: Array<{ slug: string; auditedSku: string; normalizedSku: string }> = [];
  for (const item of products) {
    const identity = productIdentity(item);
    if (!identity) continue;
    if (seenSlugs.has(identity.slug)) {
      conflicts.push({ kind: "product-slug-mismatch", slug: identity.slug, detail: "More than one product row uses this slug." });
    }
    seenSlugs.add(identity.slug);
    if (identity.mismatch) {
      conflicts.push({
        kind: "product-slug-mismatch",
        slug: identity.slug,
        detail: "Product slug attribute does not match its key.",
      });
      continue;
    }
    if (item.sku == null || item.sku === "") {
      blankSkuSlugs.push(identity.slug);
      continue;
    }
    if (typeof item.sku !== "string") {
      conflicts.push({ kind: "unexpected-product-sku", slug: identity.slug, detail: "Product SKU is not text." });
      continue;
    }
    const normalizedSku = normalizeCatalogSku(item.sku);
    if (!normalizedSku) {
      blankSkuSlugs.push(identity.slug);
      continue;
    }
    usable.push({ slug: identity.slug, auditedSku: item.sku, normalizedSku });
  }

  const diagnosis = diagnoseCatalogSkuReservations(input.items.filter((item) => item.SK === "META"));
  for (const group of diagnosis.duplicateNormalizedSkus) {
    conflicts.push({ kind: "duplicate-sku", sku: group.sku, slugs: [...group.slugs].sort() });
  }
  for (const row of diagnosis.reservationsMissingOwner) {
    conflicts.push({ kind: "orphan-reservation", sku: row.sku, productSlug: row.productSlug });
  }
  for (const row of diagnosis.reservationsWithDifferentSku) {
    conflicts.push({
      kind: "mismatched-reservation",
      sku: row.sku,
      productSlug: row.productSlug,
      productSku: row.productSku,
    });
  }

  const reservationByKey = new Map<string, CatalogRow>();
  for (const item of reservations) {
    const key = reservationKey(item);
    if (!key) {
      conflicts.push({ kind: "unexpected-reservation", detail: "Reservation key is empty." });
      continue;
    }
    if (reservationByKey.has(key)) {
      conflicts.push({ kind: "unexpected-reservation", sku: key, detail: "More than one reservation uses this key." });
    }
    reservationByKey.set(key, item);
    const owner = typeof item.productSlug === "string" ? item.productSlug : "";
    const stored = item.sku;
    if (typeof stored === "string" && normalizeCatalogSku(stored) !== key) {
      conflicts.push({
        kind: "unexpected-reservation",
        sku: key,
        productSlug: owner,
        detail: "Reservation sku attribute does not normalize to its key.",
      });
    } else if (stored != null && typeof stored !== "string") {
      conflicts.push({ kind: "unexpected-reservation", sku: key, productSlug: owner, detail: "Reservation sku is not text." });
    }
  }

  const alreadyComplete: SkuBackfillPlan["alreadyComplete"] = [];
  const candidates: SkuBackfillCandidate[] = [];
  for (const product of usable) {
    const reservation = reservationByKey.get(product.normalizedSku);
    if (!reservation) {
      candidates.push(product);
      continue;
    }
    const owner = typeof reservation.productSlug === "string" ? reservation.productSlug : "";
    const storedNormalized = typeof reservation.sku === "string" ? normalizeCatalogSku(reservation.sku) : null;
    if (owner === product.slug && storedNormalized === product.normalizedSku) {
      alreadyComplete.push({ slug: product.slug, normalizedSku: product.normalizedSku });
      continue;
    }
    if (owner !== product.slug) {
      conflicts.push({
        kind: "reserved-by-other",
        slug: product.slug,
        sku: product.normalizedSku,
        productSlug: owner,
      });
      continue;
    }
    conflicts.push({
      kind: "unexpected-reservation",
      slug: product.slug,
      sku: product.normalizedSku,
      productSlug: owner,
      detail: "Reservation is not an exact match for this product.",
    });
  }

  candidates.sort((a, b) => a.slug.localeCompare(b.slug) || a.normalizedSku.localeCompare(b.normalizedSku));
  alreadyComplete.sort((a, b) => a.slug.localeCompare(b.slug));
  blankSkuSlugs.sort();

  const refusal = conflicts.length > 0 ? "Refusing SKU backfill until every conflict is resolved." : null;
  return {
    ok: conflicts.length === 0,
    scanComplete: input.scanComplete,
    candidates: input.scanComplete ? candidates : [],
    alreadyComplete: input.scanComplete ? alreadyComplete : [],
    blankSkuSlugs: input.scanComplete ? blankSkuSlugs : [],
    conflicts,
    refusal,
  };
}

export function skuBackfillTransactItems(
  tableName: string,
  candidates: readonly SkuBackfillCandidate[]
): SkuBackfillTransactItem[] {
  if (tableName !== DEV_SKU_BACKFILL_TABLE) {
    throw new Error("Refusing to build a SKU backfill transaction for a table that is not the DEV products table.");
  }
  if (candidates.length > SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION) {
    throw new Error("SKU backfill batch exceeds the DynamoDB transaction action limit.");
  }
  const items: SkuBackfillTransactItem[] = [];
  for (const candidate of candidates) {
    if (normalizeCatalogSku(candidate.auditedSku) !== candidate.normalizedSku) {
      throw new Error(`Refusing to reserve ${candidate.slug} because its SKU no longer matches the plan.`);
    }
    const reservation = catalogSkuReservationItem(candidate.auditedSku, candidate.slug);
    if (!reservation || reservation.PK !== productSkuKeys.pk(candidate.normalizedSku)) {
      throw new Error(`Refusing to reserve ${candidate.slug} because the reservation key is empty.`);
    }
    items.push({
      ConditionCheck: {
        TableName: tableName,
        Key: { PK: productKeys.pk(candidate.slug), SK: productKeys.sk() },
        ConditionExpression: "attribute_exists(PK) AND sku = :auditedSku",
        ExpressionAttributeValues: { ":auditedSku": candidate.auditedSku },
      },
    });
    items.push({
      Put: {
        TableName: tableName,
        Item: reservation,
        ConditionExpression: "attribute_not_exists(PK)",
      },
    });
  }
  return items;
}

function skuBackfillPayloadBytes(tableName: string, candidates: readonly SkuBackfillCandidate[]): number {
  return Buffer.byteLength(JSON.stringify(skuBackfillTransactItems(tableName, candidates)));
}

export function chunkSkuBackfillCandidates(
  tableName: string,
  candidates: readonly SkuBackfillCandidate[],
  limits: { maxProducts?: number; maxBytes?: number } = {}
): SkuBackfillCandidate[][] {
  const maxProducts = Math.min(
    limits.maxProducts ?? SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION,
    SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION
  );
  const maxBytes = limits.maxBytes ?? SKU_BACKFILL_MAX_TRANSACTION_BYTES;
  const batches: SkuBackfillCandidate[][] = [];
  let current: SkuBackfillCandidate[] = [];

  const startBatch = (candidate: SkuBackfillCandidate) => {
    if (skuBackfillPayloadBytes(tableName, [candidate]) > maxBytes) {
      throw new Error(`Refusing to reserve ${candidate.slug} because its backfill transaction exceeds the payload limit.`);
    }
    current = [candidate];
  };

  for (const candidate of candidates) {
    if (current.length === 0) {
      startBatch(candidate);
      continue;
    }
    if (current.length >= maxProducts) {
      batches.push(current);
      startBatch(candidate);
      continue;
    }
    const next = [...current, candidate];
    if (skuBackfillPayloadBytes(tableName, next) > maxBytes) {
      batches.push(current);
      startBatch(candidate);
      continue;
    }
    current = next;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

export type VerifiedSkuBackfillTarget = {
  accountId: string;
  region: string;
  tableName: string;
  tableArn: string;
  stackProductsTable: string;
};

export function assertSkuBackfillTarget(target: VerifiedSkuBackfillTarget): void {
  const problems: string[] = [];
  if (target.accountId !== DEV_SKU_BACKFILL_ACCOUNT) problems.push("account");
  if (target.region !== DEV_SKU_BACKFILL_REGION) problems.push("region");
  if (target.tableName !== DEV_SKU_BACKFILL_TABLE) problems.push("table");
  if (target.stackProductsTable !== DEV_SKU_BACKFILL_TABLE) problems.push("stack table");
  if (target.tableName === PROD_SKU_BACKFILL_TABLE || target.tableArn.includes(PROD_SKU_BACKFILL_TABLE)) {
    problems.push("production table");
  }
  const expectedArn = `arn:aws:dynamodb:${DEV_SKU_BACKFILL_REGION}:${DEV_SKU_BACKFILL_ACCOUNT}:table/${DEV_SKU_BACKFILL_TABLE}`;
  if (target.tableArn !== expectedArn) problems.push("table ARN");
  if (problems.length > 0) {
    throw new Error(`Refusing SKU backfill. Target is not the verified DEV table (${problems.join(", ")}).`);
  }
}

export function parseSkuBackfillArgs(argv: readonly string[]): {
  apply: boolean;
  confirmAccount?: string;
  confirmTable?: string;
} {
  let apply = false;
  let confirmAccount: string | undefined;
  let confirmTable: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") apply = true;
    else if (arg === "--confirm-account") confirmAccount = argv[index + 1];
    else if (arg === "--confirm-table") confirmTable = argv[index + 1];
  }
  return { apply, confirmAccount, confirmTable };
}

/** Dry-run is the default. Apply writes only when both confirmation flags match the DEV target. */
export function assertSkuBackfillApplyRequest(input: {
  apply: boolean;
  confirmAccount?: string;
  confirmTable?: string;
}): { write: false } | { write: true } {
  if (!input.apply) return { write: false };
  if (input.confirmAccount !== DEV_SKU_BACKFILL_ACCOUNT || input.confirmTable !== DEV_SKU_BACKFILL_TABLE) {
    throw new Error(
      "Refusing to apply. Pass --apply --confirm-account 796174527529 --confirm-table blossompot-products-dev."
    );
  }
  return { write: true };
}

export type SkuBackfillExecution = {
  mode: "dry-run" | "apply";
  wrote: boolean;
  created: number;
  alreadyComplete: number;
  blankSkipped: number;
  batchesCommitted: number;
  batchesNotCommitted: number;
  stopped: boolean;
  stopReason: "conflict" | "throttled" | "error" | null;
  remainingSlugs: string[];
};

function errorName(err: unknown): string {
  return err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
}

export function isSkuBackfillThrottle(err: unknown): boolean {
  const name = errorName(err);
  if (
    name === "ProvisionedThroughputExceededException" ||
    name === "ThrottlingException" ||
    name === "RequestLimitExceeded" ||
    name === "ThrottlingError"
  ) {
    return true;
  }
  const message = err instanceof Error ? err.message : "";
  return /throttl|throughput exceeded|request limit exceeded/i.test(message);
}

export function isSkuBackfillConflict(err: unknown): boolean {
  const name = errorName(err);
  return name === "TransactionCanceledException" || name === "ConditionalCheckFailedException";
}

/**
 * Apply a plan in bounded transactions.
 * Each transaction is conditional. The full run is not one atomic transaction.
 * A committed reservation is the resume marker. A cancelled or throttled batch is not counted as created.
 */
export async function executeSkuReservationBackfill(input: {
  plan: SkuBackfillPlan;
  mode: "dry-run" | "apply";
  applyConfirmed: boolean;
  tableName: string;
  transact: (items: readonly SkuBackfillTransactItem[]) => Promise<void>;
  batchSize?: number;
  maxThrottleAttempts?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<SkuBackfillExecution> {
  const base = {
    mode: input.mode,
    wrote: false,
    created: 0,
    alreadyComplete: input.plan.alreadyComplete.length,
    blankSkipped: input.plan.blankSkuSlugs.length,
    batchesCommitted: 0,
    batchesNotCommitted: 0,
    stopped: false,
    stopReason: null as SkuBackfillExecution["stopReason"],
    remainingSlugs: input.plan.candidates.map((candidate) => candidate.slug),
  };
  if (input.mode === "dry-run") return base;
  if (!input.applyConfirmed) {
    throw new Error("Refusing to apply without explicit DEV account and table confirmation.");
  }
  assertSkuBackfillTarget({
    accountId: DEV_SKU_BACKFILL_ACCOUNT,
    region: DEV_SKU_BACKFILL_REGION,
    tableName: input.tableName,
    tableArn: `arn:aws:dynamodb:${DEV_SKU_BACKFILL_REGION}:${DEV_SKU_BACKFILL_ACCOUNT}:table/${input.tableName}`,
    stackProductsTable: input.tableName,
  });
  if (!input.plan.ok || !input.plan.scanComplete) {
    throw new Error(input.plan.refusal ?? "Refusing to apply an incomplete or conflicted SKU plan.");
  }

  const batches = chunkSkuBackfillCandidates(input.tableName, input.plan.candidates, {
    maxProducts: input.batchSize,
  });
  const maxAttempts = input.maxThrottleAttempts ?? 3;
  const sleep = input.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let created = 0;
  let committed = 0;
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index] ?? [];
    let attempt = 0;
    for (;;) {
      try {
        await input.transact(skuBackfillTransactItems(input.tableName, batch));
        created += batch.length;
        committed += 1;
        break;
      } catch (err) {
        if (isSkuBackfillThrottle(err) && attempt < maxAttempts - 1) {
          attempt += 1;
          await sleep(50 * attempt);
          continue;
        }
        const remaining = batches.slice(index).flatMap((pending) => pending.map((candidate) => candidate.slug));
        return {
          ...base,
          wrote: created > 0,
          created,
          batchesCommitted: committed,
          batchesNotCommitted: 1,
          stopped: true,
          stopReason: isSkuBackfillThrottle(err) ? "throttled" : isSkuBackfillConflict(err) ? "conflict" : "error",
          remainingSlugs: remaining,
        };
      }
    }
  }
  return {
    ...base,
    wrote: created > 0,
    created,
    batchesCommitted: committed,
    remainingSlugs: [],
  };
}
