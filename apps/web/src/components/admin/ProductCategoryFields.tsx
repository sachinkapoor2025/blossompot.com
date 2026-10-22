type CategoryOption = { slug: string; name: string };

export function ProductCategoryFields({
  categories,
  categorySlug,
  additionalCategorySlugs,
  onCategorySlug,
  onAdditionalCategorySlugs,
}: {
  categories: CategoryOption[];
  categorySlug: string;
  additionalCategorySlugs: string[];
  onCategorySlug: (slug: string) => void;
  onAdditionalCategorySlugs: (slugs: string[]) => void;
}) {
  const known = new Set(categories.map((category) => category.slug));
  const primaryOptions =
    categorySlug && !known.has(categorySlug)
      ? [{ slug: categorySlug, name: categorySlug }, ...categories]
      : categories;

  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Primary category <span className="text-red-600">*</span>
        </span>
        <select
          value={categorySlug}
          onChange={(event) => onCategorySlug(event.target.value)}
          className="w-full rounded-lg border bg-white px-3 py-2"
          required
        >
          <option value="">Select category</option>
          {primaryOptions.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">Additional categories</legend>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">No categories are available.</p>
        ) : (
          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {categories.map((category) => {
              const checked = additionalCategorySlugs.includes(category.slug);
              return (
                <label key={category.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      onAdditionalCategorySlugs(
                        event.target.checked
                          ? [...additionalCategorySlugs, category.slug]
                          : additionalCategorySlugs.filter((slug) => slug !== category.slug)
                      );
                    }}
                  />
                  {category.name}
                </label>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          The primary category is stored separately and is not repeated here.
        </p>
      </fieldset>
    </>
  );
}
