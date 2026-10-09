/**
 * Import the categorized FNP USA workbook through the existing importer handlers.
 *
 *   npm run import:fnp-usa
 *
 * The script reads the workbook, previews through previewFnpImport, then commits
 * ready rows in batches of 20 through commitFnpImport. It retries only rows the
 * handler recorded as errors. It does not write DynamoDB items itself.
 *
 * It stops before any commit when the environment is production, the API is on
 * the in-memory store, DynamoDB Local is configured as ephemeral, the products
 * table cannot be reached, or S3 image hosting is not configured.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import * as XLSX from "xlsx";
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  FNP_IMPORT_COMMIT_BATCH_SIZE,
  fnpImportWriteBlocked,
  type FnpImportPlanRow,
} from "@blossompot/shared";

const ROOT = resolve(process.cwd());
const WORKBOOK =
  process.env.FNP_WORKBOOK ??
  resolve(ROOT, "scripts/data/fnp-usa/FNP_USA_Product_List.xlsx");
const REPORT_DIR = resolve(ROOT, "scripts/reports");
const REPORT_PATH = resolve(REPORT_DIR, "fnp-usa-import-report.json");

type Blocker = { code: string; message: string };

type CommitRow = FnpImportPlanRow & {
  outcome?: { status: string; message: string; productSlug?: string };
};

type Report = {
  startedAt: string;
  finishedAt?: string;
  workbook: string;
  totalRows: number;
  imported: number | null;
  skipped: number | null;
  blocked: number | null;
  conflicts: number | null;
  failed: number | null;
  categoriesCreated: string[];
  imageHosting: string;
  batchIds: string[];
  published: false;
  productionChanged: false;
  committed: boolean;
  environment: {
    environment: string;
    productsTable: string;
    dynamoEndpoint: string;
    useMemoryDb: boolean;
    uploadBucket: string;
    cloudfrontDomain: string;
    useLocalUploads: boolean;
  };
  blockers: Blocker[];
  previewPath?: string;
  rows?: Array<Record<string, unknown>>;
};

function environmentSnapshot() {
  return {
    environment: process.env.ENVIRONMENT ?? "",
    productsTable: process.env.PRODUCTS_TABLE ?? "",
    dynamoEndpoint: process.env.DYNAMODB_ENDPOINT ?? "",
    useMemoryDb: process.env.USE_MEMORY_DB === "true",
    uploadBucket: process.env.UPLOAD_BUCKET ?? "",
    cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN ?? "",
    useLocalUploads: process.env.USE_LOCAL_UPLOADS === "true",
  };
}

function readWorkbookRows(): Record<string, unknown>[] {
  if (!existsSync(WORKBOOK)) {
    throw new Error(`Workbook not found: ${WORKBOOK}`);
  }
  const book = XLSX.read(readFileSync(WORKBOOK), { type: "buffer" });
  const sheet = book.Sheets.Products ?? book.Sheets[book.SheetNames[0] ?? ""];
  if (!sheet) throw new Error("Workbook has no sheets.");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
}

function ephemeralLocalDynamo(): string | null {
  const endpoint = process.env.DYNAMODB_ENDPOINT ?? "";
  if (!/localhost|127\.0\.0\.1/i.test(endpoint)) return null;
  const composePath = resolve(ROOT, "docker-compose.yml");
  if (!existsSync(composePath)) return null;
  const compose = readFileSync(composePath, "utf8");
  if (!compose.includes("-inMemory")) return null;
  return "docker-compose.yml starts DynamoDB Local with -inMemory. That database is discarded when the container stops, so it cannot hold the catalog import.";
}

async function endpointResponds(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

async function collectBlockers(): Promise<Blocker[]> {
  const blockers: Blocker[] = [];
  const env = environmentSnapshot();
  const guard = fnpImportWriteBlocked({
    environment: env.environment,
    productsTable: env.productsTable,
    uploadBucket: env.uploadBucket,
  });
  if (!env.environment) {
    blockers.push({
      code: "environment-missing",
      message: "ENVIRONMENT is not set. Run npm run import:fnp-usa so apps/api/.env is loaded.",
    });
  }
  if (guard.blocked && guard.reason) {
    blockers.push({ code: "production", message: guard.reason });
  }
  if (!env.productsTable) {
    blockers.push({
      code: "table-missing",
      message: "PRODUCTS_TABLE is not set. The import will not choose a default AWS table.",
    });
  }
  if (env.useMemoryDb) {
    blockers.push({
      code: "memory-db",
      message:
        "USE_MEMORY_DB=true. The running API keeps products in process memory. A full catalog import would disappear when the API stops.",
    });
  }
  const allowDevAws =
    process.env.FNP_IMPORT_ALLOW_DEV_AWS === "true" && env.productsTable === "blossompot-products-dev";
  const ephemeral = ephemeralLocalDynamo();
  if (ephemeral) blockers.push({ code: "ephemeral-dynamo", message: ephemeral });
  if (env.dynamoEndpoint) {
    const up = await endpointResponds(env.dynamoEndpoint);
    if (!up) {
      blockers.push({
        code: "dynamo-unreachable",
        message: `No database responded at ${env.dynamoEndpoint}. Docker is not available on this machine, so DynamoDB Local is not running.`,
      });
    }
  } else if (!env.useMemoryDb && env.productsTable && !guard.blocked && !allowDevAws) {
    blockers.push({
      code: "dynamo-endpoint-missing",
      message: "DYNAMODB_ENDPOINT is not set. Refusing to guess an AWS account.",
    });
  }
  if (!env.uploadBucket && process.env.USE_LOCAL_UPLOADS !== "true") {
    blockers.push({
      code: "s3-missing",
      message:
        "UPLOAD_BUCKET is not set. The FNP importer copies images to S3 before it creates a product. USE_LOCAL_UPLOADS does not apply to this importer, and the in-memory image stub cannot be used for the catalog.",
    });
  }
  if (process.env.FNP_IMPORT_IMAGE_STUB?.trim()) {
    blockers.push({
      code: "image-stub",
      message: "FNP_IMPORT_IMAGE_STUB is set. Unset it so images are copied to the upload bucket.",
    });
  }
  if (process.env.DEV_AUTH_ENABLED !== "true" && !process.env.FNP_IMPORT_TOKEN) {
    blockers.push({
      code: "auth-missing",
      message: "Set DEV_AUTH_ENABLED=true for the local admin token, or set FNP_IMPORT_TOKEN to an admin bearer token.",
    });
  }
  return blockers;
}

function adminEvent(method: string, path: string, body?: unknown): APIGatewayProxyEventV2 {
  const token = process.env.FNP_IMPORT_TOKEN ?? "dev:fnp-import@blossompot.local:admin";
  return {
    rawPath: path,
    body: body == null ? undefined : JSON.stringify(body),
    headers: { authorization: `Bearer ${token}` },
    isBase64Encoded: false,
    pathParameters: {},
    requestContext: { http: { method, path }, stage: "$default" },
  } as unknown as APIGatewayProxyEventV2;
}

function readHandler(result: APIGatewayProxyResultV2): { status: number; body: Record<string, unknown> } {
  if (typeof result === "string") return { status: 200, body: JSON.parse(result) as Record<string, unknown> };
  return {
    status: result.statusCode ?? 200,
    body: JSON.parse(result.body ?? "{}") as Record<string, unknown>,
  };
}

function save(report: Report) {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

async function assertTableExists() {
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(endpoint
      ? {
          endpoint,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
          },
        }
      : {}),
  });
  await client.send(new DescribeTableCommand({ TableName: process.env.PRODUCTS_TABLE }));
}

async function main() {
  const report: Report = {
    startedAt: new Date().toISOString(),
    workbook: WORKBOOK,
    totalRows: 0,
    imported: null,
    skipped: null,
    blocked: null,
    conflicts: null,
    failed: null,
    categoriesCreated: [],
    imageHosting: process.env.UPLOAD_BUCKET
      ? `s3://${process.env.UPLOAD_BUCKET}`
      : "not configured",
    batchIds: [],
    published: false,
    productionChanged: false,
    committed: false,
    environment: environmentSnapshot(),
    blockers: [],
  };

  let rows: Record<string, unknown>[] = [];
  try {
    rows = readWorkbookRows();
    report.totalRows = rows.length;
  } catch (err) {
    report.blockers.push({
      code: "workbook",
      message: err instanceof Error ? err.message : "Could not read the workbook.",
    });
    report.finishedAt = new Date().toISOString();
    save(report);
    console.error(report.blockers[0]?.message);
    process.exit(1);
  }

  report.blockers = await collectBlockers();
  if (report.blockers.length > 0) {
    report.finishedAt = new Date().toISOString();
    save(report);
    console.error("FNP catalog import stopped before any database write.");
    for (const blocker of report.blockers) console.error(`- ${blocker.message}`);
    console.error(`Workbook rows read: ${report.totalRows}`);
    console.error(`Report: ${REPORT_PATH}`);
    process.exit(1);
  }

  await assertTableExists();
  const { previewFnpImport, commitFnpImport, retryFnpImport } = await import(
    "../apps/api/src/handlers/fnp-import"
  );

  const preview = readHandler(
    await previewFnpImport(adminEvent("POST", "/admin/imports/fnp/preview", { rows }))
  );
  if (preview.status !== 200) {
    throw new Error(`Preview failed (${preview.status}): ${JSON.stringify(preview.body)}`);
  }
  if (preview.body.writeBlocked === true) {
    throw new Error(String(preview.body.writeBlockedReason ?? "Preview refused a production write target."));
  }

  const previewPath = resolve(REPORT_DIR, "fnp-usa-preview.json");
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(previewPath, JSON.stringify(preview.body, null, 2));
  report.previewPath = previewPath;

  const planned = (preview.body.rows ?? []) as FnpImportPlanRow[];
  report.imported = 0;
  report.skipped = 0;
  report.blocked = planned.filter((row) => row.status === "blocked").length;
  report.conflicts = planned.filter((row) => row.status === "conflict").length;
  report.failed = 0;
  const ready = planned.filter((row) => row.status === "ready");
  const created = new Set<string>();

  let batchId = "";
  for (let index = 0; index < ready.length; index += FNP_IMPORT_COMMIT_BATCH_SIZE) {
    const chunk = ready.slice(index, index + FNP_IMPORT_COMMIT_BATCH_SIZE);
    const committed = readHandler(
      await commitFnpImport(
        adminEvent("POST", "/admin/imports/fnp/commit", {
          ...(batchId ? { batchId } : {}),
          entries: chunk.map((row) => ({ row: row.row, input: row.input })),
        })
      )
    );
    if (committed.status !== 200) {
      report.finishedAt = new Date().toISOString();
      report.rows = [{ error: committed.body, batchStart: index }];
      save(report);
      throw new Error(`Commit failed (${committed.status}): ${JSON.stringify(committed.body)}`);
    }
    batchId = String(committed.body.batchId ?? batchId);
    if (batchId && !report.batchIds.includes(batchId)) report.batchIds.push(batchId);
    report.committed = true;
    const batchRows = (committed.body.rows ?? []) as CommitRow[];
    for (const row of batchRows) {
      const status = row.outcome?.status;
      if (status === "imported") {
        report.imported += 1;
        if (row.categoryAction === "create" && row.categorySlug) created.add(row.categorySlug);
      } else if (status === "duplicate" || status === "empty") report.skipped += 1;
      else if (status === "conflict") report.conflicts += 1;
      else if (status === "blocked") report.blocked += 1;
      else report.failed += 1;
    }
    report.categoriesCreated = [...created];
    report.finishedAt = new Date().toISOString();
    save(report);
    console.log(
      `Batch ${report.batchIds.length} saved. Imported ${report.imported}, failed ${report.failed}, batch ${batchId}.`
    );
  }

  for (let attempt = 1; attempt <= 3 && report.failed > 0 && batchId; attempt += 1) {
    const before = report.failed;
    const retried = readHandler(
      await retryFnpImport(adminEvent("POST", "/admin/imports/fnp/retry", { batchId }))
    );
    if (retried.status !== 200) {
      throw new Error(`Retry failed (${retried.status}): ${JSON.stringify(retried.body)}`);
    }
    if (Number(retried.body.retried ?? 0) === 0) break;
    const retryRows = (retried.body.rows ?? []) as CommitRow[];
    let recovered = 0;
    let stillFailed = 0;
    for (const row of retryRows) {
      if (row.outcome?.status === "imported") {
        recovered += 1;
        if (row.categoryAction === "create" && row.categorySlug) created.add(row.categorySlug);
      } else if (row.outcome?.status === "error") stillFailed += 1;
    }
    report.imported += recovered;
    report.failed = Math.max(0, report.failed - recovered);
    report.categoriesCreated = [...created];
    report.finishedAt = new Date().toISOString();
    save(report);
    if (recovered === 0 || report.failed >= before) break;
    if (stillFailed === 0) break;
  }

  report.skipped += planned.filter((row) => row.status === "duplicate").length;
  report.finishedAt = new Date().toISOString();
  save(report);
  console.log(JSON.stringify({
    totalRows: report.totalRows,
    imported: report.imported,
    skipped: report.skipped,
    blocked: report.blocked,
    conflicts: report.conflicts,
    failed: report.failed,
    categoriesCreated: report.categoriesCreated,
    batchIds: report.batchIds,
    published: report.published,
    report: REPORT_PATH,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
