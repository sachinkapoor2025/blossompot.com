import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = "blossompot-products-additional-category-update-test";
process.env.CONFIG_TABLE = "blossompot-config-additional-category-update-test";

let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;
let AdditionalCategoryConflictError: new () => Error;
let appendProductAdditionalCategory: (input: {
  slug: string;
  expectedCategorySlug: string;
  expectedAdditionalCategorySlugs: readonly string[] | null;
  additionalSlug: string;
}) => Promise<{ additionalCategorySlugs: string[] }>;

before(async () => {
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  const update = await import("./additional-category-update");
  AdditionalCategoryConflictError = update.AdditionalCategoryConflictError;
  appendProductAdditionalCategory = update.appendProductAdditionalCategory;
});

function product(slug: string, extra: Record<string, unknown> = {}) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    slug,
    name: "Kept name",
    description: "Kept description",
    price: 22,
    currency: "USD",
    categorySlug: "cakes",
    images: ["https://cdn.example.com/cake.jpg"],
    inventory: 9,
    sku: `${slug}-sku`,
    vendorSlug: "fnp",
    tags: ["fnp-usa-import"],
    published: true,
    GSI1PK: "CATEGORY#cakes",
    GSI1SK: `PRODUCT#${slug}`,
    updatedAt: "2026-10-14T00:00:00.000Z",
    createdAt: "2026-10-14T00:00:00.000Z",
    ...extra,
  };
}

async function put(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

async function read(slug: string): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: productsTable,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  return result.Item;
}

describe("appendProductAdditionalCategory", () => {
  it("appends one occasion slug and leaves every other attribute unchanged", async () => {
    const beforeItem = product("anniversary-cake", { additionalCategorySlugs: ["flowers"] });
    await put(beforeItem);

    const result = await appendProductAdditionalCategory({
      slug: "anniversary-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: ["flowers"],
      additionalSlug: "anniversary-gifts",
    });

    assert.deepEqual(result.additionalCategorySlugs, ["flowers", "anniversary-gifts"]);
    const stored = await read("anniversary-cake");
    assert.deepEqual(stored, {
      ...beforeItem,
      additionalCategorySlugs: ["flowers", "anniversary-gifts"],
    });
    assert.equal(stored?.categorySlug, "cakes");
    assert.equal(stored?.GSI1PK, "CATEGORY#cakes");
    assert.equal(stored?.GSI1SK, "PRODUCT#anniversary-cake");
  });

  it("does not add a duplicate or the primary category", async () => {
    const withOccasion = product("valentine-cake", {
      additionalCategorySlugs: ["flowers", "valentines-day-gifts"],
    });
    await put(withOccasion);
    const duplicate = await appendProductAdditionalCategory({
      slug: "valentine-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: ["flowers", "valentines-day-gifts"],
      additionalSlug: "valentines-day-gifts",
    });
    assert.deepEqual(duplicate.additionalCategorySlugs, ["flowers", "valentines-day-gifts"]);
    assert.deepEqual(await read("valentine-cake"), withOccasion);

    const primaryOnly = product("primary-cake");
    await put(primaryOnly);
    const skippedPrimary = await appendProductAdditionalCategory({
      slug: "primary-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: null,
      additionalSlug: "cakes",
    });
    assert.deepEqual(skippedPrimary.additionalCategorySlugs, []);
    const stored = await read("primary-cake");
    assert.equal(stored?.categorySlug, "cakes");
    assert.equal(Object.hasOwn(stored ?? {}, "additionalCategorySlugs"), false);
    assert.equal(stored?.GSI1PK, "CATEGORY#cakes");
  });

  it("does not create a missing product", async () => {
    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "missing-cake",
          expectedCategorySlug: "cakes",
          expectedAdditionalCategorySlugs: null,
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );
    assert.equal(await read("missing-cake"), undefined);
  });

  it("conflicts when the primary or additional categories changed and leaves the row untouched", async () => {
    const current = product("changed-cake", {
      additionalCategorySlugs: ["flowers"],
      price: 40,
      inventory: 3,
      published: false,
    });
    await put(current);

    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "changed-cake",
          expectedCategorySlug: "flowers",
          expectedAdditionalCategorySlugs: ["flowers"],
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );
    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "changed-cake",
          expectedCategorySlug: "cakes",
          expectedAdditionalCategorySlugs: null,
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );

    assert.deepEqual(await read("changed-cake"), current);
  });

  it("appends an occasion slug when additional categories are absent", async () => {
    const beforeItem = product("absent-additional-cake");
    await put(beforeItem);

    const result = await appendProductAdditionalCategory({
      slug: "absent-additional-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: null,
      additionalSlug: "anniversary-gifts",
    });

    assert.deepEqual(result.additionalCategorySlugs, ["anniversary-gifts"]);
    const stored = await read("absent-additional-cake");
    assert.deepEqual(stored, {
      ...beforeItem,
      additionalCategorySlugs: ["anniversary-gifts"],
    });
    assert.equal(stored?.GSI1PK, "CATEGORY#cakes");
    assert.equal(stored?.GSI1SK, "PRODUCT#absent-additional-cake");
  });

  it("appends an occasion slug onto an empty additional-category list", async () => {
    const beforeItem = product("empty-additional-cake", { additionalCategorySlugs: [] });
    await put(beforeItem);

    const result = await appendProductAdditionalCategory({
      slug: "empty-additional-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: [],
      additionalSlug: "valentines-day-gifts",
    });

    assert.deepEqual(result.additionalCategorySlugs, ["valentines-day-gifts"]);
    assert.deepEqual(await read("empty-additional-cake"), {
      ...beforeItem,
      additionalCategorySlugs: ["valentines-day-gifts"],
    });
  });

  it("conflicts when a missing additional-category attribute is confused with an empty list", async () => {
    const emptyList = product("empty-list-cake", { additionalCategorySlugs: [] });
    const absent = product("absent-list-cake");
    await put(emptyList);
    await put(absent);

    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "empty-list-cake",
          expectedCategorySlug: "cakes",
          expectedAdditionalCategorySlugs: null,
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );
    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "absent-list-cake",
          expectedCategorySlug: "cakes",
          expectedAdditionalCategorySlugs: [],
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );

    assert.deepEqual(await read("empty-list-cake"), emptyList);
    assert.equal(Object.hasOwn((await read("absent-list-cake")) ?? {}, "additionalCategorySlugs"), false);
    assert.deepEqual(await read("absent-list-cake"), absent);
  });

  it("conflicts when the expected additional-category list differs and leaves the row unchanged", async () => {
    const current = product("different-list-cake", {
      additionalCategorySlugs: ["flowers"],
      price: 18,
      inventory: 4,
    });
    await put(current);

    await assert.rejects(
      () =>
        appendProductAdditionalCategory({
          slug: "different-list-cake",
          expectedCategorySlug: "cakes",
          expectedAdditionalCategorySlugs: ["plants"],
          additionalSlug: "anniversary-gifts",
        }),
      AdditionalCategoryConflictError
    );

    assert.deepEqual(await read("different-list-cake"), current);
  });

  it("does not write when the requested slug equals the primary and additional categories already exist", async () => {
    const current = product("primary-in-list-noop-cake", {
      additionalCategorySlugs: ["flowers"],
    });
    await put(current);

    const result = await appendProductAdditionalCategory({
      slug: "primary-in-list-noop-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: ["flowers"],
      additionalSlug: "cakes",
    });

    assert.deepEqual(result.additionalCategorySlugs, ["flowers"]);
    assert.deepEqual(await read("primary-in-list-noop-cake"), current);
  });

  it("keeps an existing primary entry and appends a different occasion slug once", async () => {
    const beforeItem = product("primary-already-listed-cake", {
      additionalCategorySlugs: ["cakes", "flowers"],
    });
    await put(beforeItem);

    const result = await appendProductAdditionalCategory({
      slug: "primary-already-listed-cake",
      expectedCategorySlug: "cakes",
      expectedAdditionalCategorySlugs: ["cakes", "flowers"],
      additionalSlug: "anniversary-gifts",
    });

    assert.deepEqual(result.additionalCategorySlugs, ["cakes", "flowers", "anniversary-gifts"]);
    assert.deepEqual(await read("primary-already-listed-cake"), {
      ...beforeItem,
      additionalCategorySlugs: ["cakes", "flowers", "anniversary-gifts"],
    });
  });
});
