/**
 * Homepage-only brand lines — kept out of the logo image so favicons stay clean.
 */
export function HomeBrandTaglines() {
  return (
    <section
      aria-label="BlossomPot brand"
      className="border-b border-[#eadfd8] bg-gradient-to-b from-[#fff8f5] to-white"
    >
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 text-center">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#1A3D34]">
          <span className="text-[#E07A9A]" aria-hidden>
            —
          </span>{" "}
          Flowers{" "}
          <span className="text-[#E07A9A]" aria-hidden>
            ♥
          </span>{" "}
          Cakes{" "}
          <span className="text-[#E07A9A]" aria-hidden>
            ♥
          </span>{" "}
          Gifts{" "}
          <span className="text-[#E07A9A]" aria-hidden>
            —
          </span>
        </p>
        <p
          className="mt-2 font-display text-xl sm:text-2xl italic text-[#1A3D34]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Delivering Smiles{" "}
          <span className="text-[#E07A9A] not-italic" aria-hidden>
            ♡
          </span>
        </p>
      </div>
    </section>
  );
}
