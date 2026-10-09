import { VENDOR_FNP } from "../constants";
import { productSchema, type Product } from "../schemas/product";
import { slugify } from "./slug";

export const FNP_IMPORT_COMMIT_BATCH_SIZE = 20;
export const FNP_IMPORT_PREVIEW_MAX_ROWS = 1000;
export const FNP_IMPORT_TAG = "fnp-usa-import";

/** Imported FNP rows often have the import tag and no vendor slug. The shopping helper still needs that vendor. */
export function productForShoppingDecision<T extends { vendorSlug?: string | null; tags?: readonly string[] | null }>(
  product: T
): T {
  if (product.vendorSlug?.trim()) return product;
  if ((product.tags ?? []).includes(FNP_IMPORT_TAG)) return { ...product, vendorSlug: VENDOR_FNP };
  return product;
}
export const FNP_IMAGE_HOST = "static-assets-prod.fnp.com";

const CAKE_NAME_OVERRIDES = new Set(
  [
    "Petite Midnight Chocolate Cake",
    "Double Chocolate Cake With Personalization",
    "Anniversary Triple Chocolate Enrobed Brownie Cake",
    "Triple Chocolate Cheesecake",
    "Best Dad Tempting Chocolate Cake",
    "Belgian Chocolate Delicious Cake Pops",
    "Personalised Tempting Chocolate Sheet Cake",
    "Personalised Chocolate Chip Sheet Cake",
  ].map(normalizeName)
);

export type FnpCategoryTarget = {
  workbook: string;
  slug: string;
  name: string;
  /** Already in the BlossomPot catalog. Commit must not create or edit these. */
  existing: boolean;
};

/** Admin mapping for a workbook category that is not in the approved map. */
export type FnpCategoryOverride = {
  workbook: string;
  slug: string;
  name: string;
  /** Create the slug unpublished when it is absent. An existing slug is reused. */
  create: boolean;
};

/**
 * Approved workbook category → existing BlossomPot catalog slug.
 * Spelling variants (Bouquet/Bouquets/Buequet) reuse `flower-bouquets`.
 * Workbook buckets such as Combos, Mugs, or Rakhi are mapped onto catalog
 * categories that already exist — this import does not create new ones.
 */
export const FNP_CATEGORY_MAP: readonly FnpCategoryTarget[] = [
  { workbook: "Flowers", slug: "flowers", name: "Flowers", existing: true },
  { workbook: "Flower Bouquets", slug: "flower-bouquets", name: "Flower Bouquets", existing: true },
  { workbook: "Bouquets", slug: "flower-bouquets", name: "Flower Bouquets", existing: true },
  { workbook: "Bouquet", slug: "flower-bouquets", name: "Flower Bouquets", existing: true },
  { workbook: "Buequet", slug: "flower-bouquets", name: "Flower Bouquets", existing: true },
  { workbook: "Bouqet", slug: "flower-bouquets", name: "Flower Bouquets", existing: true },
  { workbook: "Cakes", slug: "cakes", name: "Cakes", existing: true },
  { workbook: "Cup Cakes", slug: "cakes", name: "Cakes", existing: true },
  { workbook: "Gift Hampers", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Wine Hampers", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Plants", slug: "plants", name: "Plants", existing: true },
  { workbook: "Personalised Gifts", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Personalized Gifts", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Birthday Gifts", slug: "birthday-gifts", name: "Birthday Gifts", existing: true },
  { workbook: "Anniversary Gifts", slug: "anniversary-gifts", name: "Anniversary Gifts", existing: true },
  { workbook: "Same Day Gifts", slug: "same-day-gifts", name: "Same Day Gifts", existing: true },
  { workbook: "Valentine's Day Gifts", slug: "valentines-day-gifts", name: "Valentine's Day Gifts", existing: true },
  { workbook: "Valentines Day Gifts", slug: "valentines-day-gifts", name: "Valentine's Day Gifts", existing: true },
  { workbook: "Mother's Day Gifts", slug: "mothers-day-gifts", name: "Mother's Day Gifts", existing: true },
  { workbook: "Mothers Day Gifts", slug: "mothers-day-gifts", name: "Mother's Day Gifts", existing: true },
  { workbook: "Wedding Gifts", slug: "wedding-gifts", name: "Wedding Gifts", existing: true },
  { workbook: "Celebration Gifts", slug: "celebration-gifts", name: "Celebration Gifts", existing: true },
  { workbook: "Combos", slug: "celebration-gifts", name: "Celebration Gifts", existing: true },
  { workbook: "Home Decor", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Sweets", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Soft Toys", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Chocolates", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Cushions", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Dry Fruits", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Mugs", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Personalised Mugs", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Rakhi", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Rakhi With Dryfruits", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Water Bottles", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Cookies", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Rakhi With Sweets", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Barware", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Fruits", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Jewellery", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Jewelry", slug: "personalized-gifts", name: "Personalized Gifts", existing: true },
  { workbook: "Rakhi With Chocolates", slug: "gift-hampers", name: "Gift Hampers", existing: true },
  { workbook: "Rakhi With Cushions", slug: "gift-hampers", name: "Gift Hampers", existing: true },
];

const CATEGORY_BY_WORKBOOK = new Map(
  FNP_CATEGORY_MAP.map((entry) => [normalizeName(entry.workbook), entry])
);

const RAKHI_CATALOG_SLUGS = new Set([
  "rakhi-hampers",
  "rakhi-combo",
  "single-rakhi",
  "bhaiya-bhabhi-rakhi",
  "kids-rakhi",
  "lumba-rakhi",
]);

export type FnpImportStatus = "ready" | "blocked" | "duplicate" | "conflict" | "empty";

export type FnpNormalizedRow = {
  name: string;
  finalCategory: string;
  listPrice: number | null;
  mrp: number | null;
  productUrl: string;
  imageUrl: string;
  confidence: number | null;
  /** Excel "S. No". Reference only — never used as the product id. */
  sourceSerial: string;
};

export type FnpImportPlanRow = {
  row: number;
  status: FnpImportStatus;
  name: string;
  slug: string;
  sourceUrl: string;
  sourceKey: string | null;
  imageUrl: string;
  categorySlug: string | null;
  categoryName: string | null;
  categoryAction: "reuse" | "create" | "missing" | null;
  /** Workbook category text that is not in the approved map and has no admin mapping yet. */
  unmatchedCategory: string | null;
  /** Excel "S. No". Reference only — never used as the product id. */
  sourceSerial: string;
  price: number | null;
  compareAtPrice?: number;
  errors: string[];
  warnings: string[];
  input: Record<string, unknown>;
};

export type FnpImportPlan = {
  total: number;
  ready: number;
  blocked: number;
  duplicate: number;
  conflict: number;
  empty: number;
  warningCount: number;
  categoriesToCreate: string[];
  unmatchedCategories: string[];
  rows: FnpImportPlanRow[];
};

export type FnpExistingSource = { productSlug: string };
export type FnpExistingProduct = { sourceUrl?: string; sourceKey?: string };

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function canonicalKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cell(raw: Record<string, unknown>, ...names: string[]): unknown {
  const entries = Object.entries(raw);
  for (const name of names) {
    const wanted = canonicalKey(name);
    for (const [key, value] of entries) {
      if (canonicalKey(key) === wanted) return value;
    }
  }
  return undefined;
}

export function parseFnpMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseConfidence(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function fnpSourceKey(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (host !== "www.fnp.com" && host !== "fnp.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1]?.toLowerCase() ?? "";
    if (!/^[a-z0-9-]{2,}$/.test(slug)) return null;
    return slug;
  } catch {
    return null;
  }
}

function catalogTarget(workbook: string): FnpCategoryTarget | null {
  return CATEGORY_BY_WORKBOOK.get(normalizeName(workbook)) ?? null;
}

/**
 * Strong signals from the product name. These beat a generic workbook bucket
 * (Combos, Flowers, blank) so Bouquet / cake / hamper names land on the
 * existing catalog category instead of a duplicate slug.
 */
function inferStrongFnpCategoryFromName(productName: string): FnpCategoryTarget | null {
  const n = normalizeName(productName);
  if (!n) return null;
  if (CAKE_NAME_OVERRIDES.has(n) || /\b(cup ?cakes?|cheesecake|cake pops|sheet cake|brownie cake|cakes?)\b/.test(n)) {
    return catalogTarget("Cakes");
  }
  if (
    /\b(plants?|succulent|bonsai|money plant|jade plant|snake plant|peace lily|lucky bamboo|terrarium|pothos|monstera|cactus|areca|ficus|calathea|syngonium|zz plant)\b/.test(
      n
    )
  ) {
    return catalogTarget("Plants");
  }
  if (/\b(buequet|bouqet|bouquets?)\b/.test(n)) return catalogTarget("Flower Bouquets");
  if (
    /\b(roses?|lilies|lily|tulips?|orchids?|carnations?|gerberas?|sunflowers?|hydrangeas?|daisies|daisy|stargazer)\b/.test(
      n
    )
  ) {
    return catalogTarget("Flower Bouquets");
  }
  if (/\bvalentine/.test(n)) return catalogTarget("Valentine's Day Gifts");
  if (/\b(mother'?s? day|\bmoms?\b.*\bday)\b/.test(n)) return catalogTarget("Mother's Day Gifts");
  if (/\b(wedding|bridal)\b/.test(n)) return catalogTarget("Wedding Gifts");
  if (/\banniversary\b/.test(n)) return catalogTarget("Anniversary Gifts");
  if (/\b(hampers?|gift basket|wine basket|\bbasket\b|rakhi|teddy|soft toy|plush|ferrero|chocolate box|chocolates?|dry fruits?)\b/.test(n)) {
    return catalogTarget("Gift Hampers");
  }
  if (/\bbirthday\b/.test(n)) return catalogTarget("Birthday Gifts");
  if (
    /\b(mugs?|cushions?|personalise[d]?|personalize[d]?|photo frame|engraved|water bottle|necklace|jewellery|jewelry|idol|decor)\b/.test(
      n
    )
  ) {
    return catalogTarget("Personalized Gifts");
  }
  return null;
}

function inferWeakFnpCategoryFromName(productName: string): FnpCategoryTarget | null {
  const n = normalizeName(productName);
  if (!n) return null;
  if (/\b(flowers?|blooms?|floral|petals?|arrangement|stems?)\b/.test(n)) return catalogTarget("Flowers");
  if (/\b(premium|deluxe|parent)\b/.test(n)) return catalogTarget("Flowers");
  return null;
}

export function inferFnpCategoryFromName(productName: string): FnpCategoryTarget | null {
  return inferStrongFnpCategoryFromName(productName) ?? inferWeakFnpCategoryFromName(productName);
}

export function mapFnpCategory(
  finalCategory: string,
  productName: string
): FnpCategoryTarget | null {
  const fromWorkbook = catalogTarget(finalCategory);
  const strong = inferStrongFnpCategoryFromName(productName);
  if (strong) {
    if (!fromWorkbook) return strong;
    if (fromWorkbook.slug === "celebration-gifts") return strong;
    if (
      fromWorkbook.slug === "flowers" &&
      (strong.slug === "flower-bouquets" || strong.slug === "cakes" || strong.slug === "plants")
    ) {
      return strong;
    }
    return fromWorkbook;
  }
  if (fromWorkbook) return fromWorkbook;
  if (finalCategory.trim()) return null;
  return inferWeakFnpCategoryFromName(productName) ?? catalogTarget("Celebration Gifts");
}

function indexCategoryOverrides(
  overrides: readonly FnpCategoryOverride[] | undefined
): Map<string, FnpCategoryOverride> {
  const map = new Map<string, FnpCategoryOverride>();
  for (const item of overrides ?? []) {
    const workbook = item.workbook.trim().replace(/\s+/g, " ");
    const name = item.name.trim().replace(/\s+/g, " ");
    const slug = slugify(item.slug);
    if (!workbook || !name || !slug) continue;
    if (mapFnpCategory(workbook, "import-check")) continue;
    map.set(normalizeName(workbook), { workbook, name, slug, create: item.create === true });
  }
  return map;
}

function categoryNameCollision(
  name: string,
  slug: string,
  names: ReadonlyMap<string, string> | undefined
): string | null {
  if (!names) return null;
  const wanted = normalizeName(name);
  for (const [existingSlug, existingName] of names) {
    if (existingSlug === slug) continue;
    if (normalizeName(existingName) === wanted) return existingSlug;
  }
  return null;
}

function isProductionName(value: string): boolean {
  return /(?:^|[-_])prod(?:uction)?(?:$|[-_])/.test(value.trim().toLowerCase());
}

export function fnpImportWriteBlocked(env: {
  environment?: string;
  productsTable?: string;
  uploadBucket?: string;
}): { blocked: boolean; reason?: string } {
  const environment = (env.environment ?? "").trim().toLowerCase();
  if (environment === "prod" || environment === "production") {
    return {
      blocked: true,
      reason: "FNP import writes are disabled when ENVIRONMENT is production.",
    };
  }
  if (isProductionName(env.productsTable ?? "")) {
    return {
      blocked: true,
      reason: "FNP import writes are disabled for a production products table.",
    };
  }
  if (isProductionName(env.uploadBucket ?? "")) {
    return {
      blocked: true,
      reason: "FNP import writes are disabled for a production upload bucket.",
    };
  }
  return { blocked: false };
}

export function imageExtensionForContentType(contentType: string, bytes: Uint8Array): string | null {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return ".png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return ".webp";
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return ".gif";
  return null;
}

export function normalizeFnpImportRow(raw: Record<string, unknown>): FnpNormalizedRow {
  const name = String(cell(raw, "productName", "Product Name", "name") ?? "").trim();
  const finalCategory = String(
    cell(raw, "finalCategory", "Final Category") ?? cell(raw, "category", "Category") ?? ""
  ).trim();
  const productUrl = String(cell(raw, "productUrl", "Product URL", "sourceUrl", "url") ?? "").trim();
  const explicitImage = String(cell(raw, "imageUrl", "Image URL") ?? "").trim();
  const imageColumn = String(cell(raw, "Image") ?? "").trim();
  const sourceSerial = String(cell(raw, "S. No", "S.No", "S No", "serial") ?? "").trim();
  return {
    name,
    finalCategory,
    listPrice: parseFnpMoney(
      cell(
        raw,
        "listingPrice",
        "Listing Price for BlossomPot ($)",
        "Listing Price for BlossomPot",
        "listPrice",
        "List Price ($)",
        "List Price",
        "price"
      )
    ),
    mrp: parseFnpMoney(cell(raw, "mrp", "MRP ($)", "MRP")),
    productUrl,
    imageUrl: explicitImage || imageColumn,
    confidence: parseConfidence(cell(raw, "confidence", "Classification Confidence")),
    sourceSerial,
  };
}

function isBlankRow(row: FnpNormalizedRow): boolean {
  return (
    !row.name &&
    !row.finalCategory &&
    !row.productUrl &&
    !row.imageUrl &&
    row.listPrice == null &&
    row.mrp == null
  );
}

export function planFnpImport(args: {
  rows: unknown[];
  rowNumbers?: number[];
  categoriesPresent: ReadonlySet<string>;
  existingSources: ReadonlyMap<string, FnpExistingSource>;
  existingProducts: ReadonlyMap<string, FnpExistingProduct>;
  /** slug → display name, used to refuse a second category with the same name. */
  categoryNames?: ReadonlyMap<string, string>;
  /** Applied only when the workbook category is absent from the approved map. */
  categoryOverrides?: readonly FnpCategoryOverride[];
}): FnpImportPlan {
  const seenSources = new Map<string, number>();
  const seenSlugs = new Map<string, number>();
  const overrides = indexCategoryOverrides(args.categoryOverrides);
  const rows: FnpImportPlanRow[] = [];

  args.rows.forEach((raw, index) => {
    const input = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const rowNumber = args.rowNumbers?.[index] ?? index + 1;
    const normalized = normalizeFnpImportRow(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isBlankRow(normalized)) {
      rows.push({
        row: rowNumber,
        status: "empty",
        name: "",
        slug: "",
        sourceUrl: "",
        sourceKey: null,
        imageUrl: "",
        categorySlug: null,
        categoryName: null,
        categoryAction: null,
        unmatchedCategory: null,
        sourceSerial: "",
        price: null,
        errors,
        warnings,
        input,
      });
      return;
    }

    const sourceKey = normalized.productUrl ? fnpSourceKey(normalized.productUrl) : null;
    const slug = normalized.name ? slugify(normalized.name) : "";
    const approved = mapFnpCategory(normalized.finalCategory, normalized.name);
    const override = approved ? undefined : overrides.get(normalizeName(normalized.finalCategory));
    const category: FnpCategoryTarget | null =
      approved ??
      (override
        ? {
            workbook: normalized.finalCategory,
            slug: override.slug,
            name: override.name,
            existing: !override.create,
          }
        : null);
    const unmatchedCategory = !approved && !override && normalized.finalCategory ? normalized.finalCategory : null;
    // List price is the storefront selling price. MRP is compare-at only when it is strictly higher.
    let price: number | null = normalized.listPrice;
    let compareAtPrice: number | undefined;
    let categoryAction: FnpImportPlanRow["categoryAction"] = null;

    if (!normalized.name) errors.push("Product name is required.");
    if (!slug) errors.push("Product name does not produce a slug.");
    if (!category) {
      errors.push(
        unmatchedCategory
          ? `Category "${normalized.finalCategory}" is not in the BlossomPot catalog. Map it before import.`
          : normalized.finalCategory
            ? `Final Category "${normalized.finalCategory}" is not in the approved map.`
            : "Category could not be determined from the product name or workbook category."
      );
    }
    if (!normalized.productUrl) errors.push("Product URL is required.");
    else if (!sourceKey) errors.push("Product URL must be an fnp.com product link.");
    if (!normalized.imageUrl) errors.push("Image URL is required.");
    else {
      try {
        const image = new URL(normalized.imageUrl);
        if (image.protocol !== "https:") errors.push("Image URL must use https.");
        else if (image.hostname.toLowerCase() !== FNP_IMAGE_HOST) {
          errors.push(`Image URL must be hosted on ${FNP_IMAGE_HOST}.`);
        }
      } catch {
        errors.push("Image URL is not a valid URL.");
      }
    }
    if (price == null) errors.push("List price is required.");
    else if (price <= 0) errors.push("List price must be greater than zero.");
    if (normalized.mrp != null && price != null && price > 0) {
      if (normalized.mrp < price) errors.push("MRP is below the list price.");
      else if (normalized.mrp > price) compareAtPrice = normalized.mrp;
    }
    if (normalized.confidence != null && normalized.confidence < 90) {
      warnings.push(`Classification confidence is ${normalized.confidence}. Confirm the category before commit.`);
    }
    if (/\bparent\b/i.test(normalized.name)) {
      warnings.push("Name looks like a parent or grouping row. Confirm it before commit.");
    }
    if (price != null && price >= 500) {
      warnings.push("List price is $500 or more. Confirm it before commit.");
    }

    if (category && errors.length === 0) {
      if (args.categoriesPresent.has(category.slug)) categoryAction = "reuse";
      else if (category.existing) {
        categoryAction = "missing";
        errors.push(`Category "${category.slug}" is not in this database. It will not be created by this import.`);
      } else {
        const collision = categoryNameCollision(category.name, category.slug, args.categoryNames);
        if (collision) {
          categoryAction = "missing";
          errors.push(
            `Category name "${category.name}" already exists as "${collision}". Map to that category instead of creating a duplicate.`
          );
        } else {
          categoryAction = "create";
          warnings.push(`Category "${category.slug}" will be created unpublished when this batch is committed.`);
        }
      }
    }

    let status: FnpImportStatus = errors.length > 0 ? "blocked" : "ready";

    if (status === "ready" && sourceKey) {
      const earlier = seenSources.get(sourceKey);
      const existingSource = args.existingSources.get(sourceKey);
      if (earlier != null) {
        status = "duplicate";
        errors.push(`Duplicate FNP URL. Row ${earlier} already uses this product.`);
      } else if (existingSource) {
        status = "duplicate";
        errors.push(
          `This FNP URL was already imported as "${existingSource.productSlug}". The existing product will not be changed.`
        );
      }
      seenSources.set(sourceKey, rowNumber);
    }

    if (status === "ready" && slug) {
      const earlierSlug = seenSlugs.get(slug);
      const existingProduct = args.existingProducts.get(slug);
      if (earlierSlug != null) {
        status = "conflict";
        errors.push(`Slug "${slug}" is already used by row ${earlierSlug} in this file.`);
      } else if (existingProduct) {
        const existingKey = existingProduct.sourceKey || (existingProduct.sourceUrl ? fnpSourceKey(existingProduct.sourceUrl) : null);
        if (existingKey && existingKey === sourceKey) {
          status = "duplicate";
          errors.push(`Product "${slug}" already exists for this FNP URL and will not be changed.`);
        } else {
          status = "conflict";
          errors.push(
            `Slug "${slug}" already belongs to another product. This import will not overwrite it.`
          );
        }
      }
      seenSlugs.set(slug, rowNumber);
    }

    if (status === "ready") {
      warnings.push("Description is empty, so this product stays unpublished.");
      warnings.push("Stock is unknown. Imported inventory is 0 and the product stays unpublished.");
    }

    rows.push({
      row: rowNumber,
      status,
      name: normalized.name,
      slug,
      sourceUrl: normalized.productUrl,
      sourceKey,
      imageUrl: normalized.imageUrl,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      categoryAction,
      unmatchedCategory,
      sourceSerial: normalized.sourceSerial,
      price: price != null && price > 0 ? price : null,
      ...(compareAtPrice ? { compareAtPrice } : {}),
      errors,
      warnings,
      input,
    });
  });

  const categoriesToCreate = [
    ...new Set(
      rows
        .filter((row) => row.status === "ready" && row.categoryAction === "create" && row.categorySlug)
        .map((row) => row.categorySlug as string)
    ),
  ];
  const unmatchedCategories = [
    ...new Set(rows.map((row) => row.unmatchedCategory).filter((name): name is string => Boolean(name))),
  ];

  return {
    total: rows.length,
    ready: rows.filter((row) => row.status === "ready").length,
    blocked: rows.filter((row) => row.status === "blocked").length,
    duplicate: rows.filter((row) => row.status === "duplicate").length,
    conflict: rows.filter((row) => row.status === "conflict").length,
    empty: rows.filter((row) => row.status === "empty").length,
    warningCount: rows.reduce((sum, row) => sum + row.warnings.length, 0),
    categoriesToCreate,
    unmatchedCategories,
    rows,
  };
}

export function buildFnpProductDraft(args: {
  row: FnpImportPlanRow;
  batchId: string;
  imageUrl: string;
  timestamp: string;
}): Product {
  if (args.row.status !== "ready" || !args.row.categorySlug || args.row.price == null || !args.row.sourceUrl) {
    throw new Error("Only a ready import row can become a product draft.");
  }
  const parsed = productSchema.parse({
    slug: args.row.slug,
    name: args.row.name,
    description: "",
    price: args.row.price,
    ...(args.row.compareAtPrice ? { compareAtPrice: args.row.compareAtPrice } : {}),
    currency: "USD" as const,
    categorySlug: args.row.categorySlug,
    images: [args.imageUrl],
    sku: args.row.slug,
    inventory: 0,
    tags: [FNP_IMPORT_TAG],
    published: false,
    indexable: false,
    sourceUrl: args.row.sourceUrl,
    importBatchId: args.batchId,
  });
  return {
    ...parsed,
    createdAt: args.timestamp,
    updatedAt: args.timestamp,
  };
}

export function fnpRakhiTargetsStaySeparate(): boolean {
  return FNP_CATEGORY_MAP.filter((entry) => entry.workbook.toLowerCase().startsWith("rakhi with")).every(
    (entry) => !RAKHI_CATALOG_SLUGS.has(entry.slug)
  );
}
