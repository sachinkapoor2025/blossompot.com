import { trustStripItems } from "@/lib/trust";

export function TrustStrip() {
  return (
    <div
      className="bg-ivory border-y border-line"
      aria-label="Why customers trust BlossomPot"
    >
      <div className="store-wrap py-3 md:py-4">
        <ul className="type-support flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-x-6 text-ink">
          {trustStripItems.map((item, i) => (
            <li key={item} className="flex items-center gap-4">
              {i > 0 && (
                <span className="hidden sm:inline text-accent" aria-hidden>
                  •
                </span>
              )}
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
