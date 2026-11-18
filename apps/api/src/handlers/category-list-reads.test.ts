import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { productInStorefrontCategory } from "@blossompot/shared";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-category-list-reads";
process.env.PRODUCTS_TABLE = "blossompot-products-category-list-reads";
process.env.CARTS_TABLE = "blossompot-carts-category-list-reads";
process.env.ORDERS_TABLE = "blossompot-orders-category-list-reads";

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

let listProducts: Handler;
let invalidateProductListCache: () => void;
let docClient: { send: (command: unknown) => Promise<unknown> };
let productKeys: {
  pk: (slug: string) => string;
  sk: () => string;
  gsi1pk: (category: string) => string;
  gsi1sk: (slug: string) => string;
};
let productsTable: string;
let memoryStore: {
  send: (command: { input: unknown; constructor: { name: string } }) => Promise<unknown>;
};

before(async () => {
  const db = await import("../lib/db");
  const memory = await import("../lib/memory-store");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  memoryStore = memory.memoryStore;
  const shared = await import("@blossompot/shared");
  productKeys = shared.productKeys;
  const products = await import("./products");
  listProducts = products.listProducts;
  invalidateProductListCache = products.invalidateProductListCache;
});

function resultOf(result: APIGatewayProxyResultV2): { statusCode: number; body: Record<string, unknown> } {
  if (typeof result === "string" || !result || typeof result.body !== "string") {
    throw new Error("Expected a JSON response");
  }
  return { statusCode: result.statusCode ?? 0, body: JSON.parse(result.body) as Record<string, unknown> };
}

function slugsOf(body: Record<string, unknown>): string[] {
  return ((body.products as Array<{ slug?: string }> | undefined) ?? []).map((product) => product.slug ?? "");
}

function row(slug: string, categorySlug: string, extra: Record<string, unknown> = {}) {
  return {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: slug,
    description: "Catalog row",
    price: 24,
    currency: "USD",
    categorySlug,
    images: ["https://cdn.example.com/rose.jpg"],
    inventory: 8,
    tags: [],
    published: true,
    updatedAt: "2026-10-14T00:00:00.000Z",
    createdAt: "2026-10-14T00:00:00.000Z",
    ...extra,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

function shopper(
  category: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEventV2 {
  return {
    headers: { "x-session-id": "category-list-reads", ...headers },
    queryStringParameters: { category, country: "US", postalCode: "92612" },
  } as unknown as APIGatewayProxyEventV2;
}

describe("category list reads stay cross-listed without unrelated writes", { concurrency: false }, () => {
  it("loads a cross-listed product from another partition and does not write unrelated catalog rows", async () => {
    await putProduct(
      row("cross-listed-personalized-cake", "cakes", {
        additionalCategorySlugs: ["personalized-gifts"],
        price: 24,
      })
    );
    await putProduct(row("plain-personalized-flower", "flowers"));
    invalidateProductListCache();

    const queries: QueryCommandInput[] = [];
    const written: Array<{ slug?: string; categorySlug?: string; additionalCategorySlugs?: string[] }> = [];
    const original = memoryStore.send;
    memoryStore.send = async (command) => {
      if (command.constructor.name === "QueryCommand") queries.push(command.input as QueryCommandInput);
      if (command.constructor.name === "TransactWriteCommand") {
        const items =
          (command.input as { TransactItems?: Array<{ Put?: { Item?: { slug?: string; categorySlug?: string; additionalCategorySlugs?: string[] } } }> })
            .TransactItems ?? [];
        for (const item of items) {
          if (item.Put?.Item?.categorySlug) written.push(item.Put.Item);
        }
      }
      return original(command);
    };

    try {
      const first = resultOf(await listProducts(shopper("personalized-gifts")));
      assert.equal(first.statusCode, 200);
      const products = (first.body.products as Array<{ slug?: string; price?: number }>) ?? [];
      const cross = products.find((product) => product.slug === "cross-listed-personalized-cake");
      assert.ok(cross);
      assert.equal(typeof cross.price, "number");
      assert.equal(products.some((product) => product.slug === "plain-personalized-flower"), false);
      assert.equal(first.body.location && (first.body.location as { countryCode?: string }).countryCode, "US");
      for (const item of written) {
        assert.equal(productInStorefrontCategory(item, "personalized-gifts"), true);
        assert.equal(item.slug === "plain-personalized-flower", false);
        assert.equal(item.slug === "cross-listed-personalized-cake", false);
      }
      const productQueries = queries.filter((query) => String(query.ExpressionAttributeValues?.[":pk"] ?? "").startsWith("CATEGORY#"));
      const primary = productQueries.filter((query) => query.ExpressionAttributeValues?.[":pk"] === "CATEGORY#personalized-gifts");
      const others = productQueries.filter((query) => query.ExpressionAttributeValues?.[":pk"] !== "CATEGORY#personalized-gifts");
      assert.equal(primary.length > 0, true);
      assert.equal(primary.every((query) => query.ProjectionExpression == null), true);
      assert.equal(others.length > 0, true);
      assert.equal(
        others.every((query) => query.ProjectionExpression === "slug, categorySlug, additionalCategorySlugs"),
        true
      );

      queries.length = 0;
      const second = slugsOf(resultOf(await listProducts(shopper("personalized-gifts"))).body);
      assert.equal(second.includes("cross-listed-personalized-cake"), true);
      assert.equal(
        queries.some((query) => String(query.ExpressionAttributeValues?.[":pk"] ?? "").startsWith("CATEGORY#")),
        false
      );
    } finally {
      memoryStore.send = original;
    }
  });

  it("returns the same related products and stops the stock read early", async () => {
    for (let index = 0; index <= 14; index += 1) {
      const slug = `birthday-rel-${String(index).padStart(2, "0")}`;
      await putProduct(
        row(slug, "birthday-gifts", {
          ...(index === 0 ? { inventory: 0 } : {}),
          ...(index === 1 ? { published: false } : {}),
          ...(index === 2 ? { deliveryCountries: ["GB"] } : {}),
        })
      );
    }
    invalidateProductListCache();

    const full = slugsOf(
      resultOf(
        await listProducts(
          shopper("birthday-gifts", {
            "x-blossompot-home-row": "1",
            "x-blossompot-listing-view": "card",
          })
        )
      ).body
    ).filter((slug) => slug.startsWith("birthday-rel-"));

    let commerceReads = 0;
    const original = memoryStore.send;
    memoryStore.send = async (command) => {
      if (
        command.constructor.name === "GetCommand" &&
        (command.input as { ProjectionExpression?: string }).ProjectionExpression === "published, slug, price, inventory"
      ) {
        commerceReads += 1;
      }
      return original(command);
    };
    let related: string[] = [];
    try {
      related = slugsOf(
        resultOf(
          await listProducts(
            shopper("birthday-gifts", {
              "x-blossompot-home-row": "1",
              "x-blossompot-listing-view": "card",
              "x-blossompot-related-limit": "5",
              "x-blossompot-related-exclude": "birthday-rel-03",
            })
          )
        ).body
      ).filter((slug) => slug.startsWith("birthday-rel-"));
    } finally {
      memoryStore.send = original;
    }

    const expected = full.filter((slug) => slug !== "birthday-rel-03").slice(0, 5);
    assert.deepEqual(related, expected);
    assert.equal(related.includes("birthday-rel-00"), false);
    assert.equal(related.includes("birthday-rel-01"), false);
    assert.equal(related.includes("birthday-rel-02"), false);
    assert.equal(related.includes("birthday-rel-03"), false);
    assert.equal(related.length, 5);
    assert.equal(commerceReads < 14, true);
    assert.equal(commerceReads <= 8, true);
  });
});
