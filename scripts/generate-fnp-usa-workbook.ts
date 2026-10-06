/**
 * Build a categorized FNP USA workbook and merge those products into the
 * existing bundled catalog used by Admin Portal → Products.
 *
 * Existing TF / BlossomPot rows are kept. Matching FNP source URLs or slugs
 * are not duplicated.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import { FNP_IMPORT_TAG, fnpSourceKey, mapFnpCategory } from "../packages/shared/src/lib/fnp-import";
import { slugify } from "../packages/shared/src/lib/slug";

const ROOT = resolve(process.cwd());
const SOURCE =
  process.env.FNP_WORKBOOK_SOURCE ??
  "C:\\Users\\dell\\Downloads\\FNP_USA_Product_List_Categorized.xlsx";
const OUTPUT_XLSX = resolve(ROOT, "scripts/data/fnp-usa/FNP_USA_Product_List.xlsx");
const OUTPUT_JSON = resolve(ROOT, "scripts/data/fnp-usa-catalog.json");
const DOWNLOAD_COPY = "C:\\Users\\dell\\Downloads\\FNP_USA_Product_List_Categorized.xlsx";
const CATALOG_PATHS = [
  resolve(ROOT, "scripts/data/blossompot-catalog.json"),
  resolve(ROOT, "apps/api/src/data/blossompot-catalog.json"),
];

type CatalogProduct = Record<string, unknown> & {
  slug?: string;
  sku?: string;
  tags?: string[];
  sourceUrl?: string;
};

function isFnpRow(product: CatalogProduct): boolean {
  const tags = product.tags ?? [];
  if (tags.includes(FNP_IMPORT_TAG)) return true;
  const source = String(product.sourceUrl ?? "");
  return source.includes("fnp.com");
}

function mergeCatalog(path: string, fnpProducts: CatalogProduct[]) {
  const data = JSON.parse(readFileSync(path, "utf8")) as { products: CatalogProduct[]; categories?: unknown };
  const keep = (data.products ?? []).filter((product) => !isFnpRow(product));
  const existingSlugs = new Set(keep.map((product) => product.slug).filter(Boolean));
  const added: CatalogProduct[] = [];
  const skipped: string[] = [];
  for (const product of fnpProducts) {
    const slug = String(product.slug ?? "");
    if (!slug || existingSlugs.has(slug)) {
      skipped.push(slug || String(product.name ?? ""));
      continue;
    }
    existingSlugs.add(slug);
    added.push(product);
  }
  data.products = [...keep, ...added];
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  return { kept: keep.length, added: added.length, skipped: skipped.length, total: data.products.length };
}

function main() {
  if (!existsSync(SOURCE)) throw new Error(`Source workbook not found: ${SOURCE}`);
  const book = XLSX.read(readFileSync(SOURCE), { type: "buffer" });
  const sheet = book.Sheets.Products ?? book.Sheets[book.SheetNames[0] ?? ""];
  if (!sheet) throw new Error("Workbook has no sheets.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
  const usedSlugs = new Set<string>();
  const stamp = "2026-10-06T00:00:00.000Z";

  const outRows: Record<string, unknown>[] = [];
  const products: CatalogProduct[] = [];
  const counts = new Map<string, number>();

  for (const row of rows) {
    const name = String(row["Product Name"] ?? "").trim();
    const workbookCategory = String(row.Category ?? row["Final Category"] ?? "").trim();
    const mapped = mapFnpCategory(workbookCategory, name);
    const productUrl = String(row["Product URL"] ?? "").trim();
    const imageUrl = String(row["Image URL"] ?? row.Image ?? "").trim();
    const listPrice = row["List Price ($)"];
    const mrp = row["MRP ($)"];
    const price = typeof listPrice === "number" ? listPrice : Number(listPrice);
    const compare = typeof mrp === "number" ? mrp : Number(mrp);
    let slug = slugify(name);
    const sourceKey = productUrl ? fnpSourceKey(productUrl) : null;
    if (!slug && sourceKey) slug = sourceKey;
    if (usedSlugs.has(slug) && sourceKey) slug = `${slug}-${sourceKey}`.replace(/-+/g, "-");
    usedSlugs.add(slug);
    const categoryName = mapped?.name ?? workbookCategory;
    const categorySlug = mapped?.slug ?? "";
    counts.set(categorySlug || "(unmapped)", (counts.get(categorySlug || "(unmapped)") ?? 0) + 1);

    outRows.push({
      "S. No": row["S. No"] ?? "",
      "Product Name": name,
      Category: categoryName,
      "Final Category": categoryName,
      "Catalog Slug": categorySlug,
      "List Price ($)": listPrice ?? "",
      "MRP ($)": mrp ?? "",
      "Product URL": productUrl,
      "Image URL": imageUrl,
      Image: row.Image ?? "",
    });

    products.push({
      slug,
      name,
      description: `Send ${name} across the USA with BlossomPot.`,
      price,
      ...(Number.isFinite(compare) && compare > price ? { compareAtPrice: compare } : {}),
      currency: "USD",
      categorySlug,
      images: imageUrl ? [imageUrl] : [],
      sku: sourceKey || slug,
      inventory: 50,
      tags: [FNP_IMPORT_TAG],
      published: true,
      sourceUrl: productUrl,
      seoTitle: `${name} | USA Delivery | BlossomPot`,
      seoDescription: `Order ${name} for USA delivery. Price and product details match the FNP USA product list.`,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(outRows), "Products");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([slug, count]) => ({ slug, count }))
    ),
    "Summary"
  );
  mkdirSync(resolve(OUTPUT_XLSX, ".."), { recursive: true });
  XLSX.writeFile(workbook, OUTPUT_XLSX);
  XLSX.writeFile(workbook, DOWNLOAD_COPY);
  writeFileSync(
    OUTPUT_JSON,
    `${JSON.stringify({ source: SOURCE, tag: FNP_IMPORT_TAG, products }, null, 2)}\n`
  );

  const merges = CATALOG_PATHS.filter((path) => existsSync(path)).map((path) => ({
    path,
    ...mergeCatalog(path, products),
  }));

  console.log(
    JSON.stringify(
      {
        source: SOURCE,
        excel: OUTPUT_XLSX,
        downloadCopy: DOWNLOAD_COPY,
        catalog: OUTPUT_JSON,
        excelRows: outRows.length,
        catalogProducts: products.length,
        unmapped: outRows.filter((row) => !row["Catalog Slug"]).length,
        categories: Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1])),
        merges,
      },
      null,
      2
    )
  );
}

main();
