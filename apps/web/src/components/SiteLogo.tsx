import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Brand logo = B emblem + “Blossompot” wordmark (transparent PNG).
 * Aspect ~863×615.
 */
const LOGO = {
  desktop: {
    width: 280,
    height: 200,
    className: "h-[6.25rem] w-auto max-w-[280px] object-contain object-left",
  },
  mobile: {
    width: 210,
    height: 150,
    className: "h-[4.75rem] w-auto max-w-[210px] object-contain object-left",
  },
  headerMobile: {
    width: 140,
    height: 100,
    className: "h-9 w-auto max-w-[min(28vw,104px)] object-contain object-left",
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
      alt={site.name}
      width={width}
      height={height}
      className={`${sizeClass} ${className}`.trim()}
      priority={priority}
      sizes="(max-width: 768px) 210px, 280px"
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
