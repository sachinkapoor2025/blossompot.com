import { trustStripItems } from "@/lib/trust";

export function TrustStrip() {
  return (
    <div
      className="bg-ivory border-y border-line"
      aria-label="Why customers trust BlossomPot"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-ink">
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
