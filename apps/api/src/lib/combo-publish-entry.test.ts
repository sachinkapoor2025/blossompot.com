import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys } from "@blossompot/shared";
import { ComboPublishConfigError, resolveComboPublishConfig, runExplicitComboPublish } from "./combo-publish-run";

const PRODUCTS_TABLE = "blossompot-products-explicit-combo-publish-test";
const CONFIG_TABLE = "blossompot-config-explicit-combo-publish-test";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = PRODUCTS_TABLE;
process.env.CONFIG_TABLE = CONFIG_TABLE;
delete process.env.DYNAMODB_ENDPOINT;

type StoreModule = typeof import("./combo-store");
type ListModule = typeof import("../handlers/combos");

let store: StoreModule;
let listCombos: ListModule["listCombos"];
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;

before(async () => {
  store = await import("./combo-store");
  listCombos = (await import("../handlers/combos")).listCombos;
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  assert.equal(productsTable, PRODUCTS_TABLE);
  assert.equal(db.CONFIG_TABLE, CONFIG_TABLE);
});

function memoryEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "true",
    PRODUCTS_TABLE,
    CONFIG_TABLE,
    ENVIRONMENT: "local",
    ...overrides,
  };
}

function remoteEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "false",
    PRODUCTS_TABLE: "configured-products",
    CONFIG_TABLE: "configured-config",
    AWS_REGION: "configured-region",
    ...overrides,
  };
}

function catalogProduct(slug: string, categorySlug: string, name: string, vendorSlug = "blossompot", inventory = 4) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    slug,
    name,
    description: name,
    price: 20,
    currency: "USD" as const,
    categorySlug,
    vendorSlug,
    images: [`https://example.com/${slug}.jpg`],
    sku: `TF${slug.toUpperCase()}`,
    inventory,
    tags: ["tf-usa"],
    published: true,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

describe("explicit combo publishing", { concurrency: false }, () => {
  it("refuses a missing confirmation, table, region, or ambiguous database target", () => {
    assert.throws(
      () => resolveComboPublishConfig(memoryEnv(), ["node", "publish-combos"]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(memoryEnv({ PRODUCTS_TABLE: "  " }), ["node", "publish-combos", "--publish"]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(memoryEnv({ CONFIG_TABLE: undefined }), ["node", "publish-combos", "--publish"]),
      ComboPublishConfigError
    );
    assert.throws(
      () =>
        resolveComboPublishConfig(memoryEnv({ DYNAMODB_ENDPOINT: "http://localhost:8000" }), [
          "node",
          "publish-combos",
          "--publish",
        ]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(memoryEnv({ USE_MEMORY_DB: "1" }), ["node", "publish-combos", "--publish"]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(remoteEnv({ AWS_REGION: "" }), ["node", "publish-combos", "--publish"]),
      ComboPublishConfigError
    );
    const remote = resolveComboPublishConfig(remoteEnv(), ["node", "publish-combos", "--publish"]);
    assert.equal(remote.productsTable, "configured-products");
    assert.equal(remote.configTable, "configured-config");
    assert.equal(remote.region, "configured-region");
    assert.equal(remote.memory, false);
  });

  it("does not publish when the confirmation flag is missing", async () => {
    await assert.rejects(
      () => runExplicitComboPublish({ env: memoryEnv(), argv: ["node", "publish-combos"] }),
      ComboPublishConfigError
    );
    assert.equal((await store.queryCombos()).length, 0);
  });

  it("does not publish when the resolved target differs from the process", async () => {
    await assert.rejects(
      () =>
        runExplicitComboPublish({
          env: memoryEnv({ PRODUCTS_TABLE: "some-other-products-table" }),
          argv: ["node", "publish-combos", "--publish"],
        }),
      ComboPublishConfigError
    );
    assert.equal((await store.queryCombos()).length, 0);
  });

  it("leaves GET /combos empty until the explicit publisher runs", async () => {
    await putProduct(catalogProduct("roses", "flowers", "Roses"));
    await putProduct(catalogProduct("tulips", "flowers", "Tulips"));
    await putProduct(catalogProduct("cake", "cakes", "Cake"));
    await putProduct(catalogProduct("sold-out-plant", "plants", "Sold Out Plant", "blossompot", 0));
    await putProduct(catalogProduct("fnp-cake", "cakes", "FNP Cake", "fnp"));

    const before = await listCombos({} as never);
    const body = JSON.parse((before as { body: string }).body) as { combos: unknown[] };
    assert.deepEqual(body.combos, []);
    assert.equal((await store.queryCombos()).length, 0);
  });

  it("inserts same-vendor pairs from different primary categories", async () => {
    const result = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--publish"],
    });
    assert.equal(result.inserted, 2);
    assert.equal(result.skipped, 0);
    const listed = await store.queryCombos();
    assert.deepEqual(
      listed.map((combo) => combo.productSlugs),
      [
        ["cake", "roses"],
        ["cake", "tulips"],
      ]
    );
    assert.equal(listed.some((combo) => combo.productSlugs.includes("fnp-cake")), false);
    assert.equal(listed.some((combo) => combo.productSlugs.includes("sold-out-plant")), false);
    assert.equal("price" in (listed[0] ?? {}), false);

    const again = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--publish"],
    });
    assert.equal(again.inserted, 0);
    assert.equal(again.skipped, 2);
    assert.deepEqual(
      again.skips.map((skip) => skip.reason),
      ["existing-combo", "existing-combo"]
    );
  });

  it("keeps an admin edit when the publisher runs again", async () => {
    await putProduct(catalogProduct("admin-roses", "flowers", "Admin Roses"));
    await putProduct(catalogProduct("admin-cake", "cakes", "Admin Cake"));
    await store.insertCombo(
      {
        slug: "admin-roses-admin-cake",
        name: "Admin Rose and Cake",
        description: "Edited by admin",
        productSlugs: ["admin-roses", "admin-cake"],
        sortOrder: 9,
      },
      "2026-01-01T00:00:00.000Z"
    );
    await store.updateCombo("admin-roses-admin-cake", { name: "Admin Rose and Cake" }, "2026-01-02T00:00:00.000Z");

    const result = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--publish"],
    });
    assert.equal(result.skips.some((skip) => skip.slug === "admin-roses-admin-cake" && skip.reason === "existing-combo"), true);
    const saved = (await store.queryCombos()).find((combo) => combo.slug === "admin-roses-admin-cake");
    assert.equal(saved?.name, "Admin Rose and Cake");
    assert.equal(saved?.description, "Edited by admin");
    assert.equal(saved?.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(saved?.updatedAt, "2026-01-02T00:00:00.000Z");
  });

  it("skips a product-slug collision without changing the product", async () => {
    const slug = "collision-cake-roses";
    await putProduct(catalogProduct("collision-cake", "cakes", "Collision Cake"));
    await putProduct({
      ...catalogProduct(slug, "plants", "Stored product", "blossompot", 0),
      name: "Stored product",
    });

    const result = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--publish"],
    });
    assert.equal(result.skips.some((skip) => skip.slug === slug && skip.reason === "product-slug"), true);
    const combo = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
    );
    assert.equal(combo.Item, undefined);
    const product = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: productKeys.pk(slug), SK: productKeys.sk() } })
    );
    assert.equal(product.Item?.name, "Stored product");

    const listed = await listCombos({} as never);
    const body = JSON.parse((listed as { body: string }).body) as { combos: Array<{ slug: string }> };
    assert.equal(body.combos.some((combo) => combo.slug === slug), false);
    assert.equal(body.combos.some((combo) => combo.slug === "cake-roses"), true);
  });
});
