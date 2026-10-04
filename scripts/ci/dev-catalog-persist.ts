/** Identity checks for inserting bundled catalog rows into the dev products table. */

export const DEV_CATALOG_ACCOUNT = "796174527529";
export const DEV_CATALOG_REGION = "us-east-1";
export const DEV_CATALOG_STACK = "blossompot-dev";
export const DEV_CATALOG_TABLE = "blossompot-products-dev";

export type DevCatalogTarget = {
  accountId: string;
  region: string;
  stackName: string;
  productsTable: string;
};

export function assertDevCatalogPersistenceTarget(target: DevCatalogTarget): void {
  const problems: string[] = [];
  if (target.accountId !== DEV_CATALOG_ACCOUNT) problems.push(`account ${target.accountId || "(missing)"}`);
  if (target.region !== DEV_CATALOG_REGION) problems.push(`region ${target.region || "(missing)"}`);
  if (target.stackName !== DEV_CATALOG_STACK) problems.push(`stack ${target.stackName || "(missing)"}`);
  if (target.productsTable !== DEV_CATALOG_TABLE) problems.push(`table ${target.productsTable || "(missing)"}`);
  if (problems.length > 0) {
    throw new Error(`Refusing catalog persistence. Target is not dev: ${problems.join(", ")}.`);
  }
}

export function productsTableFromStackOutputs(outputs: Readonly<Record<string, string>>): string {
  return (outputs.ProductsTableName ?? "").trim();
}
