const DIM_FIELDS = [
  ["weightOz", "Weight (oz)"],
  ["lengthIn", "Length (in)"],
  ["widthIn", "Width (in)"],
  ["heightIn", "Height (in)"],
] as const;

export type ShippingDimField = (typeof DIM_FIELDS)[number][0];

export type ShippingDimForm = Record<ShippingDimField, string>;

export type OptionalShippingDims =
  | { ok: true; dims: Partial<Record<ShippingDimField, number>> }
  | { ok: false; message: string };

/**
 * Blank dimension inputs are omitted so an edit keeps the stored value.
 * A supplied value must be a positive number. Missing values are not filled in.
 */
export function optionalShippingDims(form: ShippingDimForm): OptionalShippingDims {
  const dims: Partial<Record<ShippingDimField, number>> = {};
  for (const [field, label] of DIM_FIELDS) {
    const raw = form[field].trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      return { ok: false, message: `${label} must be greater than 0.` };
    }
    dims[field] = value;
  }
  return { ok: true, dims };
}
