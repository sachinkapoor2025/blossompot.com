import Link from "next/link";

type Variant = "compact" | "full";

export function TrustBadges({ variant = "full", className = "" }: { variant?: Variant; className?: string }) {
  const items = [
    { icon: "🇺🇸", label: "Ships from USA" },
    { icon: "🔒", label: "SSL Secure Checkout" },
    { icon: "🚚", label: "5–7 Day USA Delivery" },
    { icon: "✓", label: "Satisfaction Guarantee", href: "/returns" },
  ] as const;

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Trust and security badges">
        {items.map((item) =>
          "href" in item && item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink hover:border-accent/40"
            >
              <span aria-hidden className="text-accent">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink"
            >
              <span aria-hidden className="text-accent">{item.icon}</span>
              {item.label}
            </span>
          )
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`} aria-label="Trust and security badges">
      {items.map((item) => {
        const inner = (
          <>
            <span className="text-lg text-accent" aria-hidden>
              {item.icon}
            </span>
            <span className="text-[11px] font-semibold text-muted leading-tight">{item.label}</span>
          </>
        );
        return "href" in item && item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-3 text-center hover:border-accent/40 transition"
          >
            {inner}
          </Link>
        ) : (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-3 text-center"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
