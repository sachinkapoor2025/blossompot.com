/**
 * Read-only export of catalogue products that do not belong to a live menu category.
 * Writes reports/BlossomPot_Products_Outside_Menu_Categories.xlsx
 *
 * Usage: node reports/generate-outside-menu-products.mjs
 */
import { createRequire } from "module";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  classify,
  countryOf,
  imageOf,
  loadProducts,
  originalCategory,
  plain,
  vendorOf,
} from "./generate-missing-category-audit.mjs";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ExcelJS = require(process.env.EXCELJS_PATH || join(process.env.TEMP || "/tmp", "bp-exceljs", "node_modules", "exceljs"));

const SITE = "https://www.blossompot.com";

const GROUP_ORDER = [
  "Mithai and Indian Sweets",
  "Dry Fruits",
  "Chocolates",
  "Rakhi",
  "Spiritual and Pooja Products",
  "Toys and Soft Toys",
  "Perfumes",
  "Jewellery",
  "Cookies and Biscuits",
  "Wine and Champagne",
  "Fruit Baskets",
  "Drinkware",
  "Other Products",
];

const GROUP_BY_CLASS = {
  Rakhi: "Rakhi",
  "Wine, Champagne and Beer": "Wine and Champagne",
  Chocolates: "Chocolates",
  "Spiritual Gifts": "Spiritual and Pooja Products",
  "Toys and Soft Toys": "Toys and Soft Toys",
  "Sweets and Mithai": "Mithai and Indian Sweets",
  "Perfumes and Fragrances": "Perfumes",
  "Dry Fruits": "Dry Fruits",
  "Cookies and Biscuits": "Cookies and Biscuits",
  Jewellery: "Jewellery",
  "Fruit Baskets": "Fruit Baskets",
  "Barware and Drinkware": "Drinkware",
};

const GROUP_FILL = {
  "Mithai and Indian Sweets": "FFFDE7C7",
  "Dry Fruits": "FFE7F5E4",
  Chocolates: "FFF8D7E3",
  Rakhi: "FFFFF2CC",
  "Spiritual and Pooja Products": "FFE8E0F5",
  "Toys and Soft Toys": "FFD6EAF8",
  Perfumes: "FFF3E5F5",
  Jewellery: "FFF7E7C6",
  "Cookies and Biscuits": "FFF5E6D3",
  "Wine and Champagne": "FFF8D0D0",
  "Fruit Baskets": "FFE3F2D6",
  Drinkware: "FFD9EAF7",
  "Other Products": "FFEEEEEE",
};

function groupOf(category) {
  return GROUP_BY_CLASS[category] || "Other Products";
}

function productUrl(product) {
  return `${SITE}/products/${encodeURIComponent(product.slug)}`;
}

function publication(product) {
  if (product.published === false) return "Unpublished";
  if (product.live) return "Published — on current US storefront";
  return "Published — in catalogue, not on current US storefront";
}

function linkCell(cell, url) {
  if (!url) {
    cell.value = "";
    return;
  }
  cell.value = { text: url, hyperlink: url };
  cell.font = { name: "Calibri", size: 10, color: { argb: "FF1A4F8B" }, underline: true };
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri", size: 11 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3D34" } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 22;
}

function paintType(cell, group) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GROUP_FILL[group] || "FFEEEEEE" } };
  cell.font = { bold: true, name: "Calibri", size: 10 };
}

function applySheet(sheet, headerRow, columns, widths) {
  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: columns },
  };
  sheet.views = [{ state: "frozen", ySplit: headerRow, xSplit: 0 }];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function writeProductRow(excelRow, item, serial) {
  const price = typeof item.product.price === "number" ? item.product.price : null;
  const currency = item.product.currency || "USD";
  const values = [
    serial,
    item.product.slug,
    item.product.name,
    null,
    plain(item.product.description).slice(0, 1200),
    price,
    currency,
    vendorOf(item.product),
    originalCategory(item.product),
    item.subcategory || item.category,
    item.group,
    null,
    countryOf(item.product),
    publication(item.product),
  ];
  values.forEach((value, column) => {
    if (value != null) excelRow.getCell(column + 1).value = value;
  });
  linkCell(excelRow.getCell(4), imageOf(item.product));
  linkCell(excelRow.getCell(12), productUrl(item.product));
  if (price != null) excelRow.getCell(6).numFmt = currency === "INR" ? '"₹"#,##0.00' : '"$"#,##0.00';
  excelRow.alignment = { vertical: "top", wrapText: true };
  excelRow.getCell(1).font = { name: "Calibri", size: 10 };
  excelRow.getCell(2).font = { name: "Calibri", size: 10 };
  excelRow.getCell(3).font = { name: "Calibri", size: 10 };
  excelRow.getCell(5).font = { name: "Calibri", size: 10 };
  excelRow.getCell(6).font = { name: "Calibri", size: 10 };
  excelRow.getCell(7).font = { name: "Calibri", size: 10 };
  excelRow.getCell(8).font = { name: "Calibri", size: 10 };
  excelRow.getCell(9).font = { name: "Calibri", size: 10 };
  excelRow.getCell(13).font = { name: "Calibri", size: 10 };
  excelRow.getCell(14).font = { name: "Calibri", size: 10 };
  paintType(excelRow.getCell(10), item.group);
  paintType(excelRow.getCell(11), item.group);
}

async function main() {
  const { products } = loadProducts();
  const outside = [];
  const uncertain = [];
  let inMenu = 0;

  for (const product of products) {
    const result = classify(product);
    if (result.kind === "existing") {
      inMenu += 1;
      continue;
    }
    if (result.kind === "unclassified") {
      uncertain.push({ product, reason: result.unclassifiedReason || result.reason });
      continue;
    }
    outside.push({
      product,
      category: result.category,
      subcategory: result.subcategory,
      group: groupOf(result.category),
      reason: result.reason,
    });
  }

  const rank = new Map(GROUP_ORDER.map((name, index) => [name, index]));
  outside.sort((a, b) => (rank.get(a.group) ?? 99) - (rank.get(b.group) ?? 99) || a.group.localeCompare(b.group) || a.product.name.localeCompare(b.product.name));
  uncertain.sort((a, b) => a.product.name.localeCompare(b.product.name));

  const counts = new Map();
  for (const item of outside) counts.set(item.group, (counts.get(item.group) || 0) + 1);
  const typeRows = [...counts.entries()].sort((a, b) => (rank.get(a[0]) ?? 99) - (rank.get(b[0]) ?? 99));

  const outDir = join(root, "reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "BlossomPot_Products_Outside_Menu_Categories.xlsx");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BlossomPot catalogue audit";
  workbook.created = new Date("2026-11-22T03:00:00Z");
  workbook.title = "BlossomPot products outside menu categories";

  const all = workbook.addWorksheet("All Outside Menu Products");
  const allHeaders = [
    "Serial Number",
    "Product ID",
    "Product Name",
    "Product Image URL",
    "Product Description",
    "Product Price",
    "Currency",
    "Vendor Name",
    "Original Vendor Category",
    "Actual Product Type",
    "Suggested Group",
    "Product URL",
    "Country Availability",
    "Published / Unpublished Status",
  ];
  const allHeader = all.getRow(1);
  allHeaders.forEach((title, index) => {
    allHeader.getCell(index + 1).value = title;
  });
  styleHeader(allHeader);
  outside.forEach((item, index) => writeProductRow(all.getRow(index + 2), item, index + 1));
  applySheet(all, 1, allHeaders.length, [16, 42, 46, 42, 55, 16, 12, 24, 46, 32, 32, 46, 36, 48]);

  const visibleItems = outside.filter((item) => item.product.live);
  const visible = workbook.addWorksheet("Visible on Website");
  const visibleHeader = visible.getRow(1);
  allHeaders.forEach((title, index) => {
    visibleHeader.getCell(index + 1).value = title;
  });
  styleHeader(visibleHeader);
  visibleItems.forEach((item, index) => writeProductRow(visible.getRow(index + 2), item, index + 1));
  applySheet(visible, 1, allHeaders.length, [16, 42, 46, 42, 55, 16, 12, 24, 46, 32, 32, 46, 36, 48]);

  const grouped = workbook.addWorksheet("Products Grouped by Type");
  const groupedHeaders = [
    "Suggested Group",
    "Products in Group",
    "Serial Number",
    "Product ID",
    "Product Name",
    "Actual Product Type",
    "Product Price",
    "Currency",
    "Vendor Name",
    "Product URL",
  ];
  const groupedHeader = grouped.getRow(1);
  groupedHeaders.forEach((title, index) => {
    groupedHeader.getCell(index + 1).value = title;
  });
  styleHeader(groupedHeader);
  outside.forEach((item, index) => {
    const excelRow = grouped.getRow(index + 2);
    const price = typeof item.product.price === "number" ? item.product.price : null;
    const currency = item.product.currency || "USD";
    excelRow.getCell(1).value = item.group;
    excelRow.getCell(2).value = counts.get(item.group) || 0;
    excelRow.getCell(3).value = index + 1;
    excelRow.getCell(4).value = item.product.slug;
    excelRow.getCell(5).value = item.product.name;
    excelRow.getCell(6).value = item.subcategory || item.category;
    excelRow.getCell(7).value = price;
    excelRow.getCell(8).value = currency;
    excelRow.getCell(9).value = vendorOf(item.product);
    linkCell(excelRow.getCell(10), productUrl(item.product));
    if (price != null) excelRow.getCell(7).numFmt = currency === "INR" ? '"₹"#,##0.00' : '"$"#,##0.00';
    excelRow.alignment = { vertical: "top", wrapText: true };
    for (const column of [2, 3, 4, 5, 7, 8, 9]) {
      excelRow.getCell(column).font = { name: "Calibri", size: 10 };
    }
    paintType(excelRow.getCell(1), item.group);
    paintType(excelRow.getCell(6), item.group);
  });
  applySheet(grouped, 1, groupedHeaders.length, [32, 20, 16, 42, 46, 32, 16, 12, 24, 46]);

  const unsure = workbook.addWorksheet("Uncertain Products");
  const unsureHeaders = ["Product ID", "Product Name", "Vendor", "Original Category", "Reason for Uncertainty", "Product URL"];
  const unsureHeader = unsure.getRow(1);
  unsureHeaders.forEach((title, index) => {
    unsureHeader.getCell(index + 1).value = title;
  });
  styleHeader(unsureHeader);
  uncertain.forEach((item, index) => {
    const excelRow = unsure.getRow(index + 2);
    excelRow.getCell(1).value = item.product.slug;
    excelRow.getCell(2).value = item.product.name;
    excelRow.getCell(3).value = vendorOf(item.product);
    excelRow.getCell(4).value = originalCategory(item.product);
    excelRow.getCell(5).value = item.reason;
    linkCell(excelRow.getCell(6), productUrl(item.product));
    excelRow.alignment = { vertical: "top", wrapText: true };
    excelRow.font = { name: "Calibri", size: 10 };
    excelRow.getCell(6).font = { name: "Calibri", size: 10, color: { argb: "FF1A4F8B" }, underline: true };
  });
  applySheet(unsure, 1, unsureHeaders.length, [42, 46, 24, 46, 70, 46]);

  const summary = workbook.addWorksheet("Summary");
  const summaryHeader = summary.getRow(1);
  summaryHeader.getCell(1).value = "Summary Item";
  summaryHeader.getCell(2).value = "Count";
  styleHeader(summaryHeader);
  const summaryRows = [
    ["Total unique products scanned", products.length],
    ["Total products belonging to existing menu categories", inMenu],
    ["Total products outside existing menu categories", outside.length],
    ["Total uncertain products", uncertain.length],
    ["Total distinct outside-menu product types", typeRows.length],
    ["Outside-menu products visible on the website", outside.filter((item) => item.product.live).length],
  ];
  summaryRows.forEach((pair, index) => {
    const row = summary.getRow(index + 2);
    row.getCell(1).value = pair[0];
    row.getCell(2).value = pair[1];
    row.font = { name: "Calibri", size: 11 };
    row.getCell(1).font = { bold: true, name: "Calibri", size: 11 };
  });
  const typeHeaderRow = summaryRows.length + 3;
  const typeHeader = summary.getRow(typeHeaderRow);
  typeHeader.getCell(1).value = "Product Type";
  typeHeader.getCell(2).value = "Product Count";
  styleHeader(typeHeader);
  typeRows.forEach(([name, count], index) => {
    const row = summary.getRow(typeHeaderRow + 1 + index);
    row.getCell(1).value = name;
    row.getCell(2).value = count;
    paintType(row.getCell(1), name);
    row.getCell(2).font = { name: "Calibri", size: 11 };
    row.getCell(2).alignment = { horizontal: "left" };
  });
  summary.autoFilter = {
    from: { row: typeHeaderRow, column: 1 },
    to: { row: typeHeaderRow, column: 2 },
  };
  summary.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  summary.getColumn(1).width = 62;
  summary.getColumn(2).width = 18;
  summary.getCell("A" + (typeHeaderRow + typeRows.length + 2)).value =
    "Checked against the 14 live catalogue categories: Flowers, Flower Bouquets, Cakes, Birthday Gifts, Anniversary Gifts, Valentine's Day Gifts, Mother's Day Gifts, Wedding Gifts, Personalized Gifts, Gift Hampers, Plants, Same-Day Gifts, Celebration Gifts, and Overseas Gift Baskets. Flower-and-wine sets, chocolate cakes, plant-and-chocolate sets, and personalised mugs or cushions stay with those menu categories. DynamoDB was not scanned because the AWS session has expired. Gift Baskets Overseas products were not in the public catalogue or the local files.";
  summary.mergeCells(`A${typeHeaderRow + typeRows.length + 2}:B${typeHeaderRow + typeRows.length + 4}`);
  summary.getCell(`A${typeHeaderRow + typeRows.length + 2}`).alignment = { wrapText: true, vertical: "top" };
  summary.getRow(typeHeaderRow + typeRows.length + 2).height = 48;

  await workbook.xlsx.writeFile(outPath);

  const notable = outside
    .filter((item) => item.group !== "Rakhi" && item.group !== "Wine and Champagne")
    .slice(0, 40)
    .map((item) => `${item.group} | ${item.product.name}`);

  console.log(JSON.stringify({
    scanned: products.length,
    inMenu,
    outside: outside.length,
    uncertain: uncertain.length,
    types: typeRows,
    outPath,
    notable,
    sampleOutside: outside.slice(0, 5).map((item) => item.product.name),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
