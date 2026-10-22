import { DEFAULT_PRODUCT_INVENTORY, VENDOR_GBO } from "../constants";
import { catalogSkuReservationItem, normalizeCatalogSku } from "./catalog-sku";
import { productKeys } from "../db/keys";
import { isGboCatalogProduct, parseGboSku, parseGboSlug } from "./gbo";
import { slugify } from "./slug";
import { fulfillmentVendorSlug } from "./serviceability";

/** One product Put plus one SKU reservation Put. */
export const PRODUCT_IMPORT_ACTIONS_PER_PRODUCT = 2;
/** DynamoDB TransactWriteItems allows 100 actions. */
export const PRODUCT_IMPORT_MAX_ACTIONS = 100;
export const PRODUCT_IMPORT_MAX_PRODUCTS = PRODUCT_IMPORT_MAX_ACTIONS / PRODUCT_IMPORT_ACTIONS_PER_PRODUCT;
/** DynamoDB rejects a transaction larger than 4 MB. */
export const PRODUCT_IMPORT_MAX_TRANSACTION_BYTES = 4_000_000;

export const PRODUCT_IMPORT_IMAGE_PROBE_NOTE =
  "Each image URL is resolved and rejected unless the address is public. Redirects are checked one at a time. HEAD is used first, and GET is used only when HEAD returns 405 or 501, with a small response cap. The URL is accepted only for HTTP 200-299, and only when a provided content type is an image type. A well-formed URL is not treated as accessible until that request succeeds.";

export type ProductImportImageResult = { ok: boolean; detail: string };

export type ProductImportVendor = {
  vendorSlug: string;
  enabled: boolean;
  trashedAt?: string;
  deliveryCountries: readonly string[];
  defaultInventory?: number;
};

export type ProductImportContext = {
  vendor: ProductImportVendor | null;
  globallyEnabledCountries: readonly string[];
  categorySlugs: ReadonlySet<string>;
  existingSlugs: ReadonlySet<string>;
  /** Lowercased SKUs already stored on products or SKU reservation rows. */
  existingSkus: ReadonlySet<string>;
  imageResults: ReadonlyMap<string, ProductImportImageResult>;
};

export type PlannedImportProduct = {
  name: string;
  description: string;
  sku: string;
  slug: string;
  price: number;
  currency: "USD" | "INR";
  categorySlug: string;
  additionalCategorySlugs?: string[];
  images: string[];
  inventory: number;
  published: boolean;
  tags?: string[];
  compareAtPrice?: number;
  seoTitle?: string;
  seoDescription?: string;
  sourceUrl?: string;
  weightOz?: number;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
  vendorSlug: string;
  deliveryCountries: string[];
};

export type ProductImportPlan = {
  ok: boolean;
  batchErrors: string[];
  rows: Array<{ row: number; errors: string[]; product?: PlannedImportProduct }>;
  actionCount: number;
  transactionBytes: number;
};

/** @deprecated Use normalizeCatalogSku. Blank input returns an empty string. */
export function normalizeImportSku(sku: string): string {
  return normalizeCatalogSku(sku) ?? "";
}

export function productImportActionCount(productCount: number): number {
  return productCount * PRODUCT_IMPORT_ACTIONS_PER_PRODUCT;
}

function cell(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") return row[key];
  }
  return undefined;
}

function text(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function stringList(value: unknown, separator: "|" | ","): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];
  return raw.split(separator).map((item) => item.trim()).filter(Boolean);
}

function positiveNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(text(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function publishedValue(value: unknown, errors: string[]): boolean {
  if (value == null || text(value) === "") return false;
  if (value === true || value === false) return value;
  const raw = text(value).toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  errors.push("published must be true, false, or blank.");
  return false;
}

function sameCountrySet(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].map((code) => code.trim().toUpperCase()).sort();
  const b = [...right].map((code) => code.trim().toUpperCase()).sort();
  return a.length === b.length && a.every((code, index) => code === b[index]);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeImportCountries(codes: readonly string[]): string[] | { error: string } {
  const countries: string[] = [];
  for (const raw of codes) {
    const code = raw.trim().toUpperCase();
    if (!code) continue;
    if (!/^[A-Z]{2}$/.test(code)) return { error: `"${raw.trim()}" is not a two-letter country code.` };
    if (!countries.includes(code)) countries.push(code);
  }
  if (countries.length === 0) return { error: "Select at least one delivery country." };
  return countries;
}

function batchCountryError(
  selected: readonly string[],
  vendor: ProductImportVendor,
  globallyEnabled: readonly string[]
): string | null {
  const enabled = new Set(globallyEnabled.map((code) => code.trim().toUpperCase()));
  const covered = new Set(vendor.deliveryCountries.map((code) => code.trim().toUpperCase()));
  for (const code of selected) {
    if (!enabled.has(code)) return `${code} is not a globally enabled shopping country.`;
    if (!covered.has(code)) return `${code} is not in this vendor's delivery countries.`;
  }
  return null;
}

export function planProductImport(input: {
  vendorSlug: string;
  deliveryCountries: readonly string[];
  rows: readonly Record<string, unknown>[];
}, context: ProductImportContext): ProductImportPlan {
  const batchErrors: string[] = [];
  const selectedCountries = normalizeImportCountries(input.deliveryCountries);
  const vendorSlug = input.vendorSlug.trim().toLowerCase();
  if (!context.vendor || context.vendor.vendorSlug !== vendorSlug) {
    batchErrors.push("Select a catalog vendor that exists.");
  } else if (context.vendor.trashedAt) {
    batchErrors.push("This vendor is in trash and cannot receive products.");
  } else if (!context.vendor.enabled) {
    batchErrors.push("This vendor is disabled and cannot receive products.");
  } else if (context.vendor.vendorSlug === VENDOR_GBO) {
    batchErrors.push("Gift Baskets Overseas products stay on their SKU country and cannot use this import.");
  } else if ("error" in selectedCountries) {
    batchErrors.push(selectedCountries.error);
  } else {
    const countryError = batchCountryError(selectedCountries, context.vendor, context.globallyEnabledCountries);
    if (countryError) batchErrors.push(countryError);
  }
  if (input.rows.length > PRODUCT_IMPORT_MAX_PRODUCTS) {
    batchErrors.push(
      `A batch can contain at most ${PRODUCT_IMPORT_MAX_PRODUCTS} products (${PRODUCT_IMPORT_MAX_ACTIONS} DynamoDB actions).`
    );
  }
  if (input.rows.length === 0) batchErrors.push("Add at least one product.");

  const countries = "error" in selectedCountries ? [] : selectedCountries;
  const seenSlugs = new Map<string, number>();
  const seenSkus = new Map<string, number>();
  const rows = input.rows.map((record, index) => {
    const errors: string[] = [];
    const name = text(cell(record, "name"));
    const description = text(cell(record, "description"));
    const sku = text(cell(record, "sku"));
    const slug = name ? slugify(name) : "";
    if (!name) errors.push("name is required.");
    if (!description) errors.push("description is required.");
    if (!sku) errors.push("sku is required.");
    if (name && !slug) errors.push("name does not produce a product slug.");
    const price = positiveNumber(cell(record, "price"));
    if (price == null || price <= 0) errors.push("price must be a positive number.");
    const currencyRaw = text(cell(record, "currency")) || "USD";
    const currency = currencyRaw.toUpperCase();
    if (currency !== "USD" && currency !== "INR") errors.push("currency must be USD or INR.");
    const categorySlug = text(cell(record, "categorySlug"));
    if (!categorySlug) errors.push("categorySlug is required.");
    else if (!context.categorySlugs.has(categorySlug)) errors.push(`category "${categorySlug}" does not exist.`);
    const additional = stringList(cell(record, "additionalCategorySlugs"), "|");
    for (const extra of additional) {
      if (extra === categorySlug) errors.push(`additional category "${extra}" repeats the primary category.`);
      else if (!context.categorySlugs.has(extra)) errors.push(`category "${extra}" does not exist.`);
    }
    const images = stringList(cell(record, "images", "imageUrls", "imageUrl"), "|");
    if (images.length === 0) errors.push("at least one image URL is required.");
    for (const imageUrl of images) {
      if (!isHttpUrl(imageUrl)) {
        errors.push(`image URL "${imageUrl}" must be an http(s) URL.`);
        continue;
      }
      const probed = context.imageResults.get(imageUrl);
      if (!probed) errors.push(`image URL "${imageUrl}" was not checked.`);
      else if (!probed.ok) errors.push(`image URL "${imageUrl}" is not accessible (${probed.detail}).`);
    }
    const fileVendor = text(cell(record, "vendorSlug"));
    if (fileVendor && fileVendor.toLowerCase() !== vendorSlug) {
      errors.push(`vendorSlug "${fileVendor}" does not match the selected vendor.`);
    }
    const fileCountries = stringList(cell(record, "deliveryCountries"), "|");
    if (fileCountries.length > 0 && !sameCountrySet(fileCountries, countries)) {
      errors.push("deliveryCountries in the file does not match the selected countries.");
    }
    if (parseGboSku(sku) || parseGboSlug(slug) || parseGboSlug(sku)) {
      errors.push("Gift Baskets Overseas SKUs and slugs cannot be imported here.");
    }
    const tags = stringList(cell(record, "tags"), ",");
    const resolved = fulfillmentVendorSlug({ vendorSlug, sku, slug, tags });
    if (isGboCatalogProduct({ vendorSlug: resolved, sku, slug }) || resolved === VENDOR_GBO) {
      errors.push("This row resolves to Gift Baskets Overseas and cannot use this import.");
    }
    const skuKey = normalizeCatalogSku(sku) ?? "";
    if (skuKey) {
      const earlierSku = seenSkus.get(skuKey);
      if (earlierSku != null) errors.push(`sku duplicates row ${earlierSku}.`);
      else seenSkus.set(skuKey, index + 1);
      if (context.existingSkus.has(skuKey)) errors.push(`sku "${sku}" is already used by a product.`);
    }
    if (slug) {
      const earlierSlug = seenSlugs.get(slug);
      if (earlierSlug != null) errors.push(`slug "${slug}" duplicates row ${earlierSlug}.`);
      else seenSlugs.set(slug, index + 1);
      if (context.existingSlugs.has(slug)) errors.push(`slug "${slug}" already exists and will not be overwritten.`);
    }
    const compareAt = positiveNumber(cell(record, "compareAtPrice"));
    if (cell(record, "compareAtPrice") != null && text(cell(record, "compareAtPrice")) !== "" && (compareAt == null || compareAt <= 0)) {
      errors.push("compareAtPrice must be a positive number when provided.");
    }
    const inventoryRaw = cell(record, "inventory");
    let inventory = context.vendor?.defaultInventory ?? DEFAULT_PRODUCT_INVENTORY;
    if (inventoryRaw != null && text(inventoryRaw) !== "") {
      const parsed = Number(text(inventoryRaw));
      if (!Number.isInteger(parsed) || parsed < 0) errors.push("inventory must be a whole number of 0 or more.");
      else inventory = parsed;
    }
    const published = publishedValue(cell(record, "published"), errors);
    const sourceUrl = text(cell(record, "sourceUrl"));
    if (sourceUrl && !isHttpUrl(sourceUrl)) errors.push("sourceUrl must be an http(s) URL.");
    const weightOz = optionalPositive(cell(record, "weightOz"), "weightOz", errors);
    const lengthIn = optionalPositive(cell(record, "lengthIn"), "lengthIn", errors);
    const widthIn = optionalPositive(cell(record, "widthIn"), "widthIn", errors);
    const heightIn = optionalPositive(cell(record, "heightIn"), "heightIn", errors);
    if (batchErrors.length > 0 || errors.length > 0 || !name || !slug || !sku || price == null || price <= 0) {
      return { row: index + 1, errors };
    }
    const product: PlannedImportProduct = {
      name,
      description,
      sku,
      slug,
      price,
      currency: currency === "INR" ? "INR" : "USD",
      categorySlug,
      ...(additional.length ? { additionalCategorySlugs: additional } : {}),
      images,
      inventory,
      published,
      ...(tags.length ? { tags } : {}),
      ...(compareAt != null && compareAt > 0 ? { compareAtPrice: compareAt } : {}),
      ...(text(cell(record, "seoTitle")) ? { seoTitle: text(cell(record, "seoTitle")) } : {}),
      ...(text(cell(record, "seoDescription")) ? { seoDescription: text(cell(record, "seoDescription")) } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(weightOz != null ? { weightOz } : {}),
      ...(lengthIn != null ? { lengthIn } : {}),
      ...(widthIn != null ? { widthIn } : {}),
      ...(heightIn != null ? { heightIn } : {}),
      vendorSlug,
      deliveryCountries: countries,
    };
    return { row: index + 1, errors, product };
  });

  const ready = rows.flatMap((row) => (row.product && row.errors.length === 0 ? [row.product] : []));
  const items = ready.flatMap((product) => productImportDynamoItems(product, "batch", "1970-01-01T00:00:00.000Z"));
  const transactionBytes = productImportTransactionBytes(items);
  if (ready.length > 0 && transactionBytes > PRODUCT_IMPORT_MAX_TRANSACTION_BYTES) {
    batchErrors.push("The batch is larger than the DynamoDB transaction size limit.");
  }
  const ok = batchErrors.length === 0 && rows.every((row) => row.errors.length === 0) && ready.length === input.rows.length && input.rows.length > 0;
  return {
    ok,
    batchErrors,
    rows,
    actionCount: productImportActionCount(ready.length),
    transactionBytes,
  };
}

function optionalPositive(value: unknown, label: string, errors: string[]): number | null {
  if (value == null || text(value) === "") return null;
  const parsed = positiveNumber(value);
  if (parsed == null || parsed <= 0) {
    errors.push(`${label} must be a positive number when provided.`);
    return null;
  }
  return parsed;
}

export function productImportDynamoItems(
  product: PlannedImportProduct,
  batchId: string,
  timestamp: string
): Record<string, unknown>[] {
  const productItem: Record<string, unknown> = {
    PK: productKeys.pk(product.slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(product.categorySlug),
    GSI1SK: productKeys.gsi1sk(product.slug),
    slug: product.slug,
    name: product.name,
    description: product.description,
    sku: product.sku,
    price: product.price,
    currency: product.currency,
    categorySlug: product.categorySlug,
    images: product.images,
    inventory: product.inventory,
    published: product.published,
    vendorSlug: product.vendorSlug,
    deliveryCountries: product.deliveryCountries,
    importBatchId: batchId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  if (product.additionalCategorySlugs) productItem.additionalCategorySlugs = product.additionalCategorySlugs;
  if (product.tags) productItem.tags = product.tags;
  if (product.compareAtPrice) productItem.compareAtPrice = product.compareAtPrice;
  if (product.seoTitle) productItem.seoTitle = product.seoTitle;
  if (product.seoDescription) productItem.seoDescription = product.seoDescription;
  if (product.sourceUrl) productItem.sourceUrl = product.sourceUrl;
  if (product.weightOz) productItem.weightOz = product.weightOz;
  if (product.lengthIn) productItem.lengthIn = product.lengthIn;
  if (product.widthIn) productItem.widthIn = product.widthIn;
  if (product.heightIn) productItem.heightIn = product.heightIn;
  const skuItem = catalogSkuReservationItem(product.sku, product.slug, { importBatchId: batchId });
  return skuItem ? [productItem, skuItem] : [productItem];
}

export function productImportTransactionBytes(items: readonly unknown[]): number {
  return new TextEncoder().encode(JSON.stringify(items)).length;
}
