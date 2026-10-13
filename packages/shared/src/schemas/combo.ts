import { z } from "zod";

/** Public combo URL key. Matches slugify() output, including rejection of an empty result. */
export const comboSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const componentProductSlugSchema = z.string().min(1).max(200);

export const comboSchema = z.object({
  slug: comboSlugSchema,
  name: z.string().min(1).max(160),
  description: z.string().max(2000).default(""),
  productSlugs: z
    .array(componentProductSlugSchema)
    .min(2)
    .max(8)
    .refine((slugs) => new Set(slugs).size === slugs.length, {
      message: "Each product can appear only once",
    }),
  /** Merchandising order. Stored in GSI1SK with the same padding as categories. */
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const createComboSchema = comboSchema;

export const updateComboSchema = comboSchema.partial().omit({ slug: true });

export type Combo = z.infer<typeof comboSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type CreateComboInput = z.infer<typeof createComboSchema>;
export type UpdateComboInput = z.infer<typeof updateComboSchema>;
