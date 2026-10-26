import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { catalogVendorKeys, productKeys } from "@blossompot/shared";
import { runExplicitComboPublish } from "./combo-publish-run";

const PRODUCTS_TABLE = "blossompot-products-combo-rakhi-test";
const CONFIG_TABLE = "blossompot-config-combo-rakhi-test";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = PRODUCTS_TABLE;
process.env.CONFIG_TABLE = CONFIG_TABLE;
process.env.GBO_STOREFRONT_ENABLED = "false";
delete process.env.DYNAMODB_ENDPOINT;
delete process.env.AWS_REGION;

let docClient: { send: (command: unknown) => Promise<unknown> };
let productsTable: string;
let configTable: string;

before(async () => {
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  configTable = db.CONFIG_TABLE;
  assert.equal(productsTable, PRODUCTS_TABLE);
  assert.equal(configTable, CONFIG_TABLE);
});

function memoryEnv(): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "true",
    ENVIRONMENT: "local",
    PRODUCTS_TABLE,
    CONFIG_TABLE,
  };
}

function catalogProduct(
  slug: string,
  categorySlug: string,
  name: string,
  vendorSlug?: string
) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    slug,
    name,
    description: name,
    price: 20,
    currency: "USD" as const,
    categorySlug,
    ...(vendorSlug ? { vendorSlug } : {}),
    images: [`https://cdn.example.com/${slug}.jpg`],
    sku: `TF${slug.toUpperCase()}`,
    inventory: 4,
    tags: ["tf-usa"],
    published: true,
  };
}

describe("combo publisher rakhi card parity", { concurrency: false }, () => {
  it("hides non-Orange County rakhi products and still applies Orange County delivery rules", async () => {
    const publishing = await import("./combo-publish");
    assert.equal(publishing.DEFAULT_COMBOS_PER_VENDOR, 10);
    await docClient.send(
      new PutCommand({
        TableName: configTable,
        Item: {
          PK: catalogVendorKeys.pk("florist"),
          SK: catalogVendorKeys.sk(),
          vendorSlug: "florist",
          vendorName: "Florist",
          enabled: true,
          integrationType: "owned",
          deliveryCountries: ["US"],
          displayOrder: 1,
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: catalogProduct("red-rose", "flowers", "Red Rose", "florist"),
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: catalogProduct("chocolate-cake", "cakes", "Chocolate Cake", "florist"),
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: catalogProduct("deluxe-rakhi", "hampers", "Deluxe Rakhi", "florist"),
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: catalogProduct("missing-slug-rakhi", "gifts", "Rakhi Surprise"),
      })
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: catalogProduct("oc-rakhi-thread", "flowers", "OC Rakhi Thread", "orange-county"),
      })
    );

    const report = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--country", "US"],
    });
    const reasons = new Map(report.exclusions.map((row) => [row.reason, row.count]));
    const componentSlugs = report.candidates.flatMap((combo) => combo.components.map((part) => part.slug));

    assert.deepEqual(
      report.candidates.map((combo) => combo.components.map((part) => part.slug)),
      [["chocolate-cake", "red-rose"]]
    );
    assert.equal(componentSlugs.includes("deluxe-rakhi"), false);
    assert.equal(componentSlugs.includes("missing-slug-rakhi"), false);
    assert.equal(componentSlugs.includes("oc-rakhi-thread"), false);
    assert.equal((reasons.get("rakhi-hidden") ?? 0) >= 2, true);
    assert.equal((reasons.get("no_matching_service_area") ?? 0) >= 1, true);
    assert.equal(report.candidateCombosByVendor.florist, 1);
    assert.equal(report.candidateCombosByVendor["orange-county"], undefined);
    assert.equal(report.mode, "dry-run");
    assert.equal(report.expectedWrites, 1);
  });
});
