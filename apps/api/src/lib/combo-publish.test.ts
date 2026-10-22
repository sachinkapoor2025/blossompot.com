import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ComboSourceProduct, VendorDisplaySource } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = "blossompot-products-combo-publish-test";

type PublishModule = typeof import("./combo-publish");
type ComboStore = typeof import("./combo-store");

let publishGeneratedCombos: PublishModule["publishGeneratedCombos"];
let DEFAULT_COMBOS_PER_VENDOR: PublishModule["DEFAULT_COMBOS_PER_VENDOR"];
let store: ComboStore;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;

const vendors: VendorDisplaySource[] = [
  { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 },
  { vendorSlug: "fnp", vendorName: "FNP", displayOrder: 2 },
];

function product(slug: string, categorySlug: string, vendorSlug = "blossompot", name = slug): ComboSourceProduct {
  return { slug, name, categorySlug, vendorSlug };
}

before(async () => {
  const publishing = await import("./combo-publish");
  publishGeneratedCombos = publishing.publishGeneratedCombos;
  DEFAULT_COMBOS_PER_VENDOR = publishing.DEFAULT_COMBOS_PER_VENDOR;
  store = await import("./combo-store");
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
});

async function comboRow(slug: string): Promise<Record<string, unknown> | undefined> {
  const result = await docClient.send(
    new GetCommand({ TableName: productsTable, Key: { PK: `COMBO#${slug}`, SK: "META" } })
  );
  return result.Item;
}

describe("combo publishing", { concurrency: 1 }, () => {
  it("inserts generated drafts in vendor rank order", async () => {
    const result = await publishGeneratedCombos({
      products: [
        product("fnp-cake", "cakes", "fnp", "FNP Cake"),
        product("fnp-roses", "flowers", "fnp", "FNP Roses"),
        product("bp-cake", "cakes", "blossompot", "BP Cake"),
        product("bp-roses", "flowers", "blossompot", "BP Roses"),
      ],
      vendors,
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(result.generated, 2);
    assert.equal(result.inserted, 2);
    assert.equal(result.skipped, 0);
    const listed = await store.queryCombos();
    assert.deepEqual(
      listed.map((combo) => combo.slug),
      ["bp-cake-bp-roses", "fnp-cake-fnp-roses"]
    );
    assert.deepEqual(
      listed.map((combo) => combo.sortOrder),
      [0, 1]
    );
  });

  it("skips an existing combo on a repeated run and keeps an admin edit", async () => {
    const products = [product("roses", "flowers", "blossompot", "Roses"), product("cake", "cakes", "blossompot", "Cake")];
    const first = await publishGeneratedCombos({
      products,
      vendors,
      timestamp: "2026-02-01T00:00:00.000Z",
    });
    assert.equal(first.inserted, 1);
    assert.equal(first.skips.length, 0);

    await store.updateCombo("cake-roses", { name: "Admin Rose and Cake" }, "2026-02-02T00:00:00.000Z");
    const second = await publishGeneratedCombos({
      products,
      vendors,
      timestamp: "2026-02-03T00:00:00.000Z",
    });

    assert.equal(second.generated, 1);
    assert.equal(second.inserted, 0);
    assert.equal(second.skipped, 1);
    assert.deepEqual(second.skips, [{ slug: "cake-roses", reason: "existing-combo" }]);
    const row = await comboRow("cake-roses");
    assert.equal(row?.name, "Admin Rose and Cake");
    assert.equal(row?.createdAt, "2026-02-01T00:00:00.000Z");
    assert.equal(row?.updatedAt, "2026-02-02T00:00:00.000Z");
  });

  it("skips a combo slug reserved by a product and leaves that product unchanged", async () => {
    const slug = "publish-cake-publish-roses";
    await docClient.send(
      new PutCommand({
        TableName: productsTable,
        Item: { PK: `PRODUCT#${slug}`, SK: "META", slug, name: "Stored product" },
      })
    );

    const result = await publishGeneratedCombos({
      products: [
        product("publish-roses", "flowers", "blossompot", "Publish Roses"),
        product("publish-cake", "cakes", "blossompot", "Publish Cake"),
      ],
      vendors,
      timestamp: "2026-03-01T00:00:00.000Z",
    });

    assert.equal(result.inserted, 0);
    assert.deepEqual(result.skips, [{ slug, reason: "product-slug" }]);
    assert.equal(await comboRow(slug), undefined);
    const productRow = await docClient.send(
      new GetCommand({ TableName: productsTable, Key: { PK: `PRODUCT#${slug}`, SK: "META" } })
    );
    assert.equal(productRow.Item?.name, "Stored product");
  });

  it("uses 10 combos per vendor unless the caller sets another limit", async () => {
    assert.equal(DEFAULT_COMBOS_PER_VENDOR, 10);
    const many = ["a", "b", "c", "d", "e", "f"].map((slug) => product(slug, slug, "blossompot", slug.toUpperCase()));
    const capped = await publishGeneratedCombos({
      products: many,
      vendors,
      timestamp: "2026-04-01T00:00:00.000Z",
    });
    assert.equal(capped.generated, 10);
    assert.equal(capped.inserted, 10);

    const limited = await publishGeneratedCombos({
      products: [
        product("limit-roses", "flowers"),
        product("limit-cake", "cakes"),
        product("limit-plant", "plants"),
        product("limit-fnp-a", "hampers", "fnp"),
        product("limit-fnp-b", "bouquets", "fnp"),
      ],
      vendors,
      limitPerVendor: 1,
      timestamp: "2026-04-02T00:00:00.000Z",
    });
    assert.equal(limited.generated, 2);
    assert.equal(limited.inserted, 2);
    assert.deepEqual(
      (await store.queryCombos())
        .filter((combo) => combo.slug.startsWith("limit-"))
        .map((combo) => combo.productSlugs),
      [
        ["limit-cake", "limit-plant"],
        ["limit-fnp-a", "limit-fnp-b"],
      ]
    );
  });

  it("skips a stored pair whose combo slug lists the components in reverse order", async () => {
    const storedSlug = "kept-roses-kept-cake";
    await store.insertCombo(
      {
        slug: storedSlug,
        name: "Admin kept pair",
        description: "Edited by admin",
        productSlugs: ["kept-roses", "kept-cake"],
        sortOrder: 3,
      },
      "2026-05-02T00:00:00.000Z"
    );

    const result = await publishGeneratedCombos({
      products: [
        product("kept-cake", "cakes", "blossompot", "Kept Cake"),
        product("kept-roses", "flowers", "blossompot", "Kept Roses"),
      ],
      vendors,
      timestamp: "2026-05-03T00:00:00.000Z",
    });

    assert.equal(result.generated, 1);
    assert.equal(result.inserted, 0);
    assert.deepEqual(result.skips, [{ slug: storedSlug, reason: "existing-combo" }]);
    assert.equal(await comboRow("kept-cake-kept-roses"), undefined);
    const row = await comboRow(storedSlug);
    assert.equal(row?.name, "Admin kept pair");
    assert.equal(row?.description, "Edited by admin");
    assert.deepEqual(row?.productSlugs, ["kept-roses", "kept-cake"]);
    assert.equal(row?.createdAt, "2026-05-02T00:00:00.000Z");
    assert.equal(row?.updatedAt, "2026-05-02T00:00:00.000Z");
  });

  it("returns an empty result when there is nothing to publish", async () => {
    const result = await publishGeneratedCombos({ products: [], vendors, timestamp: "2026-05-01T00:00:00.000Z" });
    assert.deepEqual(result, { generated: 0, inserted: 0, skipped: 0, skips: [] });
  });

  it("stops on an unexpected storage error without recording it as a skip", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        publishGeneratedCombos(
          {
            products: [product("err-roses", "flowers"), product("err-cake", "cakes"), product("err-plant", "plants")],
            vendors,
            limitPerVendor: 2,
            timestamp: "2026-06-01T00:00:00.000Z",
          },
          {
            queryCombos: store.queryCombos,
            insertCombo: async (draft, timestamp) => {
              calls += 1;
              if (calls === 2) throw new Error("storage unavailable");
              return store.insertCombo(draft, timestamp);
            },
          }
        ),
      /storage unavailable/
    );

    assert.equal((await comboRow("err-cake-err-plant"))?.name, "err-cake and err-plant");
    assert.equal(await comboRow("err-cake-err-roses"), undefined);
  });
});
