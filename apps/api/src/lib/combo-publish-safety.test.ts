import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  FNP_IMPORT_TAG,
  catalogCountryKeys,
  catalogVendorKeys,
  generateComboDrafts,
  productKeys,
  vendorCoverageKeys,
  type ComboSourceProduct,
  type VendorDisplaySource,
} from "@blossompot/shared";
import { COMBO_PUBLISH_ACCOUNT } from "./combo-publish-config";
import {
  assertComboPublishAccount,
  ComboPublishConfigError,
  resolveComboPublishConfig,
  runExplicitComboPublish,
} from "./combo-publish-run";

const PRODUCTS_TABLE = "blossompot-products-combo-safety-test";
const CONFIG_TABLE = "blossompot-config-combo-safety-test";

process.env.USE_MEMORY_DB = "true";
process.env.ENVIRONMENT = "local";
process.env.PRODUCTS_TABLE = PRODUCTS_TABLE;
process.env.CONFIG_TABLE = CONFIG_TABLE;
process.env.GBO_STOREFRONT_ENABLED = "false";
delete process.env.DYNAMODB_ENDPOINT;
delete process.env.AWS_REGION;

type StoreModule = typeof import("./combo-store");

let store: StoreModule;
let docClient: { send: (command: unknown) => Promise<{ Item?: Record<string, unknown> }> };
let productsTable: string;
let configTable: string;

before(async () => {
  store = await import("./combo-store");
  const db = await import("./db");
  docClient = db.docClient as typeof docClient;
  productsTable = db.PRODUCTS_TABLE;
  configTable = db.CONFIG_TABLE;
  assert.equal(productsTable, PRODUCTS_TABLE);
  assert.equal(configTable, CONFIG_TABLE);
});

function memoryEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "true",
    ENVIRONMENT: "local",
    PRODUCTS_TABLE,
    CONFIG_TABLE,
    ...overrides,
  };
}

function devEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "false",
    ENVIRONMENT: "dev",
    PRODUCTS_TABLE: "blossompot-products-dev",
    CONFIG_TABLE: "blossompot-config-dev",
    AWS_REGION: "us-east-1",
    ...overrides,
  };
}

function prodEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    USE_MEMORY_DB: "false",
    ENVIRONMENT: "prod",
    PRODUCTS_TABLE: "blossompot-products-prod",
    CONFIG_TABLE: "blossompot-config-prod",
    AWS_REGION: "us-east-1",
    ...overrides,
  };
}

function catalogProduct(
  slug: string,
  categorySlug: string,
  name: string,
  vendorSlug?: string,
  extras: Record<string, unknown> = {}
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
    ...extras,
  };
}

async function putProduct(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: productsTable, Item: item }));
}

async function putVendor(
  slug: string,
  name: string,
  enabled: boolean,
  deliveryCountries: string[],
  displayOrder: number
) {
  await docClient.send(
    new PutCommand({
      TableName: configTable,
      Item: {
        PK: catalogVendorKeys.pk(slug),
        SK: catalogVendorKeys.sk(),
        vendorSlug: slug,
        vendorName: name,
        enabled,
        integrationType: "owned",
        deliveryCountries,
        displayOrder,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    })
  );
}

describe("storefront-compatible combo publishing", { concurrency: false }, () => {
  it("preserves occasion and festival pairing rules", () => {
    const vendors: VendorDisplaySource[] = [
      { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 },
      { vendorSlug: "orange-county", vendorName: "Orange County", displayOrder: 2 },
    ];
    const occasion = generateComboDrafts(
      [
        { slug: "flower", name: "Flower", categorySlug: "flowers", vendorSlug: "blossompot", occasion: "anniversary" },
        {
          slug: "cake",
          name: "Cake",
          categorySlug: "cakes",
          vendorSlug: "blossompot",
          additionalCategorySlugs: ["valentines-day-gifts"],
        },
        { slug: "hamper", name: "Hamper", categorySlug: "gift-hampers", vendorSlug: "blossompot" },
      ] satisfies ComboSourceProduct[],
      vendors,
      10
    );
    assert.deepEqual(
      occasion.map((draft) => draft.productSlugs),
      [
        ["cake", "hamper"],
        ["flower", "hamper"],
      ]
    );

    const festival = generateComboDrafts(
      [
        { slug: "rakhi-box", name: "Rakhi", categorySlug: "rakhi-hampers", vendorSlug: "orange-county" },
        { slug: "roses", name: "Roses", categorySlug: "flowers", vendorSlug: "orange-county" },
        { slug: "single-thread", name: "Thread", categorySlug: "single-rakhi", vendorSlug: "orange-county" },
      ] satisfies ComboSourceProduct[],
      vendors,
      10
    );
    assert.deepEqual(festival.map((draft) => draft.productSlugs), [["rakhi-box", "single-thread"]]);
  });

  it("fails closed for the account, region, tables, country, and production confirmation", async () => {
    assert.throws(
      () => resolveComboPublishConfig(devEnv(), ["node", "publish-combos", "--publish"]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(devEnv(), ["node", "publish-combos", "--publish", "--country", "ZZ"]),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(devEnv({ AWS_REGION: "eu-west-1" }), ["node", "publish-combos", "--country", "US"]),
      ComboPublishConfigError
    );
    assert.throws(
      () =>
        resolveComboPublishConfig(
          devEnv({ PRODUCTS_TABLE: "blossompot-products-prod", CONFIG_TABLE: "blossompot-config-prod" }),
          ["node", "publish-combos", "--country", "US"]
        ),
      ComboPublishConfigError
    );
    assert.throws(
      () => resolveComboPublishConfig(prodEnv(), ["node", "publish-combos", "--publish", "--country", "US"]),
      /confirm-production/
    );
    const prodDryRun = resolveComboPublishConfig(prodEnv(), ["node", "publish-combos", "--country", "US"]);
    assert.equal(prodDryRun.publish, false);
    const prodWrite = resolveComboPublishConfig(prodEnv(), [
      "node",
      "publish-combos",
      "--publish",
      "--confirm-production",
      "--country",
      "US",
    ]);
    assert.equal(prodWrite.publish, true);
    assert.throws(() => assertComboPublishAccount(prodWrite, "000000000000"), ComboPublishConfigError);
    assert.doesNotThrow(() => assertComboPublishAccount(prodWrite, COMBO_PUBLISH_ACCOUNT));

    const previous = {
      USE_MEMORY_DB: process.env.USE_MEMORY_DB,
      ENVIRONMENT: process.env.ENVIRONMENT,
      PRODUCTS_TABLE: process.env.PRODUCTS_TABLE,
      CONFIG_TABLE: process.env.CONFIG_TABLE,
      AWS_REGION: process.env.AWS_REGION,
    };
    Object.assign(process.env, devEnv());
    try {
      await assert.rejects(
        () => runExplicitComboPublish({ env: process.env, argv: ["node", "publish-combos", "--country", "US"] }),
        ComboPublishConfigError
      );
    } finally {
      process.env.USE_MEMORY_DB = previous.USE_MEMORY_DB;
      process.env.ENVIRONMENT = previous.ENVIRONMENT;
      process.env.PRODUCTS_TABLE = previous.PRODUCTS_TABLE;
      process.env.CONFIG_TABLE = previous.CONFIG_TABLE;
      if (previous.AWS_REGION == null) delete process.env.AWS_REGION;
      else process.env.AWS_REGION = previous.AWS_REGION;
    }
    assert.equal((await store.queryCombos()).length, 0);
  });

  it("discovers vendors from the catalog and keeps the per-vendor cap", async () => {
    await putVendor("florist", "Florist", true, ["US"], 1);
    await putVendor("bakery", "Bakery", true, ["US"], 2);
    await putVendor("closed-shop", "Closed Shop", false, ["US"], 3);
    await putVendor("zip-shop", "Zip Shop", true, ["US"], 4);
    await putVendor("gb-pantry", "GB Pantry", true, ["GB"], 5);
    await docClient.send(
      new PutCommand({
        TableName: configTable,
        Item: {
          PK: vendorCoverageKeys.pk("zip-shop"),
          SK: vendorCoverageKeys.areaSk("zip-10001"),
          areaId: "zip-10001",
          vendorSlug: "zip-shop",
          countryCode: "US",
          postalCode: "10001",
          scope: "POSTAL_CODE",
          ruleType: "ALLOW",
          isActive: true,
          priority: 10,
        },
      })
    );

    const floristCategories = ["bouquets", "cakes", "hampers", "plants"];
    for (const category of floristCategories) {
      for (const number of [1, 2, 3]) {
        const slug = `florist-${category}-${number}`;
        await putProduct(catalogProduct(slug, category, `${category} ${number}`, "florist"));
      }
    }
    await putProduct(catalogProduct("undimensioned-plant", "plants", "Undimensioned Plant", "florist"));
    await putProduct(catalogProduct("bakery-cake", "cakes", "Bakery Cake", "bakery"));
    await putProduct(catalogProduct("bakery-hamper", "hampers", "Bakery Hamper", "bakery"));
    await putProduct(catalogProduct("closed-cake", "cakes", "Closed Cake", "closed-shop"));
    await putProduct(catalogProduct("closed-flower", "flowers", "Closed Flower", "closed-shop"));
    await putProduct(catalogProduct("zip-cake", "cakes", "Zip Cake", "zip-shop"));
    await putProduct(catalogProduct("zip-flower", "flowers", "Zip Flower", "zip-shop"));
    await putProduct(catalogProduct("oc-roses", "flowers", "OC Roses", "orange-county"));
    await putProduct(catalogProduct("oc-cake", "cakes", "OC Cake", "orange-county"));
    await putProduct(catalogProduct("plain-rose", "flowers", "Plain Rose"));
    await putProduct(catalogProduct("plain-cake", "cakes", "Plain Cake"));
    await putProduct(
      catalogProduct("tagged-basket", "hampers", "Tagged Basket", undefined, { tags: [FNP_IMPORT_TAG] })
    );
    await putProduct(catalogProduct("fnp-mug", "mugs", "FNP Mug", "fnp"));
    await putProduct(catalogProduct("collision-cake", "cakes", "Collision Cake", "collision-shop"));
    await putProduct(catalogProduct("collision-roses", "flowers", "Collision Roses", "collision-shop"));
    await putVendor("collision-shop", "Collision Shop", true, ["US"], 6);
    await putProduct({
      ...catalogProduct("collision-cake-collision-roses", "plants", "Stored product", "collision-shop", {
        inventory: 0,
      }),
      name: "Stored product",
    });
    await putProduct(
      catalogProduct("overseas-basket", "hampers", "Overseas Basket", "gift-baskets-overseas", {
        internationalDelivery: true,
      })
    );
    await putProduct(catalogProduct("gb-tea", "hampers", "GB Tea", "gb-pantry", { deliveryCountries: ["GB"] }));
    await putProduct(catalogProduct("gb-biscuit", "cakes", "GB Biscuit", "gb-pantry", { deliveryCountries: ["GB"] }));
    await putProduct({ ...catalogProduct("hidden-draft", "cakes", "Hidden Draft", "florist"), published: false });
    await putProduct(catalogProduct("sample-orchid", "plants", "Sample Orchid", "florist"));

    await assert.rejects(
      () =>
        runExplicitComboPublish({
          env: memoryEnv(),
          argv: ["node", "publish-combos", "--country", "FR"],
        }),
      /not an enabled shopping country/
    );
    assert.equal((await store.queryCombos()).length, 0);

    const dryRun = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--country", "US"],
    });
    assert.equal(dryRun.mode, "dry-run");
    assert.equal(dryRun.country, "US");
    assert.equal(dryRun.accountId, "local");
    assert.equal(dryRun.productsTable, PRODUCTS_TABLE);
    assert.equal(dryRun.configTable, CONFIG_TABLE);
    assert.equal((await store.queryCombos()).length, 0);

    const byVendor = dryRun.candidateCombosByVendor;
    assert.equal(byVendor.florist, 10);
    assert.equal(byVendor.bakery, 1);
    assert.equal(byVendor.blossompot, 1);
    assert.equal(byVendor.fnp, 1);
    assert.equal(byVendor["collision-shop"], 1);
    assert.equal(byVendor["closed-shop"], undefined);
    assert.equal(byVendor["orange-county"], undefined);
    assert.equal(byVendor["zip-shop"], undefined);
    assert.equal(Object.values(byVendor).reduce((sum, count) => sum + count, 0), dryRun.candidates.length);
    assert.notEqual(dryRun.candidates.length, 20);
    assert.equal(dryRun.vendorsConsidered >= 4, true);
    assert.equal(dryRun.candidates.some((combo) => combo.components.some((part) => part.slug === "undimensioned-plant")), true);
    assert.equal(dryRun.candidates.some((combo) => combo.components.some((part) => part.slug.startsWith("oc-"))), false);
    assert.equal(dryRun.candidates.some((combo) => combo.components.some((part) => part.slug.startsWith("zip-"))), false);
    assert.equal(dryRun.candidates.some((combo) => combo.components.some((part) => part.slug.startsWith("closed-"))), false);
    assert.equal(dryRun.candidates.some((combo) => combo.components.some((part) => part.slug.startsWith("gb-"))), false);
    const plain = dryRun.candidates.find((combo) => combo.resolvedVendorSlug === "blossompot");
    assert.deepEqual(
      plain?.components.map((part) => part.resolvedVendorSlug),
      ["blossompot", "blossompot"]
    );
    assert.equal(plain?.components.some((part) => part.slug === "plain-rose"), true);
    const reasons = new Map(dryRun.exclusions.map((row) => [row.reason, row.count]));
    assert.equal((reasons.get("vendor_disabled") ?? 0) >= 2, true);
    assert.equal((reasons.get("no_matching_service_area") ?? 0) >= 4, true);
    assert.equal((reasons.get("country-not-visible") ?? 0) >= 2, true);
    assert.equal((reasons.get("gbo-hidden") ?? 0) >= 1, true);
    assert.equal((reasons.get("unpublished") ?? 0) >= 1, true);
    assert.equal((reasons.get("not-storefront-visible") ?? 0) >= 1, true);
    assert.equal(dryRun.skips.some((skip) => skip.slug === "collision-cake-collision-roses" && skip.reason === "product-slug"), true);
    assert.equal(dryRun.expectedWrites, dryRun.candidates.length - dryRun.skips.length);

    await store.insertCombo(
      {
        slug: "bakery-cake-bakery-hamper",
        name: "Admin Bakery Pair",
        description: "Edited by admin",
        productSlugs: ["bakery-cake", "bakery-hamper"],
        sortOrder: 4,
      },
      "2026-01-01T00:00:00.000Z"
    );
    const secondDryRun = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--country", "US"],
    });
    assert.equal(
      secondDryRun.skips.some((skip) => skip.slug === "bakery-cake-bakery-hamper" && skip.reason === "existing-combo"),
      true
    );
    assert.equal(secondDryRun.expectedWrites, dryRun.expectedWrites - 1);
    assert.equal((await store.queryCombos()).length, 1);

    const published = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--publish", "--country", "US"],
    });
    assert.equal(published.mode, "publish");
    assert.equal(published.inserted, secondDryRun.expectedWrites);
    const saved = (await store.queryCombos()).find((combo) => combo.slug === "bakery-cake-bakery-hamper");
    assert.equal(saved?.name, "Admin Bakery Pair");
    assert.equal(saved?.description, "Edited by admin");
    const storedProduct = await docClient.send(
      new GetCommand({
        TableName: productsTable,
        Key: { PK: productKeys.pk("collision-cake-collision-roses"), SK: productKeys.sk() },
      })
    );
    assert.equal(storedProduct.Item?.name, "Stored product");
    const blockedCombo = await docClient.send(
      new GetCommand({
        TableName: productsTable,
        Key: { PK: "COMBO#collision-cake-collision-roses", SK: "META" },
      })
    );
    assert.equal(blockedCombo.Item, undefined);
    const plant = await docClient.send(
      new GetCommand({
        TableName: productsTable,
        Key: { PK: productKeys.pk("undimensioned-plant"), SK: productKeys.sk() },
      })
    );
    assert.equal(plant.Item?.weight, undefined);
    assert.equal(
      (await store.queryCombos()).some((combo) => combo.productSlugs.includes("undimensioned-plant")),
      true
    );

    await docClient.send(
      new PutCommand({
        TableName: configTable,
        Item: {
          PK: catalogCountryKeys.pk,
          SK: catalogCountryKeys.sk,
          countries: [
            { countryCode: "US", enabled: true },
            { countryCode: "GB", enabled: true },
          ],
          defaultCountry: "US",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      })
    );
    const britain = await runExplicitComboPublish({
      env: memoryEnv(),
      argv: ["node", "publish-combos", "--country", "GB"],
    });
    assert.equal(britain.mode, "dry-run");
    assert.equal(britain.country, "GB");
    assert.deepEqual(
      britain.candidates.map((combo) => combo.components.map((part) => part.slug)),
      [["gb-biscuit", "gb-tea"]]
    );
    assert.equal(britain.candidateCombosByVendor["gb-pantry"], 1);
    assert.equal((await store.queryCombos()).some((combo) => combo.slug === "gb-biscuit-gb-tea"), false);
  });
});
