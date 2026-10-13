import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ComboNotFoundError, ComboSlugConflictError, parseGboSlug } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = "blossompot-products-combo-store-test";

type ComboStore = typeof import("./combo-store");

let store: ComboStore;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;

before(async () => {
  store = await import("./combo-store");
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
});

const rose = {
  slug: "rose-and-cake",
  name: "Rose and Cake",
  productSlugs: ["golden-sunset-blooms", "chocolate-truffle"],
  sortOrder: 4,
};

describe("combo store", { concurrency: 1 }, () => {
  it("writes a combo that can be read and listed by merchandising order", async () => {
    const created = await store.insertCombo(rose, "2026-01-01T00:00:00.000Z");
    assert.equal(created.PK, "COMBO#rose-and-cake");
    assert.equal(created.GSI1SK, "000004#rose-and-cake");

    await store.insertCombo(
      {
        slug: "lilies-and-cake",
        name: "Lilies and Cake",
        productSlugs: ["white-lilies", "vanilla-cake"],
        sortOrder: 1,
      },
      "2026-01-02T00:00:00.000Z"
    );

    const listed = await store.queryCombos();
    assert.deepEqual(
      listed.map((combo) => combo.slug),
      ["lilies-and-cake", "rose-and-cake"]
    );

    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "PRODUCT#rose-and-cake", SK: "META" } })
    );
    assert.equal(product.Item, undefined);
  });

  it("rejects a duplicate slug and keeps the original row", async () => {
    await assert.rejects(
      store.insertCombo({ ...rose, name: "Replacement" }, "2026-04-01T00:00:00.000Z"),
      ComboSlugConflictError
    );
    const row = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: "COMBO#rose-and-cake", SK: "META" } })
    );
    assert.equal(row.Item?.name, "Rose and Cake");
    assert.equal(row.Item?.createdAt, "2026-01-01T00:00:00.000Z");
  });

  it("preserves createdAt and refreshes updatedAt and sort order", async () => {
    const updated = await store.updateCombo(
      "rose-and-cake",
      { name: "Rose and Chocolate Cake", sortOrder: 9 },
      "2026-05-01T00:00:00.000Z"
    );
    assert.equal(updated.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(updated.updatedAt, "2026-05-01T00:00:00.000Z");
    assert.equal(updated.GSI1SK, "000009#rose-and-cake");
    assert.equal(updated.PK, "COMBO#rose-and-cake");

    const listed = await store.queryCombos();
    assert.deepEqual(
      listed.map((combo) => combo.slug),
      ["lilies-and-cake", "rose-and-cake"]
    );
  });

  it("does not update a missing combo", async () => {
    await assert.rejects(store.updateCombo("missing-combo", { name: "Nope" }, "2026-06-01T00:00:00.000Z"), ComboNotFoundError);
  });

  it("rejects a slug that already has a product row and leaves that row unchanged", async () => {
    const slug = "stored-product-only";
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: { PK: `PRODUCT#${slug}`, SK: "META", slug, name: "Stored product" },
      })
    );

    await assert.rejects(
      store.insertCombo(
        { slug, name: "Same Slug Combo", productSlugs: ["one-rose", "one-cake"] },
        "2026-07-01T00:00:00.000Z"
      ),
      ComboSlugConflictError
    );

    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(product.Item?.name, "Stored product");
    const combo = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
    );
    assert.equal(combo.Item, undefined);
  });

  it("rejects a bundled catalog slug that has no product row and does not create one", async () => {
    const { getBundledUsarakhiProduct } = await import("./blossompot-catalog");
    const slug = "classic-red-rose-bouquet";
    assert.ok(getBundledUsarakhiProduct(slug));

    const before = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(before.Item, undefined);

    await assert.rejects(
      store.insertCombo(
        { slug, name: "Bundled Slug Combo", productSlugs: ["one-rose", "one-cake"] },
        "2026-07-02T00:00:00.000Z"
      ),
      ComboSlugConflictError
    );

    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(product.Item, undefined);
    const combo = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
    );
    assert.equal(combo.Item, undefined);
  });

  it("rejects an Orange County bundled slug without creating a product row", async () => {
    const { getBundledOrangeCountyProduct } = await import("./orange-county-catalog");
    const slug = "rakhi-dry-fruit-celebration-combo";
    assert.ok(getBundledOrangeCountyProduct(slug));

    await assert.rejects(
      store.insertCombo(
        { slug, name: "Orange County Slug Combo", productSlugs: ["one-rose", "one-cake"] },
        "2026-07-03T00:00:00.000Z"
      ),
      ComboSlugConflictError
    );

    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(product.Item, undefined);
    const combo = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
    );
    assert.equal(combo.Item, undefined);
  });

  it("rejects a GBO-style slug without a partner lookup", async () => {
    const slug = "gbo-us-1-roses";
    assert.ok(parseGboSlug(slug));

    await assert.rejects(
      store.insertCombo(
        { slug, name: "Overseas Combo", productSlugs: ["one-rose", "one-cake"] },
        "2026-07-04T00:00:00.000Z"
      ),
      ComboSlugConflictError
    );

    const combo = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
    );
    assert.equal(combo.Item, undefined);
  });

  it("still updates a combo after a product row with the same slug is added", async () => {
    const slug = "combo-then-product";
    await store.insertCombo(
      { slug, name: "Combo first", productSlugs: ["one-rose", "one-cake"] },
      "2026-08-01T00:00:00.000Z"
    );
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: { PK: `PRODUCT#${slug}`, SK: "META", slug, name: "Later product" },
      })
    );

    const updated = await store.updateCombo(slug, { name: "Combo edited" }, "2026-08-02T00:00:00.000Z");
    assert.equal(updated.slug, slug);
    assert.equal(updated.name, "Combo edited");
    assert.equal(updated.createdAt, "2026-08-01T00:00:00.000Z");
    assert.equal(updated.updatedAt, "2026-08-02T00:00:00.000Z");

    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(product.Item?.name, "Later product");
  });
});
