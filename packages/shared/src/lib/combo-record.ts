import { comboKeys } from "../db/keys";
import { comboSchema, updateComboSchema, type Combo } from "../schemas/combo";

export class ComboSlugConflictError extends Error {
  constructor() {
    super("Combo slug already exists");
    this.name = "ComboSlugConflictError";
  }
}

export class ComboNotFoundError extends Error {
  constructor() {
    super("Combo not found");
    this.name = "ComboNotFoundError";
  }
}

export type StoredCombo = Combo & {
  PK: string;
  SK: "META";
  GSI1PK: "ENTITY#COMBO";
  GSI1SK: string;
};

export function toStoredCombo(combo: Combo): StoredCombo {
  return {
    slug: combo.slug,
    name: combo.name,
    description: combo.description,
    productSlugs: combo.productSlugs,
    sortOrder: combo.sortOrder,
    published: combo.published,
    createdAt: combo.createdAt,
    updatedAt: combo.updatedAt,
    PK: comboKeys.pk(combo.slug),
    SK: comboKeys.sk(),
    GSI1PK: comboKeys.gsi1pk(),
    GSI1SK: comboKeys.gsi1sk(combo.sortOrder, combo.slug),
  };
}

/** Build a new combo row. Refuses to replace a row that already occupies the slug. */
export function createStoredCombo(input: unknown, timestamp: string, existing: unknown): StoredCombo {
  if (existing != null) throw new ComboSlugConflictError();
  const parsed = comboSchema.parse(input);
  return toStoredCombo({
    ...parsed,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

/** Merge a partial update. The slug and original createdAt stay on the same row. */
export function updateStoredCombo(existing: Combo, patch: unknown, timestamp: string): StoredCombo {
  const parsed = updateComboSchema.parse(patch);
  return toStoredCombo({
    slug: existing.slug,
    name: parsed.name ?? existing.name,
    description: parsed.description ?? existing.description,
    productSlugs: parsed.productSlugs ?? existing.productSlugs,
    sortOrder: parsed.sortOrder ?? existing.sortOrder,
    published: parsed.published ?? existing.published,
    createdAt: existing.createdAt,
    updatedAt: timestamp,
  });
}
