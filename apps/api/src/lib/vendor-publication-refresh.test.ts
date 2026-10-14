import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { formatGboProductSlug, type Product } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "true";
process.env.GBO_API_TOKEN = "phase1-vendor-publication-token";
process.env.CONFIG_TABLE = "blossompot-config-vendor-publication-test";
process.env.PRODUCTS_TABLE = "blossompot-products-vendor-publication-test";
process.env.CARTS_TABLE = "blossompot-carts-vendor-publication-test";
process.env.ORDERS_TABLE = "blossompot-orders-vendor-publication-test";

const OC_EXISTING = "rakhi-dry-fruit-celebration-combo";
const OC_NEW = "grand-rakhi-dry-fruit-indulgence-box";
const GBO_ID = 77;
const GBO_NAME = "Phase One Basket";
const SESSION = "vendor-publication-shopper";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;
type Send = (command: unknown) => Promise<{ Item?: Record<string, unknown> }>;

let docClient: { send: Send };
let productsTable: string;
let productKeys: { pk: (slug: string) => string; sk: () => string; gsi1pk: (category: string) => string; gsi1sk: (slug: string) => string };
let ensureOrangeCountyProductInDb: (slug: string) => Promise<Record<string, unknown> | null>;
let ensureGboProductInDb: (slug: string) => Promise<Record<string, unknown> | null>;
let refreshExistingGboProduct: (
  observed: Record<string, unknown>,
  product: Product,
  slug: string,
  ts: string
) => Promise<Record<string, unknown>>;
let getProduct: Handler;
let addToCart: Handler;
let updateCartItem: Handler;

before(async () => {
  const db = await import("./db");
  docClient = db.docClient as unknown as { send: Send };
  productsTable = db.PRODUCTS_TABLE;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const orange = await import("./orange-county-catalog");
  ensureOrangeCountyProductInDb = orange.ensureOrangeCountyProductInDb;
  const gbo = await import("./gbo-catalog");
  ensureGboProductInDb = gbo.ensureGboProductInDb;
  refreshExistingGboProduct = gbo.refreshExistingGboProduct;
  const products = await import("../handlers/products");
  getProduct = products.getProduct;
  const cart = await import("../handlers/cart");
  addToCart = cart.addToCart;
  updateCartItem = cart.updateCartItem;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function shopper(partial: Record<string, unknown> = {}): APIGatewayProxyEventV2 {
  const headers = {
    "x-session-id": SESSION,
    ...((partial.headers as Record<string, string> | undefined) ?? {}),
  };
  return {
    requestContext: { http: { method: "GET", path: "/products" } },
    ...partial,
    headers,
  } as unknown as APIGatewayProxyEventV2;
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

async function stored(slug: string): Promise<Record<string, unknown> | undefined> {
  const row = await docClient.send(
    new GetCommand({ TableName: productsTable, Key: { PK: productKeys.pk(slug), SK: productKeys.sk() } })
  );
  return row.Item;
}

function ocRow(slug: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk("rakhi-hampers"),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: "Stored hamper",
    description: "stale description",
    price: 10,
    currency: "USD",
    categorySlug: "rakhi-hampers",
    vendorSlug: "orange-county",
    images: ["https://cdn.example.com/hamper.jpg"],
    inventory: 4,
    sku: "stored-hamper",
    tags: ["rakhi-hamper"],
    published: true,
    ...extra,
  };
}

function gboGift(name: string, sku: string): Product {
  return {
    slug: "ignored-by-refresh",
    name,
    description: "Fresh basket description",
    price: 80,
    currency: "USD",
    categorySlug: "gift-baskets",
    images: ["https://cdn.example.com/basket.jpg"],
    sku,
    inventory: 1,
    tags: ["overseas"],
    published: true,
    vendorSlug: "gift-baskets-overseas",
    internationalDelivery: true,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
  };
}

describe("vendor refresh keeps an unpublished product unpublished", { concurrency: false }, () => {
  it("creates a new Orange County product as published", async () => {
    assert.equal(await stored(OC_NEW), undefined);
    const created = await ensureOrangeCountyProductInDb(OC_NEW);
    assert.equal(created?.published, true);
    assert.equal(created?.name, "Grand Rakhi Dry Fruit Indulgence Box");
    assert.equal((await stored(OC_NEW))?.published, true);
  });

  it("refreshes an already published Orange County product", async () => {
    await putProduct(ocRow(OC_EXISTING, { published: true, description: "stale description" }));
    const refreshed = await ensureOrangeCountyProductInDb(OC_EXISTING);
    assert.equal(refreshed?.published, true);
    assert.notEqual(refreshed?.description, "stale description");
    const row = await stored(OC_EXISTING);
    assert.equal(row?.published, true);
    assert.equal(row?.vendorSlug, "orange-county");
    assert.equal(Number(row?.inventory) >= 500, true);
  });

  it("does not republish an unpublished Orange County product during refresh", async () => {
    await putProduct(ocRow(OC_EXISTING, { published: false, description: "stale description", name: "Hidden hamper" }));
    const refreshed = await ensureOrangeCountyProductInDb(OC_EXISTING);
    assert.equal(refreshed?.published, false);
    assert.notEqual(refreshed?.description, "stale description");
    const row = await stored(OC_EXISTING);
    assert.equal(row?.published, false);
    assert.equal(row?.name, "Hidden hamper");
    assert.equal(Number(row?.inventory) >= 500, true);
  });

  it("does not let an Orange County refresh overwrite an unpublish that lands after the stored-row read", async () => {
    await putProduct(
      ocRow(OC_EXISTING, {
        published: true,
        name: "Visible hamper",
        description: "stale description",
        sku: "stored-hamper",
        images: ["https://cdn.example.com/stale.jpg"],
        seoTitle: "Stale title",
        seoDescription: "Stale seo",
        tags: ["stale"],
      })
    );
    const originalSend = docClient.send.bind(docClient);
    let armed = true;
    docClient.send = async (command: unknown) => {
      const result = await originalSend(command);
      const commandName = (command as { constructor?: { name?: string } }).constructor?.name;
      const key = (command as { input?: { Key?: { PK?: string } } }).input?.Key?.PK;
      if (armed && commandName === "GetCommand" && key === productKeys.pk(OC_EXISTING)) {
        armed = false;
        const item = (result as { Item?: Record<string, unknown> }).Item;
        await originalSend(
          new PutCommand({
            TableName: productsTable,
            Item: { ...item, published: false },
          })
        );
      }
      return result;
    };
    try {
      const saved = await ensureOrangeCountyProductInDb(OC_EXISTING);
      assert.equal(saved?.published, false);
      assert.notEqual(saved?.description, "stale description");
      const row = await stored(OC_EXISTING);
      assert.equal(row?.published, false);
      assert.equal(row?.name, "Visible hamper");
      assert.equal(row?.sku, "stored-hamper");
      assert.equal(Number(row?.inventory) >= 500, true);
      assert.notEqual(row?.description, "stale description");
      assert.deepEqual(row?.images, [
        "/uploads/orange-county/TFUSRH2026-3/TFUSRH2026-3a.jpg",
        "/uploads/orange-county/TFUSRH2026-3/TFUSRH2026-3b.jpg",
        "/uploads/orange-county/TFUSRH2026-3/TFUSRH2026-3.jpg",
      ]);
      assert.equal(row?.seoTitle, "Rakhi Dry Fruit Celebration Combo | Orange County Delivery | Rakhi Hamper");
      assert.match(String(row?.seoDescription), /Rakhi Dry Fruit Celebration Combo/);
      assert.deepEqual(row?.tags, ["rakhi-hamper", "gift-hamper", "raksha-bandhan", "dry-fruits"]);
    } finally {
      docClient.send = originalSend;
    }
  });

  it("does not let the product page or cart refresh republish an unpublished Orange County product", async () => {
    await putProduct(ocRow(OC_EXISTING, { published: true, description: "stale description", name: "Visible hamper" }));
    const added = resultOf(
      await addToCart(
        shopper({
          body: JSON.stringify({
            productSlug: OC_EXISTING,
            quantity: 1,
            deliveryCountry: "US",
            deliveryPostal: "92612",
          }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(added.statusCode, 200);
    assert.equal((await stored(OC_EXISTING))?.published, true);
    assert.notEqual((await stored(OC_EXISTING))?.description, "stale description");

    await putProduct(ocRow(OC_EXISTING, { published: false, description: "left unpublished", name: "Hidden hamper" }));
    const detail = resultOf(
      await getProduct(
        shopper({
          pathParameters: { slug: OC_EXISTING },
          queryStringParameters: { country: "US", postalCode: "92612" },
        })
      )
    );
    assert.equal(detail.statusCode, 404);
    assert.equal((await stored(OC_EXISTING))?.published, false);
    assert.equal((await stored(OC_EXISTING))?.description, "left unpublished");

    const rejected = resultOf(
      await addToCart(
        shopper({
          body: JSON.stringify({
            productSlug: OC_EXISTING,
            quantity: 1,
            deliveryCountry: "US",
            deliveryPostal: "92612",
          }),
          requestContext: { http: { method: "POST", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rejected.statusCode, 400);
    assert.equal(rejected.body.error, "Hidden hamper is no longer available.");
    assert.equal((await stored(OC_EXISTING))?.published, false);

    const cart = added.body.cart as { items: Array<{ lineId?: string; productSlug?: string }> };
    const line = cart.items.find((item) => item.productSlug === OC_EXISTING);
    const rejectedUpdate = resultOf(
      await updateCartItem(
        shopper({
          pathParameters: { lineId: String(line?.lineId) },
          body: JSON.stringify({ quantity: 2 }),
          requestContext: { http: { method: "PATCH", path: "/cart/items" } },
        })
      )
    );
    assert.equal(rejectedUpdate.statusCode, 400);
    assert.equal(rejectedUpdate.body.error, "Hidden hamper is no longer available.");
    assert.equal((await stored(OC_EXISTING))?.published, false);
    assert.equal((await stored(OC_EXISTING))?.description, "left unpublished");
  });

  it("refreshes a published Gift Baskets Overseas product and leaves a missing flag published", async () => {
    const slug = "gbo-us-901-published";
    const sku = "gbo:US:901";
    await putProduct(ocRow(slug, { published: true, name: "Old Basket", sku, vendorSlug: "gift-baskets-overseas", categorySlug: "gift-baskets" }));
    const refreshed = await refreshExistingGboProduct(
      { sku, name: "Old Basket", published: true },
      gboGift("Published Basket", sku),
      slug,
      "2026-10-14T00:00:00.000Z"
    );
    assert.equal(refreshed.published, true);
    assert.equal(refreshed.name, "Published Basket");
    assert.equal((await stored(slug))?.published, true);
    assert.equal((await stored(slug))?.price, 80);

    const omitted = "gbo-us-902-omitted";
    const omittedSku = "gbo:US:902";
    const { published: _published, ...withoutFlag } = ocRow(omitted, { name: "Old Basket", sku: omittedSku });
    await putProduct(withoutFlag);
    const saved = await refreshExistingGboProduct(
      { sku: omittedSku, name: "Old Basket" },
      gboGift("Default Basket", omittedSku),
      omitted,
      "2026-10-14T00:00:00.000Z"
    );
    assert.equal(saved.published, true);
    assert.equal((await stored(omitted))?.published, true);
  });

  it("keeps a stored unpublished Gift Baskets Overseas row unpublished when the snapshot omits or claims published", async () => {
    const omittedSlug = "gbo-us-904-omitted-snapshot";
    const omittedSku = "gbo:US:904";
    await putProduct(
      ocRow(omittedSlug, {
        published: false,
        name: "Hidden basket",
        sku: omittedSku,
        vendorSlug: "gift-baskets-overseas",
        categorySlug: "gift-baskets",
      })
    );
    const omitted = await refreshExistingGboProduct(
      { sku: omittedSku, name: "Hidden basket" },
      gboGift("Refreshed from omitted snapshot", omittedSku),
      omittedSlug,
      "2026-10-14T00:00:00.000Z"
    );
    assert.equal(omitted.published, false);
    assert.equal(omitted.name, "Refreshed from omitted snapshot");
    assert.equal((await stored(omittedSlug))?.published, false);
    assert.equal((await stored(omittedSlug))?.name, "Refreshed from omitted snapshot");

    const claimedSlug = "gbo-us-905-claimed-published";
    const claimedSku = "gbo:US:905";
    await putProduct(
      ocRow(claimedSlug, {
        published: false,
        name: "Hidden basket",
        sku: claimedSku,
        vendorSlug: "gift-baskets-overseas",
        categorySlug: "gift-baskets",
      })
    );
    const claimed = await refreshExistingGboProduct(
      { sku: claimedSku, name: "Hidden basket", published: true },
      gboGift("Refreshed from published snapshot", claimedSku),
      claimedSlug,
      "2026-10-14T00:00:00.000Z"
    );
    assert.equal(claimed.published, false);
    assert.equal(claimed.name, "Refreshed from published snapshot");
    assert.equal((await stored(claimedSlug))?.published, false);
    assert.equal((await stored(claimedSlug))?.price, 80);
  });

  it("does not let a vendor refresh overwrite an unpublish that lands after the publication read", async () => {
    const slug = "gbo-us-906-unpublish-race";
    const sku = "gbo:US:906";
    await putProduct(
      ocRow(slug, {
        published: true,
        name: "Visible basket",
        sku,
        price: 12,
        vendorSlug: "gift-baskets-overseas",
        categorySlug: "gift-baskets",
      })
    );
    const originalSend = docClient.send.bind(docClient);
    let armed = true;
    docClient.send = async (command: unknown) => {
      const result = await originalSend(command);
      const commandName = (command as { constructor?: { name?: string } }).constructor?.name;
      const key = (command as { input?: { Key?: { PK?: string } } }).input?.Key?.PK;
      if (armed && commandName === "GetCommand" && key === productKeys.pk(slug)) {
        armed = false;
        const item = (result as { Item?: Record<string, unknown> }).Item;
        await originalSend(
          new PutCommand({
            TableName: productsTable,
            Item: { ...item, published: false },
          })
        );
      }
      return result;
    };
    try {
      const saved = await refreshExistingGboProduct(
        { sku, name: "Visible basket", published: true },
        gboGift("Refreshed during unpublish", sku),
        slug,
        "2026-10-14T00:00:00.000Z"
      );
      assert.equal(saved.published, false);
      assert.equal(saved.name, "Refreshed during unpublish");
      const row = await stored(slug);
      assert.equal(row?.published, false);
      assert.equal(row?.name, "Refreshed during unpublish");
      assert.equal(row?.price, 80);
      assert.equal(row?.sku, sku);
    } finally {
      docClient.send = originalSend;
    }
  });

  it("does not republish an unpublished Gift Baskets Overseas product during refresh", async () => {
    const slug = "gbo-us-903-hidden";
    const sku = "gbo:US:903";
    await putProduct(
      ocRow(slug, {
        published: false,
        name: "Hidden basket",
        sku,
        price: 12,
        vendorSlug: "gift-baskets-overseas",
        categorySlug: "gift-baskets",
        internationalDelivery: true,
      })
    );
    const refreshed = await refreshExistingGboProduct(
      { sku, name: "Hidden basket", published: false, price: 12 },
      gboGift("Refreshed Basket", sku),
      slug,
      "2026-10-14T00:00:00.000Z"
    );
    assert.equal(refreshed.published, false);
    assert.equal(refreshed.name, "Refreshed Basket");
    assert.equal(refreshed.price, 80);
    const row = await stored(slug);
    assert.equal(row?.published, false);
    assert.equal(row?.name, "Refreshed Basket");
    assert.equal(row?.price, 80);
  });

  it("creates a new Gift Baskets Overseas product as published and will not republish it later", async () => {
    const slug = formatGboProductSlug("US", GBO_ID, GBO_NAME);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: {
            id: GBO_ID,
            name: GBO_NAME,
            price: 40,
            price_retail: 50,
            description: "Tea and biscuits",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    try {
      assert.equal(await stored(slug), undefined);
      const created = await ensureGboProductInDb(slug);
      assert.equal(created?.published, true);
      assert.equal(created?.name, GBO_NAME);
      assert.equal((await stored(slug))?.published, true);

      const current = await stored(slug);
      await putProduct({ ...current, published: false, price: 1, description: "left unpublished" });
      const refreshed = await ensureGboProductInDb(slug);
      assert.equal(refreshed?.published, false);
      assert.equal(refreshed?.name, GBO_NAME);
      assert.equal(refreshed?.price, 50);
      const row = await stored(slug);
      assert.equal(row?.published, false);
      assert.equal(row?.price, 50);

      let fetches = 0;
      globalThis.fetch = async () => {
        fetches += 1;
        throw new Error("vendor refresh should not run for an unpublished product");
      };
      const detail = resultOf(
        await getProduct(
          shopper({
            pathParameters: { slug },
            queryStringParameters: { country: "US" },
          })
        )
      );
      assert.equal(detail.statusCode, 404);
      const rejected = resultOf(
        await addToCart(
          shopper({
            body: JSON.stringify({ productSlug: slug, quantity: 1, deliveryCountry: "US" }),
            requestContext: { http: { method: "POST", path: "/cart/items" } },
          })
        )
      );
      assert.equal(rejected.statusCode, 400);
      assert.equal(rejected.body.error, `${GBO_NAME} is no longer available.`);
      assert.equal(fetches, 0);
      assert.equal((await stored(slug))?.published, false);
      assert.equal((await stored(slug))?.price, 50);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
