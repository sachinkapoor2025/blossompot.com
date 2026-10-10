import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { productKeys, productSkuKeys, type Product } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = "blossompot-products-sku-race-test";
process.env.CONFIG_TABLE = "blossompot-config-sku-race-test";

type Send = (command: {
  constructor: { name: string };
  input?: { Key?: { PK?: string; SK?: string } };
}) => Promise<{ Item?: Record<string, unknown> }>;

let docClient: { send: Send };
let productsTable: string;
let insertCatalogProduct: (item: Record<string, unknown>) => Promise<void>;
let replaceCatalogProduct: (input: {
  item: Record<string, unknown>;
  previousSku: unknown;
  nextSku: string | undefined;
}) => Promise<void>;
let deleteImportedProductIfUnchanged: (input: {
  slug: string;
  sku: string;
  sourceUrl: string;
}) => Promise<"deleted" | "kept">;
let refreshExistingGboProduct: (
  observed: Record<string, unknown>,
  product: Product,
  slug: string,
  ts: string
) => Promise<Record<string, unknown>>;
let vendorUpsertProduct: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;
let putVendorSession: (session: {
  token: string;
  vendorId: string;
  vendorSlug: string;
  email: string;
  expiresAt: string;
}) => Promise<void>;

before(async () => {
  const db = await import("./db");
  docClient = db.docClient as unknown as { send: Send };
  productsTable = db.PRODUCTS_TABLE;
  const sku = await import("./catalog-sku-write");
  insertCatalogProduct = sku.insertCatalogProduct;
  replaceCatalogProduct = sku.replaceCatalogProduct;
  deleteImportedProductIfUnchanged = sku.deleteImportedProductIfUnchanged;
  const gbo = await import("./gbo-catalog");
  refreshExistingGboProduct = gbo.refreshExistingGboProduct;
  const vendors = await import("../handlers/marketplace-vendors");
  vendorUpsertProduct = vendors.vendorUpsertProduct;
  const auth = await import("./vendor-auth");
  putVendorSession = auth.putVendorSession;
});

function productItem(slug: string, sku: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    slug,
    sku,
    name: "Rose",
    description: "A rose",
    price: 20,
    currency: "USD",
    categorySlug: "flowers",
    images: ["https://cdn.example.com/rose.jpg"],
    inventory: 3,
    published: false,
    ...extra,
  };
}

async function item(pk: string, sk = "META"): Promise<Record<string, unknown> | undefined> {
  const row = await docClient.send(new GetCommand({ TableName: productsTable, Key: { PK: pk, SK: sk } }));
  return row.Item;
}

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") throw new Error("Expected JSON");
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

describe("fnp import cleanup versus a concurrent sku change", () => {
  const sourceUrl = "https://www.fnp.com/usa/rose";

  it("deletes the product and reservation only while both still belong to the import", async () => {
    const slug = "fnp-cleanup-owned";
    await insertCatalogProduct(productItem(slug, "fnp-owned", { sourceUrl }));
    const outcome = await deleteImportedProductIfUnchanged({ slug, sku: "fnp-owned", sourceUrl });
    assert.equal(outcome, "deleted");
    assert.equal(await item(productKeys.pk(slug)), undefined);
    assert.equal(await item(productSkuKeys.pk("fnp-owned")), undefined);
  });

  it("keeps a product whose sku changed and does not drop the new reservation", async () => {
    const slug = "fnp-cleanup-moved";
    const original = productItem(slug, "fnp-old", { sourceUrl });
    await insertCatalogProduct(original);
    await replaceCatalogProduct({
      item: productItem(slug, "fnp-new", { sourceUrl }),
      previousSku: "fnp-old",
      nextSku: "fnp-new",
    });
    const outcome = await deleteImportedProductIfUnchanged({ slug, sku: "fnp-old", sourceUrl });
    assert.equal(outcome, "kept");
    const stored = await item(productKeys.pk(slug));
    assert.equal(stored?.sku, "fnp-new");
    assert.equal((await item(productSkuKeys.pk("fnp-new")))?.productSlug, slug);
    assert.equal(await item(productSkuKeys.pk("fnp-old")), undefined);
  });

  it("leaves no mismatched product and reservation when cleanup races a sku change", async () => {
    const slug = "fnp-cleanup-race";
    const original = productItem(slug, "fnp-race-old", { sourceUrl });
    await insertCatalogProduct(original);
    const [cleanup, change] = await Promise.allSettled([
      deleteImportedProductIfUnchanged({ slug, sku: "fnp-race-old", sourceUrl }),
      replaceCatalogProduct({
        item: productItem(slug, "fnp-race-new", { sourceUrl }),
        previousSku: "fnp-race-old",
        nextSku: "fnp-race-new",
      }),
    ]);
    const stored = await item(productKeys.pk(slug));
    const oldReservation = await item(productSkuKeys.pk("fnp-race-old"));
    const newReservation = await item(productSkuKeys.pk("fnp-race-new"));
    if (!stored) {
      assert.equal(cleanup.status, "fulfilled");
      assert.equal(cleanup.status === "fulfilled" ? cleanup.value : "", "deleted");
      assert.equal(change.status, "rejected");
      assert.equal(oldReservation, undefined);
      assert.equal(newReservation, undefined);
      return;
    }
    assert.equal(stored.sku, "fnp-race-new");
    assert.equal(newReservation?.productSlug, slug);
    assert.equal(oldReservation, undefined);
    assert.equal(cleanup.status === "fulfilled" ? cleanup.value : "", "kept");
  });
});

describe("gbo refresh versus a concurrent sku change", () => {
  it("does not restore an unchanged incoming sku after the stored sku changes", async () => {
    const slug = "gbo-us-42";
    const originalSku = "gbo:US:42";
    const movedSku = "custom-basket";
    await insertCatalogProduct(productItem(slug, originalSku));
    await replaceCatalogProduct({
      item: productItem(slug, movedSku),
      previousSku: originalSku,
      nextSku: movedSku,
    });
    const gift = productItem(slug, originalSku, { name: "Refreshed Basket", price: 80 }) as unknown as Product;
    const saved = await refreshExistingGboProduct({ sku: originalSku, name: "Old Basket" }, gift, slug, "2026-10-09T00:00:00.000Z");
    assert.equal(saved.sku, movedSku);
    assert.equal(saved.name, "Refreshed Basket");
    const stored = await item(productKeys.pk(slug));
    assert.equal(stored?.sku, movedSku);
    assert.equal(stored?.name, "Refreshed Basket");
    assert.equal((await item(productSkuKeys.pk(movedSku)))?.productSlug, slug);
    assert.equal(await item(productSkuKeys.pk(originalSku)), undefined);
  });

  it("still refreshes fields when the observed sku is unchanged", async () => {
    const slug = "gbo-us-43";
    const sku = "gbo:US:43";
    await insertCatalogProduct(productItem(slug, sku, { name: "Old Basket" }));
    const gift = productItem(slug, sku, { name: "Same Sku Basket" }) as unknown as Product;
    const saved = await refreshExistingGboProduct({ sku, name: "Old Basket" }, gift, slug, "2026-10-09T00:00:00.000Z");
    assert.equal(saved.sku, sku);
    assert.equal((await item(productKeys.pk(slug)))?.name, "Same Sku Basket");
    assert.equal((await item(productSkuKeys.pk(sku)))?.productSlug, slug);
  });
});

describe("vendor product submission preserves sku reservations", () => {
  const token = "vendor-race-token";
  const vendorSlug = "local-florist";
  const slug = "local-florist-red-rose";

  before(async () => {
    await putVendorSession({
      token,
      vendorId: "vendor-race",
      vendorSlug,
      email: "florist@example.com",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
  });

  function submission(): APIGatewayProxyEventV2 {
    return {
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: "Red Rose",
        description: "Fresh stems",
        vendorCost: 12,
        categorySlug: "flowers",
        images: ["https://cdn.example.com/rose.jpg"],
        inventory: 6,
        tags: ["rose"],
        submitForApproval: false,
      }),
      rawPath: "/vendor/products",
    } as unknown as APIGatewayProxyEventV2;
  }

  it("keeps the stored sku and reservation when the submission replaces other fields", async () => {
    await insertCatalogProduct(productItem(slug, "Vendor-Rose", { vendorSlug, vendorCost: 9 }));
    const saved = resultOf(await vendorUpsertProduct(submission()));
    assert.equal(saved.statusCode, 201);
    const stored = await item(productKeys.pk(slug));
    assert.equal(stored?.sku, "Vendor-Rose");
    assert.equal(stored?.description, "Fresh stems");
    assert.equal(stored?.inventory, 6);
    assert.equal((await item(productSkuKeys.pk("vendor-rose")))?.productSlug, slug);
  });

  it("rejects a submission that would overwrite a sku changed after the read", async () => {
    const raced = "local-florist-raced-rose";
    const seeded = productItem(raced, "Vendor-Old", { vendorSlug, vendorCost: 9, name: "Raced Rose" });
    await insertCatalogProduct(seeded);
    const originalSend = docClient.send.bind(docClient);
    let swapped = false;
    docClient.send = async (command) => {
      const result = await originalSend(command);
      if (!swapped && command.constructor.name === "GetCommand" && command.input?.Key?.PK === productKeys.pk(raced)) {
        swapped = true;
        await replaceCatalogProduct({
          item: productItem(raced, "Vendor-New", { vendorSlug, vendorCost: 9, name: "Raced Rose" }),
          previousSku: "Vendor-Old",
          nextSku: "Vendor-New",
        });
      }
      return result;
    };
    try {
      const saved = resultOf(
        await vendorUpsertProduct({
          headers: { authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: "Raced Rose",
            description: "Changed copy",
            vendorCost: 15,
            categorySlug: "flowers",
            images: ["https://cdn.example.com/rose.jpg"],
            inventory: 2,
            tags: [],
            submitForApproval: false,
          }),
          rawPath: "/vendor/products",
        } as unknown as APIGatewayProxyEventV2)
      );
      assert.equal(saved.statusCode, 409);
    } finally {
      docClient.send = originalSend;
    }
    const stored = await item(productKeys.pk(raced));
    assert.equal(stored?.sku, "Vendor-New");
    assert.equal((await item(productSkuKeys.pk("vendor-new")))?.productSlug, raced);
    assert.equal(await item(productSkuKeys.pk("vendor-old")), undefined);
  });
});
