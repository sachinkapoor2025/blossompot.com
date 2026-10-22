import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productSkuKeys } from "../db/keys";
import { catalogSkuReservationItem, normalizeCatalogSku } from "./catalog-sku";
import {
  DEV_SKU_BACKFILL_ACCOUNT,
  DEV_SKU_BACKFILL_TABLE,
  PROD_SKU_BACKFILL_TABLE,
  SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION,
  SKU_BACKFILL_MAX_TRANSACTION_BYTES,
  assertSkuBackfillApplyRequest,
  assertSkuBackfillTarget,
  chunkSkuBackfillCandidates,
  executeSkuReservationBackfill,
  parseSkuBackfillArgs,
  planSkuReservationBackfill,
  skuBackfillTransactItems,
  type SkuBackfillCandidate,
  type SkuBackfillTransactItem,
} from "./sku-reservation-backfill";

function product(slug: string, sku?: string | null): Record<string, unknown> {
  const item: Record<string, unknown> = { PK: `PRODUCT#${slug}`, SK: "META", slug };
  if (sku !== undefined) item.sku = sku;
  return item;
}

function reservation(sku: string, productSlug: string, storedSku: string = sku): Record<string, unknown> {
  return {
    PK: productSkuKeys.pk(sku),
    SK: "META",
    sku: storedSku,
    productSlug,
  };
}

function planOf(items: Record<string, unknown>[], scanComplete = true) {
  return planSkuReservationBackfill({ items, scanComplete });
}

function candidate(slug: string, auditedSku: string): SkuBackfillCandidate {
  const normalizedSku = normalizeCatalogSku(auditedSku);
  if (!normalizedSku) throw new Error("blank sku");
  return { slug, auditedSku, normalizedSku };
}

type Store = Map<string, Record<string, unknown>>;

function keyOf(pk: unknown, sk: unknown): string {
  return `${String(pk)}|${String(sk)}`;
}

function applyBatch(store: Store, items: readonly SkuBackfillTransactItem[]): void {
  const writes: Array<{ key: string; item: Record<string, unknown> }> = [];
  for (const entry of items) {
    if (entry.ConditionCheck) {
      const current = store.get(keyOf(entry.ConditionCheck.Key.PK, entry.ConditionCheck.Key.SK));
      const audited = entry.ConditionCheck.ExpressionAttributeValues[":auditedSku"];
      if (!current || current.sku !== audited) {
        const err = new Error("Transaction cancelled");
        err.name = "TransactionCanceledException";
        throw err;
      }
    }
    if (entry.Put) {
      const item = entry.Put.Item;
      const key = keyOf(item.PK, item.SK);
      if (entry.Put.ConditionExpression === "attribute_not_exists(PK)" && store.has(key)) {
        const err = new Error("Transaction cancelled");
        err.name = "TransactionCanceledException";
        throw err;
      }
      writes.push({ key, item: { ...item } });
    }
  }
  for (const write of writes) store.set(write.key, write.item);
}

function namedError(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

function manyCandidates(count: number): SkuBackfillCandidate[] {
  return Array.from({ length: count }, (_, index) => {
    const auditedSku = `SKU-${index}`;
    return {
      slug: `product-${String(index).padStart(4, "0")}`,
      auditedSku,
      normalizedSku: normalizeCatalogSku(auditedSku) ?? "",
    };
  });
}

function assertBatchesWithinLimits(batches: SkuBackfillCandidate[][], maxBytes = SKU_BACKFILL_MAX_TRANSACTION_BYTES) {
  assert.ok(batches.every((batch) => batch.length > 0));
  for (const batch of batches) {
    assert.ok(batch.length <= SKU_BACKFILL_MAX_PRODUCTS_PER_TRANSACTION);
    const items = skuBackfillTransactItems(DEV_SKU_BACKFILL_TABLE, batch);
    assert.equal(items.length, batch.length * 2);
    assert.ok(items.length <= 100);
    assert.ok(Buffer.byteLength(JSON.stringify(items)) <= maxBytes);
  }
}

describe("sku backfill batch splitter", () => {
  it("returns no batches for an empty plan", () => {
    assert.deepEqual(chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, []), []);
  });

  it("keeps one candidate in one batch", () => {
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(1));
    assert.deepEqual(batches.map((batch) => batch.length), [1]);
    assertBatchesWithinLimits(batches);
  });

  it("keeps exactly 50 candidates in one batch", () => {
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(50));
    assert.deepEqual(batches.map((batch) => batch.length), [50]);
    assertBatchesWithinLimits(batches);
  });

  it("splits 51 candidates into 50 and 1", () => {
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(51));
    assert.deepEqual(batches.map((batch) => batch.length), [50, 1]);
    assertBatchesWithinLimits(batches);
  });

  it("splits 100 candidates into two batches of 50", () => {
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(100));
    assert.deepEqual(batches.map((batch) => batch.length), [50, 50]);
    assertBatchesWithinLimits(batches);
  });

  it("splits 798 candidates into 16 batches ending with 48", () => {
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(798));
    assert.equal(batches.length, 16);
    assert.deepEqual(batches.slice(0, 15).map((batch) => batch.length), Array.from({ length: 15 }, () => 50));
    assert.equal(batches[15]?.length, 48);
    assert.equal(batches.reduce((sum, batch) => sum + batch.length, 0), 798);
    assertBatchesWithinLimits(batches);
  });

  it("starts a new batch when the next product would exceed the payload guard", () => {
    const one = skuBackfillTransactItems(DEV_SKU_BACKFILL_TABLE, manyCandidates(1));
    const two = skuBackfillTransactItems(DEV_SKU_BACKFILL_TABLE, manyCandidates(2));
    const oneByte = Buffer.byteLength(JSON.stringify(one));
    const twoBytes = Buffer.byteLength(JSON.stringify(two));
    assert.ok(twoBytes > oneByte);
    const batches = chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(5), { maxBytes: oneByte });
    assert.deepEqual(batches.map((batch) => batch.length), [1, 1, 1, 1, 1]);
    assertBatchesWithinLimits(batches, oneByte);
  });

  it("rejects one product that cannot fit in the payload limit", () => {
    assert.throws(
      () => chunkSkuBackfillCandidates(DEV_SKU_BACKFILL_TABLE, manyCandidates(1), { maxBytes: 1 }),
      /payload limit/
    );
  });
});

describe("sku reservation backfill plan", () => {
  it("uses the shared SKU normalization for the reservation key", () => {
    const planned = planOf([product("sweet-moments-bouquet", " TFFF2602 ")]);
    assert.equal(planned.ok, true);
    assert.equal(planned.candidates[0]?.normalizedSku, normalizeCatalogSku(" TFFF2602 "));
    const [check, put] = skuBackfillTransactItems(DEV_SKU_BACKFILL_TABLE, planned.candidates);
    assert.equal(check?.ConditionCheck?.ExpressionAttributeValues[":auditedSku"], " TFFF2602 ");
    assert.deepEqual(put?.Put?.Item, catalogSkuReservationItem(" TFFF2602 ", "sweet-moments-bouquet"));
    assert.equal(put?.Put?.Item?.PK, productSkuKeys.pk("tfff2602"));
    assert.equal(put?.Put?.ConditionExpression, "attribute_not_exists(PK)");
  });

  it("leaves a blank SKU out of the plan", () => {
    const planned = planOf([
      product("chocolate-truffle-cake"),
      product("whitespace-sku", "   "),
      product("rose", "Rose-1"),
    ]);
    assert.equal(planned.ok, true);
    assert.deepEqual(planned.blankSkuSlugs, ["chocolate-truffle-cake", "whitespace-sku"]);
    assert.deepEqual(planned.candidates.map((row) => row.slug), ["rose"]);
  });

  it("treats an exact owned reservation as already complete", () => {
    const planned = planOf([
      product("rose", "Rose-1"),
      reservation("rose-1", "rose", "Rose-1"),
    ]);
    assert.equal(planned.ok, true);
    assert.equal(planned.candidates.length, 0);
    assert.deepEqual(planned.alreadyComplete, [{ slug: "rose", normalizedSku: "rose-1" }]);
  });

  it("rejects a reservation owned by another product", () => {
    const planned = planOf([
      product("rose", "Rose-1"),
      reservation("rose-1", "lily", "Rose-1"),
    ]);
    assert.equal(planned.ok, false);
    assert.equal(planned.conflicts.some((conflict) => conflict.kind === "reserved-by-other"), true);
    assert.equal(planned.conflicts.some((conflict) => conflict.kind === "orphan-reservation"), true);
  });

  it("aborts the whole plan when normalized SKUs are duplicated", () => {
    const planned = planOf([
      product("rose", "Rose-1"),
      product("other", " rose-1 "),
    ]);
    assert.equal(planned.ok, false);
    assert.equal(planned.refusal?.includes("Refusing"), true);
    assert.equal(planned.conflicts.filter((conflict) => conflict.kind === "duplicate-sku").length, 1);
  });

  it("refuses an incomplete scan", () => {
    const planned = planOf([product("rose", "Rose-1")], false);
    assert.equal(planned.ok, false);
    assert.deepEqual(planned.candidates, []);
    assert.equal(planned.conflicts[0]?.kind, "incomplete-scan");
  });
});

describe("sku reservation backfill execution", () => {
  it("does not write during dry-run", async () => {
    const planned = planOf([product("rose", "Rose-1"), product("chocolate-truffle-cake")]);
    let calls = 0;
    const result = await executeSkuReservationBackfill({
      plan: planned,
      mode: "dry-run",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      transact: async () => {
        calls += 1;
      },
    });
    assert.equal(calls, 0);
    assert.equal(result.wrote, false);
    assert.equal(result.created, 0);
    assert.equal(result.blankSkipped, 1);
  });

  it("requires explicit DEV confirmation before apply", async () => {
    assert.equal(parseSkuBackfillArgs(["--apply"]).apply, true);
    assert.throws(() => assertSkuBackfillApplyRequest({ apply: true }), /confirm-account/);
    assert.deepEqual(
      assertSkuBackfillApplyRequest({
        apply: true,
        confirmAccount: DEV_SKU_BACKFILL_ACCOUNT,
        confirmTable: DEV_SKU_BACKFILL_TABLE,
      }),
      { write: true }
    );
    assert.equal(assertSkuBackfillApplyRequest({ apply: false }).write, false);
    assert.throws(
      () =>
        assertSkuBackfillTarget({
          accountId: "000",
          region: "us-east-1",
          tableName: DEV_SKU_BACKFILL_TABLE,
          tableArn: `arn:aws:dynamodb:us-east-1:${DEV_SKU_BACKFILL_ACCOUNT}:table/${DEV_SKU_BACKFILL_TABLE}`,
          stackProductsTable: DEV_SKU_BACKFILL_TABLE,
        }),
      /not the verified DEV/
    );
    assert.throws(
      () =>
        assertSkuBackfillTarget({
          accountId: DEV_SKU_BACKFILL_ACCOUNT,
          region: "us-east-1",
          tableName: PROD_SKU_BACKFILL_TABLE,
          tableArn: `arn:aws:dynamodb:us-east-1:${DEV_SKU_BACKFILL_ACCOUNT}:table/${PROD_SKU_BACKFILL_TABLE}`,
          stackProductsTable: PROD_SKU_BACKFILL_TABLE,
        }),
      /production table|not the verified DEV/
    );

    const planned = planOf([product("rose", "Rose-1")]);
    let calls = 0;
    await assert.rejects(
      () =>
        executeSkuReservationBackfill({
          plan: planned,
          mode: "apply",
          applyConfirmed: false,
          tableName: DEV_SKU_BACKFILL_TABLE,
          transact: async () => {
            calls += 1;
          },
        }),
      /explicit DEV/
    );
    assert.equal(calls, 0);
  });

  it("does not apply a duplicate plan", async () => {
    const planned = planOf([product("rose", "Rose-1"), product("other", "rose-1")]);
    let calls = 0;
    await assert.rejects(
      () =>
        executeSkuReservationBackfill({
          plan: planned,
          mode: "apply",
          applyConfirmed: true,
          tableName: DEV_SKU_BACKFILL_TABLE,
          transact: async () => {
            calls += 1;
          },
        }),
      /Refusing/
    );
    assert.equal(calls, 0);
  });

  it("reports a conflict when the product SKU changes before the transaction", async () => {
    const planned = planOf([product("rose", "Rose-1")]);
    const store: Store = new Map([["PRODUCT#rose|META", product("rose", "Rose-2")]]);
    const result = await executeSkuReservationBackfill({
      plan: planned,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      transact: async (items) => applyBatch(store, items),
    });
    assert.equal(result.created, 0);
    assert.equal(result.wrote, false);
    assert.equal(result.stopReason, "conflict");
    assert.equal(store.has(productSkuKeys.pk("rose-1") + "|META"), false);
    assert.equal(store.get("PRODUCT#rose|META")?.sku, "Rose-2");
  });

  it("reports a conflict when a reservation appears before the transaction", async () => {
    const planned = planOf([product("rose", "Rose-1")]);
    const store: Store = new Map([
      ["PRODUCT#rose|META", product("rose", "Rose-1")],
      [productSkuKeys.pk("rose-1") + "|META", reservation("rose-1", "lily", "Rose-1")],
    ]);
    const result = await executeSkuReservationBackfill({
      plan: planned,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      transact: async (items) => applyBatch(store, items),
    });
    assert.equal(result.created, 0);
    assert.equal(result.stopReason, "conflict");
    assert.equal(store.get(productSkuKeys.pk("rose-1") + "|META")?.productSlug, "lily");
  });

  it("resumes after partial progress without creating a second reservation", async () => {
    const first = planOf([product("lily", "Lily-1"), product("rose", "Rose-1")]);
    const store: Store = new Map([
      ["PRODUCT#lily|META", product("lily", "Lily-1")],
      ["PRODUCT#rose|META", product("rose", "Rose-1")],
    ]);
    let calls = 0;
    const partial = await executeSkuReservationBackfill({
      plan: first,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      batchSize: 1,
      transact: async (items) => {
        calls += 1;
        if (calls === 2) throw namedError("TransactionCanceledException");
        applyBatch(store, items);
      },
    });
    assert.equal(partial.created, 1);
    assert.equal(partial.stopped, true);
    assert.equal(partial.stopReason, "conflict");
    assert.equal(calls, 2);
    assert.deepEqual(partial.remainingSlugs, ["rose"]);

    const second = planOf([
      product("lily", "Lily-1"),
      reservation("lily-1", "lily", "Lily-1"),
      product("rose", "Rose-1"),
      product("chocolate-truffle-cake"),
    ]);
    assert.deepEqual(second.alreadyComplete, [{ slug: "lily", normalizedSku: "lily-1" }]);
    assert.deepEqual(second.blankSkuSlugs, ["chocolate-truffle-cake"]);
    const resumed = await executeSkuReservationBackfill({
      plan: second,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      batchSize: 1,
      transact: async (items) => applyBatch(store, items),
    });
    assert.equal(resumed.created, 1);
    assert.equal(resumed.stopped, false);
    assert.equal(store.get(productSkuKeys.pk("rose-1") + "|META")?.productSlug, "rose");
    assert.equal(store.get(productSkuKeys.pk("lily-1") + "|META")?.productSlug, "lily");

    const done = planOf([...store.values()]);
    const rerun = await executeSkuReservationBackfill({
      plan: done,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      transact: async () => {
        throw new Error("should not write");
      },
    });
    assert.equal(rerun.created, 0);
    assert.equal(rerun.wrote, false);
    assert.equal(rerun.alreadyComplete, 2);
  });

  it("does not count throttling or a failed transaction as success", async () => {
    const planned = planOf([product("rose", "Rose-1")]);
    let attempts = 0;
    const store: Store = new Map([["PRODUCT#rose|META", product("rose", "Rose-1")]]);
    const throttled = await executeSkuReservationBackfill({
      plan: planned,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      maxThrottleAttempts: 3,
      sleep: async () => undefined,
      transact: async (items) => {
        attempts += 1;
        if (attempts < 3) throw namedError("ProvisionedThroughputExceededException");
        applyBatch(store, items);
      },
    });
    assert.equal(attempts, 3);
    assert.equal(throttled.created, 1);
    assert.equal(throttled.stopped, false);

    attempts = 0;
    const exhausted = await executeSkuReservationBackfill({
      plan: planned,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      maxThrottleAttempts: 2,
      sleep: async () => undefined,
      transact: async () => {
        attempts += 1;
        throw namedError("ThrottlingException");
      },
    });
    assert.equal(attempts, 2);
    assert.equal(exhausted.created, 0);
    assert.equal(exhausted.wrote, false);
    assert.equal(exhausted.stopReason, "throttled");

    const failed = await executeSkuReservationBackfill({
      plan: planned,
      mode: "apply",
      applyConfirmed: true,
      tableName: DEV_SKU_BACKFILL_TABLE,
      transact: async () => {
        throw new Error("network down");
      },
    });
    assert.equal(failed.created, 0);
    assert.equal(failed.stopReason, "error");
  });
});
