/**
 * Backfill missing DEV catalog SKU reservations.
 *
 * Dry-run is the default and writes nothing. Apply is a series of conditional
 * transactions, not one atomic write. Each committed reservation is the resume
 * marker: rerun the same command and exact owned reservations are left unchanged.
 *
 *   npx tsx scripts/backfill-sku-reservations.ts
 *   npx tsx scripts/backfill-sku-reservations.ts --apply --confirm-account 796174527529 --confirm-table blossompot-products-dev
 *
 * This file does not run unless invoked. Do not point it at production.
 */
import { execFileSync } from "node:child_process";
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import {
  DEV_SKU_BACKFILL_ACCOUNT,
  DEV_SKU_BACKFILL_REGION,
  DEV_SKU_BACKFILL_STACK,
  DEV_SKU_BACKFILL_TABLE,
  assertSkuBackfillApplyRequest,
  assertSkuBackfillTarget,
  executeSkuReservationBackfill,
  parseSkuBackfillArgs,
  planSkuReservationBackfill,
} from "../packages/shared/src/lib/sku-reservation-backfill";

const PAGE_LIMIT = 10_000;

function awsText(args: readonly string[]): string {
  return execFileSync("aws", args, { encoding: "utf8" }).trim();
}

async function verifyDevTarget(): Promise<void> {
  const accountId = awsText([
    "sts",
    "get-caller-identity",
    "--query",
    "Account",
    "--output",
    "text",
    "--region",
    DEV_SKU_BACKFILL_REGION,
  ]);
  const stackProductsTable = awsText([
    "cloudformation",
    "describe-stacks",
    "--stack-name",
    DEV_SKU_BACKFILL_STACK,
    "--region",
    DEV_SKU_BACKFILL_REGION,
    "--query",
    "Stacks[0].Outputs[?OutputKey=='ProductsTableName'].OutputValue",
    "--output",
    "text",
  ]);
  const dynamo = new DynamoDBClient({ region: DEV_SKU_BACKFILL_REGION });
  const described = await dynamo.send(new DescribeTableCommand({ TableName: DEV_SKU_BACKFILL_TABLE }));
  assertSkuBackfillTarget({
    accountId,
    region: DEV_SKU_BACKFILL_REGION,
    tableName: described.Table?.TableName ?? "",
    tableArn: described.Table?.TableArn ?? "",
    stackProductsTable,
  });
}

async function scanDevCatalog(): Promise<Record<string, unknown>[]> {
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: DEV_SKU_BACKFILL_REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const items: Record<string, unknown>[] = [];
  let start: Record<string, unknown> | undefined;
  let pages = 0;
  do {
    const page = await doc.send(
      new ScanCommand({
        TableName: DEV_SKU_BACKFILL_TABLE,
        ConsistentRead: true,
        ExclusiveStartKey: start,
        ProjectionExpression: "PK, SK, slug, sku, productSlug",
      })
    );
    items.push(...((page.Items ?? []) as Record<string, unknown>[]));
    start = page.LastEvaluatedKey;
    pages += 1;
    if (pages > PAGE_LIMIT) {
      throw new Error("Refusing to continue. The DEV catalog scan exceeded the page limit.");
    }
  } while (start);
  return items;
}

async function main(): Promise<void> {
  const args = parseSkuBackfillArgs(process.argv.slice(2));
  const request = assertSkuBackfillApplyRequest(args);
  await verifyDevTarget();
  const items = await scanDevCatalog();
  const plan = planSkuReservationBackfill({ items, scanComplete: true });
  const summary = {
    mode: request.write ? "apply" : "dry-run",
    accountId: DEV_SKU_BACKFILL_ACCOUNT,
    region: DEV_SKU_BACKFILL_REGION,
    table: DEV_SKU_BACKFILL_TABLE,
    ok: plan.ok,
    refusal: plan.refusal,
    candidates: plan.candidates.length,
    alreadyComplete: plan.alreadyComplete.length,
    blankSkuSlugs: plan.blankSkuSlugs,
    conflicts: plan.conflicts,
    candidateSample: plan.candidates.slice(0, 20).map((candidate) => ({
      slug: candidate.slug,
      sku: candidate.auditedSku,
    })),
  };
  console.log(JSON.stringify(summary));
  if (!plan.ok) {
    process.exitCode = 2;
    return;
  }
  if (!request.write) return;

  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: DEV_SKU_BACKFILL_REGION }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const result = await executeSkuReservationBackfill({
    plan,
    mode: "apply",
    applyConfirmed: true,
    tableName: DEV_SKU_BACKFILL_TABLE,
    transact: async (transactItems) => {
      if (transactItems.length === 0) return;
      await doc.send(
        new TransactWriteCommand({
          TransactItems: [...transactItems] as NonNullable<TransactWriteCommandInput["TransactItems"]>,
        })
      );
    },
  });
  console.log(
    JSON.stringify({
      created: result.created,
      wrote: result.wrote,
      batchesCommitted: result.batchesCommitted,
      batchesNotCommitted: result.batchesNotCommitted,
      stopped: result.stopped,
      stopReason: result.stopReason,
      remainingSlugs: result.remainingSlugs,
      note: "Committed batches are not one atomic transaction. Rerun the same command to continue.",
    })
  );
  if (result.stopped) process.exitCode = 3;
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "SKU backfill failed.";
  console.error(message);
  process.exitCode = 1;
});
