import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FNP_CATEGORY_MAP,
  FNP_IMPORT_COMMIT_BATCH_SIZE,
  FNP_IMPORT_TAG,
  buildFnpProductDraft,
  fnpImportWriteBlocked,
  fnpRakhiTargetsStaySeparate,
  fnpSourceKey,
  imageExtensionForContentType,
  mapFnpCategory,
  planFnpImport,
  type FnpExistingProduct,
  type FnpExistingSource,
} from "./fnp-import";
import { isProductSearchIndexable, isProductStorefrontVisible } from "./product-images";

const PRESENT = new Set([
  "flowers",
  "flower-bouquets",
  "cakes",
  "gift-hampers",
  "plants",
  "personalized-gifts",
  "celebration-gifts",
  "birthday-gifts",
  "anniversary-gifts",
  "same-day-gifts",
  "valentines-day-gifts",
  "mothers-day-gifts",
  "wedding-gifts",
]);

function row(overrides: Record<string, unknown> = {}) {
  return {
    "Product Name": "Petite Midnight Chocolate Cake",
    "Final Category": "Combos",
    "List Price ($)": 49.99,
    "MRP ($)": 49.99,
    "Product URL": "https://www.fnp.com/usa/gift/petite-midnight-chocolate-cake",
    "Image URL": "https://static-assets-prod.fnp.com/images/m/petite.jpg",
    "Classification Confidence": 96,
    ...overrides,
  };
}

function plan(
  rows: Record<string, unknown>[],
  extras?: {
    categoriesPresent?: ReadonlySet<string>;
    existingSources?: ReadonlyMap<string, FnpExistingSource>;
    existingProducts?: ReadonlyMap<string, FnpExistingProduct>;
    categoryNames?: ReadonlyMap<string, string>;
    categoryOverrides?: Parameters<typeof planFnpImport>[0]["categoryOverrides"];
  }
) {
  return planFnpImport({
    rows,
    categoriesPresent: extras?.categoriesPresent ?? PRESENT,
    existingSources: extras?.existingSources ?? new Map(),
    existingProducts: extras?.existingProducts ?? new Map(),
    categoryNames: extras?.categoryNames,
    categoryOverrides: extras?.categoryOverrides,
  });
}

describe("FNP category map", () => {
  it("moves the eight single-cake products onto cakes", () => {
    const names = [
      "Petite Midnight Chocolate Cake",
      "Double Chocolate Cake With Personalization",
      "Anniversary Triple Chocolate Enrobed Brownie Cake",
      "Triple Chocolate Cheesecake",
      "Best Dad Tempting Chocolate Cake",
      "Belgian Chocolate Delicious Cake Pops",
      "Personalised Tempting Chocolate Sheet Cake",
      "Personalised Chocolate Chip Sheet Cake",
    ];
    for (const name of names) {
      assert.equal(mapFnpCategory("Combos", name)?.slug, "cakes");
    }
    assert.equal(mapFnpCategory("Combos", "Ferrero Rocher And Chocolate Cake")?.slug, "cakes");
  });

  it("reuses existing catalog slugs and bouquet spelling variants", () => {
    assert.equal(mapFnpCategory("Personalised Gifts", "Custom Frame")?.slug, "personalized-gifts");
    assert.equal(mapFnpCategory("Mugs", "Best Bro Mug")?.slug, "personalized-gifts");
    assert.equal(mapFnpCategory("Personalised Mugs", "Mr N Mrs Always Right Karwachauth Gift")?.slug, "personalized-gifts");
    assert.equal(mapFnpCategory("Soft Toys", "Honey Teddy")?.slug, "gift-hampers");
    assert.equal(mapFnpCategory("Jewellery", "Love Necklace")?.slug, "personalized-gifts");
    assert.equal(mapFnpCategory("Cup Cakes", "Delicious Valentines Day Cupcakes")?.slug, "cakes");
    assert.equal(mapFnpCategory("Combos", "Grand Vanilla Cake")?.slug, "cakes");
    assert.equal(mapFnpCategory("Gift Hampers", "Wine Basket")?.slug, "gift-hampers");
    assert.equal(mapFnpCategory("Wine Hampers", "Cabernet Set")?.slug, "gift-hampers");
    assert.equal(mapFnpCategory("Home Decor", "Divine Laxmi Ganesh Idol")?.slug, "personalized-gifts");
    assert.equal(mapFnpCategory("Flowers", "Pink Surprise Bouquet Deluxe")?.slug, "flower-bouquets");
    assert.equal(mapFnpCategory("Buequet", "Florist Choice Bouquet")?.slug, "flower-bouquets");
    assert.equal(mapFnpCategory("", "Florist Choice Bouquet")?.slug, "flower-bouquets");
    assert.equal(fnpRakhiTargetsStaySeparate(), true);
    assert.equal(mapFnpCategory("Rakhi", "Relax N Recharge Rakhi")?.slug, "gift-hampers");
    assert.equal(mapFnpCategory("Rakhi", "Relax N Recharge Rakhi")?.existing, true);
    assert.equal(mapFnpCategory("Rakhi With Chocolates", "Rakhi Treat")?.slug, "gift-hampers");
    assert.notEqual(mapFnpCategory("Rakhi With Sweets", "Rakhi Treat")?.slug, "rakhi-combo");
    assert.equal(mapFnpCategory("Combos", "Relax N Recharge Rakhi")?.slug, "gift-hampers");
    assert.ok(FNP_CATEGORY_MAP.every((entry) => entry.existing));
  });
});

describe("FNP import plan", () => {
  it("builds an unpublished draft and sets compare-at only when MRP is higher", () => {
    const higher = plan([
      row({
        "Classification Confidence": 86,
        "Product Name": "Serene Sweetness Parent",
        "Final Category": "Flowers",
        "Product URL": "https://www.fnp.com/usa/gift/serene-sweetness-parent",
        "List Price ($)": 554.49,
        "MRP ($)": 600,
      }),
    ]);
    const planned = higher.rows[0]!;
    assert.equal(planned.status, "ready");
    assert.equal(planned.categorySlug, "flowers");
    assert.equal(planned.compareAtPrice, 600);
    assert.ok(planned.warnings.some((warning) => warning.includes("confidence")));
    assert.ok(planned.warnings.some((warning) => warning.includes("parent")));
    assert.ok(planned.warnings.some((warning) => warning.includes("$500")));

    const draft = buildFnpProductDraft({
      row: planned,
      batchId: "batch-test-1",
      imageUrl: "https://cdn.example.com/serene.webp",
      timestamp: "2026-10-03T00:00:00.000Z",
    });
    assert.equal(draft.sku, planned.slug);
    assert.equal(draft.published, false);
    assert.equal(draft.indexable, false);
    assert.equal(draft.inventory, 0);
    assert.equal(draft.description, "");
    assert.equal(draft.currency, "USD");
    assert.deepEqual(draft.tags, [FNP_IMPORT_TAG]);
    assert.equal(draft.internationalDelivery, undefined);
    assert.equal(draft.vendorSlug, undefined);
    assert.equal(isProductStorefrontVisible(draft), false);
    assert.equal(isProductSearchIndexable(draft), false);

    const equal = plan([row()]);
    assert.equal(equal.rows[0]?.compareAtPrice, undefined);
    assert.equal(equal.rows[0]?.categorySlug, "cakes");

    const below = plan([row({ "MRP ($)": 10 })]);
    assert.equal(below.rows[0]?.status, "blocked");
  });

  it("blocks unknown categories, bad URLs, and missing existing categories", () => {
    const unknown = plan([row({ "Final Category": "Mystery", "Product Name": "Blue Vase" })]);
    assert.equal(unknown.rows[0]?.status, "blocked");

    const badUrl = plan([row({ "Product URL": "https://example.com/gift/rose" })]);
    assert.equal(badUrl.rows[0]?.status, "blocked");
    assert.equal(fnpSourceKey("https://www.fnp.com/usa/gift/red-rose"), "red-rose");

    const missingCakes = plan([row()], { categoriesPresent: new Set(["flowers"]) });
    assert.equal(missingCakes.rows[0]?.status, "blocked");
    assert.equal(missingCakes.rows[0]?.categoryAction, "missing");

    const reuseHampers = plan(
      [
        row({
          "Product Name": "Relax N Recharge Rakhi",
          "Final Category": "Combos",
          "Product URL": "https://www.fnp.com/usa/gift/relax-n-recharge-rakhi",
        }),
      ],
      { categoriesPresent: new Set(["cakes", "gift-hampers"]) }
    );
    assert.equal(reuseHampers.rows[0]?.status, "ready");
    assert.equal(reuseHampers.rows[0]?.categoryAction, "reuse");
    assert.equal(reuseHampers.rows[0]?.categorySlug, "gift-hampers");
    assert.deepEqual(reuseHampers.categoriesToCreate, []);
  });

  it("detects duplicate FNP URLs and refuses slug collisions", () => {
    const duplicated = plan([
      row(),
      row({ "List Price ($)": 10 }),
    ]);
    assert.equal(duplicated.rows[0]?.status, "ready");
    assert.equal(duplicated.rows[1]?.status, "duplicate");

    const imported = plan([row()], {
      existingSources: new Map([["petite-midnight-chocolate-cake", { productSlug: "petite-midnight-chocolate-cake" }]]),
    });
    assert.equal(imported.rows[0]?.status, "duplicate");

    const owned = plan([row()], {
      existingProducts: new Map([["petite-midnight-chocolate-cake", { sourceUrl: "https://www.fnp.com/usa/gift/some-other-cake" }]]),
    });
    assert.equal(owned.rows[0]?.status, "conflict");

    const unrelated = plan(
      [
        row({
          "Product Name": "Red Rose Bouquet",
          "Final Category": "Flowers",
          "Product URL": "https://www.fnp.com/usa/gift/red-rose-bouquet",
        }),
      ],
      { existingProducts: new Map([["red-rose-bouquet", {}]]) }
    );
    assert.equal(unrelated.rows[0]?.status, "conflict");
    assert.match(unrelated.rows[0]?.errors.join(" ") ?? "", /will not overwrite/);
  });

  it("uses the BlossomPot listing price as the selling price and leaves compare-at empty", () => {
    const listed = plan([
      row({
        "List Price ($)": "",
        "MRP ($)": "",
        "Listing Price for BlossomPot ($)": 75.41,
        "Product Name": "Perfectly Pastel Premium",
        "Final Category": "Gift Hampers",
        "Product URL": "https://www.fnp.com/usa/gift/perfectly-pastel-premium",
      }),
    ]);
    const planned = listed.rows[0]!;
    assert.equal(planned.status, "ready");
    assert.equal(planned.price, 75.41);
    assert.equal(planned.compareAtPrice, undefined);
    assert.equal(planned.categorySlug, "gift-hampers");
    const draft = buildFnpProductDraft({
      row: planned,
      batchId: "batch-listing-price",
      imageUrl: "https://cdn.example.com/pastel.webp",
      timestamp: "2026-10-03T00:00:00.000Z",
    });
    assert.equal(draft.price, 75.41);
    assert.equal(draft.compareAtPrice, undefined);
    assert.equal(draft.sku, "perfectly-pastel-premium");
    assert.equal(draft.inventory, 0);
    assert.equal(draft.published, false);
  });

  it("maps Rakhi workbook rows onto the existing Gift Hampers category", () => {
    const names = [
      "Relax N Recharge Rakhi",
      "Rakhi for the Modern Man",
      "Power Fuel Rakhi",
      "Fit N Festive Rakhi",
      "Luxury Dubai Rakhi",
      "Travel Companion Rakhi",
      "Signature Style Rakhi",
    ];
    const planned = plan(
      names.map((name, index) =>
        row({
          "Product Name": name,
          "Final Category": "Rakhi",
          "List Price ($)": 40 + index,
          "MRP ($)": "",
          "Product URL": `https://www.fnp.com/usa/gift/rakhi-${index + 1}`,
        })
      )
    );
    assert.equal(planned.ready, 7);
    assert.equal(planned.blocked, 0);
    assert.deepEqual(planned.categoriesToCreate, []);
    for (const plannedRow of planned.rows) {
      assert.equal(plannedRow.status, "ready");
      assert.equal(plannedRow.categorySlug, "gift-hampers");
      assert.equal(plannedRow.categoryAction, "reuse");
    }
  });

  it("blocks a missing name, an invalid price, and a missing image", () => {
    const nameless = plan([row({ "Product Name": "  " })]);
    assert.equal(nameless.rows[0]?.status, "blocked");
    assert.match(nameless.rows[0]?.errors.join(" ") ?? "", /Product name is required/);

    for (const price of [0, -5, "free"]) {
      const invalid = plan([row({ "List Price ($)": price })]);
      assert.equal(invalid.rows[0]?.status, "blocked");
      assert.match(invalid.rows[0]?.errors.join(" ") ?? "", /List price/);
    }

    const noImage = plan([row({ "Image URL": "" })]);
    assert.equal(noImage.rows[0]?.status, "blocked");
    assert.match(noImage.rows[0]?.errors.join(" ") ?? "", /Image URL is required/);

    const insecure = plan([row({ "Image URL": "http://static-assets-prod.fnp.com/images/m/petite.jpg" })]);
    assert.equal(insecure.rows[0]?.status, "blocked");
    assert.match(insecure.rows[0]?.errors.join(" ") ?? "", /https/);
  });

  it("prefers Final Category and Image URL over earlier columns, and keeps S. No as a reference", () => {
    const mixed = plan([
      {
        "S. No": 18,
        Category: "Flowers",
        "Final Category": "Cakes",
        Image: "not-a-url",
        "Image URL": "https://static-assets-prod.fnp.com/images/m/vanilla.jpg",
        "Product Name": "Grand Vanilla Cake",
        "List Price ($)": 40,
        "MRP ($)": 40,
        "Product URL": "https://www.fnp.com/usa/gift/grand-vanilla-cake",
      },
    ]);
    assert.equal(mixed.rows[0]?.status, "ready");
    assert.equal(mixed.rows[0]?.categorySlug, "cakes");
    assert.equal(mixed.rows[0]?.imageUrl, "https://static-assets-prod.fnp.com/images/m/vanilla.jpg");
    assert.equal(mixed.rows[0]?.sourceSerial, "18");

    const imageColumn = plan([
      row({
        "Image URL": "",
        Image: "https://static-assets-prod.fnp.com/images/m/from-image.jpg",
      }),
    ]);
    assert.equal(imageColumn.rows[0]?.imageUrl, "https://static-assets-prod.fnp.com/images/m/from-image.jpg");
    assert.equal(imageColumn.rows[0]?.status, "ready");
  });

  it("maps an unmatched category only when an admin override says so, and refuses a duplicate name", () => {
    const unmatched = plan([
      row({
        "Product Name": "Blue Vase",
        "Final Category": "Mystery Vases",
        "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
      }),
    ]);
    assert.equal(unmatched.rows[0]?.status, "blocked");
    assert.deepEqual(unmatched.unmatchedCategories, ["Mystery Vases"]);

    const mapped = plan(
      [
        row({
          "Product Name": "Blue Vase",
          "Final Category": "Mystery Vases",
          "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
        }),
      ],
      {
        categoryOverrides: [{ workbook: "Mystery Vases", slug: "flowers", name: "Flowers", create: false }],
      }
    );
    assert.equal(mapped.rows[0]?.status, "ready");
    assert.equal(mapped.rows[0]?.categorySlug, "flowers");
    assert.equal(mapped.rows[0]?.categoryAction, "reuse");
    assert.deepEqual(mapped.unmatchedCategories, []);

    const created = plan(
      [
        row({
          "Product Name": "Blue Vase",
          "Final Category": "Desk Plants",
          "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
        }),
      ],
      {
        categoryOverrides: [{ workbook: "Desk Plants", slug: "Desk Plants", name: "Desk Plants", create: true }],
      }
    );
    assert.equal(created.rows[0]?.status, "ready");
    assert.equal(created.rows[0]?.categorySlug, "desk-plants");
    assert.equal(created.rows[0]?.categoryAction, "create");

    const collision = plan(
      [
        row({
          "Product Name": "Blue Vase",
          "Final Category": "Desk Plants",
          "Product URL": "https://www.fnp.com/usa/gift/blue-vase",
        }),
      ],
      {
        categoryNames: new Map([["plants", "Desk Plants"]]),
        categoryOverrides: [{ workbook: "Desk Plants", slug: "desk-plants", name: "Desk Plants", create: true }],
      }
    );
    assert.equal(collision.rows[0]?.status, "blocked");
    assert.match(collision.rows[0]?.errors.join(" ") ?? "", /already exists as "plants"/);

    const approved = plan(
      [
        row({
          "Product Name": "Grand Vanilla Cake",
          "Final Category": "Cakes",
          "Product URL": "https://www.fnp.com/usa/gift/grand-vanilla-cake",
        }),
      ],
      {
        categoryOverrides: [{ workbook: "Cakes", slug: "flowers", name: "Flowers", create: false }],
      }
    );
    assert.equal(approved.rows[0]?.categorySlug, "cakes");
  });

  it("treats a webp payload as webp even when the URL says jpg", () => {
    const bytes = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    assert.equal(imageExtensionForContentType("application/octet-stream", bytes), ".webp");
    assert.equal(imageExtensionForContentType("image/jpeg", bytes), ".jpg");
  });
});

describe("FNP import production guard", () => {
  it("allows a dev table and blocks production names", () => {
    assert.equal(
      fnpImportWriteBlocked({
        environment: "dev",
        productsTable: "blossompot-products-dev",
        uploadBucket: "blossompot-dev-uploads",
      }).blocked,
      false
    );
    assert.equal(fnpImportWriteBlocked({ environment: "production" }).blocked, true);
    assert.equal(fnpImportWriteBlocked({ environment: "prod" }).blocked, true);
    assert.equal(
      fnpImportWriteBlocked({ productsTable: "blossompot-products-prod" }).blocked,
      true
    );
    assert.equal(
      fnpImportWriteBlocked({ uploadBucket: "blossompot-prod-uploadbucket-477egxwp8t34" }).blocked,
      true
    );
    assert.equal(FNP_IMPORT_COMMIT_BATCH_SIZE, 20);
  });
});
