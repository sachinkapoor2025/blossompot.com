import { bulkProductRowSchema, type CatalogIntegrationType } from "@blossompot/shared";

export const VENDOR_DELIVERY_HELP =
  "The vendor can deliver to these countries. A country must also be globally enabled by BlossomPot before customers can shop products from this vendor in that country.";

export const VENDOR_STATUS_HELP =
  "Disabling a vendor hides its products from new shopping. Existing orders are not affected.";

export const VENDOR_SLUG_HELP =
  "Used internally to associate products with this vendor. Avoid changing it after products have been imported.";

export const VENDOR_DEFAULT_INVENTORY_HELP =
  "Used as the default inventory value for new products/imports. Existing product inventory is not changed.";

export const VENDOR_STORAGE_HELP =
  "Products are stored in BlossomPot's DynamoDB catalog. Storage is informational and cannot be changed here.";

export const ADD_PRODUCT_METHODS = ["manual", "api", "excel", "json"] as const;
export type AddProductMethod = (typeof ADD_PRODUCT_METHODS)[number];

export const ADD_PRODUCT_METHOD_LABELS: Record<AddProductMethod, string> = {
  manual: "Manual",
  api: "API",
  excel: "Excel Sheet",
  json: "JSON / Bundle",
};

const IMPORT_COLUMNS = [
  "name",
  "sku",
  "description",
  "price",
  "currency",
  "categorySlug",
  "inventory",
  "published",
  "imageUrl",
  "compareAtPrice",
  "tags",
  "sourceUrl",
  "seoTitle",
  "seoDescription",
  "weightOz",
  "lengthIn",
  "widthIn",
  "heightIn",
] as const;

export function vendorImportTemplateColumns(): readonly string[] {
  return IMPORT_COLUMNS;
}

export function slugifyVendorName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function cell(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value == null) return "";
  return String(value).trim();
}

function publishedValue(raw: string): boolean {
  const value = raw.trim().toLowerCase();
  if (!value) return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return true;
}

export type PreparedVendorProduct = {
  name: string;
  description: string;
  price: number;
  currency: "USD" | "INR";
  categorySlug: string;
  inventory: number;
  published: boolean;
  vendorSlug: string;
  sku?: string;
  compareAtPrice?: number;
  tags?: string[];
  images?: string[];
  sourceUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  weightOz?: number;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
};

export type VendorImportPreview = {
  rows: Array<{ row: number; product?: PreparedVendorProduct; errors: string[] }>;
  valid: number;
  invalid: number;
};

/**
 * Validate uploaded rows and force vendorSlug from the admin selection.
 * A vendorSlug column in the file is ignored.
 */
export function previewVendorImport(
  records: readonly Record<string, unknown>[],
  vendorSlug: string,
  defaultInventory?: number
): VendorImportPreview {
  const rows = records.map((record, index) => {
    const inventoryRaw = cell(record, "inventory");
    const parsed = bulkProductRowSchema.safeParse({
      name: cell(record, "name"),
      description: cell(record, "description"),
      price: cell(record, "price"),
      compareAtPrice: cell(record, "compareAtPrice") || undefined,
      currency: cell(record, "currency") || undefined,
      categorySlug: cell(record, "categorySlug"),
      sku: cell(record, "sku") || undefined,
      inventory: inventoryRaw || (defaultInventory != null ? defaultInventory : undefined),
      tags: cell(record, "tags") || undefined,
      seoTitle: cell(record, "seoTitle") || undefined,
      seoDescription: cell(record, "seoDescription") || undefined,
      published: publishedValue(cell(record, "published")),
      weightOz: cell(record, "weightOz") || undefined,
      lengthIn: cell(record, "lengthIn") || undefined,
      widthIn: cell(record, "widthIn") || undefined,
      heightIn: cell(record, "heightIn") || undefined,
    });
    const errors = parsed.success ? [] : parsed.error.issues.map((issue) => issue.message);
    const imageUrl = cell(record, "imageUrl");
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) errors.push("imageUrl must be an http(s) URL");
    const sourceUrl = cell(record, "sourceUrl");
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) errors.push("sourceUrl must be an http(s) URL");
    if (!parsed.success) return { row: index + 2, errors };
    const tags = parsed.data.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const product: PreparedVendorProduct = {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      currency: parsed.data.currency,
      categorySlug: parsed.data.categorySlug,
      inventory: parsed.data.inventory,
      published: parsed.data.published,
      vendorSlug,
      ...(parsed.data.sku ? { sku: parsed.data.sku } : {}),
      ...(parsed.data.compareAtPrice ? { compareAtPrice: parsed.data.compareAtPrice } : {}),
      ...(tags?.length ? { tags } : {}),
      ...(imageUrl && /^https?:\/\//i.test(imageUrl) ? { images: [imageUrl] } : {}),
      ...(sourceUrl && /^https?:\/\//i.test(sourceUrl) ? { sourceUrl } : {}),
      ...(parsed.data.seoTitle ? { seoTitle: parsed.data.seoTitle } : {}),
      ...(parsed.data.seoDescription ? { seoDescription: parsed.data.seoDescription } : {}),
      ...(parsed.data.weightOz ? { weightOz: parsed.data.weightOz } : {}),
      ...(parsed.data.lengthIn ? { lengthIn: parsed.data.lengthIn } : {}),
      ...(parsed.data.widthIn ? { widthIn: parsed.data.widthIn } : {}),
      ...(parsed.data.heightIn ? { heightIn: parsed.data.heightIn } : {}),
    };
    return { row: index + 2, product, errors };
  });
  return {
    rows,
    valid: rows.filter((row) => row.errors.length === 0).length,
    invalid: rows.filter((row) => row.errors.length > 0).length,
  };
}

export const PRODUCT_IMPORT_SAMPLE_NOTICE =
  "SAMPLE — replace these rows before import. They are not production products.";

export const PRODUCT_IMPORT_COLUMNS = [
  "name",
  "description",
  "sku",
  "categorySlug",
  "additionalCategorySlugs",
  "imageUrls",
  "price",
  "currency",
  "compareAtPrice",
  "inventory",
  "published",
  "tags",
  "seoTitle",
  "seoDescription",
  "weightOz",
  "lengthIn",
  "widthIn",
  "heightIn",
  "sourceUrl",
] as const;

const SAMPLE_PRODUCTS = [
  {
    name: "Sample Red Roses",
    description: "Sample description for a dozen roses. Replace before import.",
    sku: "sample-red-roses",
    categorySlug: "flowers",
    additionalCategorySlugs: "birthday",
    imageUrls: "https://cdn.example.com/sample-roses.jpg",
    price: "24.00",
    currency: "USD",
    compareAtPrice: "29.00",
    inventory: "",
    published: "",
    tags: "flowers,sample",
    seoTitle: "Sample Red Roses",
    seoDescription: "Replace this sample.",
    weightOz: "",
    lengthIn: "",
    widthIn: "",
    heightIn: "",
    sourceUrl: "",
  },
  {
    name: "Sample Gift Hamper",
    description: "Sample description for a gift hamper. Replace before import.",
    sku: "sample-gift-hamper",
    categorySlug: "gift-hampers",
    additionalCategorySlugs: "birthday|flowers",
    imageUrls: "https://cdn.example.com/sample-hamper.jpg|https://cdn.example.com/sample-hamper-side.jpg",
    price: "48.00",
    currency: "USD",
    compareAtPrice: "",
    inventory: "10",
    published: "false",
    tags: "hamper,sample",
    seoTitle: "",
    seoDescription: "",
    weightOz: "32",
    lengthIn: "12",
    widthIn: "10",
    heightIn: "6",
    sourceUrl: "https://example.com/sample-hamper",
  },
] as const;

export function productImportJsonTemplate(): {
  notice: string;
  products: Array<Record<string, unknown>>;
} {
  return {
    notice: PRODUCT_IMPORT_SAMPLE_NOTICE,
    products: SAMPLE_PRODUCTS.map((product) => ({
      name: product.name,
      description: product.description,
      sku: product.sku,
      categorySlug: product.categorySlug,
      additionalCategorySlugs: product.additionalCategorySlugs.split("|").filter(Boolean),
      images: product.imageUrls.split("|").filter(Boolean),
      price: Number(product.price),
      currency: product.currency,
      ...(product.compareAtPrice ? { compareAtPrice: Number(product.compareAtPrice) } : {}),
      ...(product.inventory ? { inventory: Number(product.inventory) } : {}),
      tags: product.tags.split(",").filter(Boolean),
      ...(product.seoTitle ? { seoTitle: product.seoTitle } : {}),
      ...(product.seoDescription ? { seoDescription: product.seoDescription } : {}),
      ...(product.weightOz ? { weightOz: Number(product.weightOz) } : {}),
      ...(product.lengthIn ? { lengthIn: Number(product.lengthIn) } : {}),
      ...(product.widthIn ? { widthIn: Number(product.widthIn) } : {}),
      ...(product.heightIn ? { heightIn: Number(product.heightIn) } : {}),
      ...(product.sourceUrl ? { sourceUrl: product.sourceUrl } : {}),
    })),
  };
}

export function productImportWorkbookSheets(): {
  productUpload: string[][];
  instructions: string[][];
  allowedValues: string[][];
} {
  return {
    productUpload: [
      [...PRODUCT_IMPORT_COLUMNS],
      PRODUCT_IMPORT_COLUMNS.map((column) => SAMPLE_PRODUCTS[0][column]),
      PRODUCT_IMPORT_COLUMNS.map((column) => SAMPLE_PRODUCTS[1][column]),
    ],
    instructions: [
      ["BlossomPot product import"],
      [PRODUCT_IMPORT_SAMPLE_NOTICE],
      ["Vendor and delivery countries are selected on the Add Product page. Do not rely on columns in this file."],
      ["If vendorSlug or deliveryCountries is present, it must match the page selection or the row is rejected."],
      ["Required: name, description, sku, categorySlug, at least one imageUrls value, price."],
      ["SKU must be unique. The product slug is generated from the name and must also be unique."],
      ["additionalCategorySlugs and imageUrls use a pipe (|). Tags use a comma. JSON templates use arrays."],
      ["Blank published means unpublished. Blank inventory uses the vendor default, then 200."],
      ["Blank currency means USD. compareAtPrice is optional and is not required to be higher than price."],
      ["Each image URL is requested by the server. A well-formed URL is not enough; the response must be HTTP 200-299."],
      ["One invalid row blocks the whole batch. Nothing is written until you approve the preview."],
      ["The commit writes at most 50 products in one transaction (100 DynamoDB actions: product plus SKU reservation)."],
      ["Existing products, orders, and inventory are not changed. A matching slug or SKU rejects the batch."],
      ["Gift Baskets Overseas vendors, SKUs, and slugs are rejected. United Kingdom is GB."],
    ],
    allowedValues: [
      ["field", "allowed"],
      ["currency", "USD | INR | blank (USD)"],
      ["published", "true | false | blank (unpublished)"],
      ["additionalCategorySlugs", "existing category slugs separated by |"],
      ["imageUrls", "http or https URLs separated by |"],
      ["categorySlug", "an existing category slug"],
    ],
  };
}

export function integrationSettingsNote(integrationType: CatalogIntegrationType): string {
  if (integrationType === "partner-api") {
    return "Gift Baskets Overseas and the vendor API pages are the live API integrations. A generic endpoint mapper is not part of this catalog.";
  }
  return "A generic API endpoint, authentication, and product-mapping connector is not implemented. Use Manual, Excel, or JSON for this vendor.";
}
