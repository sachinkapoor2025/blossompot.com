/** Price, compare-at, % off, and dollar savings from existing product fields. */
export function ProductPriceBlock({
  currentPrice,
  comparePrice,
  discountPercent,
  youSave,
  addonsNote,
}: {
  currentPrice: string;
  comparePrice: string | null;
  discountPercent: number | null;
  youSave: string | null;
  addonsNote: string | null;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {comparePrice ? <span className="text-lg text-muted line-through">{comparePrice}</span> : null}
        <span className="text-2xl sm:text-3xl font-bold text-primary-deep">{currentPrice}</span>
        {discountPercent !== null ? (
          <span className="text-sm font-semibold text-accent">{discountPercent}% OFF</span>
        ) : null}
      </div>
      {youSave ? <p className="mt-1 text-sm font-semibold text-accent">You save {youSave}</p> : null}
      {addonsNote ? <p className="mt-1 text-sm text-muted">{addonsNote}</p> : null}
    </div>
  );
}
