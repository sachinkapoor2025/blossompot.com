import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { queryCombos } from "../lib/combo-store";
import { ok } from "../lib/response";

/** Public combo rows. Prices stay on the component products. */
export async function listCombos(_event: APIGatewayProxyEventV2) {
  const combos = (await queryCombos())
    .filter((combo) => combo.published !== false)
    .map((combo) => ({
      slug: combo.slug,
      name: combo.name,
      description: combo.description,
      productSlugs: combo.productSlugs,
      published: combo.published,
      sortOrder: combo.sortOrder,
    }));
  return ok({ combos });
}
