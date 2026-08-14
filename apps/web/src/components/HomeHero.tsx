import Image from "next/image";
import Link from "next/link";
import type { HomeBanner } from "@/components/BannerCarousel";
import { BannerCarousel } from "@/components/BannerCarousel";

/**
 * Server component wrapper: first banner image is rendered on the server and
 * passed into the client carousel as a slot. Carousel JS still owns autoplay /
 * dots / later slides — it must not gate the LCP <img> behind hydration.
 */
export function HomeHero({ banners }: { banners: readonly HomeBanner[] }) {
  const first = banners[0];
  if (!first) return null;

  const imageClass =
    first.imageFit === "contain" ? "object-contain object-center" : "object-cover object-center";

  const image = (
    <Image
      src={first.src}
      alt={first.alt}
      fill
      className={imageClass}
      sizes="(max-width: 1023px) 100vw, 768px"
      priority
      fetchPriority="high"
    />
  );

  const lcpImage = first.href ? (
    <Link href={first.href} className="block h-full w-full">
      {image}
    </Link>
  ) : (
    image
  );

  return <BannerCarousel banners={banners} lcpImage={lcpImage} />;
}
