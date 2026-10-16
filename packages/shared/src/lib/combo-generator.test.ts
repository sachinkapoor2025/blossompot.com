import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FNP_IMPORT_TAG } from "../constants";
import { comboSchema } from "../schemas/combo";
import { generateComboDrafts, type ComboSourceProduct } from "./combo-generator";
import type { VendorDisplaySource } from "./vendor-display-order";

const vendors: VendorDisplaySource[] = [
  { vendorSlug: "blossompot", vendorName: "BlossomPot", displayOrder: 1 },
  { vendorSlug: "fnp", vendorName: "FNP", displayOrder: 2 },
];

function product(
  slug: string,
  categorySlug: string,
  vendorSlug: string,
  name = slug
): ComboSourceProduct {
  return { slug, name, categorySlug, vendorSlug };
}

describe("combo generator", () => {
  it("pairs two products from the same vendor and different categories", () => {
    const drafts = generateComboDrafts(
      [product("roses", "flowers", "blossompot", "Roses"), product("cake", "cakes", "blossompot", "Cake")],
      vendors,
      10
    );
    assert.equal(drafts.length, 1);
    assert.deepEqual(drafts[0]?.productSlugs, ["cake", "roses"]);
    assert.equal(drafts[0]?.name, "Cake and Roses");
    assert.equal(drafts[0]?.slug, "cake-roses");
    assert.equal(drafts[0]?.description, "");
    assert.equal(drafts[0]?.published, true);
    assert.equal("vendorSlug" in (drafts[0] ?? {}), false);
    assert.equal("price" in (drafts[0] ?? {}), false);
    assert.equal(comboSchema.safeParse(drafts[0]).success, true);
  });

  it("excludes products that share a primary category", () => {
    const drafts = generateComboDrafts(
      [
        product("red-roses", "flowers", "blossompot"),
        product("pink-roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["cake", "pink-roses"],
        ["cake", "red-roses"],
      ]
    );
  });

  it("keeps each pair inside one resolved vendor", () => {
    const drafts = generateComboDrafts(
      [
        product("bp-cake", "cakes", "blossompot"),
        product("bp-roses", "flowers", "  "),
        { ...product("bp-plant", "plants", "BlossomPot"), tags: [FNP_IMPORT_TAG] },
        { ...product("tagged-hamper", "hampers", " "), tags: [FNP_IMPORT_TAG] },
        product("fnp-mug", "mugs", "FNP"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["bp-cake", "bp-plant"],
        ["bp-cake", "bp-roses"],
        ["bp-plant", "bp-roses"],
        ["fnp-mug", "tagged-hamper"],
      ]
    );
    assert.equal(drafts.every((draft) => draft.productSlugs.length === 2), true);
  });

  it("excludes products from different vendors", () => {
    const drafts = generateComboDrafts(
      [product("roses", "flowers", "blossompot"), product("cake", "cakes", "fnp")],
      vendors,
      10
    );
    assert.deepEqual(drafts, []);
  });

  it("emits one combo when the same pair appears again in either order", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot", "Roses"),
        product("cake", "cakes", "blossompot", "Cake"),
        product("cake", "cakes", "blossompot", "Cake"),
        product("roses", "flowers", "blossompot", "Roses"),
      ],
      vendors,
      10
    );
    assert.equal(drafts.length, 1);
    assert.deepEqual(drafts[0]?.productSlugs, ["cake", "roses"]);
    assert.equal(drafts[0]?.slug, "cake-roses");
  });

  it("orders vendors with the existing display order", () => {
    const drafts = generateComboDrafts(
      [
        product("fnp-cake", "cakes", "fnp", "FNP Cake"),
        product("fnp-roses", "flowers", "fnp", "FNP Roses"),
        product("bp-cake", "cakes", "blossompot", "BP Cake"),
        product("bp-roses", "flowers", "blossompot", "BP Roses"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["bp-cake", "bp-roses"],
        ["fnp-cake", "fnp-roses"],
      ]
    );
    assert.deepEqual(
      drafts.map((draft) => draft.sortOrder),
      [0, 1]
    );
  });

  it("orders components by slug so a reversed input keeps the same combo slug", () => {
    const forward = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
        product("plant", "plants", "blossompot"),
      ],
      vendors,
      10
    );
    const reversed = generateComboDrafts(
      [
        product("plant", "plants", "blossompot"),
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
      ],
      vendors,
      10
    );
    assert.deepEqual(
      forward.map((draft) => draft.productSlugs),
      [
        ["cake", "plant"],
        ["cake", "roses"],
        ["plant", "roses"],
      ]
    );
    assert.deepEqual(
      reversed.map((draft) => draft.slug),
      forward.map((draft) => draft.slug)
    );
  });

  it("caps each vendor and still includes a vendor with fewer pairs", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
        product("plant", "plants", "blossompot"),
        product("fnp-hamper", "hampers", "fnp"),
        product("fnp-bouquet", "bouquets", "fnp"),
      ],
      vendors,
      2
    );
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["cake", "plant"],
        ["cake", "roses"],
        ["fnp-bouquet", "fnp-hamper"],
      ]
    );
  });

  it("returns no drafts for an empty list or an invalid limit", () => {
    const products = [product("roses", "flowers", "blossompot"), product("cake", "cakes", "blossompot")];
    assert.deepEqual(generateComboDrafts([], vendors, 10), []);
    assert.deepEqual(generateComboDrafts(products, vendors, 0), []);
    assert.deepEqual(generateComboDrafts(products, vendors, -1), []);
    assert.deepEqual(generateComboDrafts(products, vendors, 1.5), []);
    assert.deepEqual(generateComboDrafts(products, vendors, Number.NaN), []);
  });

  it("does not use a product whose primary category is combos", () => {
    const drafts = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("already-combined", "combos", "blossompot"),
        product("cake", "cakes", "blossompot"),
      ],
      vendors,
      10
    );
    assert.deepEqual(drafts.map((draft) => draft.productSlugs), [["cake", "roses"]]);
    assert.equal(
      drafts.some((draft) => draft.productSlugs.includes("already-combined")),
      false
    );
  });

  it("keeps the same pairs when the input order is shuffled", () => {
    const products = balancedFixture();
    const forward = generateComboDrafts(products, vendors, 10).map((draft) => draft.slug);
    const shuffled = generateComboDrafts([...products].reverse(), vendors, 10).map((draft) => draft.slug);
    assert.deepEqual(shuffled, forward);
    assert.equal(new Set(forward).size, forward.length);
  });

  it("spreads category pairings and reuses a component only as far as the catalog requires", () => {
    const drafts = generateComboDrafts(balancedFixture(), vendors, 10);
    const measured = measure(drafts);
    assert.equal(measured.pairs, 10);
    assert.equal(measured.categoryPairings, 6);
    assert.equal(measured.components, 12);
    assert.equal(measured.maxReuse, 2);
    assert.equal(measured.duplicatePairs, 0);
    assert.equal(measured.ruleBreaks, 0);
    assert.equal(measured.includesPrimaryCombos, false);

    const wide = generateComboDrafts(wideFixture(), vendors, 10);
    const wideMeasured = measure(wide);
    assert.equal(wideMeasured.pairs, 10);
    assert.equal(wideMeasured.maxReuse, 1);
    assert.equal(wideMeasured.duplicatePairs, 0);

    const tight = generateComboDrafts(
      [
        product("only-cake", "cakes", "blossompot"),
        product("flower-a", "flowers", "blossompot"),
        product("flower-b", "flowers", "blossompot"),
      ],
      vendors,
      10
    );
    assert.equal(measure(tight).pairs, 2);
    assert.equal(measure(tight).maxReuse, 2);
  });

  it("rejects a pair only when both products have conflicting explicit occasion markers", () => {
    const hamper = product("hamper", "gift-hampers", "blossompot");
    const anniversaryFlower = {
      ...product("flower", "flowers", "blossompot"),
      occasion: "anniversary",
    };
    const diwaliCake = {
      ...product("cake", "cakes", "blossompot"),
      additionalCategorySlugs: ["valentines-day-gifts"],
    };
    const drafts = generateComboDrafts([anniversaryFlower, diwaliCake, hamper], vendors, 10);
    assert.deepEqual(
      drafts.map((draft) => draft.productSlugs),
      [
        ["cake", "hamper"],
        ["flower", "hamper"],
      ]
    );

    const shared = generateComboDrafts(
      [
        { ...product("flower", "flowers", "blossompot"), additionalCategorySlugs: ["anniversary-gifts"] },
        { ...product("cake", "cakes", "blossompot"), occasion: "anniversary-gifts" },
      ],
      vendors,
      10
    );
    assert.deepEqual(shared.map((draft) => draft.productSlugs), [["cake", "flower"]]);

    const unmarked = generateComboDrafts(
      [
        { ...product("flower", "flowers", "blossompot"), occasion: "anniversary", tags: ["diwali"] },
        { ...product("cake", "cakes", "blossompot"), additionalCategorySlugs: ["cakes"], tags: ["birthday"] },
      ],
      vendors,
      10
    );
    assert.deepEqual(unmarked.map((draft) => draft.productSlugs), [["cake", "flower"]]);
  });

  it("pairs the same festival and rejects cross-festival, ambiguous, and festival-to-general pairs", () => {
    const sameFestival = generateComboDrafts(
      [
        product("rakhi-box", "rakhi-hampers", "orange-county"),
        product("single-thread", "single-rakhi", "orange-county"),
        product("dooj-box", "bhai-dooj", "orange-county"),
        product("diwali-box", "diwali", "orange-county"),
        product("roses", "flowers", "orange-county"),
      ],
      vendors,
      10
    );
    assert.deepEqual(sameFestival.map((draft) => draft.productSlugs), [["rakhi-box", "single-thread"]]);

    const unrelated = generateComboDrafts(
      [
        product("roses", "flowers", "blossompot"),
        product("cake", "cakes", "blossompot"),
        product("rakhi-box", "rakhi-hampers", "blossompot"),
        product("diwali-box", "diwali", "blossompot"),
      ],
      vendors,
      10
    );
    const unrelatedPairs = unrelated.map((draft) => draft.productSlugs);
    assert.equal(
      unrelatedPairs.some((pair) => pair.includes("rakhi-box") && pair.includes("diwali-box")),
      false
    );
    assert.equal(
      unrelatedPairs.some((pair) => pair.includes("cake") && pair.includes("roses")),
      true
    );
    assert.equal(
      unrelatedPairs.some((pair) => pair.includes("rakhi-box") && (pair.includes("cake") || pair.includes("roses"))),
      true
    );

    const ambiguous = {
      ...product("mixed-festival", "diwali", "orange-county"),
      additionalCategorySlugs: ["rakhi-hampers"],
    };
    const withAmbiguous = generateComboDrafts(
      [
        ambiguous,
        product("diwali-sweets", "diwali", "orange-county"),
        product("rakhi-box", "rakhi-hampers", "orange-county"),
        product("roses", "flowers", "orange-county"),
        product("cake", "cakes", "orange-county"),
      ],
      vendors,
      10
    );
    assert.equal(
      withAmbiguous.some((draft) => draft.productSlugs.includes("mixed-festival")),
      false
    );
    assert.deepEqual(withAmbiguous.map((draft) => draft.productSlugs), [["cake", "roses"]]);
  });
});

function balancedFixture(): ComboSourceProduct[] {
  return [
    ...["f1", "f2", "f3", "f4"].map((slug) => product(slug, "flowers", "blossompot")),
    ...["c1", "c2", "c3"].map((slug) => product(slug, "cakes", "blossompot")),
    ...["h1", "h2", "h3"].map((slug) => product(slug, "gift-hampers", "blossompot")),
    ...["p1", "p2"].map((slug) => product(slug, "plants", "blossompot")),
    ...["k1", "k2"].map((slug) => product(slug, "combos", "blossompot")),
  ];
}

function wideFixture(): ComboSourceProduct[] {
  const categories = ["cakes", "flowers", "gift-hampers", "plants", "personalized-gifts"];
  return categories.flatMap((category) =>
    [1, 2, 3, 4].map((n) => product(`${category}-${n}`, category, "blossompot"))
  );
}

function measure(drafts: ReturnType<typeof generateComboDrafts>) {
  const components = new Map<string, number>();
  const categories = new Set<string>();
  const unordered = new Set<string>();
  let duplicatePairs = 0;
  let ruleBreaks = 0;
  let includesPrimaryCombos = false;
  const source = new Map(
    [...balancedFixture(), ...wideFixture()].map((item) => [item.slug, item])
  );
  for (const draft of drafts) {
    const [left, right] = draft.productSlugs;
    if (!left || !right) continue;
    components.set(left, (components.get(left) ?? 0) + 1);
    components.set(right, (components.get(right) ?? 0) + 1);
    const leftCategory = source.get(left)?.categorySlug ?? "";
    const rightCategory = source.get(right)?.categorySlug ?? "";
    categories.add([leftCategory, rightCategory].sort().join("+"));
    if (leftCategory === "combos" || rightCategory === "combos") includesPrimaryCombos = true;
    if (leftCategory === rightCategory || source.get(left)?.vendorSlug !== source.get(right)?.vendorSlug) ruleBreaks += 1;
    const key = [left, right].sort().join("\0");
    if (unordered.has(key)) duplicatePairs += 1;
    unordered.add(key);
  }
  return {
    pairs: drafts.length,
    categoryPairings: categories.size,
    components: components.size,
    maxReuse: Math.max(0, ...components.values()),
    duplicatePairs,
    ruleBreaks,
    includesPrimaryCombos,
  };
}
