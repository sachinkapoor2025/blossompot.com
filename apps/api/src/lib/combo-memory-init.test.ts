import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.COMBO_COUNTRY = "US";
process.env.PRODUCTS_TABLE = "blossompot-products-combo-memory-init";
process.env.CONFIG_TABLE = "blossompot-config-combo-memory-init";

type InitModule = typeof import("./combo-memory-init");
type StoreModule = typeof import("./combo-store");
type ListModule = typeof import("../handlers/combos");

let publishSeededMemoryCombos: InitModule["publishSeededMemoryCombos"];
let store: StoreModule;
let listCombos: ListModule["listCombos"];
let docClient: { send: (command: unknown) => Promise<unknown> };
let productsTable: string;

before(async () => {
  const init = await import("./combo-memory-init");
  publishSeededMemoryCombos = init.publishSeededMemoryCombos;
  store = await import("./combo-store");
  listCombos = (await import("../handlers/combos")).listCombos;
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
});

function catalogProduct(slug: string, categorySlug: string, name: string) {
  return {
    slug,
    name,
    description: name,
    price: 20,
    currency: "USD" as const,
    categorySlug,
    images: [`https://example.com/${slug}.jpg`],
    sku: `TF${slug.toUpperCase()}`,
    inventory: 4,
    tags: ["tf-usa"],
    published: true,
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
  };
}

async function putProduct(slug: string, categorySlug: string, name: string) {
  await docClient.send(
    new PutCommand({
      TableName: productsTable,
      Item: catalogProduct(slug, categorySlug, name),
    })
  );
}

describe("in-memory combo initialization", { concurrency: 1 }, () => {
  it("does not publish unless the process is using the local memory database", async () => {
    const previous = process.env.USE_MEMORY_DB;
    process.env.USE_MEMORY_DB = "false";
    try {
      const blocked = await publishSeededMemoryCombos();
      assert.deepEqual(blocked, { ran: false, reason: "not-memory" });
      assert.equal((await store.queryCombos()).length, 0);
    } finally {
      process.env.USE_MEMORY_DB = previous;
    }
  });

  it("publishes once and keeps an existing combo on later runs", async () => {
    await putProduct("roses", "flowers", "Roses");
    await putProduct("cake", "cakes", "Cake");
    await putProduct("sample-orchid", "plants", "Sample Orchid");
    await store.insertCombo(
      {
        slug: "roses-cake",
        name: "Admin Rose and Cake",
        productSlugs: ["roses", "cake"],
        description: "Edited by admin",
        sortOrder: 4,
      },
      "2026-01-01T00:00:00.000Z"
    );

    const first = await publishSeededMemoryCombos();
    assert.equal(first.ran, true);
    if (!first.ran) return;
    assert.equal(first.inserted, 0);
    assert.equal(first.skipped, 1);
    const saved = (await store.queryCombos()).find((combo) => combo.slug === "roses-cake");
    assert.equal(saved?.name, "Admin Rose and Cake");
    assert.equal(saved?.description, "Edited by admin");
    assert.equal(saved?.createdAt, "2026-01-01T00:00:00.000Z");

    await putProduct("plant", "plants", "Plant");
    const second = await publishSeededMemoryCombos();
    assert.equal(second.ran, true);
    if (!second.ran) return;
    assert.equal(second.inserted, 2);
    const third = await publishSeededMemoryCombos();
    assert.equal(third.ran, true);
    if (!third.ran) return;
    assert.equal(third.inserted, 0);
    assert.equal(third.skipped, second.generated);
    const still = (await store.queryCombos()).find((combo) => combo.slug === "roses-cake");
    assert.equal(still?.name, "Admin Rose and Cake");
    assert.equal(still?.updatedAt, "2026-01-01T00:00:00.000Z");

    const listed = await listCombos({} as never);
    const body = JSON.parse((listed as { body: string }).body) as { combos: Array<{ slug: string; price?: number }> };
    assert.equal(body.combos.some((combo) => combo.slug === "roses-cake"), true);
    assert.equal(body.combos.some((combo) => combo.price != null), false);
    assert.equal(body.combos.some((combo) => combo.slug.includes("sample-orchid")), false);
  });
});
