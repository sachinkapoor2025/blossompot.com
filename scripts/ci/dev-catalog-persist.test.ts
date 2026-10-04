import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEV_CATALOG_ACCOUNT,
  DEV_CATALOG_REGION,
  DEV_CATALOG_STACK,
  DEV_CATALOG_TABLE,
  assertDevCatalogPersistenceTarget,
  productsTableFromStackOutputs,
} from "./dev-catalog-persist";

const devTarget = {
  accountId: DEV_CATALOG_ACCOUNT,
  region: DEV_CATALOG_REGION,
  stackName: DEV_CATALOG_STACK,
  productsTable: DEV_CATALOG_TABLE,
};

describe("dev catalog persistence target", () => {
  it("accepts only the dev account, region, stack, and products table", () => {
    assert.doesNotThrow(() => assertDevCatalogPersistenceTarget(devTarget));
    assert.equal(productsTableFromStackOutputs({ ProductsTableName: DEV_CATALOG_TABLE }), DEV_CATALOG_TABLE);
  });

  it("refuses production and any other table", () => {
    assert.throws(() => assertDevCatalogPersistenceTarget({ ...devTarget, accountId: "111111111111" }));
    assert.throws(() => assertDevCatalogPersistenceTarget({ ...devTarget, region: "us-west-2" }));
    assert.throws(() => assertDevCatalogPersistenceTarget({ ...devTarget, stackName: "blossompot-prod" }));
    assert.throws(() =>
      assertDevCatalogPersistenceTarget({ ...devTarget, productsTable: "blossompot-products-prod" })
    );
    assert.throws(() => assertDevCatalogPersistenceTarget({ ...devTarget, productsTable: "" }));
  });
});
