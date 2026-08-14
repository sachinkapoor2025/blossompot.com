/**
 * Build scripts/data/orange-county-hampers.json from Orange County vendor folders.
 *
 * Sources (merged by SKU — first wins; duplicates skipped):
 *   1) USA Rakhi Images Catalouge  2026i/
 *   2) Rakhi Hamper Images/
 *
 *   COPY_IMAGES=1 npx tsx scripts/generate-orange-county-catalog.ts
 */
import { readdirSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readFileSync } from "fs";
import { join, basename, resolve } from "path";
import * as XLSX from "xlsx";
import {
  VENDOR_ORANGE_COUNTY,
  ORANGE_COUNTY_CATEGORY_SLUG,
  ORANGE_COUNTY_PRODUCT_INVENTORY,
  pricingFromVendorCost,
  metaDescription,
} from "@blossompot/shared";
import { buildHamperHtmlDescription, buildHamperSeoDescription } from "./lib/hamper-description";
import { inferAdditionalCategorySlugs } from "./lib/hamper-category";

const ROOT = resolve(process.cwd());
const OUT = join(ROOT, "scripts/data/orange-county-hampers.json");
/** Bundled into Lambda so cart can upsert missing OC products. */
const API_OUT = join(ROOT, "apps/api/src/data/orange-county-hampers.json");
const PUBLIC_IMG = join(ROOT, "apps/web/public/uploads/orange-county");
const COPY_IMAGES = process.env.COPY_IMAGES === "1" || process.env.COPY_IMAGES === "true";
/** Skip Windows/vendor thumbnails that upscale into blur on storefront cards. */
const MIN_IMAGE_EDGE_PX = 250;

type RawRow = { sku: string; name: string; description: string; vendorCost: number; source: string };

const SOURCES: { dir: string; excel: string; kind: "legacy" | "v2" }[] = [
  {
    dir: join(ROOT, "USA Rakhi Images Catalouge  2026i"),
    excel: "USA Rakhi Catalouge sheet  2026.xlsx",
    kind: "legacy",
  },
  {
    dir: join(ROOT, "Rakhi Hamper Images"),
    excel: "Rakhi Hamper sheets 1.xlsx",
    kind: "v2",
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stemOf(file: string): string {
  return file
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[`']/g, "")
    .replace(/\s+/g, "");
}

/** Match SKU.jpg / SKUa.jpg and long Excel SKUs that prefix image stems (TFPRD00294QT2…). */
function imagesForSku(sku: string, files: string[]): string[] {
  const base = sku.toLowerCase().replace(/[`'\s]/g, "");
  const scored: { file: string; score: number }[] = [];

  for (const file of files) {
    const stem = stemOf(file);
    const stemNoLetter = stem.replace(/[a-z]$/i, "");
    if (stem === base) {
      scored.push({ file, score: 100 });
      continue;
    }
    if (new RegExp(`^${escapeRe(base)}[a-z]$`, "i").test(stem)) {
      scored.push({ file, score: 95 });
      continue;
    }
    if (stemNoLetter.length >= 8 && (base.startsWith(stemNoLetter) || stemNoLetter.startsWith(base))) {
      scored.push({ file, score: stemNoLetter.length + (base.startsWith(stemNoLetter) ? 50 : 40) });
      continue;
    }
    if (stem.length >= 8 && base.startsWith(stem)) {
      scored.push({ file, score: 40 + stem.length });
    }
  }

  if (scored.length === 0) return [];
  const best = Math.max(...scored.map((s) => s.score));
  const threshold = best >= 90 ? 90 : best - 5;
  return scored
    .filter((s) => s.score >= threshold)
    .map((s) => s.file)
    .sort((a, b) => {
      const sa = stemOf(a);
      const sb = stemOf(b);
      if (sa === base) return -1;
      if (sb === base) return 1;
      return sa.localeCompare(sb);
    });
}

function parseLegacyExcel(path: string, source: string): RawRow[] {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const products: RawRow[] = [];
  for (const r of rows) {
    const sku = String(r.__EMPTY_2 ?? "").trim();
    const name = String(r.__EMPTY_3 ?? "").trim();
    if (!sku || !name || sku.toLowerCase() === "sku code") continue;
    const vendorCost = Number(r.__EMPTY_5);
    if (!Number.isFinite(vendorCost) || vendorCost <= 0) continue;
    products.push({
      sku,
      name,
      description: String(r.__EMPTY_4 ?? "").trim(),
      vendorCost,
      source,
    });
  }
  return products;
}

function parseV2Excel(path: string, source: string): RawRow[] {
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const products: RawRow[] = [];
  for (const r of rows) {
    const sku = String(r.SKU ?? r.sku ?? "").trim();
    const name = String(r.Name ?? r.name ?? "").trim();
    if (!sku || !name || sku.toLowerCase() === "sku") continue;
    const vendorCost = Number(r.price ?? r.Price ?? r.PRICE);
    if (!Number.isFinite(vendorCost) || vendorCost <= 0) {
      console.warn(`Skip ${sku}: invalid price`, r.price);
      continue;
    }
    products.push({
      sku,
      name,
      description: String(r["Product details"] ?? r.details ?? r.Description ?? "").trim(),
      vendorCost,
      source,
    });
  }
  return products;
}

function safeSkuFolder(sku: string): string {
  return sku.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "sku";
}

/** Read JPEG SOF dimensions without pulling in image libraries. */
function jpegDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buf = readFileSync(filePath);
    for (let i = 0; i < buf.length - 9; i++) {
      if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc1 || buf[i + 1] === 0xc2)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isUsableProductImage(filePath: string, allowSmallFallback: boolean): boolean {
  const dims = jpegDimensions(filePath);
  if (!dims) return allowSmallFallback;
  const edge = Math.min(dims.width, dims.height);
  if (edge >= MIN_IMAGE_EDGE_PX) return true;
  return allowSmallFallback;
}

const seenSku = new Set<string>();
const seenSlug = new Set<string>();
const rows: RawRow[] = [];
const skipped: string[] = [];

for (const src of SOURCES) {
  const excelPath = join(src.dir, src.excel);
  if (!existsSync(excelPath)) {
    console.warn(`Skip missing source: ${excelPath}`);
    continue;
  }
  const parsed = src.kind === "legacy" ? parseLegacyExcel(excelPath, src.dir) : parseV2Excel(excelPath, src.dir);
  for (const row of parsed) {
    const key = row.sku.toLowerCase();
    if (seenSku.has(key)) {
      skipped.push(`${row.sku} (duplicate SKU from ${basename(src.dir)})`);
      continue;
    }
    seenSku.add(key);
    rows.push(row);
  }
  console.log(`Loaded ${parsed.length} rows from ${basename(src.dir)} (unique so far ${rows.length})`);
}

const ts = new Date().toISOString();
const categorySlug = ORANGE_COUNTY_CATEGORY_SLUG;
if (COPY_IMAGES) mkdirSync(PUBLIC_IMG, { recursive: true });

const products = [];
for (const row of rows) {
  const pricing = pricingFromVendorCost(row.vendorCost, "USD");
  let slug = slugify(row.name);
  if (seenSlug.has(slug)) {
    slug = `${slug}-${slugify(row.sku).slice(0, 24)}`;
  }
  seenSlug.add(slug);

  const imageFiles = existsSync(row.source)
    ? readdirSync(row.source).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    : [];
  const localImages = imagesForSku(row.sku, imageFiles);
  const folder = safeSkuFolder(row.sku);
  const imageUrls: string[] = [];
  let skippedTiny = 0;

  const candidates = localImages.map((file) => ({
    file,
    path: join(row.source, file),
  }));
  const hasSharp = candidates.some((c) => isUsableProductImage(c.path, false));

  for (const { file, path: srcPath } of candidates) {
    if (!isUsableProductImage(srcPath, !hasSharp)) {
      skippedTiny += 1;
      continue;
    }
    const safeName = basename(file).replace(/[`']/g, "").replace(/\s+/g, "-");
    const publicPath = `/uploads/orange-county/${folder}/${safeName}`;
    if (COPY_IMAGES) {
      const destDir = join(PUBLIC_IMG, folder);
      mkdirSync(destDir, { recursive: true });
      copyFileSync(srcPath, join(destDir, safeName));
    }
    imageUrls.push(publicPath);
  }
  if (skippedTiny > 0) {
    console.warn(`  ${row.sku}: skipped ${skippedTiny} tiny thumbnail image(s)`);
  }

  const additionalCategorySlugs = inferAdditionalCategorySlugs(row.name, row.description);

  products.push({
    name: row.name,
    slug,
    description: buildHamperHtmlDescription(row.name, row.description, row.sku),
    price: pricing.price,
    compareAtPrice: pricing.compareAtPrice,
    currency: "USD" as const,
    categorySlug,
    additionalCategorySlugs: additionalCategorySlugs.length ? additionalCategorySlugs : undefined,
    images: imageUrls,
    sku: row.sku,
    inventory: ORANGE_COUNTY_PRODUCT_INVENTORY,
    tags: ["rakhi-hamper", "gift-hamper", "raksha-bandhan", "dry-fruits", "send-rakhi-to-usa"],
    vendorSlug: VENDOR_ORANGE_COUNTY,
    vendorCost: pricing.vendorCost,
    seoTitle: `Send ${row.name} to USA | Free Shipping | Rakhi Hamper`,
    seoDescription: metaDescription(buildHamperSeoDescription(row.name, row.description, pricing.price)),
    published: true,
    createdAt: ts,
    updatedAt: ts,
  });

  console.log(
    `• ${row.sku} → /products/${slug} extras=[${additionalCategorySlugs.join(",")}] images=${imageUrls.length}`
  );
}

mkdirSync(join(ROOT, "scripts/data"), { recursive: true });
mkdirSync(join(ROOT, "apps/api/src/data"), { recursive: true });
const payload = JSON.stringify({ products }, null, 2);
writeFileSync(OUT, payload);
writeFileSync(API_OUT, payload);
console.log(`\nWrote ${products.length} unique hampers → ${OUT}`);
console.log(`Wrote Lambda bundle copy → ${API_OUT}`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length} duplicates:\n  - ${skipped.join("\n  - ")}`);
}
if (COPY_IMAGES) console.log(`Copied images → ${PUBLIC_IMG}`);
else console.log("Skipped image copy (set COPY_IMAGES=1 to copy into public/)");
