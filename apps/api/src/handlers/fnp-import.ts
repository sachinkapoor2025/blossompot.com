import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  FNP_IMAGE_HOST,
  FNP_IMPORT_COMMIT_BATCH_SIZE,
  FNP_IMPORT_PREVIEW_MAX_ROWS,
  buildFnpProductDraft,
  categoryKeys,
  fnpImportWriteBlocked,
  imageExtensionForContentType,
  importBatchKeys,
  importImageKeys,
  importSourceKeys,
  mapFnpCategory,
  planFnpImport,
  productKeys,
  slugify,
  type FnpCategoryOverride,
  type FnpExistingProduct,
  type FnpExistingSource,
  type FnpImportPlanRow,
} from "@blossompot/shared";
import { getAuth } from "../lib/auth";
import { deleteImportedProductIfUnchanged, insertCatalogProduct, isTransactionConflict } from "../lib/catalog-sku-write";
import { docClient, now, PRODUCTS_TABLE } from "../lib/db";
import { badRequest, forbidden, notFound, ok } from "../lib/response";
import { invalidateCategoryCache } from "./categories";
import { invalidateProductListCache } from "./products";

const entrySchema = z.object({
  row: z.number().int().positive().max(100_000),
  input: z.record(z.string(), z.unknown()),
});

const categoryOverrideSchema = z.object({
  workbook: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  create: z.boolean(),
});

const commitSchema = z.object({
  batchId: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/).optional(),
  entries: z.array(entrySchema).min(1).max(FNP_IMPORT_COMMIT_BATCH_SIZE),
  categoryOverrides: z.array(categoryOverrideSchema).max(40).optional(),
});

const previewSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).max(FNP_IMPORT_PREVIEW_MAX_ROWS),
  categoryOverrides: z.array(categoryOverrideSchema).max(40).optional(),
});

const retrySchema = z.object({
  batchId: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/),
});

type ImportOutcome = {
  status: "imported" | "duplicate" | "conflict" | "blocked" | "error" | "empty";
  message: string;
  productSlug?: string;
};

function requireAdmin(event: APIGatewayProxyEventV2) {
  const auth = getAuth(event);
  if (!auth?.isAdmin) return null;
  return auth;
}

function writeGuard() {
  return fnpImportWriteBlocked({
    environment: process.env.ENVIRONMENT,
    productsTable: PRODUCTS_TABLE,
    uploadBucket: process.env.UPLOAD_BUCKET,
  });
}

function prepareOverrides(
  raw: FnpCategoryOverride[]
): { overrides: FnpCategoryOverride[]; error?: string } {
  const overrides: FnpCategoryOverride[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const workbook = item.workbook.trim().replace(/\s+/g, " ");
    const name = item.name.trim().replace(/\s+/g, " ");
    const slug = slugify(item.slug);
    if (!workbook || !name || !slug) {
      return { overrides: [], error: "Each category mapping needs a workbook category, a name, and a slug." };
    }
    if (mapFnpCategory(workbook, "import-check")) {
      return {
        overrides: [],
        error: `"${workbook}" is already in the approved category map. Choose a different workbook category.`,
      };
    }
    const key = workbook.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    overrides.push({ workbook, name, slug, create: item.create });
  }
  return { overrides };
}

type CatalogCategory = { slug: string; name: string; published: boolean };

async function loadCatalogCategories(): Promise<CatalogCategory[]> {
  const items: CatalogCategory[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": categoryKeys.gsi1pk() },
        ExclusiveStartKey,
      })
    );
    for (const item of result.Items ?? []) {
      if (typeof item.slug !== "string" || !item.slug) continue;
      items.push({
        slug: item.slug,
        name: typeof item.name === "string" && item.name.trim() ? item.name : item.slug,
        published: item.published !== false,
      });
    }
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function isConditionalFailure(err: unknown): boolean {
  return isTransactionConflict(err);
}

async function getItem(pk: string, sk: string): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: pk, SK: sk },
    })
  );
  return result.Item as Record<string, unknown> | undefined;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]!);
    }
  }
  const workers = Math.min(limit, items.length);
  if (workers > 0) await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

async function loadLookups(rows: unknown[], overrides: readonly FnpCategoryOverride[]) {
  const catalog = await loadCatalogCategories();
  const categoriesPresent = new Set(catalog.map((category) => category.slug));
  const categoryNames = new Map(catalog.map((category) => [category.slug, category.name]));
  const planned = planFnpImport({
    rows,
    categoriesPresent,
    existingSources: new Map(),
    existingProducts: new Map(),
    categoryNames,
    categoryOverrides: overrides,
  });
  const sourceKeys = [...new Set(planned.rows.map((row) => row.sourceKey).filter((key): key is string => Boolean(key)))];
  const slugs = [...new Set(planned.rows.map((row) => row.slug).filter(Boolean))];
  const categorySlugs = [
    ...new Set(planned.rows.map((row) => row.categorySlug).filter((slug): slug is string => Boolean(slug))),
  ].filter((slug) => !categoriesPresent.has(slug));

  const [sources, products, categories] = await Promise.all([
    mapPool(sourceKeys, 8, async (key) => ({ key, item: await getItem(importSourceKeys.pk(key), importSourceKeys.sk()) })),
    mapPool(slugs, 8, async (slug) => ({ slug, item: await getItem(productKeys.pk(slug), productKeys.sk()) })),
    mapPool(categorySlugs, 8, async (slug) => ({ slug, item: await getItem(categoryKeys.pk(slug), categoryKeys.sk()) })),
  ]);

  const existingSources = new Map<string, FnpExistingSource>();
  for (const source of sources) {
    const productSlug = typeof source.item?.productSlug === "string" ? source.item.productSlug : "";
    if (productSlug) existingSources.set(source.key, { productSlug });
  }
  const existingProducts = new Map<string, FnpExistingProduct>();
  for (const product of products) {
    if (!product.item) continue;
    existingProducts.set(product.slug, {
      sourceUrl: typeof product.item.sourceUrl === "string" ? product.item.sourceUrl : undefined,
      sourceKey: typeof product.item.sourceKey === "string" ? product.item.sourceKey : undefined,
    });
  }
  for (const category of categories) {
    if (!category.item) continue;
    categoriesPresent.add(category.slug);
    if (typeof category.item.name === "string" && category.item.name.trim()) {
      categoryNames.set(category.slug, category.item.name);
    }
  }
  return { existingSources, existingProducts, categoriesPresent, categoryNames, catalog };
}

function publicImageUrl(key: string): string {
  const cdn = process.env.CLOUDFRONT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (cdn) return `https://${cdn}/${key}`;
  const bucket = process.env.UPLOAD_BUCKET;
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

async function downloadFnpImage(imageUrl: string): Promise<{ bytes: Uint8Array; ext: string; contentType: string }> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(imageUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
        headers: { "User-Agent": "BlossomPotFnpImport/1.0" },
      });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Image host returned ${response.status}.`);
      }
      if (!response.ok) {
        throw Object.assign(new Error(`Image host returned ${response.status}.`), { permanent: true });
      }
      const finalHost = new URL(response.url || imageUrl).hostname.toLowerCase();
      if (finalHost !== FNP_IMAGE_HOST) {
        throw Object.assign(new Error("Image download left the FNP asset host."), { permanent: true });
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > 8_000_000) {
        throw Object.assign(new Error("Image must be between 1 byte and 8 MB."), { permanent: true });
      }
      const ext = imageExtensionForContentType(response.headers.get("content-type") ?? "", bytes);
      if (!ext) {
        throw Object.assign(new Error("Image must be jpg, png, webp, or gif."), { permanent: true });
      }
      const contentType =
        ext === ".jpg" ? "image/jpeg" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/gif";
      return { bytes, ext, contentType };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Image download failed.");
      const permanent = Boolean((error as { permanent?: boolean }).permanent);
      if (permanent || attempt === 3) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }
  throw lastError ?? new Error("Image download failed.");
}

async function hostFnpImage(imageUrl: string, productSlug: string): Promise<string> {
  const parsed = new URL(imageUrl);
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== FNP_IMAGE_HOST) {
    throw new Error(`Image URL must be an https URL on ${FNP_IMAGE_HOST}.`);
  }
  const stub = process.env.FNP_IMPORT_IMAGE_STUB?.trim();
  if (process.env.USE_MEMORY_DB === "true" && stub) {
    const stubUrl = new URL(stub);
    if (stubUrl.protocol !== "https:") throw new Error("FNP image stub must be https.");
    return stubUrl.toString();
  }
  if (process.env.USE_LOCAL_UPLOADS === "true") {
    const image = await downloadFnpImage(imageUrl);
    const key = `products/${productSlug}/${randomUUID()}${image.ext}`;
    const { saveLocalUpload } = await import("./uploads");
    return saveLocalUpload(key, Buffer.from(image.bytes));
  }
  const bucket = process.env.UPLOAD_BUCKET?.trim();
  if (!bucket) throw new Error("S3 image hosting is not configured. Set UPLOAD_BUCKET before committing.");
  const image = await downloadFnpImage(imageUrl);
  const key = `products/${productSlug}/${randomUUID()}${image.ext}`;
  const client = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: image.bytes,
          ContentType: image.contentType,
          Metadata: { "product-slug": productSlug, "source-host": FNP_IMAGE_HOST },
        })
      );
      return publicImageUrl(key);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("S3 upload failed.");
      if (attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
    }
  }
  throw lastError ?? new Error("S3 upload failed.");
}

function imageDigest(imageUrl: string): string {
  return createHash("sha256").update(imageUrl).digest("hex");
}

async function hostFnpImageOnce(
  imageUrl: string,
  productSlug: string,
  memo: Map<string, Promise<string>>
): Promise<string> {
  const pending = memo.get(imageUrl);
  if (pending) return pending;
  const job = (async () => {
    const digest = imageDigest(imageUrl);
    const cached = await getItem(importImageKeys.pk(digest), importImageKeys.sk());
    const cachedUrl = typeof cached?.imageUrl === "string" ? cached.imageUrl : "";
    if (cachedUrl.startsWith("https://")) return cachedUrl;
    const hosted = await hostFnpImage(imageUrl, productSlug);
    try {
      await docClient.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: {
            PK: importImageKeys.pk(digest),
            SK: importImageKeys.sk(),
            sourceImageUrl: imageUrl,
            imageUrl: hosted,
            productSlug,
            hostedAt: now(),
          },
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );
    } catch (err) {
      if (!isConditionalFailure(err)) return hosted;
      const winner = await getItem(importImageKeys.pk(digest), importImageKeys.sk());
      const winnerUrl = typeof winner?.imageUrl === "string" ? winner.imageUrl : "";
      if (winnerUrl.startsWith("https://")) return winnerUrl;
    }
    return hosted;
  })();
  memo.set(imageUrl, job);
  try {
    return await job;
  } catch (err) {
    memo.delete(imageUrl);
    throw err;
  }
}

async function ensureNewCategory(slug: string, name: string, timestamp: string): Promise<"exists" | "created"> {
  const current = await getItem(categoryKeys.pk(slug), categoryKeys.sk());
  if (current) return "exists";
  try {
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: categoryKeys.pk(slug),
          SK: categoryKeys.sk(),
          GSI1PK: categoryKeys.gsi1pk(),
          GSI1SK: categoryKeys.gsi1sk(500, slug),
          slug,
          name,
          description: "",
          sortOrder: 500,
          published: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
    return "created";
  } catch (err) {
    if (!isConditionalFailure(err)) throw err;
    const again = await getItem(categoryKeys.pk(slug), categoryKeys.sk());
    if (again) return "exists";
    throw err;
  }
}

async function importReadyRow(
  row: FnpImportPlanRow,
  batchId: string,
  timestamp: string,
  images: Map<string, Promise<string>>
): Promise<ImportOutcome> {
  if (!row.sourceKey || !row.categorySlug || row.price == null) {
    return { status: "blocked", message: row.errors.join(" ") || "Row is incomplete." };
  }
  const source = await getItem(importSourceKeys.pk(row.sourceKey), importSourceKeys.sk());
  if (source?.productSlug) {
    return {
      status: "duplicate",
      message: `Already imported as ${String(source.productSlug)}. The existing product was left unchanged.`,
      productSlug: String(source.productSlug),
    };
  }
  const existing = await getItem(productKeys.pk(row.slug), productKeys.sk());
  if (existing) {
    return {
      status: "conflict",
      message: `Slug "${row.slug}" already exists. It was not overwritten.`,
    };
  }

  let hostedUrl: string;
  try {
    hostedUrl = await hostFnpImageOnce(row.imageUrl, row.slug, images);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Image hosting failed." };
  }

  if (row.categoryAction === "create" && row.categorySlug) {
    try {
      await ensureNewCategory(row.categorySlug, row.categoryName ?? row.categorySlug, timestamp);
      invalidateCategoryCache();
    } catch (err) {
      return {
        status: "error",
        message: err instanceof Error ? err.message : "Category could not be created.",
      };
    }
  }

  const draft = buildFnpProductDraft({ row, batchId, imageUrl: hostedUrl, timestamp });
  const productItem = {
    ...draft,
    PK: productKeys.pk(draft.slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(draft.categorySlug),
    GSI1SK: productKeys.gsi1sk(draft.slug),
  };
  try {
    await insertCatalogProduct(productItem);
  } catch (err) {
    if (!isConditionalFailure(err)) throw err;
    return { status: "conflict", message: `Slug or SKU "${row.slug}" was reserved by another write. It was not overwritten.` };
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: importSourceKeys.pk(row.sourceKey),
          SK: importSourceKeys.sk(),
          sourceKey: row.sourceKey,
          sourceUrl: row.sourceUrl,
          sourceSerial: row.sourceSerial,
          productSlug: draft.slug,
          batchId,
          imageUrl: hostedUrl,
          importedAt: timestamp,
        },
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  } catch (err) {
    if (!isConditionalFailure(err)) throw err;
    const winner = await getItem(importSourceKeys.pk(row.sourceKey), importSourceKeys.sk());
    if (winner?.productSlug === draft.slug) {
      return { status: "imported", message: "Imported unpublished.", productSlug: draft.slug };
    }
    const cleanup = await deleteImportedProductIfUnchanged({
      slug: draft.slug,
      sku: draft.sku ?? draft.slug,
      sourceUrl: row.sourceUrl,
    });
    if (cleanup === "deleted") {
      return {
        status: "error",
        message: "The FNP URL is already linked to a different product. The new product was removed.",
      };
    }
    return {
      status: "error",
      message:
        "The FNP URL is already linked to a different product. The new product was kept because its SKU, source, or reservation no longer matches this import.",
    };
  }

  return { status: "imported", message: "Imported unpublished.", productSlug: draft.slug };
}

async function writeBatch(
  batchId: string,
  actor: string,
  createdAt: string,
  outcomes: Array<{ row: FnpImportPlanRow; outcome: ImportOutcome }>,
  overrides: readonly FnpCategoryOverride[]
) {
  const existing = await getItem(importBatchKeys.pk(batchId), importBatchKeys.sk());
  const counts = {
    imported: Number(existing?.imported ?? 0),
    skipped: Number(existing?.skipped ?? 0),
    failed: Number(existing?.failed ?? 0),
    blocked: Number(existing?.blocked ?? 0),
    conflicts: Number(existing?.conflicts ?? 0),
  };
  for (const entry of outcomes) {
    if (entry.outcome.status === "imported") counts.imported += 1;
    else if (entry.outcome.status === "duplicate" || entry.outcome.status === "empty") counts.skipped += 1;
    else if (entry.outcome.status === "conflict") counts.conflicts += 1;
    else if (entry.outcome.status === "blocked") counts.blocked += 1;
    else counts.failed += 1;
    await docClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          PK: importBatchKeys.pk(batchId),
          SK: importBatchKeys.rowSk(entry.row.row),
          row: entry.row.row,
          status: entry.outcome.status,
          message: entry.outcome.message,
          name: entry.row.name,
          slug: entry.row.slug,
          sourceUrl: entry.row.sourceUrl,
          sourceKey: entry.row.sourceKey,
          productSlug: entry.outcome.productSlug ?? null,
          categorySlug: entry.row.categorySlug,
          sourceSerial: entry.row.sourceSerial,
          errors: entry.row.errors,
          warnings: entry.row.warnings,
          input: entry.row.input,
          updatedAt: createdAt,
        },
      })
    );
  }
  const timestamp = typeof existing?.createdAt === "string" ? existing.createdAt : createdAt;
  await docClient.send(
    new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: {
        PK: importBatchKeys.pk(batchId),
        SK: importBatchKeys.sk(),
        GSI1PK: importBatchKeys.gsi1pk(),
        GSI1SK: importBatchKeys.gsi1sk(timestamp, batchId),
        batchId,
        createdAt: timestamp,
        updatedAt: createdAt,
        createdBy: typeof existing?.createdBy === "string" ? existing.createdBy : actor,
        environment: process.env.ENVIRONMENT ?? "dev",
        productsTable: PRODUCTS_TABLE,
        published: false,
        categoryOverrides: overrides.length > 0 ? overrides : existing?.categoryOverrides ?? [],
        ...counts,
      },
    })
  );
  return counts;
}

async function commitEntries(
  entries: Array<{ row: number; input: Record<string, unknown> }>,
  batchId: string,
  actor: string,
  overrides: readonly FnpCategoryOverride[]
) {
  const lookups = await loadLookups(
    entries.map((entry) => entry.input),
    overrides
  );
  const plan = planFnpImport({
    rows: entries.map((entry) => entry.input),
    rowNumbers: entries.map((entry) => entry.row),
    categoriesPresent: lookups.categoriesPresent,
    existingSources: lookups.existingSources,
    existingProducts: lookups.existingProducts,
    categoryNames: lookups.categoryNames,
    categoryOverrides: overrides,
  });
  const timestamp = now();
  const images = new Map<string, Promise<string>>();
  const outcomes: Array<{ row: FnpImportPlanRow; outcome: ImportOutcome }> = [];
  let wroteProduct = false;
  for (const planned of plan.rows) {
    if (planned.status !== "ready") {
      outcomes.push({
        row: planned,
        outcome: {
          status: planned.status === "empty" ? "empty" : planned.status,
          message: planned.errors[0] ?? planned.status,
        },
      });
      continue;
    }
    const outcome = await importReadyRow(planned, batchId, timestamp, images);
    if (outcome.status === "imported") wroteProduct = true;
    outcomes.push({ row: planned, outcome });
  }
  if (wroteProduct) invalidateProductListCache();
  const counts = await writeBatch(batchId, actor, timestamp, outcomes, overrides);
  return { batchId, counts, rows: outcomes.map(({ row, outcome }) => ({ ...row, outcome })) };
}

export async function previewFnpImport(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Request body must be JSON.");
  }
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);
  const prepared = prepareOverrides(parsed.data.categoryOverrides ?? []);
  if (prepared.error) return badRequest(prepared.error);
  const lookups = await loadLookups(parsed.data.rows, prepared.overrides);
  const plan = planFnpImport({
    rows: parsed.data.rows,
    categoriesPresent: lookups.categoriesPresent,
    existingSources: lookups.existingSources,
    existingProducts: lookups.existingProducts,
    categoryNames: lookups.categoryNames,
    categoryOverrides: prepared.overrides,
  });
  const guard = writeGuard();
  return ok({
    writes: false,
    writeBlocked: guard.blocked,
    writeBlockedReason: guard.reason ?? null,
    batchSize: FNP_IMPORT_COMMIT_BATCH_SIZE,
    catalogCategories: lookups.catalog,
    ...plan,
  });
}

export async function commitFnpImport(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const guard = writeGuard();
  if (guard.blocked) return forbidden(guard.reason);
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Request body must be JSON.");
  }
  const parsed = commitSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);
  const prepared = prepareOverrides(parsed.data.categoryOverrides ?? []);
  if (prepared.error) return badRequest(prepared.error);
  const batchId = parsed.data.batchId ?? randomUUID();
  const result = await commitEntries(parsed.data.entries, batchId, auth.email || auth.userId, prepared.overrides);
  return ok({ writes: true, published: false, ...result });
}

export async function retryFnpImport(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const guard = writeGuard();
  if (guard.blocked) return forbidden(guard.reason);
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Request body must be JSON.");
  }
  const parsed = retrySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);
  const meta = await getItem(importBatchKeys.pk(parsed.data.batchId), importBatchKeys.sk());
  if (!meta) return notFound("Import batch not found.");
  const stored = z.array(categoryOverrideSchema).max(40).safeParse(meta.categoryOverrides ?? []);
  const prepared = prepareOverrides(stored.success ? stored.data : []);
  if (prepared.error) return badRequest(prepared.error);
  const result = await docClient.send(
    new QueryCommand({
      TableName: PRODUCTS_TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": importBatchKeys.pk(parsed.data.batchId),
        ":sk": "ROW#",
      },
    })
  );
  const failed = (result.Items ?? [])
    .filter((item) => item.status === "error" && item.input && typeof item.input === "object")
    .slice(0, FNP_IMPORT_COMMIT_BATCH_SIZE);
  if (failed.length === 0) return ok({ batchId: parsed.data.batchId, retried: 0, message: "No failed rows to retry." });
  const entries = failed.map((item) => ({
    row: Number(item.row),
    input: item.input as Record<string, unknown>,
  }));
  const committed = await commitEntries(entries, parsed.data.batchId, auth.email || auth.userId, prepared.overrides);
  return ok({ writes: true, published: false, retried: failed.length, ...committed });
}

export async function listFnpImports(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const result = await docClient.send(
    new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": importBatchKeys.gsi1pk() },
      ScanIndexForward: false,
      Limit: 25,
    })
  );
  const batches = (result.Items ?? []).map((item) => ({
    batchId: item.batchId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
    environment: item.environment,
    imported: item.imported ?? 0,
    skipped: item.skipped ?? 0,
    failed: item.failed ?? 0,
    blocked: item.blocked ?? 0,
    conflicts: item.conflicts ?? 0,
  }));
  return ok({ batches });
}

export async function getFnpImport(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const batchId = event.pathParameters?.batchId ?? "";
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(batchId)) return badRequest("Invalid batch id.");
  const meta = await getItem(importBatchKeys.pk(batchId), importBatchKeys.sk());
  if (!meta) return notFound("Import batch not found.");
  const rows = await docClient.send(
    new QueryCommand({
      TableName: PRODUCTS_TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": importBatchKeys.pk(batchId),
        ":sk": "ROW#",
      },
    })
  );
  return ok({
    batch: meta,
    rows: (rows.Items ?? []).map((item) => ({
      row: item.row,
      status: item.status,
      message: item.message,
      name: item.name,
      slug: item.slug,
      sourceUrl: item.sourceUrl,
      productSlug: item.productSlug,
      categorySlug: item.categorySlug,
      sourceSerial: item.sourceSerial ?? "",
      errors: item.errors ?? [],
      warnings: item.warnings ?? [],
    })),
  });
}
