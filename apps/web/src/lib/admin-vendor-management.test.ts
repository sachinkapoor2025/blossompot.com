import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  integrationSettingsNote,
  previewVendorImport,
  slugifyVendorName,
  vendorImportTemplateColumns,
} from "./admin-vendor-management";

describe("vendor product import", () => {
  it("uses the selected vendor slug and ignores a slug in the file", () => {
    const preview = previewVendorImport(
      [
        {
          name: "Studio Rose",
          description: "A rose",
          price: "24",
          currency: "USD",
          categorySlug: "flowers",
          inventory: "",
          published: "false",
          imageUrl: "https://cdn.example.com/rose.jpg",
          vendorSlug: "fnp",
        },
      ],
      "phase2-flowers",
      12
    );
    assert.equal(preview.valid, 1);
    assert.equal(preview.rows[0]?.product?.vendorSlug, "phase2-flowers");
    assert.equal(preview.rows[0]?.product?.inventory, 12);
    assert.equal(preview.rows[0]?.product?.published, false);
    assert.deepEqual(preview.rows[0]?.product?.images, ["https://cdn.example.com/rose.jpg"]);
  });

  it("reports a row that is missing a name and does not invent a vendor", () => {
    const preview = previewVendorImport(
      [{ name: "", price: "10", categorySlug: "flowers", vendorSlug: "fnp" }],
      "phase2-flowers"
    );
    assert.equal(preview.invalid, 1);
    assert.equal(preview.rows[0]?.product, undefined);
  });

  it("builds a slug from the vendor name and keeps the template columns", () => {
    assert.equal(slugifyVendorName("Phase Two Flowers"), "phase-two-flowers");
    assert.ok(vendorImportTemplateColumns().includes("name"));
    assert.equal(vendorImportTemplateColumns().includes("vendorSlug"), false);
    assert.match(integrationSettingsNote("excel"), /not implemented/i);
  });
});
