/**
 * Generate USA-only TF bouquet / gourmet hamper / cake catalog from the 2026 Excel + Images.zip.
 * Listed price = sheet price + $40. Shipping amounts stay exactly as on the sheet.
 *
 * Usage (from repo root):
 *   npx tsx scripts/generate-tf-usa-catalog.ts
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, extname, join, resolve } from "path";
import * as XLSX from "xlsx";

const ROOT = resolve(process.cwd());
const PRICE_MARKUP_USD = 40;
const XLSX_PATH =
  process.env.TF_XLSX_PATH ||
  "C:/Users/dell/OneDrive/Desktop/office DGV/TF Bouquet & Gourmet Hamper & Cakes  2026/TF Bouquet & Gourmet Hamper & Cakes.xlsx";
const IMAGES_DIR =
  process.env.TF_IMAGES_DIR ||
  join(ROOT, "scripts/data/tf-usa-import/images-zip/Images");
const PUBLIC_DIR = join(ROOT, "apps/web/public/uploads/tf-usa");
const OUT_TF = join(ROOT, "scripts/data/tf-usa-catalog.json");
const CATALOG_PATHS = [
  join(ROOT, "scripts/data/blossompot-catalog.json"),
  join(ROOT, "apps/api/src/data/blossompot-catalog.json"),
];

const CAKE_SHIPPING = [
  { label: "Next Day", price: 22.99 },
  { label: "2nd Day", price: 15.99 },
  { label: "Saturday Next Day", price: 27.99 },
  { label: "Saturday 2nd Day", price: 17.99 },
] as const;

type CatalogProduct = Record<string, unknown>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseShippingFee(raw: string): number {
  const text = cleanMultiline(raw);
  if (/free\s*ship/i.test(text)) return 0;
  const dollar = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollar) return Math.round(Number(dollar[1]) * 100) / 100;
  const nums = [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  const last = nums.filter((n) => n >= 3).pop();
  return last != null ? Math.round(last * 100) / 100 : 0;
}

function parseMoney(raw: string): number | null {
  const m = String(raw).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Math.round(Number(m[1]) * 100) / 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cleanMultiline(text: string): string {
  return String(text)
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\u200b/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function includeLines(raw: string): string[] {
  return cleanMultiline(raw)
    .replace(/^includes:?\s*/i, "")
    .replace(/^included:?\s*/i, "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]+\s*/, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1 && line !== "​");
}

function htmlDescription(lines: string[], extraParagraphs: string[] = []): string {
  const paras = extraParagraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  const items = lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("");
  const list = items ? `<ul>${items}</ul>` : "";
  return `${paras}${list}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listImageFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listImageFiles(full));
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function imagesForSku(sku: string, files: string[]): string[] {
  const skuU = sku.toUpperCase();
  const matched = files.filter((f) => {
    const stem = basename(f, extname(f)).toUpperCase();
    if (stem === skuU || stem.startsWith(`${skuU}`) ) {
      // TFFF2602 must not match TFCC2602
      if (!stem.startsWith(skuU)) return false;
      const rest = stem.slice(skuU.length);
      return rest === "" || /^[A-Z_-]/.test(rest);
    }
    if (skuU === "TFFF2613" && stem.includes("TFFF20613")) return true;
    return false;
  });
  matched.sort((a, b) => {
    const sa = basename(a, extname(a)).toUpperCase();
    const sb = basename(b, extname(b)).toUpperCase();
    if (sa === skuU && sb !== skuU) return -1;
    if (sb === skuU && sa !== skuU) return 1;
    return sa.localeCompare(sb);
  });
  return matched;
}

function copyImages(sku: string, files: string[]): string[] {
  const destDir = join(PUBLIC_DIR, sku);
  mkdirSync(destDir, { recursive: true });
  const urls: string[] = [];
  for (const file of files) {
    const safe = basename(file).replace(/\s+/g, "-");
    copyFileSync(file, join(destDir, safe));
    urls.push(`/uploads/tf-usa/${sku}/${safe}`);
  }
  return urls;
}

function seoFrom(name: string, category: string): { seoTitle: string; seoDescription: string } {
  return {
    seoTitle: `${name} | USA Delivery | BlossomPot`,
    seoDescription: `Send ${name} across the USA. ${category} with the sheet details, SKU, and shipping shown on the product page.`,
  };
}

function parseFlowerHamperSheet(
  rows: string[][],
  kind: "flowers" | "hampers",
  imageFiles: string[]
): CatalogProduct[] {
  const headerIdx = rows.findIndex((r) => String(r[0]).includes("S.No") || String(r[2]).toUpperCase().includes("SKU"));
  const products: CatalogProduct[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    const sku = String(r[2] ?? "").trim();
    if (!sku || sku.toLowerCase() === "sku") continue;
    const includesRaw = String(r[3] ?? "");
    const name = cleanMultiline(String(r[4] ?? "")).replace(/\n+/g, " ");
    const sheetPrice = parseMoney(String(r[5] ?? ""));
    const shipRaw = cleanMultiline(String(r[6] ?? ""));
    if (!name || sheetPrice == null) continue;

    const lines = includeLines(includesRaw);
    const categorySlug = kind === "flowers" ? "flower-bouquets" : "gift-hampers";
    const additionalCategorySlugs = kind === "flowers" ? ["flowers"] : [];
    const deliveryFee = parseShippingFee(shipRaw);
    const images = copyImages(sku, imagesForSku(sku, imageFiles));
    const { seoTitle, seoDescription } = seoFrom(name, kind === "flowers" ? "Flower bouquet" : "Gourmet hamper");

    products.push({
      slug: slugify(name),
      name,
      description: htmlDescription(lines),
      price: round2(sheetPrice + PRICE_MARKUP_USD),
      currency: "USD",
      categorySlug,
      ...(additionalCategorySlugs.length ? { additionalCategorySlugs } : {}),
      images,
      sku,
      inventory: 50,
      tags: ["tf-usa", "fixed-price", kind === "flowers" ? "flowers" : "gift-hampers"],
      couponExcluded: true,
      published: true,
      deliveryFee,
      shippingNote: shipRaw,
      seoTitle,
      seoDescription,
    });
  }
  return products;
}

function parseCakeSheet(rows: string[][], imageFiles: string[]): CatalogProduct[] {
  const headerIdx = rows.findIndex((r) => String(r[0]).includes("S.No"));
  const products: CatalogProduct[] = [];
  const shipNote =
    "Shipping cost:\nNext Day: $22.99\n2nd Day: $15.99\nSaturday Next Day: $27.99\nSaturday 2nd Day: $17.99";
  for (const r of rows.slice(headerIdx + 1)) {
    const sku = String(r[2] ?? "").trim();
    if (!sku || !/^TFBW/i.test(sku)) continue;
    const allergens = cleanMultiline(String(r[3] ?? ""));
    const size = cleanMultiline(String(r[4] ?? ""));
    const name = cleanMultiline(String(r[5] ?? "")).replace(/\n+/g, " ");
    const sheetPrice = parseMoney(String(r[6] ?? ""));
    if (!name || sheetPrice == null) continue;
    const images = copyImages(sku, imagesForSku(sku, imageFiles));
    const extra = [size, allergens ? `Contains: ${allergens}` : ""].filter(Boolean);
    const { seoTitle, seoDescription } = seoFrom(name, "Cake");
    products.push({
      slug: slugify(name),
      name,
      description: htmlDescription([], extra),
      price: round2(sheetPrice + PRICE_MARKUP_USD),
      currency: "USD",
      categorySlug: "cakes",
      images,
      sku,
      inventory: 50,
      tags: ["tf-usa", "fixed-price", "cakes"],
      couponExcluded: true,
      published: true,
      shippingOptions: CAKE_SHIPPING.map((o) => ({ ...o })),
      shippingNote: shipNote,
      seoTitle,
      seoDescription,
    });
  }
  return products;
}

function mergeCatalog(path: string, tfProducts: CatalogProduct[]) {
  const data = JSON.parse(readFileSync(path, "utf8")) as { products: CatalogProduct[]; categories?: unknown };
  const keep = (data.products ?? []).filter((p) => {
    const sku = String(p.sku ?? "");
    return !/^(TFFF|TFCC|TFWGC|TFBW)/i.test(sku);
  });
  data.products = [...keep, ...tfProducts];
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function main() {
  if (!existsSync(XLSX_PATH)) {
    throw new Error(`Excel not found: ${XLSX_PATH}`);
  }
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true });
  const imageFiles = listImageFiles(IMAGES_DIR);
  if (imageFiles.length === 0) {
    console.warn(`No images under ${IMAGES_DIR}`);
  }

  const flowers = parseFlowerHamperSheet(
    XLSX.utils.sheet_to_json(wb.Sheets.Flowers, { header: 1, defval: "", raw: false }) as string[][],
    "flowers",
    imageFiles
  );
  const hampers = parseFlowerHamperSheet(
    XLSX.utils.sheet_to_json(wb.Sheets.Hampers, { header: 1, defval: "", raw: false }) as string[][],
    "hampers",
    imageFiles
  );
  const cakes = parseCakeSheet(
    XLSX.utils.sheet_to_json(wb.Sheets.Cake, { header: 1, defval: "", raw: false }) as string[][],
    imageFiles
  );

  const products = [...flowers, ...hampers, ...cakes];
  const missingImages = products.filter((p) => !Array.isArray(p.images) || (p.images as string[]).length === 0);
  writeFileSync(
    OUT_TF,
    `${JSON.stringify(
      {
        source: XLSX_PATH,
        priceMarkupUsd: PRICE_MARKUP_USD,
        products,
      },
      null,
      2
    )}\n`
  );
  for (const path of CATALOG_PATHS) {
    if (existsSync(path)) mergeCatalog(path, products);
  }

  console.log(
    JSON.stringify(
      {
        count: products.length,
        flowers: flowers.length,
        hampers: hampers.length,
        cakes: cakes.length,
        missingImages: missingImages.map((p) => p.sku),
        sample: products.slice(0, 3).map((p) => ({ sku: p.sku, name: p.name, price: p.price, deliveryFee: p.deliveryFee })),
      },
      null,
      2
    )
  );
}

main();
