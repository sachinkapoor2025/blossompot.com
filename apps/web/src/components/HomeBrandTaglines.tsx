/**
 * Homepage-only brand lines — kept out of the logo image so favicons stay clean.
 */
export function HomeBrandTaglines() {
  return (
    <section
      aria-label="BlossomPot brand"
      className="border-b border-line bg-ivory"
    >
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 text-center">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-ink">
          <span className="text-primary" aria-hidden>
            —
          </span>{" "}
          Flowers{" "}
          <span className="text-primary" aria-hidden>
            ♥
          </span>{" "}
          Cakes{" "}
          <span className="text-primary" aria-hidden>
            ♥
          </span>{" "}
          Gifts{" "}
          <span className="text-primary" aria-hidden>
            —
          </span>
        </p>
        <h1
          className="mt-2 font-display text-xl sm:text-2xl italic text-ink"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Delivering Smiles — Flowers, Cakes & Gifts for Every Celebration
        </h1>
      </div>
    </section>
  );
}
