/**
 * Delete every DynamoDB product (and SAMPLE VENDOR account) mapped to the
 * demo marketplace vendors (`vendorSlug` starting with `sample-`, SKU SMP-/SAMPLE-,
 * isSampleProduct, tag sample-product, fulfilledByName containing SAMPLE VENDOR).
 *
 * Does NOT delete GBO, TF USA, Orange County, or bundled BlossomPot catalog SKUs.
 *
 * Usage:
 *   npm run purge:sample-products -- --dry-run
 *   npm run purge:sample-products
 *   npm run purge:sample-products -- --env=prod
 *
 * Env: AWS_REGION, ENVIRONMENT / --env, PRODUCTS_TABLE, CONFIG_TABLE
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  isSampleCatalogProduct,
  marketplaceVendorKeys,
  vendorCoverageKeys,
  type Product,
} from "@blossompot/shared";
import { SAMPLE_VENDORS } from "./lib/sample-catalog/generate";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const envArg = args.find((a) => a.startsWith("--env="));
const ENV = envArg?.split("=")[1] || process.env.ENVIRONMENT || "dev";

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(endpoint
    ? {
        endpoint,
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {}),
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`;
const CONFIG_TABLE = process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`;

async function scanAll(
  table: string,
  extra?: { FilterExpression?: string; ExpressionAttributeValues?: Record<string, unknown> }
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: table,
        ExclusiveStartKey,
        ...extra,
      })
    );
    if (result.Items?.length) items.push(...result.Items);
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

async function del(table: string, Key: { PK: string; SK: string }) {
  if (dryRun) return;
  await docClient.send(new DeleteCommand({ TableName: table, Key }));
}

async function main() {
  console.log(
    JSON.stringify(
      {
        env: ENV,
        productsTable: PRODUCTS_TABLE,
        configTable: CONFIG_TABLE,
        dryRun,
        sampleVendorSlugs: SAMPLE_VENDORS.map((v) => v.vendorSlug),
      },
      null,
      2
    )
  );

  const productRows = await scanAll(PRODUCTS_TABLE, {
    FilterExpression: "begins_with(PK, :prefix)",
    ExpressionAttributeValues: { ":prefix": "PRODUCT#" },
  });

  const sampleMetas = productRows.filter(
    (i) => i.SK === "META" && isSampleCatalogProduct(i as Product)
  ) as Product[];
  const sampleSlugs = new Set(sampleMetas.map((p) => p.slug));

  const keptReal = productRows.filter(
    (i) => i.SK === "META" && !isSampleCatalogProduct(i as Product)
  );

  let deletedProducts = 0;
  let deletedReviews = 0;
  for (const item of productRows) {
    const pk = String(item.PK ?? "");
    const sk = String(item.SK ?? "");
    const slug = pk.replace(/^PRODUCT#/, "");
    const isSampleMeta = sk === "META" && sampleSlugs.has(slug);
    const isSampleReview =
      sk.startsWith("REVIEW#") &&
      sampleSlugs.has(slug) &&
      (item.isSampleReview === true || String(item.reviewId ?? "").startsWith("sample-"));
    if (!isSampleMeta && !isSampleReview) continue;
    await del(PRODUCTS_TABLE, { PK: pk, SK: sk });
    if (isSampleMeta) deletedProducts++;
    else deletedReviews++;
  }

  const vendorKeys: Array<{ PK: string; SK: string; reason: string }> = [];
  for (const v of SAMPLE_VENDORS) {
    vendorKeys.push({
      PK: marketplaceVendorKeys.pk(v.vendorId),
      SK: marketplaceVendorKeys.sk(),
      reason: "vendor-meta",
    });
    vendorKeys.push({
      PK: marketplaceVendorKeys.slugPk(v.vendorSlug),
      SK: marketplaceVendorKeys.slugSk(),
      reason: "vendor-slug",
    });
    vendorKeys.push({
      PK: marketplaceVendorKeys.emailPk(`${v.vendorSlug}@sample.blossompot.local`),
      SK: marketplaceVendorKeys.emailSk(),
      reason: "vendor-email",
    });
    vendorKeys.push({
      PK: vendorCoverageKeys.pk(v.vendorSlug),
      SK: vendorCoverageKeys.metaSk(),
      reason: "vendor-coverage",
    });
  }

  let deletedVendorKeys = 0;
  for (const key of vendorKeys) {
    await del(CONFIG_TABLE, { PK: key.PK, SK: key.SK });
    deletedVendorKeys++;
  }

  const remainingSample = (await scanAll(PRODUCTS_TABLE, {
    FilterExpression: "begins_with(PK, :prefix) AND SK = :sk",
    ExpressionAttributeValues: { ":prefix": "PRODUCT#", ":sk": "META" },
  })).filter((i) => isSampleCatalogProduct(i as Product));

  console.log(
    JSON.stringify(
      {
        sampleProductsFound: sampleMetas.length,
        sampleVendors: [...new Set(sampleMetas.map((p) => p.vendorSlug).filter(Boolean))],
        realProductMetasLeftUntouched: keptReal.length,
        deletedProducts,
        deletedReviews,
        deletedVendorKeys,
        remainingSampleAfter: remainingSample.length,
        remainingSampleSlugs: remainingSample.slice(0, 20).map((p) => p.slug),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
