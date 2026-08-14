import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Full stacked brand logo (emblem + wordmark + taglines).
 * Aspect ~4:3 — give enough height so “Blossompot” stays readable.
 */
const LOGO = {
  desktop: {
    width: 220,
    height: 160,
    className: "h-[4.5rem] w-auto max-w-[220px] object-contain object-left",
  },
  mobile: {
    width: 168,
    height: 122,
    className: "h-14 w-auto max-w-[168px] object-contain object-left",
  },
} as const;

type SiteLogoProps = {
  size?: keyof typeof LOGO;
  priority?: boolean;
  className?: string;
};

/** Same logo rendering in header and footer — no blend modes. */
export function SiteLogo({ size = "desktop", priority = false, className = "" }: SiteLogoProps) {
  const { width, height, className: sizeClass } = LOGO[size];
  return (
    <Image
      src={site.logoSrc}
      alt={`${site.name} — Flowers, cakes & gifts`}
      width={width}
      height={height}
      className={`${sizeClass} ${className}`.trim()}
      priority={priority}
      sizes="(max-width: 768px) 168px, 220px"
    />
  );
}

export function SiteLogoLink({
  size = "desktop",
  priority = false,
  className = "",
  onClick,
}: SiteLogoProps & { onClick?: () => void }) {
  return (
    <Link href="/" className={`inline-block shrink-0 ${className}`.trim()} onClick={onClick}>
      <SiteLogo size={size} priority={priority} />
    </Link>
  );
}
