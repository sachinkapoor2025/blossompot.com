/**
 * Insert missing bundled Orange County and BlossomPot products into the dev table.
 * Existing rows are not updated. Gift Baskets Overseas products are not written.
 *
 * The default run only verifies the target. Writes require --write and stop
 * before DynamoDB if the account, region, stack, or table is not dev.
 *
 *   npx tsx scripts/persist-dev-bundled-catalogs.ts
 *   npx tsx scripts/persist-dev-bundled-catalogs.ts --write
 */
import { createHash, createHmac } from "node:crypto";
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import {
  DEV_CATALOG_ACCOUNT,
  DEV_CATALOG_REGION,
  DEV_CATALOG_STACK,
  DEV_CATALOG_TABLE,
  assertDevCatalogPersistenceTarget,
} from "./ci/dev-catalog-persist";

const write = process.argv.includes("--write");

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

async function describeDevStack(credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}): Promise<string> {
  const service = "cloudformation";
  const host = `cloudformation.${DEV_CATALOG_REGION}.amazonaws.com`;
  const query = `Action=DescribeStacks&StackName=${encodeURIComponent(DEV_CATALOG_STACK)}&Version=2010-05-15`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256("");
  const headerValues: Record<string, string> = { host, "x-amz-date": amzDate };
  if (credentials.sessionToken) headerValues["x-amz-security-token"] = credentials.sessionToken;
  const names = Object.keys(headerValues).sort();
  const canonicalHeaders = names.map((name) => `${name}:${headerValues[name]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonical = ["GET", "/", query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${DEV_CATALOG_REGION}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${credentials.secretAccessKey}`, dateStamp), DEV_CATALOG_REGION), service), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  const requestHeaders = { ...headerValues };
  delete requestHeaders.host;
  const response = await fetch(`https://${host}/?${query}`, {
    headers: {
      ...requestHeaders,
      Authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`CloudFormation DescribeStacks failed with status ${response.status}.`);
  }
  return body;
}

function stackOutput(xml: string, key: string): string {
  const match = xml.match(new RegExp(`<OutputKey>${key}</OutputKey>\\s*<OutputValue>([^<]*)</OutputValue>`));
  return match?.[1]?.trim() ?? "";
}

async function verifyDevTarget(): Promise<void> {
  if (process.env.DYNAMODB_ENDPOINT) {
    throw new Error("Refusing catalog persistence while DYNAMODB_ENDPOINT is set.");
  }
  const credentials = await defaultProvider()();
  const sts = new STSClient({ region: DEV_CATALOG_REGION, credentials });
  const identity = await sts.send(new GetCallerIdentityCommand({}));
  const stackXml = await describeDevStack(credentials);
  const productsTable = stackOutput(stackXml, "ProductsTableName");
  const stackName = stackXml.match(/<StackName>([^<]+)<\/StackName>/)?.[1]?.trim() ?? "";
  const dynamo = new DynamoDBClient({ region: DEV_CATALOG_REGION, credentials });
  const table = await dynamo.send(new DescribeTableCommand({ TableName: DEV_CATALOG_TABLE }));
  const arn = table.Table?.TableArn ?? "";
  const expectedArn = `arn:aws:dynamodb:${DEV_CATALOG_REGION}:${DEV_CATALOG_ACCOUNT}:table/${DEV_CATALOG_TABLE}`;
  if (arn !== expectedArn) {
    throw new Error("Refusing catalog persistence. Products table ARN does not match the dev table.");
  }
  assertDevCatalogPersistenceTarget({
    accountId: identity.Account ?? "",
    region: DEV_CATALOG_REGION,
    stackName,
    productsTable,
  });
  console.log(
    JSON.stringify({
      accountId: identity.Account,
      region: DEV_CATALOG_REGION,
      stackName,
      productsTable,
      write,
    })
  );
}

async function productFingerprint(slug: string): Promise<string | null> {
  const { GetCommand } = await import("@aws-sdk/lib-dynamodb");
  const { docClient, PRODUCTS_TABLE } = await import("../apps/api/src/lib/db");
  const result = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: `PRODUCT#${slug}`, SK: "META" },
    })
  );
  if (!result.Item) return null;
  const item = result.Item;
  return JSON.stringify({
    slug: item.slug,
    price: item.price,
    inventory: item.inventory,
    published: item.published,
    vendorSlug: item.vendorSlug,
    images: item.images,
    updatedAt: item.updatedAt,
  });
}

async function existingProductSlugs(): Promise<Set<string>> {
  const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
  const { docClient, PRODUCTS_TABLE } = await import("../apps/api/src/lib/db");
  const slugs = new Set<string>();
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await docClient.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
        ExpressionAttributeValues: { ":pk": "PRODUCT#", ":sk": "META" },
        ProjectionExpression: "slug",
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of page.Items ?? []) {
      if (typeof item.slug === "string" && item.slug) slugs.add(item.slug);
    }
    startKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return slugs;
}

async function writeMissingProducts(): Promise<void> {
  process.env.AWS_REGION = DEV_CATALOG_REGION;
  process.env.ENVIRONMENT = "dev";
  process.env.PRODUCTS_TABLE = DEV_CATALOG_TABLE;
  delete process.env.DYNAMODB_ENDPOINT;

  const before = await productFingerprint("rakhi-dry-fruit-celebration-combo");
  const existing = await existingProductSlugs();
  const { persistMissingOrangeCountyProducts, missingOrangeCountyProducts } = await import(
    "../apps/api/src/lib/orange-county-catalog"
  );
  const { persistMissingBundledCatalogProducts, bundledCatalogProductsMissingFrom } = await import(
    "../apps/api/src/lib/blossompot-catalog"
  );
  const orangeCountyMissing = missingOrangeCountyProducts(existing).length;
  const blossompotMissing = bundledCatalogProductsMissingFrom(existing).length;
  const orangeCounty = await persistMissingOrangeCountyProducts(existing);
  const blossompot = await persistMissingBundledCatalogProducts(existing);
  const after = await productFingerprint("rakhi-dry-fruit-celebration-combo");
  if (before != null && before !== after) {
    throw new Error("Existing Orange County row changed during a missing-only insert.");
  }
  console.log(
    JSON.stringify({
      productsTable: DEV_CATALOG_TABLE,
      orangeCountyMissing,
      orangeCountyInserted: orangeCounty.length,
      blossompotMissing,
      blossompotInserted: blossompot.length,
      existingOrangeCountyRowUnchanged: before == null ? "absent-before" : true,
    })
  );
}

async function main(): Promise<void> {
  await verifyDevTarget();
  if (!write) {
    console.log("Verified dev target. No database writes were made. Re-run with --write to insert missing products.");
    return;
  }
  await writeMissingProducts();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Catalog persistence failed.";
  console.error(message);
  process.exit(1);
});
