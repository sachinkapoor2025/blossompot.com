import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.DEV_AUTH_ENABLED = "true";
process.env.GBO_STOREFRONT_ENABLED = "false";
process.env.CONFIG_TABLE = "blossompot-config-additional-category-test";
process.env.PRODUCTS_TABLE = "blossompot-products-additional-category-test";
process.env.CARTS_TABLE = "blossompot-carts-additional-category-test";
process.env.ORDERS_TABLE = "blossompot-orders-additional-category-test";

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

before(async () => {
  const db = await import("../lib/db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
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

function categoryList(category: string) {
  return listProducts({
    headers: { "x-session-id": "additional-category-shopper" },
    queryStringParameters: { category, country: "US", postalCode: "92612" },
  } as unknown as APIGatewayProxyEventV2);
}

describe("category pages include additional category assignments", { concurrency: false }, () => {
  it("lists an assigned bouquet on Anniversary and Valentine's and a cake on its occasion", async () => {
    await putProduct(
      row("extra-anniversary-bouquet", "flower-bouquets", { additionalCategorySlugs: ["anniversary-gifts"] })
    );
    await putProduct(
      row("extra-valentine-bouquet", "flower-bouquets", { additionalCategorySlugs: ["valentines-day-gifts"] })
    );
    await putProduct(row("extra-anniversary-cake", "cakes", { additionalCategorySlugs: ["anniversary-gifts"] }));
    await putProduct(row("extra-unrelated-tulip", "flowers"));
    invalidateProductListCache();

    const anniversary = slugsOf(resultOf(await categoryList("anniversary-gifts")).body);
    assert.equal(anniversary.includes("extra-anniversary-bouquet"), true);
    assert.equal(anniversary.includes("extra-anniversary-cake"), true);
    assert.equal(anniversary.includes("extra-valentine-bouquet"), false);
    assert.equal(anniversary.includes("extra-unrelated-tulip"), false);

    const valentines = slugsOf(resultOf(await categoryList("valentines-day-gifts")).body);
    assert.equal(valentines.includes("extra-valentine-bouquet"), true);
    assert.equal(valentines.includes("extra-anniversary-bouquet"), false);
  });

  it("keeps an unpublished assigned product off the category page", async () => {
    await putProduct(
      row("extra-hidden-bouquet", "flower-bouquets", {
        additionalCategorySlugs: ["anniversary-gifts"],
        published: false,
      })
    );
    await putProduct(
      row("extra-sold-out-cake", "cakes", {
        additionalCategorySlugs: ["anniversary-gifts"],
        inventory: 0,
      })
    );
    invalidateProductListCache();
    const anniversary = slugsOf(resultOf(await categoryList("anniversary-gifts")).body);
    assert.equal(anniversary.includes("extra-hidden-bouquet"), false);
    assert.equal(anniversary.includes("extra-sold-out-cake"), false);
  });

  it("still adds a Rakhi hamper by its additional category and does not broaden the hamper page", async () => {
    await putProduct(
      row("extra-rakhi-on-flowers", "rakhi-hampers", { additionalCategorySlugs: ["flowers"] })
    );
    await putProduct(
      row("extra-flower-on-hampers", "flowers", { additionalCategorySlugs: ["rakhi-hampers"] })
    );

    await putProduct(
      row("extra-birthday-bouquet", "flower-bouquets", { additionalCategorySlugs: ["birthday-gifts"] })
    );
    invalidateProductListCache();

    const flowers = slugsOf(resultOf(await categoryList("flowers")).body);
    assert.equal(flowers.includes("extra-rakhi-on-flowers"), true);
    assert.equal(flowers.includes("extra-flower-on-hampers"), true);

    const hampers = slugsOf(resultOf(await categoryList("rakhi-hampers")).body);
    assert.equal(hampers.includes("extra-rakhi-on-flowers"), true);
    assert.equal(hampers.includes("extra-flower-on-hampers"), false);

    const birthday = slugsOf(resultOf(await categoryList("birthday-gifts")).body);
    assert.equal(birthday.filter((slug) => slug === "extra-birthday-bouquet").length, 1);
  });

  it("lists assigned birthday flowers, bouquets, and cakes once and keeps the other filters", async () => {
    await putProduct(row("birthday-flower", "flowers", { additionalCategorySlugs: ["birthday-gifts"] }));
    await putProduct(row("birthday-bouquet", "flower-bouquets", { additionalCategorySlugs: ["birthday-gifts"] }));
    await putProduct(row("birthday-cake", "cakes", { additionalCategorySlugs: ["birthday-gifts"] }));
    await putProduct(row("plain-flower", "flowers"));
    await putProduct(row("plain-bouquet", "flower-bouquets", { additionalCategorySlugs: ["flowers"] }));
    await putProduct(
      row("unpublished-birthday-flower", "flowers", {
        additionalCategorySlugs: ["birthday-gifts"],
        published: false,
      })
    );
    await putProduct(
      row("sold-out-birthday-cake", "cakes", {
        additionalCategorySlugs: ["birthday-gifts"],
        inventory: 0,
      })
    );
    await putProduct(row("mothers-flower", "flowers", { additionalCategorySlugs: ["mothers-day-gifts"] }));
    await putProduct(row("wedding-bouquet", "flower-bouquets", { additionalCategorySlugs: ["wedding-gifts"] }));
    await putProduct(row("mothers-cake", "cakes", { additionalCategorySlugs: ["mothers-day-gifts"] }));
    invalidateProductListCache();

    const birthday = slugsOf(resultOf(await categoryList("birthday-gifts")).body);
    for (const slug of ["birthday-flower", "birthday-bouquet", "birthday-cake", "extra-birthday-bouquet"]) {
      assert.equal(birthday.filter((value) => value === slug).length, 1, slug);
    }
    for (const slug of [
      "plain-flower",
      "plain-bouquet",
      "unpublished-birthday-flower",
      "sold-out-birthday-cake",
      "mothers-flower",
      "wedding-bouquet",
      "extra-unrelated-tulip",
    ]) {
      assert.equal(birthday.includes(slug), false, slug);
    }

    const mothers = slugsOf(resultOf(await categoryList("mothers-day-gifts")).body);
    assert.equal(mothers.includes("mothers-flower"), false);
    assert.equal(mothers.filter((slug) => slug === "mothers-cake").length, 1);

    const wedding = slugsOf(resultOf(await categoryList("wedding-gifts")).body);
    assert.equal(wedding.includes("wedding-bouquet"), false);

    const anniversary = slugsOf(resultOf(await categoryList("anniversary-gifts")).body);
    assert.equal(anniversary.filter((slug) => slug === "extra-anniversary-bouquet").length, 1);
    assert.equal(anniversary.includes("birthday-flower"), false);

    const valentines = slugsOf(resultOf(await categoryList("valentines-day-gifts")).body);
    assert.equal(valentines.filter((slug) => slug === "extra-valentine-bouquet").length, 1);
    assert.equal(valentines.includes("birthday-bouquet"), false);
  });
});
