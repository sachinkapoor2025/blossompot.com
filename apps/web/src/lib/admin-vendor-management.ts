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

export function integrationSettingsNote(integrationType: CatalogIntegrationType): string {
  if (integrationType === "partner-api") {
    return "Gift Baskets Overseas and the vendor API pages are the live API integrations. A generic endpoint mapper is not part of this catalog.";
  }
  return "A generic API endpoint, authentication, and product-mapping connector is not implemented. Use Manual, Excel, or JSON for this vendor.";
}
